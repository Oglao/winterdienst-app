import React, { useState, useEffect } from 'react';
import { Cloud, Thermometer, Droplets, Wind, AlertTriangle, Map, Calendar } from 'lucide-react';

const WeatherDashboard = () => {
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [deploymentTriggers, setDeploymentTriggers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locations] = useState([
    { name: 'Hamburg Zentrum', lat: 53.5511, lng: 9.9937 },
    { name: 'Hamburg Nord', lat: 53.6, lng: 9.9 },
    { name: 'Hamburg Süd', lat: 53.5, lng: 10.0 }
  ]);

  useEffect(() => {
    loadWeatherData();
    // Auto-refresh every 10 minutes
    const interval = setInterval(loadWeatherData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadWeatherData = async () => {
    try {
      setLoading(true);
      
      // Load current weather for main location
      const currentResponse = await fetch(`/api/weather/current?lat=${locations[0].lat}&lng=${locations[0].lng}`);
      if (currentResponse.ok) {
        const current = await currentResponse.json();
        setCurrentWeather(current);
      }

      // Load forecast
      const forecastResponse = await fetch(`/api/weather/forecast?lat=${locations[0].lat}&lng=${locations[0].lng}&hours=24`);
      if (forecastResponse.ok) {
        const forecastData = await forecastResponse.json();
        setForecast(forecastData);
      }

      // Load deployment triggers
      const triggersResponse = await fetch('/api/weather/deployment-triggers');
      if (triggersResponse.ok) {
        const triggers = await triggersResponse.json();
        setDeploymentTriggers(triggers);
      }
    } catch (error) {
      console.error('Error loading weather data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherFromAPI = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/weather/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat: locations[0].lat,
          lng: locations[0].lng
        })
      });

      if (response.ok) {
        await loadWeatherData();
        alert('Wetterdaten erfolgreich aktualisiert!');
      } else {
        const error = await response.json();
        alert('Fehler beim Abrufen der Wetterdaten: ' + error.error);
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
      alert('Fehler beim Abrufen der Wetterdaten');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && !currentWeather) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wetter & Einsatzplanung</h1>
          <p className="text-gray-600 mt-1">
            Automatische Einsatzplanung basierend auf Wetterbedingungen
          </p>
        </div>
        
        <button
          onClick={fetchWeatherFromAPI}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
        >
          {loading ? 'Aktualisiert...' : 'Wetter aktualisieren'}
        </button>
      </div>

      {/* Current Weather */}
      {currentWeather ? (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <Cloud className="w-5 h-5 mr-2" />
            Aktuelles Wetter - {currentWeather.location_name}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <Thermometer className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Temperatur</p>
                <p className="text-xl font-bold text-gray-900">
                  {currentWeather.temperature}°C
                </p>
                <p className="text-xs text-gray-500">
                  Gefühlt: {currentWeather.feels_like}°C
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Droplets className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Niederschlag</p>
                <p className="text-xl font-bold text-gray-900">
                  {currentWeather.precipitation || 0} mm
                </p>
                <p className="text-xs text-gray-500">
                  Luftfeuchtigkeit: {currentWeather.humidity}%
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Wind className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Wind</p>
                <p className="text-xl font-bold text-gray-900">
                  {currentWeather.wind_speed} km/h
                </p>
                <p className="text-xs text-gray-500">
                  Richtung: {currentWeather.wind_direction}°
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Map className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Bedingungen</p>
                <p className="text-sm font-bold text-gray-900">
                  {currentWeather.weather_condition}
                </p>
                <p className="text-xs text-gray-500">
                  Sicht: {currentWeather.visibility} km
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-center py-8">
            <Cloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Keine aktuellen Wetterdaten verfügbar</p>
            <button
              onClick={fetchWeatherFromAPI}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Wetterdaten abrufen
            </button>
          </div>
        </div>
      )}

      {/* Deployment Triggers */}
      {deploymentTriggers.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h3 className="font-medium text-orange-800">Einsatz-Warnungen</h3>
          </div>
          <div className="space-y-2">
            {deploymentTriggers.map((trigger, index) => (
              <div key={index} className={`p-3 rounded border ${getPriorityColor(trigger.deployment_priority)}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{trigger.location_name}</p>
                    <p className="text-sm">
                      {trigger.temperature}°C • {trigger.weather_condition}
                    </p>
                    {trigger.precipitation > 0 && (
                      <p className="text-sm">Niederschlag: {trigger.precipitation}mm</p>
                    )}
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-white">
                    {trigger.deployment_priority.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 24h Forecast */}
      {forecast.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            24-Stunden Vorhersage
          </h3>
          
          <div className="overflow-x-auto">
            <div className="flex space-x-4 pb-4">
              {forecast.slice(0, 8).map((item, index) => (
                <div key={index} className="flex-shrink-0 bg-gray-50 p-3 rounded-lg text-center min-w-[120px]">
                  <p className="text-xs font-medium text-gray-600">
                    {formatDateTime(item.forecast_time)}
                  </p>
                  <div className="my-2">
                    <p className="text-lg font-bold text-gray-900">
                      {item.temperature}°C
                    </p>
                    <p className="text-xs text-gray-600">
                      {item.weather_condition}
                    </p>
                  </div>
                  <div className="space-y-1">
                    {item.precipitation > 0 && (
                      <div className="flex items-center justify-center text-xs text-blue-600">
                        <Droplets className="w-3 h-3 mr-1" />
                        {item.precipitation}mm
                      </div>
                    )}
                    <div className="flex items-center justify-center text-xs text-gray-500">
                      <Wind className="w-3 h-3 mr-1" />
                      {item.wind_speed}km/h
                    </div>
                  </div>
                  
                  {/* Deployment Risk Indicator */}
                  {(item.temperature <= 3 && item.precipitation > 0) || item.temperature <= 0 ? (
                    <div className="mt-2 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                      Einsatz!
                    </div>
                  ) : item.temperature <= 5 && item.precipitation > 2 ? (
                    <div className="mt-2 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                      Bereit
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Location Overview */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Standort-Übersicht</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {locations.map((location, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">{location.name}</h4>
              <p className="text-sm text-gray-600">
                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </p>
              <button
                onClick={() => fetchWeatherFromAPI()}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
              >
                Wetter prüfen
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeatherDashboard;