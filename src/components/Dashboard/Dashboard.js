// src/components/Dashboard/Dashboard.js
import React, { useState } from 'react';
import { Route, Users, CheckCircle, AlertCircle } from 'lucide-react';
import InteractiveMap from '../Map/InteractiveMap';
import StatsCard from './StatsCard';
import WorkerList from './WorkerList';
import WeatherWidget from '../Weather/WeatherWidget';
import RouteOptimizer from '../Routes/RouteOptimizer';
import { useAppContext } from '../../context/AppContext';

const Dashboard = () => {
  const { 
    routes, 
    workers, 
    selectedWorker, 
    setSelectedWorker 
  } = useAppContext();

  const [weatherData] = useState({
    temperature: -2,
    condition: 'Schnee',
    windSpeed: 15,
    snowfall: 2
  });

  const stats = {
    activeRoutes: routes.filter(r => r.status === 'in_arbeit').length,
    activeWorkers: workers.filter(w => w.status === 'aktiv').length,
    completedRoutes: routes.filter(r => r.status === 'abgeschlossen').length,
    totalRoutes: routes.length
  };

  return (
    <div className="space-y-6">
      {/* Statistik-Karten */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Aktive Touren"
          value={stats.activeRoutes}
          icon={Route}
          color="blue"
        />
        <StatsCard
          title="Aktive Mitarbeiter"
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
          <h3 className="text-lg font-medium text-gray-900">Live-Tracking & Karte</h3>
        </div>
        <div className="p-6">
          <InteractiveMap 
            workers={workers} 
            routes={routes} 
            selectedWorker={selectedWorker}
            onWorkerSelect={setSelectedWorker}
          />
        </div>
      </div>

      {/* Detailansicht für ausgewählten Mitarbeiter */}
      {selectedWorker && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Mitarbeiter-Details: {selectedWorker.name}
            </h3>
            <button
              onClick={() => setSelectedWorker(null)}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Aktuelle Route</p>
              <p className="font-medium">{selectedWorker.currentRoute}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Arbeitszeit</p>
              <p className="font-medium">{selectedWorker.workTime}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                selectedWorker.status === 'aktiv' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {selectedWorker.status}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Untere Sektion: Mitarbeiter-Übersicht und Wetter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WorkerList workers={workers} onWorkerSelect={setSelectedWorker} selectedWorker={selectedWorker} />
        
        {/* Live-Wetter Widget */}
        <WeatherWidget compact={false} />
      </div>

      {/* Routenoptimierung */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RouteOptimizer 
            waypoints={[
              { lat: 53.5511, lng: 9.9937, name: "Hamburg Zentrum" },
              { lat: 53.5800, lng: 10.0300, name: "Wandsbek" },
              { lat: 53.5200, lng: 9.9500, name: "Altona" }
            ]}
            onOptimizedRoute={(route) => console.log('Optimized route:', route)}
          />
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Testbereich</h3>
          <div className="space-y-3">
            <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Foto-Test
            </button>
            <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              Wetter-Test
            </button>
            <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
              Route-Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;