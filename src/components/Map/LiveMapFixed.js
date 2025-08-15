import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { MapPin, Navigation, Users, Clock, AlertTriangle } from 'lucide-react';
import L from 'leaflet';
import liveTrackingService from '../../services/liveTrackingService';
import 'leaflet/dist/leaflet.css';

// Fix für Leaflet Icons in Create React App
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom marker icons
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-worker-marker',
    html: `<div style="
      width: 20px;
      height: 20px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });
};

const LiveMapFixed = () => {
  const [workers, setWorkers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [filter, setFilter] = useState('all');
  const [alerts, setAlerts] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    console.log('🗺️ LiveMapFixed component mounted');
    connectLiveTracking();
    loadInitialData();

    return () => {
      if (liveTrackingService.isConnected) {
        liveTrackingService.disconnect();
      }
    };
  }, []);

  const connectLiveTracking = async () => {
    try {
      liveTrackingService.connect();

      liveTrackingService.on('connectionChange', (data) => {
        setIsConnected(data.connected);
      });

      liveTrackingService.on('positionUpdate', (data) => {
        console.log('📍 Live position update:', data);
        updateWorkerPosition(data);
      });

      liveTrackingService.on('trackingStarted', (data) => {
        console.log('🚀 Worker started tracking:', data);
        loadWorkerPositions();
      });

      liveTrackingService.on('trackingStopped', (data) => {
        console.log('🛑 Worker stopped tracking:', data);
        loadWorkerPositions();
      });

    } catch (error) {
      console.error('Live tracking connection error:', error);
    }
  };

  const loadInitialData = async () => {
    console.log('📊 Loading initial data...');
    
    try {
      await loadWorkerPositions();
      console.log('📊 API positions loaded, workers count:', workers.length);
    } catch (error) {
      console.error('📊 Failed to load API positions:', error);
    }
    
    // Always add demo workers for testing
    addDemoWorkers();
  };

  const addDemoWorkers = () => {
    console.log('📍 Adding demo workers...');
    
    const demoWorkers = [
      {
        user_id: 'demo-1',
        name: 'Max Müller',
        email: 'max.mueller@winterdienst.de',
        latitude: 53.5511,
        longitude: 9.9937,
        status: 'online',
        last_update: new Date(),
        route_name: 'Hauptstraße Nord',
        license_plate: 'HH-WD 123'
      },
      {
        user_id: 'demo-2', 
        name: 'Anna Schmidt',
        email: 'anna.schmidt@winterdienst.de',
        latitude: 53.5600,
        longitude: 10.0000,
        status: 'online',
        last_update: new Date(),
        route_name: 'Industriegebiet Süd',
        license_plate: 'HH-WD 456'
      },
      {
        user_id: 'demo-3',
        name: 'Peter Wagner',
        email: 'peter.wagner@winterdienst.de', 
        latitude: 53.5400,
        longitude: 9.9800,
        status: 'offline',
        last_update: new Date(Date.now() - 30 * 60 * 1000),
        route_name: 'Wohngebiet West',
        license_plate: 'HH-WD 789'
      },
      {
        user_id: 'demo-4',
        name: 'Lisa Schultz',
        email: 'lisa.schultz@winterdienst.de',
        latitude: 53.5300,
        longitude: 9.9600,
        status: 'online',
        last_update: new Date(Date.now() - 5 * 60 * 1000),
        route_name: 'Altona Bezirk',
        license_plate: 'HH-WD 901'
      },
      {
        user_id: 'demo-5',
        name: 'Tom Fischer',
        email: 'tom.fischer@winterdienst.de',
        latitude: 53.5700,
        longitude: 9.9500,
        status: 'recent',
        last_update: new Date(Date.now() - 20 * 60 * 1000),
        route_name: 'Eimsbüttel Route',
        license_plate: 'HH-WD 234'
      }
    ];
    
    setWorkers(demoWorkers);
    console.log('📍 Demo workers added:', demoWorkers.length, 'workers');
    console.log('📍 Workers state:', demoWorkers);
  };

  const loadWorkerPositions = async () => {
    try {
      const positions = await liveTrackingService.getAllPositions();
      console.log('📊 Worker positions loaded:', positions);
      setWorkers(positions);
    } catch (error) {
      console.error('Failed to load worker positions:', error);
    }
  };

  const updateWorkerPosition = (positionData) => {
    setWorkers(prevWorkers => {
      const updatedWorkers = prevWorkers.map(worker => {
        if (worker.user_id === positionData.userId || worker.id === positionData.userId) {
          return {
            ...worker,
            latitude: positionData.latitude,
            longitude: positionData.longitude,
            last_update: positionData.timestamp,
            status: 'online'
          };
        }
        return worker;
      });

      if (!updatedWorkers.find(w => w.user_id === positionData.userId)) {
        updatedWorkers.push({
          user_id: positionData.userId,
          name: positionData.name || 'Unknown Worker',
          latitude: positionData.latitude,
          longitude: positionData.longitude,
          last_update: positionData.timestamp,
          status: 'online',
          role: 'worker'
        });
      }

      return updatedWorkers;
    });
  };

  const startTracking = async () => {
    try {
      const result = await liveTrackingService.startTracking();
      if (result.success) {
        setTrackingEnabled(true);
        console.log('✅ GPS tracking started');
      } else {
        console.error('❌ Failed to start tracking:', result.error);
      }
    } catch (error) {
      console.error('❌ Tracking start error:', error);
    }
  };

  const stopTracking = async () => {
    try {
      const result = await liveTrackingService.stopTracking();
      if (result.success) {
        setTrackingEnabled(false);
        console.log('✅ GPS tracking stopped');
      } else {
        console.error('❌ Failed to stop tracking:', result.error);
      }
    } catch (error) {
      console.error('❌ Tracking stop error:', error);
    }
  };

  const filteredWorkers = workers.filter(worker => {
    if (filter === 'online') return worker.status === 'online';
    if (filter === 'offline') return worker.status !== 'online';
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100';
      case 'recent': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-red-600 bg-red-100';
    }
  };

  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return 'Nie';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Gerade eben';
    if (diffMinutes < 60) return `vor ${diffMinutes}min`;
    if (diffMinutes < 1440) return `vor ${Math.floor(diffMinutes/60)}h`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <MapPin className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Live GPS Tracking (Fixed)</h1>
            <p className="text-gray-600">UBER-ähnliches Echtzeit-Tracking mit React-Leaflet</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{isConnected ? 'Verbunden' : 'Getrennt'}</span>
          </div>

          <button
            onClick={trackingEnabled ? stopTracking : startTracking}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium ${
              trackingEnabled 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <Navigation className="h-4 w-4" />
            <span>{trackingEnabled ? 'Stop Tracking' : 'Start Tracking'}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Gesamt</p>
              <p className="text-2xl font-bold text-gray-900">{workers.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Online</p>
              <p className="text-2xl font-bold text-green-600">
                {workers.filter(w => w.status === 'online').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Kürzlich</p>
              <p className="text-2xl font-bold text-yellow-600">
                {workers.filter(w => w.status === 'recent').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Offline</p>
              <p className="text-2xl font-bold text-red-600">
                {workers.filter(w => w.status === 'offline' || !w.status).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Live Map */}
        <div className="xl:col-span-3 bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Live Karte (React-Leaflet)</h2>
              <p className="text-sm text-gray-600">
                {workers.length} Mitarbeiter geladen • Map: {mapLoaded ? 'Geladen' : 'Wird geladen...'}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={addDemoWorkers}
                className="text-green-600 hover:text-green-800 font-medium text-sm"
              >
                Demo laden
              </button>
              <button
                onClick={loadWorkerPositions}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Aktualisieren
              </button>
            </div>
          </div>
          
          <div className="w-full h-[700px] rounded-lg overflow-hidden border border-gray-200 relative">
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-50">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-gray-600">Karte wird geladen...</p>
                </div>
              </div>
            )}
            
            <MapContainer
              center={[53.5511, 9.9937]}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
              whenCreated={() => {
                setTimeout(() => {
                  setMapLoaded(true);
                  console.log('✅ React-Leaflet map created successfully');
                }, 500);
              }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
              />
              
              {workers.map(worker => {
                if (!worker.latitude || !worker.longitude) return null;
                
                const isOnline = worker.status === 'online';
                const markerColor = isOnline ? '#4caf50' : '#f44336';
                
                return (
                  <Marker
                    key={worker.user_id || worker.id}
                    position={[worker.latitude, worker.longitude]}
                    icon={createCustomIcon(markerColor)}
                    eventHandlers={{
                      click: () => setSelectedWorker(worker)
                    }}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-bold text-gray-900 mb-2">{worker.name}</h3>
                        <div className="space-y-1 text-sm">
                          <p>Status: <span style={{ color: markerColor }}>
                            {isOnline ? 'Online' : 'Offline'}
                          </span></p>
                          {worker.route_name && <p>Route: {worker.route_name}</p>}
                          {worker.license_plate && <p>Fahrzeug: {worker.license_plate}</p>}
                          <p>Koordinaten: {worker.latitude.toFixed(4)}, {worker.longitude.toFixed(4)}</p>
                          <p>Letzte Aktualisierung: {formatLastUpdate(worker.last_update)}</p>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
          
          {selectedWorker && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900">{selectedWorker.name}</h3>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <p>Status: <span className={`px-2 py-1 rounded text-xs ${getStatusColor(selectedWorker.status)}`}>
                  {selectedWorker.status || 'Unbekannt'}
                </span></p>
                <p>Position: {selectedWorker.latitude?.toFixed(6)}, {selectedWorker.longitude?.toFixed(6)}</p>
                <p>Letzte Aktualisierung: {formatLastUpdate(selectedWorker.last_update)}</p>
                {selectedWorker.route_name && <p>Route: {selectedWorker.route_name}</p>}
                {selectedWorker.license_plate && <p>Fahrzeug: {selectedWorker.license_plate}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Worker List */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Mitarbeiter</h2>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">Alle</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </div>
          
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {filteredWorkers.map(worker => (
              <div
                key={worker.user_id || worker.id}
                onClick={() => setSelectedWorker(worker)}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{worker.name}</h3>
                    <p className="text-sm text-gray-600">{worker.email}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(worker.status)}`}>
                    {worker.status || 'Offline'}
                  </span>
                </div>
                <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>{formatLastUpdate(worker.last_update)}</span>
                </div>
              </div>
            ))}
            
            {filteredWorkers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Keine Mitarbeiter gefunden</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">React-Leaflet Version</p>
            <p>
              Diese Version verwendet React-Leaflet anstatt vanilla Leaflet für bessere 
              React-Integration und Stabilität. Die Karte sollte zuverlässig laden.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMapFixed;