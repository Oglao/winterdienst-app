const db = require('../database/db');
const axios = require('axios');

class Weather {
  static async saveWeatherData(weatherData) {
    const [weather] = await db('weather_data')
      .insert(weatherData)
      .returning('*');
    return weather;
  }

  static async getCurrentWeather(latitude, longitude) {
    return await db('weather_data')
      .where({ latitude, longitude, is_forecast: false })
      .orderBy('created_at', 'desc')
      .first();
  }

  static async getForecast(latitude, longitude, hours = 24) {
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + (hours * 60 * 60 * 1000));

    return await db('weather_data')
      .where({ latitude, longitude, is_forecast: true })
      .whereBetween('forecast_time', [startTime, endTime])
      .orderBy('forecast_time', 'asc');
  }

  static async getDeploymentTriggers() {
    return await db('weather_deployment_triggers')
      .where('deployment_priority', 'high')
      .orWhere('deployment_priority', 'medium');
  }

  static async checkDeploymentConditions(latitude, longitude) {
    const forecast = await this.getForecast(latitude, longitude, 6);
    
    const triggers = forecast.map(weather => {
      let priority = 'low';
      let reasons = [];

      // Eisglätte-Gefahr
      if (weather.temperature <= 3 && weather.precipitation > 0) {
        priority = 'high';
        reasons.push('Eisglätte-Gefahr (Temp ≤ 3°C + Niederschlag)');
      }

      // Frost
      if (weather.temperature <= 0) {
        priority = 'high';
        reasons.push('Frost (Temp ≤ 0°C)');
      }

      // Schneefall
      if (weather.snow_depth > 2) {
        priority = 'high';
        reasons.push(`Schnee (${weather.snow_depth}cm)`);
      }

      // Starker Regen bei niedrigen Temperaturen
      if (weather.temperature <= 5 && weather.precipitation > 2) {
        priority = priority === 'low' ? 'medium' : priority;
        reasons.push('Starker Regen bei niedrigen Temperaturen');
      }

      return {
        time: weather.forecast_time,
        priority,
        reasons,
        weather: {
          temperature: weather.temperature,
          precipitation: weather.precipitation,
          snow_depth: weather.snow_depth,
          condition: weather.weather_condition
        }
      };
    });

    return triggers.filter(t => t.priority !== 'low');
  }

  // Integration mit OpenWeatherMap API
  static async fetchWeatherFromAPI(latitude, longitude, apiKey) {
    try {
      // Current weather
      const currentResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather`,
        {
          params: {
            lat: latitude,
            lon: longitude,
            appid: apiKey,
            units: 'metric',
            lang: 'de'
          }
        }
      );

      // Forecast
      const forecastResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast`,
        {
          params: {
            lat: latitude,
            lon: longitude,
            appid: apiKey,
            units: 'metric',
            lang: 'de'
          }
        }
      );

      // Save current weather
      const currentWeather = {
        location_name: currentResponse.data.name,
        latitude,
        longitude,
        temperature: currentResponse.data.main.temp,
        feels_like: currentResponse.data.main.feels_like,
        humidity: currentResponse.data.main.humidity,
        wind_speed: currentResponse.data.wind.speed * 3.6, // Convert m/s to km/h
        wind_direction: currentResponse.data.wind.deg,
        precipitation: currentResponse.data.rain ? currentResponse.data.rain['1h'] || 0 : 0,
        snow_depth: currentResponse.data.snow ? currentResponse.data.snow['1h'] || 0 : 0,
        weather_condition: currentResponse.data.weather[0].description,
        visibility: currentResponse.data.visibility / 1000, // Convert m to km
        forecast_time: new Date(),
        is_forecast: false,
        data_source: 'openweathermap'
      };

      await this.saveWeatherData(currentWeather);

      // Save forecast data
      const forecastData = forecastResponse.data.list.map(item => ({
        location_name: forecastResponse.data.city.name,
        latitude,
        longitude,
        temperature: item.main.temp,
        feels_like: item.main.feels_like,
        humidity: item.main.humidity,
        wind_speed: item.wind.speed * 3.6,
        wind_direction: item.wind.deg,
        precipitation: item.rain ? item.rain['3h'] || 0 : 0,
        snow_depth: item.snow ? item.snow['3h'] || 0 : 0,
        weather_condition: item.weather[0].description,
        visibility: 10, // Default visibility
        forecast_time: new Date(item.dt * 1000),
        is_forecast: true,
        data_source: 'openweathermap'
      }));

      for (const forecast of forecastData) {
        await this.saveWeatherData(forecast);
      }

      return { current: currentWeather, forecast: forecastData };
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw new Error('Wetterdaten konnten nicht abgerufen werden');
    }
  }

  static async getWeatherHistory(latitude, longitude, days = 7) {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

    return await db('weather_data')
      .where({ latitude, longitude })
      .whereBetween('created_at', [startDate, endDate])
      .orderBy('created_at', 'desc');
  }

  static async getWeatherForLocation(locationName) {
    return await db('weather_data')
      .where({ location_name: locationName })
      .orderBy('forecast_time', 'desc')
      .limit(1)
      .first();
  }

  static async cleanOldWeatherData(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const deletedCount = await db('weather_data')
      .where('created_at', '<', cutoffDate)
      .del();

    return deletedCount;
  }

  static async getLocationWeatherSummary(locations) {
    const results = [];
    
    for (const location of locations) {
      const current = await this.getCurrentWeather(location.lat, location.lng);
      const triggers = await this.checkDeploymentConditions(location.lat, location.lng);
      
      results.push({
        location: location.name,
        coordinates: { lat: location.lat, lng: location.lng },
        current_weather: current,
        deployment_triggers: triggers,
        priority: triggers.length > 0 ? Math.max(...triggers.map(t => 
          t.priority === 'high' ? 3 : t.priority === 'medium' ? 2 : 1
        )) : 0
      });
    }

    return results.sort((a, b) => b.priority - a.priority);
  }
}

module.exports = Weather;