import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Users, Clock, AlertTriangle, Settings } from 'lucide-react';
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

const LiveMap = () => {
  const [workers, setWorkers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [filter, setFilter] = useState('all'); // all, online, offline
  const [alerts, setAlerts] = useState([]);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const workerMarkersRef = useRef({});

  useEffect(() => {
    // Set up global retry function
    window.retryMapInitialization = () => {
      console.log('🔄 Retrying map initialization...');
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      initializeMap();
      if (workers.length > 0) {
        updateMapMarkers(workers);
      }
    };

    initializeMap();
    connectLiveTracking();
    loadInitialData();

    return () => {
      if (liveTrackingService.isConnected) {
        liveTrackingService.disconnect();
      }
      
      // Cleanup map
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      
      // Cleanup global function
      delete window.retryMapInitialization;
    };
  }, []);

  const initializeMap = () => {
    if (!mapRef.current) {
      console.warn('⚠️ Map container ref not available');
      return;
    }
    
    if (mapInstance.current) {
      console.log('🔄 Map instance already exists');
      return;
    }

    console.log('🗺️ Initializing Leaflet map...');
    console.log('📍 Map container:', mapRef.current);
    console.log('📍 Leaflet available:', typeof L !== 'undefined');

    try {
      // Clear any existing content
      mapRef.current.innerHTML = '';
      
      // Initialize Leaflet map
      const map = L.map(mapRef.current, {
        center: [53.5511, 9.9937],
        zoom: 12,
        zoomControl: true,
        attributionControl: true
      });

      console.log('🗺️ Leaflet map created:', map);

      // Add OpenStreetMap tiles
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      });
      
      tileLayer.addTo(map);
      console.log('🗺️ Tile layer added');

      // Store map instance
      mapInstance.current = map;
      workerMarkersRef.current = {};

      // Force map to resize after a short delay
      setTimeout(() => {
        if (map) {
          map.invalidateSize();
          console.log('🗺️ Map size invalidated');
        }
      }, 100);

      console.log('✅ Live map initialized with Leaflet successfully');
    } catch (error) {
      console.error('❌ Map initialization error:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      // Fallback to simple div
      renderSimpleMap();
    }
  };

  const renderSimpleMap = () => {
    if (!mapRef.current) return;

    console.log('🗺️ Rendering fallback map');

    mapRef.current.innerHTML = `
      <div style="
        width: 100%; 
        height: 700px; 
        background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
        position: relative;
        border-radius: 8px;
        overflow: hidden;
        border: 2px solid #2196f3;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(255,255,255,0.9);
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: bold;
          color: #1976d2;
        ">
          Hamburg Winterdienst - Live Tracking (Fallback Map)
        </div>
        
        <div style="
          text-align: center;
          padding: 20px;
          background: rgba(255,255,255,0.9);
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        ">
          <div style="font-size: 24px; margin-bottom: 10px;">🗺️</div>
          <div style="font-size: 16px; font-weight: bold; color: #1976d2; margin-bottom: 5px;">
            Karte wird geladen...
          </div>
          <div style="font-size: 12px; color: #666; margin-bottom: 10px;">
            Fallback-Modus aktiv - Leaflet konnte nicht initialisiert werden
          </div>
          <button 
            onclick="window.retryMapInitialization()" 
            style="
              padding: 8px 16px; 
              background: #1976d2; 
              color: white; 
              border: none; 
              border-radius: 4px; 
              cursor: pointer;
              font-size: 12px;
            "
          >
            Erneut versuchen
          </button>
        </div>
        
        <div id="worker-markers" style="position: absolute; width: 100%; height: 100%; pointer-events: none;"></div>
      </div>
    `;

    // Add demo markers to fallback map
    setTimeout(() => {
      if (workers.length > 0) {
        renderFallbackMarkers();
      }
    }, 500);
  };

  const renderFallbackMarkers = () => {
    const markersContainer = document.getElementById('worker-markers');
    if (!markersContainer) return;

    markersContainer.innerHTML = '';
    
    workers.forEach((worker, index) => {
      const markerDiv = document.createElement('div');
      markerDiv.style.cssText = `
        position: absolute;
        left: ${20 + index * 60}px;
        top: ${100 + (index % 3) * 80}px;
        width: 40px;
        height: 40px;
        background: ${worker.status === 'online' ? '#4caf50' : '#f44336'};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: transform 0.2s;
      `;
      
      markerDiv.textContent = worker.name.split(' ').map(n => n[0]).join('').toUpperCase();
      markerDiv.title = `${worker.name} - ${worker.status || 'Offline'}`;
      
      markerDiv.addEventListener('mouseenter', () => {
        markerDiv.style.transform = 'scale(1.2)';
      });
      
      markerDiv.addEventListener('mouseleave', () => {
        markerDiv.style.transform = 'scale(1)';
      });
      
      markerDiv.addEventListener('click', () => {
        setSelectedWorker(worker);
      });
      
      markersContainer.appendChild(markerDiv);
    });
    
    console.log('🗺️ Fallback markers rendered:', workers.length);
  };

  const connectLiveTracking = async () => {
    try {
      liveTrackingService.connect();

      // Listen for connection changes
      liveTrackingService.on('connectionChange', (data) => {
        setIsConnected(data.connected);
      });

      // Listen for position updates
      liveTrackingService.on('positionUpdate', (data) => {
        console.log('📍 Live position update:', data);
        updateWorkerPosition(data);
      });

      // Listen for tracking events
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
    await loadWorkerPositions();
    
    // Add demo workers if no real workers are found
    if (workers.length === 0) {
      addDemoWorkers();
    }
  };

  const addDemoWorkers = () => {
    const demoWorkers = [
      {
        user_id: 'demo-1',
        name: 'Max Müller',
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
        latitude: 53.5400,
        longitude: 9.9800,
        status: 'offline',
        last_update: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
        route_name: 'Wohngebiet West',
        license_plate: 'HH-WD 789'
      }
    ];
    
    setWorkers(demoWorkers);
    updateMapMarkers(demoWorkers);
    console.log('📍 Demo workers added to live map');
  };

  const loadWorkerPositions = async () => {
    try {
      const positions = await liveTrackingService.getAllPositions();
      console.log('📊 Worker positions loaded:', positions);
      setWorkers(positions);
      updateMapMarkers(positions);
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

      // If worker not found, add them
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

      updateMapMarkers(updatedWorkers);
      return updatedWorkers;
    });
  };

  const updateMapMarkers = (workerList) => {
    if (mapInstance.current) {
      // Leaflet map is available - use normal markers
      // Clear existing markers
      Object.values(workerMarkersRef.current).forEach(marker => {
        if (mapInstance.current && mapInstance.current.hasLayer) {
          mapInstance.current.removeLayer(marker);
        }
      });
      workerMarkersRef.current = {};

      // Add worker markers to Leaflet map
      workerList.forEach(worker => {
        if (worker.latitude && worker.longitude) {
          createWorkerMarker(worker);
        }
      });
    } else {
      // Fallback to simple markers if Leaflet is not available
      console.log('🗺️ Using fallback markers, Leaflet not available');
      setTimeout(() => renderFallbackMarkers(), 100);
    }
  };

  const createWorkerMarker = (worker) => {
    if (!mapInstance.current) return;

    const isOnline = worker.status === 'online';
    const markerColor = isOnline ? '#4caf50' : '#f44336';
    
    // Create custom icon
    const markerIcon = L.divIcon({
      className: 'custom-worker-marker',
      html: `<div style="
        width: 20px;
        height: 20px;
        background: ${markerColor};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });

    // Create marker
    const marker = L.marker([worker.latitude, worker.longitude], { 
      icon: markerIcon 
    }).addTo(mapInstance.current);

    // Add popup
    const popupContent = `
      <div>
        <h3 style="margin: 0 0 5px 0; font-size: 14px;">${worker.name}</h3>
        <p style="margin: 0; font-size: 12px;">Status: <span style="color: ${markerColor};">${isOnline ? 'Online' : 'Offline'}</span></p>
        ${worker.route_name ? `<p style="margin: 0; font-size: 12px;">Route: ${worker.route_name}</p>` : ''}
        ${worker.license_plate ? `<p style="margin: 0; font-size: 12px;">Fahrzeug: ${worker.license_plate}</p>` : ''}
        <p style="margin: 0; font-size: 12px;">Koordinaten: ${worker.latitude.toFixed(4)}, ${worker.longitude.toFixed(4)}</p>
      </div>
    `;
    
    marker.bindPopup(popupContent);
    
    // Click handler
    marker.on('click', () => {
      setSelectedWorker(worker);
    });

    // Store marker reference
    const workerId = worker.user_id || worker.id;
    workerMarkersRef.current[workerId] = marker;
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
            <h1 className="text-2xl font-bold text-gray-900">Live GPS Tracking</h1>
            <p className="text-gray-600">UBER-ähnliches Echtzeit-Tracking der Mitarbeiter</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{isConnected ? 'Verbunden' : 'Getrennt'}</span>
          </div>

          {/* Tracking Controls */}
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
            <h2 className="text-lg font-semibold text-gray-900">Live Karte</h2>
            <button
              onClick={loadWorkerPositions}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Aktualisieren
            </button>
          </div>
          
          <div ref={mapRef} className="w-full h-[700px] bg-gray-100 rounded-lg" />
          
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

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">Aktuelle Warnungen</h2>
          </div>
          
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-orange-900">{alert.title}</p>
                    <p className="text-sm text-orange-700">{alert.message}</p>
                  </div>
                  <span className="text-xs text-orange-600">{alert.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveMap;