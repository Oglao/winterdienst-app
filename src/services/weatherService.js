// OpenWeatherMap API Service für Live-Wetter-Daten
class WeatherService {
  constructor() {
    this.apiKey = process.env.REACT_APP_OPENWEATHER_API_KEY;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    this.geoUrl = 'https://api.openweathermap.org/geo/1.0';
    this.defaultLocation = { lat: 53.5511, lon: 9.9937 }; // Hamburg
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 Minuten Cache
  }

  // Cache-Management
  getCacheKey(lat, lon, type = 'current') {
    return `${type}_${lat.toFixed(4)}_${lon.toFixed(4)}`;
  }

  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // API-Request mit Fehlerbehandlung und Timeout
  async makeRequest(url, timeout = 5000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, { 
        signal: controller.signal,
        mode: 'cors'
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('API-Key ungültig oder fehlt');
        }
        if (response.status === 404) {
          throw new Error('Standort nicht gefunden');
        }
        if (response.status === 429) {
          throw new Error('API-Limit erreicht');
        }
        throw new Error(`Wetter-API Fehler: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.warn('Weather API timeout, using mock data');
        return null;
      }
      if (error.name === 'TypeError') {
        console.warn('Network error, using mock data');
        return null;
      }
      throw error;
    }
  }

  // Aktuelles Wetter abrufen
  async getCurrentWeather(lat = this.defaultLocation.lat, lon = this.defaultLocation.lon) {
    // Immer Mock-Daten verwenden wenn kein API-Key vorhanden
    if (!this.apiKey) {
      console.log('Weather Service: Using mock data (no API key)');
      return Promise.resolve(this.getMockWeatherData());
    }

    const cacheKey = this.getCacheKey(lat, lon, 'current');
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return Promise.resolve(cached);
    }

    try {
      const url = `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&lang=de`;
      const data = await this.makeRequest(url);

      if (!data) {
        // Fallback zu Mock-Daten bei API-Problemen
        return this.getMockWeatherData();
      }

      const weather = this.parseCurrentWeather(data);
      this.setCachedData(cacheKey, weather);
      
      return weather;
    } catch (error) {
      console.warn('Weather API error, using mock data:', error.message);
      return this.getMockWeatherData(error.message);
    }
  }

  // 5-Tage Wettervorhersage
  async getWeatherForecast(lat = this.defaultLocation.lat, lon = this.defaultLocation.lon) {
    if (!this.apiKey) {
      return this.getMockForecastData();
    }

    const cacheKey = this.getCacheKey(lat, lon, 'forecast');
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const url = `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&lang=de`;
      const data = await this.makeRequest(url);

      const forecast = this.parseForecastData(data);
      this.setCachedData(cacheKey, forecast);
      
      return forecast;
    } catch (error) {
      console.error('Fehler beim Abrufen der Vorhersage:', error);
      return this.getMockForecastData(error.message);
    }
  }

  // Wetter-Alarme abrufen
  async getWeatherAlerts(lat = this.defaultLocation.lat, lon = this.defaultLocation.lon) {
    if (!this.apiKey) {
      return [];
    }

    try {
      const url = `${this.baseUrl}/onecall?lat=${lat}&lon=${lon}&appid=${this.apiKey}&exclude=minutely,hourly,daily`;
      const data = await this.makeRequest(url);

      return data.alerts ? data.alerts.map(alert => ({
        event: alert.event,
        description: alert.description,
        start: new Date(alert.start * 1000),
        end: new Date(alert.end * 1000),
        severity: this.getAlertSeverity(alert.event)
      })) : [];
    } catch (error) {
      console.error('Fehler beim Abrufen der Wetter-Alarme:', error);
      return [];
    }
  }

  // Aktuelles Wetter parsen
  parseCurrentWeather(data) {
    const condition = data.weather[0];
    const main = data.main;
    const wind = data.wind;

    return {
      location: data.name,
      temperature: Math.round(main.temp),
      feelsLike: Math.round(main.feels_like),
      humidity: main.humidity,
      pressure: main.pressure,
      visibility: data.visibility ? Math.round(data.visibility / 1000) : null,
      condition: condition.description,
      conditionCode: condition.id,
      icon: condition.icon,
      windSpeed: Math.round(wind.speed * 3.6), // m/s zu km/h
      windDirection: wind.deg,
      cloudiness: data.clouds.all,
      sunrise: new Date(data.sys.sunrise * 1000),
      sunset: new Date(data.sys.sunset * 1000),
      timestamp: new Date(),
      // Winterdienst-spezifische Daten
      roadCondition: this.calculateRoadCondition(main.temp, main.humidity, condition.id),
      saltRecommendation: this.calculateSaltRecommendation(main.temp, condition.id),
      warningLevel: this.getWarningLevel(main.temp, condition.id, wind.speed)
    };
  }

  // Vorhersage-Daten parsen
  parseForecastData(data) {
    const forecasts = data.list.map(item => {
      const condition = item.weather[0];
      const main = item.main;
      
      return {
        datetime: new Date(item.dt * 1000),
        temperature: Math.round(main.temp),
        condition: condition.description,
        conditionCode: condition.id,
        icon: condition.icon,
        windSpeed: Math.round(item.wind.speed * 3.6),
        precipitation: item.rain ? item.rain['3h'] || 0 : item.snow ? item.snow['3h'] || 0 : 0,
        roadCondition: this.calculateRoadCondition(main.temp, main.humidity, condition.id)
      };
    });

    // Nach Tagen gruppieren
    const dailyForecasts = this.groupForecastsByDay(forecasts);
    
    return {
      hourly: forecasts.slice(0, 24), // Nächste 24 Stunden
      daily: dailyForecasts.slice(0, 5), // Nächste 5 Tage
      location: data.city.name
    };
  }

  // Vorhersagen nach Tagen gruppieren
  groupForecastsByDay(forecasts) {
    const grouped = {};
    
    forecasts.forEach(forecast => {
      const date = forecast.datetime.toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(forecast);
    });

    return Object.keys(grouped).map(date => {
      const dayForecasts = grouped[date];
      const temps = dayForecasts.map(f => f.temperature);
      
      return {
        date: new Date(date),
        minTemp: Math.min(...temps),
        maxTemp: Math.max(...temps),
        condition: dayForecasts[Math.floor(dayForecasts.length / 2)].condition,
        icon: dayForecasts[Math.floor(dayForecasts.length / 2)].icon,
        precipitation: dayForecasts.reduce((sum, f) => sum + f.precipitation, 0),
        roadCondition: this.getMostSevereRoadCondition(dayForecasts.map(f => f.roadCondition))
      };
    });
  }

  // Straßenzustand berechnen
  calculateRoadCondition(temp, humidity, conditionCode) {
    if (temp <= -2) {
      return 'icy'; // Eisglätte
    }
    if (temp <= 2 && humidity > 80) {
      return 'frost_risk'; // Frostgefahr
    }
    if (conditionCode >= 600 && conditionCode < 700) {
      return 'snowy'; // Schnee
    }
    if (conditionCode >= 500 && conditionCode < 600 && temp <= 5) {
      return 'wet_cold'; // Nass und kalt
    }
    if (conditionCode >= 500 && conditionCode < 600) {
      return 'wet'; // Nass
    }
    return 'clear'; // Trocken
  }

  // Salzempfehlung berechnen
  calculateSaltRecommendation(temp, conditionCode) {
    if (temp <= -5) {
      return { amount: 'high', type: 'NaCl + Sand', description: 'Hohe Salzung mit Sand' };
    }
    if (temp <= 0) {
      return { amount: 'medium', type: 'NaCl', description: 'Normale Salzung' };
    }
    if (temp <= 3 && (conditionCode >= 600 || conditionCode >= 500)) {
      return { amount: 'light', type: 'NaCl', description: 'Leichte Salzung präventiv' };
    }
    return { amount: 'none', type: null, description: 'Keine Salzung erforderlich' };
  }

  // Warnstufe bestimmen
  getWarningLevel(temp, conditionCode, windSpeed) {
    if (temp <= -10 || (conditionCode >= 600 && windSpeed > 10)) {
      return 'severe'; // Schwere Warnung
    }
    if (temp <= -5 || conditionCode >= 600) {
      return 'moderate'; // Moderate Warnung
    }
    if (temp <= 2) {
      return 'low'; // Geringe Warnung
    }
    return 'none'; // Keine Warnung
  }

  // Schwerwiegendste Straßenbedingung ermitteln
  getMostSevereRoadCondition(conditions) {
    const severity = {
      'icy': 5,
      'snowy': 4,
      'frost_risk': 3,
      'wet_cold': 2,
      'wet': 1,
      'clear': 0
    };

    return conditions.reduce((most, current) => 
      severity[current] > severity[most] ? current : most
    );
  }

  // Alarm-Schweregrad bestimmen
  getAlertSeverity(event) {
    const severityMap = {
      'Snow': 'high',
      'Ice': 'high',
      'Freezing Rain': 'high',
      'Blizzard': 'severe',
      'Heavy Snow': 'high',
      'Wind': 'medium',
      'Rain': 'low'
    };
    return severityMap[event] || 'medium';
  }

  // Mock-Daten für Entwicklung/Fallback
  getMockWeatherData(error = null) {
    return {
      location: 'Hamburg',
      temperature: -2,
      feelsLike: -5,
      humidity: 85,
      pressure: 1013,
      visibility: 8,
      condition: 'Leichter Schneefall',
      conditionCode: 600,
      icon: '13d',
      windSpeed: 15,
      windDirection: 270,
      cloudiness: 90,
      sunrise: new Date(),
      sunset: new Date(),
      timestamp: new Date(),
      roadCondition: 'snowy',
      saltRecommendation: { 
        amount: 'medium', 
        type: 'NaCl', 
        description: 'Normale Salzung empfohlen' 
      },
      warningLevel: 'moderate',
      error: error
    };
  }

  getMockForecastData(error = null) {
    const forecasts = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      forecasts.push({
        date,
        minTemp: -5 + i,
        maxTemp: 2 + i,
        condition: i === 0 ? 'Schnee' : 'Bewölkt',
        icon: i === 0 ? '13d' : '04d',
        precipitation: i === 0 ? 5 : 0,
        roadCondition: i === 0 ? 'snowy' : 'clear'
      });
    }

    return {
      hourly: [],
      daily: forecasts,
      location: 'Hamburg',
      error: error
    };
  }

  // Standort per Name suchen
  async searchLocation(cityName) {
    if (!this.apiKey) {
      return [{ lat: this.defaultLocation.lat, lon: this.defaultLocation.lon, name: 'Hamburg' }];
    }

    try {
      const url = `${this.geoUrl}/direct?q=${encodeURIComponent(cityName)}&limit=5&appid=${this.apiKey}`;
      const data = await this.makeRequest(url);
      
      return data.map(location => ({
        lat: location.lat,
        lon: location.lon,
        name: location.name,
        country: location.country,
        state: location.state
      }));
    } catch (error) {
      console.error('Fehler bei der Standort-Suche:', error);
      return [];
    }
  }
}

export default new WeatherService();