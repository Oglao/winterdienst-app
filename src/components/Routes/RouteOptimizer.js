import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Fuel, 
  AlertTriangle, 
  CheckCircle, 
  Settings,
  Route as RouteIcon,
  Truck,
  Snowflake
} from 'lucide-react';
import routeOptimizationService from '../../services/routeOptimizationService';
import weatherService from '../../services/weatherService';

const RouteOptimizer = ({ waypoints = [], onOptimizedRoute, currentWeather = null }) => {
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [error, setError] = useState(null);
  const [optimizationOptions, setOptimizationOptions] = useState({
    vehicleType: 'small_truck',
    avoidTolls: true,
    considerWeather: true,
    priorities: {}
  });
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Fahrzeugtypen
  const vehicleTypes = {
    'small_truck': { name: 'Kleiner LKW', icon: '🚛', speedFactor: 0.9 },
    'large_truck': { name: 'Großer LKW', icon: '🚚', speedFactor: 0.8 },
    'spreader': { name: 'Streufahrzeug', icon: '🚧', speedFactor: 0.7 }
  };

  // Route optimieren
  const optimizeRoute = async () => {
    if (waypoints.length < 2) {
      setError('Mindestens 2 Waypoints erforderlich');
      return;
    }

    setOptimizing(true);
    setError(null);

    try {
      // Aktuelles Wetter abrufen falls nötig
      let weatherData = currentWeather;
      if (optimizationOptions.considerWeather && !weatherData && waypoints.length > 0) {
        weatherData = await weatherService.getCurrentWeather(
          waypoints[0].lat, 
          waypoints[0].lng
        );
      }

      // Route optimieren
      const result = await routeOptimizationService.optimizeRoute(waypoints, {
        ...optimizationOptions,
        weatherData: optimizationOptions.considerWeather ? weatherData : null
      });

      setOptimizedRoute(result);
      
      if (onOptimizedRoute) {
        onOptimizedRoute(result);
      }

    } catch (err) {
      setError(err.message);
      console.error('Routenoptimierung fehlgeschlagen:', err);
    } finally {
      setOptimizing(false);
    }
  };

  // Priorität für Waypoint setzen
  const setPriority = (waypointIndex, priority) => {
    setOptimizationOptions(prev => ({
      ...prev,
      priorities: {
        ...prev.priorities,
        [waypointIndex]: priority
      }
    }));
  };

  // Formatierungshilfen
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDistance = (meters) => {
    const km = meters / 1000;
    return km < 1 ? `${meters}m` : `${km.toFixed(1)}km`;
  };

  // Auto-Optimierung bei Waypoint-Änderungen
  useEffect(() => {
    if (waypoints.length >= 2) {
      const timer = setTimeout(optimizeRoute, 1000);
      return () => clearTimeout(timer);
    }
  }, [waypoints]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <RouteIcon className="h-5 w-5 mr-2 text-blue-600" />
          Routenoptimierung
        </h3>
        
        <button
          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          className="text-gray-400 hover:text-gray-600"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>

      {/* Erweiterte Optionen */}
      {showAdvancedOptions && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
          <h4 className="font-medium text-gray-900">Optimierungsoptionen</h4>
          
          {/* Fahrzeugtyp */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fahrzeugtyp
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(vehicleTypes).map(([key, vehicle]) => (
                <button
                  key={key}
                  onClick={() => setOptimizationOptions(prev => ({ 
                    ...prev, 
                    vehicleType: key 
                  }))}
                  className={`p-2 text-sm rounded border text-center ${
                    optimizationOptions.vehicleType === key
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  <div className="text-lg mb-1">{vehicle.icon}</div>
                  <div className="text-xs">{vehicle.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Weitere Optionen */}
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={optimizationOptions.avoidTolls}
                onChange={(e) => setOptimizationOptions(prev => ({
                  ...prev,
                  avoidTolls: e.target.checked
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Maut vermeiden</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={optimizationOptions.considerWeather}
                onChange={(e) => setOptimizationOptions(prev => ({
                  ...prev,
                  considerWeather: e.target.checked
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Wetter berücksichtigen</span>
            </label>
          </div>
        </div>
      )}

      {/* Waypoints mit Prioritäten */}
      {waypoints.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">
            Waypoints ({waypoints.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {waypoints.map((waypoint, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center">
                  <MapPin className={`h-4 w-4 mr-2 ${
                    index === 0 ? 'text-green-600' : 
                    index === waypoints.length - 1 ? 'text-red-600' : 
                    'text-blue-600'
                  }`} />
                  <span className="text-sm">
                    {index === 0 ? 'Start: ' : 
                     index === waypoints.length - 1 ? 'Ziel: ' : 
                     `Punkt ${index}: `}
                    {waypoint.name || `${waypoint.lat.toFixed(4)}, ${waypoint.lng.toFixed(4)}`}
                  </span>
                </div>
                
                {index > 0 && index < waypoints.length - 1 && (
                  <select
                    value={optimizationOptions.priorities[index] || 0}
                    onChange={(e) => setPriority(index, parseInt(e.target.value))}
                    className="text-xs rounded border-gray-300"
                  >
                    <option value={0}>Normal</option>
                    <option value={1}>Hoch</option>
                    <option value={2}>Sehr hoch</option>
                    <option value={3}>Kritisch</option>
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optimierung Button */}
      <div className="mb-6">
        <button
          onClick={optimizeRoute}
          disabled={optimizing || waypoints.length < 2}
          className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {optimizing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Route wird optimiert...
            </>
          ) : (
            <>
              <Navigation className="h-4 w-4 mr-2" />
              Route optimieren
            </>
          )}
        </button>
      </div>

      {/* Fehler */}
      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center text-red-800">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Optimierte Route Ergebnisse */}
      {optimizedRoute && (
        <div className="space-y-4">
          <div className="flex items-center text-green-600 mb-4">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span className="font-medium">Route optimiert</span>
          </div>

          {/* Basis-Statistiken */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center text-blue-600 mb-1">
                <Clock className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Fahrzeit</span>
              </div>
              <div className="text-lg font-bold text-blue-900">
                {formatDuration(optimizedRoute.estimatedDuration || optimizedRoute.duration)}
              </div>
              {optimizedRoute.durationInTraffic && (
                <div className="text-xs text-blue-600">
                  Mit Verkehr: {formatDuration(optimizedRoute.durationInTraffic)}
                </div>
              )}
            </div>

            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center text-green-600 mb-1">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Entfernung</span>
              </div>
              <div className="text-lg font-bold text-green-900">
                {formatDistance(optimizedRoute.distance)}
              </div>
            </div>
          </div>

          {/* Wetter-Anpassungen */}
          {optimizedRoute.weatherAdjustments && (
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="flex items-center text-yellow-600 mb-2">
                <Snowflake className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Wetter-Anpassungen</span>
              </div>
              <div className="space-y-1">
                {optimizedRoute.weatherAdjustments.recommendations.map((rec, index) => (
                  <div key={index} className="text-xs text-yellow-700">
                    • {rec}
                  </div>
                ))}
                <div className="text-xs text-yellow-600 mt-2">
                  Zeitfaktor: {(optimizedRoute.weatherAdjustments.timeFactor * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          )}

          {/* Salzungs-Empfehlungen */}
          {optimizedRoute.saltingRecommendations && optimizedRoute.saltingRecommendations.length > 0 && (
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="flex items-center text-orange-600 mb-2">
                <Truck className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Salzungs-Empfehlungen</span>
              </div>
              {optimizedRoute.saltingRecommendations.map((rec, index) => (
                <div key={index} className="text-xs text-orange-700 mb-1">
                  <div className="font-medium">{rec.description}</div>
                  <div>Material: {rec.material}, Menge: ~{rec.amount}kg</div>
                </div>
              ))}
            </div>
          )}

          {/* Provider Info */}
          <div className="text-xs text-gray-500 text-center pt-2 border-t">
            Optimiert mit {optimizedRoute.provider?.toUpperCase() || 'OSRM'}
            {optimizedRoute.provider === 'google' && ' (mit Verkehrsdaten)'}
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteOptimizer;