import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  CloudSnow, 
  Sun, 
  CloudRain, 
  Wind, 
  Thermometer, 
  Droplets, 
  Eye,
  AlertTriangle,
  RefreshCw,
  MapPin
} from 'lucide-react';
import weatherService from '../../services/weatherService';

const WeatherWidget = ({ location = null, compact = false }) => {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Wetter-Icon basierend auf Code
  const getWeatherIcon = (conditionCode, iconSize = 'h-6 w-6') => {
    if (conditionCode >= 600 && conditionCode < 700) {
      return <CloudSnow className={`${iconSize} text-blue-300`} />;
    }
    if (conditionCode >= 500 && conditionCode < 600) {
      return <CloudRain className={`${iconSize} text-blue-500`} />;
    }
    if (conditionCode >= 800) {
      return <Sun className={`${iconSize} text-yellow-500`} />;
    }
    return <Cloud className={`${iconSize} text-gray-500`} />;
  };

  // Straßenzustand-Farbe
  const getRoadConditionColor = (condition) => {
    const colors = {
      'icy': 'bg-red-100 text-red-800 border-red-200',
      'snowy': 'bg-blue-100 text-blue-800 border-blue-200',
      'frost_risk': 'bg-orange-100 text-orange-800 border-orange-200',
      'wet_cold': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'wet': 'bg-blue-50 text-blue-700 border-blue-100',
      'clear': 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[condition] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Straßenzustand-Text
  const getRoadConditionText = (condition) => {
    const texts = {
      'icy': 'Eisglätte',
      'snowy': 'Schnee',
      'frost_risk': 'Frostgefahr',
      'wet_cold': 'Nass & Kalt',
      'wet': 'Nass',
      'clear': 'Trocken'
    };
    return texts[condition] || 'Unbekannt';
  };

  // Warnstufen-Farbe
  const getWarningColor = (level) => {
    const colors = {
      'severe': 'text-red-600 bg-red-50',
      'moderate': 'text-orange-600 bg-orange-50',
      'low': 'text-yellow-600 bg-yellow-50',
      'none': 'text-green-600 bg-green-50'
    };
    return colors[level] || 'text-gray-600 bg-gray-50';
  };

  // Wetterdaten laden
  const loadWeatherData = async () => {
    setLoading(true);
    setError(null);

    try {
      const coords = location || { lat: 53.5511, lon: 9.9937 };
      
      const [currentWeather, weatherForecast] = await Promise.all([
        weatherService.getCurrentWeather(coords.lat, coords.lon),
        weatherService.getWeatherForecast(coords.lat, coords.lon)
      ]);

      setWeather(currentWeather);
      setForecast(weatherForecast);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
      console.error('Fehler beim Laden der Wetterdaten:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial laden und Auto-Refresh
  useEffect(() => {
    loadWeatherData();
    
    // Auto-refresh alle 10 Minuten
    const interval = setInterval(loadWeatherData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Kompakte Ansicht für Dashboard
  if (compact) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">Wetter</h3>
          <button
            onClick={loadWeatherData}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        ) : error ? (
          <div className="text-sm text-red-600">
            <AlertTriangle className="h-4 w-4 inline mr-1" />
            {error}
          </div>
        ) : weather ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {getWeatherIcon(weather.conditionCode, 'h-5 w-5')}
                <span className="ml-2 text-lg font-semibold">
                  {weather.temperature}°C
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {weather.condition}
              </div>
            </div>

            <div className="flex items-center text-xs text-gray-600">
              <Wind className="h-3 w-3 mr-1" />
              {weather.windSpeed} km/h
            </div>

            {weather.roadCondition !== 'clear' && (
              <div className={`px-2 py-1 rounded text-xs border ${getRoadConditionColor(weather.roadCondition)}`}>
                {getRoadConditionText(weather.roadCondition)}
              </div>
            )}
          </div>
        ) : null}
      </div>
    );
  }

  // Vollständige Wetter-Ansicht
  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-gray-900">Wetter</h2>
            {weather && (
              <div className="ml-2 flex items-center text-sm text-gray-500">
                <MapPin className="h-4 w-4 mr-1" />
                {weather.location}
              </div>
            )}
          </div>
          <button
            onClick={loadWeatherData}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Aktuelles Wetter */}
      <div className="px-6 py-4">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 font-medium">Wetterdaten nicht verfügbar</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
            <button
              onClick={loadWeatherData}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Erneut versuchen
            </button>
          </div>
        ) : weather ? (
          <div className="space-y-6">
            {/* Haupttemperatur */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {getWeatherIcon(weather.conditionCode, 'h-16 w-16')}
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-1">
                {weather.temperature}°C
              </div>
              <div className="text-gray-600 mb-2">
                Gefühlt {weather.feelsLike}°C
              </div>
              <div className="text-sm text-gray-500 capitalize">
                {weather.condition}
              </div>
            </div>

            {/* Warnung */}
            {weather.warningLevel !== 'none' && (
              <div className={`p-3 rounded-lg border ${getWarningColor(weather.warningLevel)}`}>
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  <span className="font-medium">
                    {weather.warningLevel === 'severe' ? 'Schwere Wetterwarnung' :
                     weather.warningLevel === 'moderate' ? 'Wetterwarnung' : 'Wetterhinweis'}
                  </span>
                </div>
              </div>
            )}

            {/* Straßenzustand */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-500 mb-1">Straßenzustand</div>
                <div className={`px-3 py-2 rounded-lg border ${getRoadConditionColor(weather.roadCondition)}`}>
                  <div className="font-medium">
                    {getRoadConditionText(weather.roadCondition)}
                  </div>
                </div>
              </div>

              <div className="text-center">
                <div className="text-sm text-gray-500 mb-1">Salzempfehlung</div>
                <div className="px-3 py-2 bg-gray-50 rounded-lg border">
                  <div className="font-medium text-sm">
                    {weather.saltRecommendation.description}
                  </div>
                </div>
              </div>
            </div>

            {/* Wetter-Details */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center mb-1">
                  <Wind className="h-5 w-5 text-gray-400" />
                </div>
                <div className="text-sm font-medium">{weather.windSpeed} km/h</div>
                <div className="text-xs text-gray-500">Wind</div>
              </div>

              <div>
                <div className="flex items-center justify-center mb-1">
                  <Droplets className="h-5 w-5 text-gray-400" />
                </div>
                <div className="text-sm font-medium">{weather.humidity}%</div>
                <div className="text-xs text-gray-500">Luftfeuchtigkeit</div>
              </div>

              <div>
                <div className="flex items-center justify-center mb-1">
                  <Eye className="h-5 w-5 text-gray-400" />
                </div>
                <div className="text-sm font-medium">
                  {weather.visibility ? `${weather.visibility} km` : 'N/A'}
                </div>
                <div className="text-xs text-gray-500">Sicht</div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* 5-Tage Vorhersage */}
      {forecast && forecast.daily && (
        <div className="px-6 py-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">5-Tage Vorhersage</h3>
          <div className="space-y-2">
            {forecast.daily.map((day, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className="text-sm font-medium w-16">
                    {index === 0 ? 'Heute' : day.date.toLocaleDateString('de-DE', { weekday: 'short' })}
                  </div>
                  {getWeatherIcon(day.conditionCode || 800, 'h-5 w-5')}
                  <div className="text-sm text-gray-600 flex-1">
                    {day.condition}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className={`px-2 py-1 rounded text-xs ${getRoadConditionColor(day.roadCondition)}`}>
                    {getRoadConditionText(day.roadCondition)}
                  </div>
                  <div className="text-sm font-medium text-right">
                    <span className="text-gray-900">{day.maxTemp}°</span>
                    <span className="text-gray-400 ml-1">{day.minTemp}°</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer mit Update-Zeit */}
      {lastUpdate && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <div className="text-xs text-gray-500 text-center">
            Letztes Update: {lastUpdate.toLocaleTimeString('de-DE')}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherWidget;