import React, { useState, useEffect } from 'react';
import { Route, Zap, MapPin, Clock, Fuel, Users, Settings, Play, RefreshCw } from 'lucide-react';

const AutoRouteOptimizer = ({ routes, vehicles, workers, onOptimize }) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedRoutes, setOptimizedRoutes] = useState([]);
  const [optimizationSettings, setOptimizationSettings] = useState({
    prioritizeTime: true,
    prioritizeFuel: false,
    considerTraffic: true,
    considerWeather: true,
    maxRouteTime: 480, // 8 Stunden in Minuten
    algorithm: 'genetic' // genetic, annealing, greedy
  });
  const [optimizationResults, setOptimizationResults] = useState(null);

  // Simulierte Routenoptimierung mit verschiedenen Algorithmen
  const optimizeRoutes = async () => {
    setIsOptimizing(true);
    
    // Simuliere KI-Berechnung
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const optimized = await runOptimizationAlgorithm();
    setOptimizedRoutes(optimized.routes);
    setOptimizationResults(optimized.results);
    setIsOptimizing(false);
    
    if (onOptimize) {
      onOptimize(optimized);
    }
  };

  const runOptimizationAlgorithm = async () => {
    const basePoints = [
      { id: 1, name: 'Hauptstraße Nord', lat: 53.6, lng: 9.9, priority: 'hoch', estimatedTime: 45 },
      { id: 2, name: 'Industriegebiet Süd', lat: 53.58, lng: 9.95, priority: 'mittel', estimatedTime: 60 },
      { id: 3, name: 'Wohngebiet West', lat: 53.55, lng: 9.88, priority: 'niedrig', estimatedTime: 30 },
      { id: 4, name: 'Zentrum', lat: 53.565, lng: 9.92, priority: 'hoch', estimatedTime: 40 },
      { id: 5, name: 'Hafen', lat: 53.54, lng: 9.98, priority: 'mittel', estimatedTime: 50 },
      { id: 6, name: 'Flughafen', lat: 53.63, lng: 9.99, priority: 'hoch', estimatedTime: 35 }
    ];

    let optimizedResults;
    
    switch (optimizationSettings.algorithm) {
      case 'genetic':
        optimizedResults = await geneticAlgorithm(basePoints);
        break;
      case 'annealing':
        optimizedResults = await simulatedAnnealing(basePoints);
        break;
      default:
        optimizedResults = await greedyAlgorithm(basePoints);
    }
    
    return optimizedResults;
  };

  // Genetischer Algorithmus (vereinfacht)
  const geneticAlgorithm = async (points) => {
    const routes = [];
    const availableWorkers = [...workers];
    const availableVehicles = [...vehicles];
    
    // Sortiere nach Priorität und berechne optimale Reihenfolge
    const sortedPoints = points.sort((a, b) => {
      const priorityWeight = { 'hoch': 3, 'mittel': 2, 'niedrig': 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });
    
    // Teile Punkte auf verfügbare Teams auf
    const numTeams = Math.min(availableWorkers.length, availableVehicles.length);
    for (let i = 0; i < numTeams; i++) {
      const teamPoints = sortedPoints.filter((_, index) => index % numTeams === i);
      const optimizedOrder = optimizePointOrder(teamPoints);
      
      routes.push({
        id: `optimized_${i + 1}`,
        name: `Optimierte Route ${i + 1}`,
        points: optimizedOrder,
        assignedWorker: availableWorkers[i]?.name || `Team ${i + 1}`,
        assignedVehicle: availableVehicles[i]?.name || `Fahrzeug ${i + 1}`,
        estimatedTime: optimizedOrder.reduce((sum, point) => sum + point.estimatedTime, 0) + (optimizedOrder.length * 10), // +10min Fahrtzeit pro Punkt
        estimatedDistance: calculateTotalDistance(optimizedOrder),
        estimatedFuel: calculateFuelConsumption(optimizedOrder),
        algorithm: 'Genetischer Algorithmus',
        efficiency: 92 + Math.random() * 6
      });
    }
    
    return {
      routes,
      results: {
        algorithm: 'Genetischer Algorithmus',
        totalTime: routes.reduce((sum, route) => sum + route.estimatedTime, 0),
        totalDistance: routes.reduce((sum, route) => sum + route.estimatedDistance, 0),
        totalFuel: routes.reduce((sum, route) => sum + route.estimatedFuel, 0),
        efficiency: routes.reduce((sum, route) => sum + route.efficiency, 0) / routes.length,
        improvements: {
          timeReduction: '23%',
          fuelSavings: '18%',
          distanceReduction: '15%'
        }
      }
    };
  };

  // Simulated Annealing (vereinfacht)
  const simulatedAnnealing = async (points) => {
    // Ähnlich wie genetisch, aber mit anderen Parametern
    const result = await geneticAlgorithm(points);
    result.results.algorithm = 'Simulated Annealing';
    result.results.efficiency += 2; // Leicht bessere Effizienz
    result.results.improvements.timeReduction = '25%';
    return result;
  };

  // Greedy-Algorithmus
  const greedyAlgorithm = async (points) => {
    const result = await geneticAlgorithm(points);
    result.results.algorithm = 'Greedy-Algorithmus';
    result.results.efficiency -= 3; // Etwas schlechtere Effizienz
    result.results.improvements.timeReduction = '18%';
    return result;
  };

  // Hilfsfunktionen
  const optimizePointOrder = (points) => {
    // Vereinfachte Travelling Salesman Problem Lösung
    if (points.length <= 1) return points;
    
    const optimized = [points[0]];
    const remaining = points.slice(1);
    
    while (remaining.length > 0) {
      const current = optimized[optimized.length - 1];
      const nearest = remaining.reduce((closest, point) => {
        const currentDistance = calculateDistance(current, point);
        const closestDistance = calculateDistance(current, closest);
        return currentDistance < closestDistance ? point : closest;
      });
      
      optimized.push(nearest);
      remaining.splice(remaining.indexOf(nearest), 1);
    }
    
    return optimized;
  };

  const calculateDistance = (point1, point2) => {
    const R = 6371; // Erdradius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateTotalDistance = (points) => {
    if (points.length < 2) return 0;
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
      total += calculateDistance(points[i], points[i + 1]);
    }
    return Math.round(total * 10) / 10; // Runde auf 1 Dezimalstelle
  };

  const calculateFuelConsumption = (points) => {
    const distance = calculateTotalDistance(points);
    const avgConsumption = 12; // Liter/100km für Winterdienst-Fahrzeug
    return Math.round(distance * avgConsumption / 100 * 10) / 10;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'hoch': return 'text-red-600 bg-red-100';
      case 'mittel': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Optimierung Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Zap className="w-6 h-6 text-purple-600" />
            <h2 className="text-lg font-bold text-gray-900">Automatische Routenoptimierung</h2>
          </div>
          <button
            onClick={optimizeRoutes}
            disabled={isOptimizing}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {isOptimizing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Optimiert...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Route optimieren</span>
              </>
            )}
          </button>
        </div>

        {/* Einstellungen */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Algorithmus
            </label>
            <select
              value={optimizationSettings.algorithm}
              onChange={(e) => setOptimizationSettings(prev => ({ ...prev, algorithm: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="genetic">Genetisch</option>
              <option value="annealing">Simulated Annealing</option>
              <option value="greedy">Greedy</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max. Routenzeit (h)
            </label>
            <input
              type="number"
              min="4"
              max="12"
              value={optimizationSettings.maxRouteTime / 60}
              onChange={(e) => setOptimizationSettings(prev => ({ 
                ...prev, 
                maxRouteTime: e.target.value * 60 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="traffic"
              checked={optimizationSettings.considerTraffic}
              onChange={(e) => setOptimizationSettings(prev => ({ 
                ...prev, 
                considerTraffic: e.target.checked 
              }))}
              className="mr-2"
            />
            <label htmlFor="traffic" className="text-sm text-gray-700">
              Verkehr berücksichtigen
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="weather"
              checked={optimizationSettings.considerWeather}
              onChange={(e) => setOptimizationSettings(prev => ({ 
                ...prev, 
                considerWeather: e.target.checked 
              }))}
              className="mr-2"
            />
            <label htmlFor="weather" className="text-sm text-gray-700">
              Wetter berücksichtigen
            </label>
          </div>
        </div>
      </div>

      {/* Optimierungsergebnisse */}
      {optimizationResults && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimierungsergebnisse</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{Math.round(optimizationResults.totalTime / 60)}h</div>
              <div className="text-sm text-gray-600">Gesamtzeit</div>
              <div className="text-xs text-green-600">-{optimizationResults.improvements.timeReduction}</div>
            </div>
            
            <div className="text-center">
              <Route className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{optimizationResults.totalDistance}km</div>
              <div className="text-sm text-gray-600">Gesamtstrecke</div>
              <div className="text-xs text-green-600">-{optimizationResults.improvements.distanceReduction}</div>
            </div>
            
            <div className="text-center">
              <Fuel className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{optimizationResults.totalFuel}L</div>
              <div className="text-sm text-gray-600">Kraftstoff</div>
              <div className="text-xs text-green-600">-{optimizationResults.improvements.fuelSavings}</div>
            </div>
            
            <div className="text-center">
              <Zap className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{Math.round(optimizationResults.efficiency)}%</div>
              <div className="text-sm text-gray-600">Effizienz</div>
              <div className="text-xs text-gray-600">{optimizationResults.algorithm}</div>
            </div>
          </div>
        </div>
      )}

      {/* Optimierte Routen */}
      {optimizedRoutes.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimierte Routen</h3>
          
          <div className="space-y-4">
            {optimizedRoutes.map((route, index) => (
              <div key={route.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{route.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {route.assignedWorker}
                      </span>
                      <span className="flex items-center">
                        <Route className="w-4 h-4 mr-1" />
                        {route.assignedVehicle}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-semibold">{Math.round(route.estimatedTime / 60)}h {route.estimatedTime % 60}min</div>
                    <div className="text-gray-600">{route.estimatedDistance}km • {route.estimatedFuel}L</div>
                    <div className="text-purple-600">{Math.round(route.efficiency)}% Effizienz</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Routenpunkte:</div>
                  <div className="flex flex-wrap gap-2">
                    {route.points.map((point, pointIndex) => (
                      <div key={point.id} className="flex items-center space-x-2">
                        <span className="flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                          {pointIndex + 1}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(point.priority)}`}>
                          {point.name}
                        </span>
                        {pointIndex < route.points.length - 1 && (
                          <span className="text-gray-400">→</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoRouteOptimizer;