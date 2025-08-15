import React, { useState } from 'react';
import { Route, Users, CheckCircle, AlertCircle } from 'lucide-react';
import InteractiveMap from '../Map/InteractiveMap';
import StatsCard from './StatsCard';
import WorkerList from './WorkerList';
import WeatherWidget from '../Weather/WeatherWidget';
import RouteOptimizer from '../Routes/RouteOptimizer';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

const FilteredDashboard = () => {
  const { routes, workers, selectedWorker, setSelectedWorker, currentPosition, isTracking, workTime, formatTime } = useAppContext();
  const { currentUser, canViewAllData, canViewWorkerData } = useAuth();

  // Daten basierend auf Benutzerrolle filtern
  const filteredRoutes = canViewAllData() 
    ? routes 
    : routes.filter(route => canViewWorkerData(route.assignedWorker));

  const filteredWorkers = canViewAllData() 
    ? workers 
    : workers.filter(worker => canViewWorkerData(worker.name));

  const [weatherData] = useState({
    temperature: -2,
    condition: 'Schnee',
    windSpeed: 15,
    snowfall: 2
  });

  const stats = {
    activeRoutes: filteredRoutes.filter(r => r.status === 'in_arbeit').length,
    activeWorkers: filteredWorkers.filter(w => w.status === 'aktiv').length,
    completedRoutes: filteredRoutes.filter(r => r.status === 'abgeschlossen').length,
    totalRoutes: filteredRoutes.length
  };

  return (
    <div className="space-y-6">
      {/* Benutzer-Info & GPS Status */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium text-gray-900">
              Willkommen, {currentUser?.name}
            </h2>
            <p className="text-sm text-gray-500">
              {currentUser?.role === 'admin' ? 'Administrator' :
               currentUser?.role === 'supervisor' ? 'Team-Leiter' : 'Mitarbeiter'} - 
              {canViewAllData() ? ' Alle Daten sichtbar' : ' Nur eigene Daten sichtbar'}
            </p>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              isTracking ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                isTracking ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
              }`}></div>
              {isTracking ? '🛰️ GPS AKTIV' : '📍 GPS BEREIT'}
            </div>
            {isTracking && (
              <div className="text-xs text-gray-500 mt-1">
                Arbeitszeit: {formatTime(workTime)}
              </div>
            )}
            {currentPosition && (
              <div className="text-xs text-gray-500 mt-1">
                📍 Lat: {currentPosition.lat.toFixed(4)}, Lng: {currentPosition.lng.toFixed(4)}
                {currentPosition.simulated && ' (Simuliert)'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistik-Karten */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Meine/Alle Touren"
          value={stats.activeRoutes}
          icon={Route}
          color="blue"
        />
        <StatsCard
          title={canViewAllData() ? "Alle Mitarbeiter" : "Mein Status"}
          value={stats.activeWorkers}
          icon={Users}
          color="green"
        />
        <StatsCard
          title="Abgeschlossen"
          value={stats.completedRoutes}
          icon={CheckCircle}
          color="purple"
        />
        <StatsCard
          title="Wetter-Status"
          value="Normal"
          icon={CheckCircle}
          color="green"
          isWarning={false}
        />
      </div>

      {/* Karten-Sektion */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {canViewAllData() ? 'Team Live-Tracking' : 'Meine Position'}
          </h3>
        </div>
        <div className="p-6">
          <InteractiveMap 
            workers={filteredWorkers} 
            routes={filteredRoutes} 
            selectedWorker={selectedWorker}
            onWorkerSelect={setSelectedWorker}
          />
        </div>
      </div>

      {/* Untere Sektion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WorkerList 
          workers={filteredWorkers} 
          onWorkerSelect={setSelectedWorker} 
          selectedWorker={selectedWorker}
          showOnlyOwn={!canViewAllData()}
        />
        
        {/* 🌦️ NEUES Live-Wetter Widget */}
        <WeatherWidget compact={false} />
      </div>

      {/* 🗺️ NEUE Routenoptimierung Sektion */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RouteOptimizer 
            waypoints={[
              { lat: 53.5511, lng: 9.9937, name: "Hamburg Zentrum" },
              { lat: 53.5800, lng: 10.0300, name: "Wandsbek" },
              { lat: 53.5200, lng: 9.9500, name: "Altona" }
            ]}
            onOptimizedRoute={(route) => console.log('✅ Optimierte Route:', route)}
          />
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">🧪 Neue Features testen</h3>
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm font-medium text-green-800">📸 Foto-Dokumentation</p>
              <p className="text-xs text-green-600">Navigation → Tracking</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-800">🌦️ Live-Wetter</p>
              <p className="text-xs text-blue-600">Aktiv in diesem Widget</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm font-medium text-purple-800">🗺️ Route-Optimizer</p>
              <p className="text-xs text-purple-600">Links: "Route optimieren"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilteredDashboard;