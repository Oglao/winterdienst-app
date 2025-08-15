import React, { useState, useEffect } from 'react';
import { MapPin, Camera, Clock, Users, Route, CheckCircle, AlertCircle, Plus, Play, Pause, Square } from 'lucide-react';

const WinterdienstApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentPosition, setCurrentPosition] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [workTime, setWorkTime] = useState(0);
  const [photos, setPhotos] = useState([]);
  const [routes, setRoutes] = useState([
    {
      id: 1,
      name: 'Hauptstraße Nord',
      status: 'geplant',
      startTime: '06:00',
      estimatedDuration: '2h 30min',
      priority: 'hoch',
      assignedWorker: 'Max Müller',
      coordinates: [
        { lat: 53.6, lng: 9.9 },
        { lat: 53.61, lng: 9.91 },
        { lat: 53.62, lng: 9.92 }
      ]
    },
    {
      id: 2,
      name: 'Industriegebiet Süd',
      status: 'in_arbeit',
      startTime: '07:00',
      estimatedDuration: '3h 15min',
      priority: 'mittel',
      assignedWorker: 'Anna Schmidt',
      coordinates: [
        { lat: 53.58, lng: 9.95 },
        { lat: 53.57, lng: 9.96 },
        { lat: 53.56, lng: 9.97 }
      ]
    },
    {
      id: 3,
      name: 'Wohngebiet West',
      status: 'abgeschlossen',
      startTime: '05:30',
      estimatedDuration: '1h 45min',
      priority: 'niedrig',
      assignedWorker: 'Peter Wagner',
      coordinates: [
        { lat: 53.55, lng: 9.88 },
        { lat: 53.54, lng: 9.87 },
        { lat: 53.53, lng: 9.86 }
      ]
    }
  ]);
  const [workers, setWorkers] = useState([
    {
      id: 1,
      name: 'Max Müller',
      position: { lat: 53.6, lng: 9.9 },
      status: 'aktiv',
      currentRoute: 'Hauptstraße Nord',
      workTime: '2h 15min',
      lastUpdate: '10:30'
    },
    {
      id: 2,
      name: 'Anna Schmidt',
      position: { lat: 53.58, lng: 9.95 },
      status: 'aktiv',
      currentRoute: 'Industriegebiet Süd',
      workTime: '3h 45min',
      lastUpdate: '10:28'
    },
    {
      id: 3,
      name: 'Peter Wagner',
      position: { lat: 53.55, lng: 9.88 },
      status: 'pause',
      currentRoute: 'Wohngebiet West',
      workTime: '1h 30min',
      lastUpdate: '10:25'
    }
  ]);
  const [workLog, setWorkLog] = useState([]);

  // Simulierte GPS-Verfolgung
  useEffect(() => {
    if (isTracking) {
      const interval = setInterval(() => {
        setWorkTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isTracking]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePhotoCapture = () => {
    const newPhoto = {
      id: Date.now(),
      timestamp: new Date().toLocaleString('de-DE'),
      location: currentPosition || { lat: 53.6, lng: 9.9 },
      description: 'Arbeitsfortschritt dokumentiert'
    };
    setPhotos([...photos, newPhoto]);
    
    // Protokoll-Eintrag hinzufügen
    const logEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleString('de-DE'),
      action: 'Foto aufgenommen',
      location: 'Aktuelle Position',
      worker: 'Aktueller Nutzer'
    };
    setWorkLog([...workLog, logEntry]);
  };

  const updateRouteStatus = (routeId, newStatus) => {
    setRoutes(routes.map(route => 
      route.id === routeId ? { ...route, status: newStatus } : route
    ));
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'geplant': return 'bg-yellow-100 text-yellow-800';
      case 'in_arbeit': return 'bg-blue-100 text-blue-800';
      case 'abgeschlossen': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'hoch': return 'bg-red-100 text-red-800';
      case 'mittel': return 'bg-yellow-100 text-yellow-800';
      case 'niedrig': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Route className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Aktive Touren</p>
              <p className="text-2xl font-bold text-gray-900">
                {routes.filter(r => r.status === 'in_arbeit').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Aktive Mitarbeiter</p>
              <p className="text-2xl font-bold text-gray-900">
                {workers.filter(w => w.status === 'aktiv').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Abgeschlossen</p>
              <p className="text-2xl font-bold text-gray-900">
                {routes.filter(r => r.status === 'abgeschlossen').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Live-Tracking</h3>
        </div>
        <div className="p-6">
          <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center mb-4">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Karte wird hier angezeigt</p>
              <p className="text-sm text-gray-400">Mitarbeiter-Positionen und Routen</p>
            </div>
          </div>
          
          <div className="space-y-2">
            {workers.map(worker => (
              <div key={worker.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center">
                  <div className={`h-3 w-3 rounded-full mr-3 ${worker.status === 'aktiv' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <div>
                    <p className="font-medium">{worker.name}</p>
                    <p className="text-sm text-gray-500">{worker.currentRoute}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{worker.workTime}</p>
                  <p className="text-xs text-gray-500">Letztes Update: {worker.lastUpdate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderRoutes = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Tour-Planung</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Neue Tour
        </button>
      </div>
      
      {routes.map(route => (
        <div key={route.id} className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">{route.name}</h3>
              <p className="text-sm text-gray-500">Mitarbeiter: {route.assignedWorker}</p>
            </div>
            <div className="flex space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(route.status)}`}>
                {route.status.replace('_', ' ')}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(route.priority)}`}>
                {route.priority}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Startzeit</p>
              <p className="font-medium">{route.startTime}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Geschätzte Dauer</p>
              <p className="font-medium">{route.estimatedDuration}</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            {route.status === 'geplant' && (
              <button 
                onClick={() => updateRouteStatus(route.id, 'in_arbeit')}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm"
              >
                Starten
              </button>
            )}
            {route.status === 'in_arbeit' && (
              <button 
                onClick={() => updateRouteStatus(route.id, 'abgeschlossen')}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
              >
                Abschließen
              </button>
            )}
            <button className="bg-gray-600 text-white px-3 py-1 rounded text-sm">
              Auf Karte anzeigen
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTracking = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Arbeitszeit-Tracking</h3>
        
        <div className="text-center mb-6">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {formatTime(workTime)}
          </div>
          <p className="text-gray-500">Aktuelle Arbeitszeit</p>
        </div>
        
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setIsTracking(!isTracking)}
            className={`flex items-center px-4 py-2 rounded-lg ${
              isTracking ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
            }`}
          >
            {isTracking ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isTracking ? 'Pausieren' : 'Starten'}
          </button>
          
          <button
            onClick={() => {
              setIsTracking(false);
              setWorkTime(0);
            }}
            className="flex items-center px-4 py-2 rounded-lg bg-gray-600 text-white"
          >
            <Square className="h-4 w-4 mr-2" />
            Stoppen
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Foto-Dokumentation</h3>
        
        <button
          onClick={handlePhotoCapture}
          className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg flex items-center justify-center mb-4"
        >
          <Camera className="h-5 w-5 mr-2" />
          Arbeitsfortschritt fotografieren
        </button>
        
        <div className="grid grid-cols-2 gap-4">
          {photos.map(photo => (
            <div key={photo.id} className="bg-gray-100 rounded-lg p-4">
              <div className="bg-gray-200 rounded h-32 flex items-center justify-center mb-2">
                <Camera className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium">{photo.timestamp}</p>
              <p className="text-xs text-gray-500">{photo.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderProtocol = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Arbeitsprotokoll</h2>
      
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Aktivitäten</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {workLog.map(entry => (
            <div key={entry.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">{entry.action}</p>
                  <p className="text-sm text-gray-500">{entry.location}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{entry.worker}</p>
                  <p className="text-xs text-gray-500">{entry.timestamp}</p>
                </div>
              </div>
            </div>
          ))}
          {workLog.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              Keine Protokoll-Einträge vorhanden
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">Winterdienst Manager</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1" />
                {new Date().toLocaleString('de-DE')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex space-x-8">
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full text-left px-4 py-2 rounded-lg ${
                  activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('routes')}
                className={`w-full text-left px-4 py-2 rounded-lg ${
                  activeTab === 'routes' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Tour-Planung
              </button>
              <button
                onClick={() => setActiveTab('tracking')}
                className={`w-full text-left px-4 py-2 rounded-lg ${
                  activeTab === 'tracking' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Live-Tracking
              </button>
              <button
                onClick={() => setActiveTab('protocol')}
                className={`w-full text-left px-4 py-2 rounded-lg ${
                  activeTab === 'protocol' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Protokoll
              </button>
            </nav>
          </div>

          <div className="flex-1">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'routes' && renderRoutes()}
            {activeTab === 'tracking' && renderTracking()}
            {activeTab === 'protocol' && renderProtocol()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WinterdienstApp;