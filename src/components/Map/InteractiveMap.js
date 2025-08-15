// src/components/Map/InteractiveMap.js
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Users, MapPin, Navigation, Plus, Save, Trash2 } from 'lucide-react';
import WeatherWidget from '../Weather/WeatherWidget';
import ErrorBoundary from '../Common/ErrorBoundary';
import debugLogger from '../../utils/debugLogger';
import { logGPSError } from '../../utils/gpsErrorHandler';
import 'leaflet/dist/leaflet.css';

// Fix für Leaflet Icons in Create React App
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Worker Icon
const createWorkerIcon = (status) => {
  const color = status === 'aktiv' ? '#10b981' : '#f59e0b';
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="12" height="12" fill="white" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

// Custom Route Point Icon
const createRoutePointIcon = (index, isStart = false, isEnd = false) => {
  let color = '#3b82f6';
  let content = index + 1;
  
  if (isStart) {
    color = '#10b981';
    content = 'S';
  } else if (isEnd) {
    color = '#ef4444';
    content = 'E';
  }
  
  return L.divIcon({
    className: 'custom-route-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 10px;
        font-weight: bold;
      ">
        ${content}
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

// Simplified Component for handling map clicks
const RouteCreator = ({ isCreating, onAddPoint, newRoutePoints }) => {
  useMapEvents({
    click: (e) => {
      // Immediate return if not creating to prevent blocking
      if (!isCreating) return;
      
      // Use setTimeout to prevent blocking the main thread
      setTimeout(() => {
        try {
          debugLogger.log('MAP', 'Map clicked (async)', { coords: e.latlng });
          
          if (typeof onAddPoint === 'function') {
            const point = {
              lat: e.latlng.lat,
              lng: e.latlng.lng
            };
            onAddPoint(point);
          }
        } catch (error) {
          debugLogger.error('MAP', 'Error in async map click', error);
        }
      }, 0);
    }
  });

  // Return empty if not array or no points
  if (!Array.isArray(newRoutePoints) || newRoutePoints.length === 0) {
    return null;
  }

  // Limit to maximum 10 points to prevent performance issues
  const limitedPoints = newRoutePoints.slice(0, 10);

  return limitedPoints.map((point, index) => {
    if (!point || typeof point.lat !== 'number' || typeof point.lng !== 'number') {
      return null;
    }
    
    return (
      <Marker
        key={`route-point-${index}`}
        position={[point.lat, point.lng]}
        icon={createRoutePointIcon(index, index === 0, index === limitedPoints.length - 1)}
      >
        <Popup>
          <div className="text-center">
            <p className="font-medium">Punkt {index + 1}</p>
            <p className="text-xs text-gray-500">
              {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
            </p>
          </div>
        </Popup>
      </Marker>
    );
  }).filter(Boolean);
};

const InteractiveMap = ({ workers, routes, selectedWorker, onWorkerSelect }) => {
  const [mapCenter, setMapCenter] = useState([53.5511, 9.9937]); // Hamburg
  const [zoomLevel, setZoomLevel] = useState(11);
  const [showRoutes, setShowRoutes] = useState(true);
  const [isCreatingRoute, setIsCreatingRoute] = useState(false);
  const [newRoutePoints, setNewRoutePoints] = useState([]);
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [currentUserLocation, setCurrentUserLocation] = useState(null);
  const watchId = useRef(null);

  // GPS-Tracking Funktionen
  const startLocationTracking = () => {
    debugLogger.log('MAP', 'Starting GPS tracking...');
    
    if (navigator.geolocation) {
      setIsTrackingLocation(true);
      
      // Einmalige Standortabfrage mit Timeout
      const timeoutId = setTimeout(() => {
        debugLogger.warn('MAP', 'GPS timeout, using Hamburg center');
        const hamburgLocation = { lat: 53.5511, lng: 9.9937 };
        setCurrentUserLocation(hamburgLocation);
        setMapCenter([hamburgLocation.lat, hamburgLocation.lng]);
        setZoomLevel(13);
      }, 5000);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          debugLogger.success('MAP', 'GPS location acquired', location);
          setCurrentUserLocation(location);
          setMapCenter([location.lat, location.lng]);
          setZoomLevel(16);
        },
        (error) => {
          clearTimeout(timeoutId);
          const errorInfo = logGPSError(error, 'InteractiveMap');
          debugLogger.warn('MAP', 'GPS error, using Hamburg center', errorInfo.userFriendlyMessage);
          const hamburgLocation = { lat: 53.5511, lng: 9.9937 };
          setCurrentUserLocation(hamburgLocation);
          setMapCenter([hamburgLocation.lat, hamburgLocation.lng]);
          setZoomLevel(13);
          setIsTrackingLocation(false);
        },
        {
          enableHighAccuracy: false,
          timeout: 4000,
          maximumAge: 300000
        }
      );

      // Kontinuierliches Tracking
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentUserLocation(location);
          
          // TODO: Standort an Server senden
          // updateWorkerLocation(location);
        },
        (error) => {
          console.error('Standort-Tracking Fehler:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      alert('Geolocation wird von diesem Browser nicht unterstützt.');
    }
  };

  const stopLocationTracking = () => {
    setIsTrackingLocation(false);
    setCurrentUserLocation(null);
    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  };

  // Route-Erstellung Funktionen
  const startRouteCreation = () => {
    setIsCreatingRoute(true);
    setNewRoutePoints([]);
  };

  const addRoutePoint = (point) => {
    // Use setTimeout to prevent blocking UI
    setTimeout(() => {
      try {
        debugLogger.log('MAP', 'Adding route point (async)', point);
        setNewRoutePoints(prevPoints => {
          // Limit to 10 points maximum
          const newPoints = [...prevPoints, point].slice(0, 10);
          debugLogger.log('MAP', 'Route points updated', newPoints.length);
          return newPoints;
        });
      } catch (error) {
        debugLogger.error('MAP', 'Error adding route point', error);
        console.error('Add route point error:', error);
      }
    }, 10);
  };

  const clearRoute = () => {
    setNewRoutePoints([]);
  };

  const saveRoute = () => {
    if (newRoutePoints.length < 2) {
      alert('Eine Route benötigt mindestens 2 Punkte.');
      return;
    }
    
    // TODO: Route an Server senden
    console.log('Neue Route:', newRoutePoints);
    alert(`Route mit ${newRoutePoints.length} Punkten erstellt!`);
    
    setIsCreatingRoute(false);
    setNewRoutePoints([]);
  };

  const handleWorkerClick = (worker) => {
    try {
      debugLogger.log('MAP', 'Worker clicked', worker);
      
      if (onWorkerSelect && typeof onWorkerSelect === 'function') {
        onWorkerSelect(worker);
      }
      
      if (worker && worker.position && typeof worker.position.lat === 'number' && typeof worker.position.lng === 'number') {
        setMapCenter([worker.position.lat, worker.position.lng]);
        setZoomLevel(15);
      }
    } catch (error) {
      debugLogger.error('MAP', 'Error in worker click handler', error);
      console.error('Worker click error:', error);
    }
  };

  const getRouteColor = (status) => {
    switch(status) {
      case 'geplant': return '#fbbf24';
      case 'in_arbeit': return '#3b82f6';
      case 'abgeschlossen': return '#10b981';
      default: return '#6b7280';
    }
  };

  // Fallback für den Fall, dass Leaflet nicht verfügbar ist
  if (typeof window === 'undefined') {
    return (
      <div className="h-96 w-full rounded-lg overflow-hidden shadow-lg bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Karte wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary 
      showDetails={true}
      fallback={
        <div className="h-96 w-full rounded-lg overflow-hidden shadow-lg bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Karte nicht verfügbar</p>
            <p className="text-xs text-gray-400 mt-1">Verwenden Sie die anderen App-Funktionen</p>
          </div>
        </div>
      }
    >
      <div className="relative">
        {/* Karten-Controls */}
        <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow p-4 space-y-3 max-w-xs">
          {/* Route Controls */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Routen anzeigen</label>
              <input
                type="checkbox"
                checked={showRoutes}
                onChange={(e) => setShowRoutes(e.target.checked)}
                className="rounded"
              />
            </div>
            
            <div className="border-t pt-2">
              <p className="text-sm font-medium mb-2">Route erstellen</p>
              <div className="flex space-x-1">
                <button
                  onClick={isCreatingRoute ? saveRoute : startRouteCreation}
                  className={`text-xs px-2 py-1 rounded flex items-center ${
                    isCreatingRoute ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
                  }`}
                >
                  {isCreatingRoute ? <Save className="h-3 w-3 mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                  {isCreatingRoute ? 'Speichern' : 'Neue Route'}
                </button>
                
                {isCreatingRoute && (
                  <button
                    onClick={clearRoute}
                    className="text-xs px-2 py-1 rounded bg-red-500 text-white flex items-center"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Löschen
                  </button>
                )}
              </div>
              
              {isCreatingRoute && (
                <p className="text-xs text-blue-600 mt-1">
                  Klicken Sie auf die Karte um Punkte hinzuzufügen ({newRoutePoints.length} Punkte)
                </p>
              )}
            </div>
          </div>

          {/* GPS Tracking Controls */}
          <div className="border-t pt-2">
            <p className="text-sm font-medium mb-2">Standort-Tracking</p>
            <button
              onClick={isTrackingLocation ? stopLocationTracking : startLocationTracking}
              className={`text-xs px-2 py-1 rounded flex items-center w-full justify-center ${
                isTrackingLocation ? 'bg-red-500 text-white' : 'bg-green-600 text-white'
              }`}
            >
              <Navigation className="h-3 w-3 mr-1" />
              {isTrackingLocation ? 'GPS Stoppen' : 'GPS Starten'}
            </button>
            
            {currentUserLocation && (
              <p className="text-xs text-green-600 mt-1">
                Position: {currentUserLocation.lat.toFixed(6)}, {currentUserLocation.lng.toFixed(6)}
              </p>
            )}
          </div>

          {/* Weather Widget */}
          <ErrorBoundary>
            <div className="border-t pt-2">
              <WeatherWidget 
                compact={true} 
                location={{ lat: mapCenter[0], lon: mapCenter[1] }}
              />
            </div>
          </ErrorBoundary>
        </div>

        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow">
          <button
            onClick={() => setZoomLevel(Math.min(zoomLevel + 1, 18))}
            className="p-2 border-b border-gray-200 hover:bg-gray-50 block w-full"
          >
            +
          </button>
          <button
            onClick={() => setZoomLevel(Math.max(zoomLevel - 1, 10))}
            className="p-2 hover:bg-gray-50 block w-full"
          >
            -
          </button>
        </div>

        {/* Karte */}
        <ErrorBoundary 
          fallback={
            <div className="h-96 w-full rounded-lg overflow-hidden shadow-lg bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Karte kann nicht geladen werden</p>
              </div>
            </div>
          }
        >
          <div className="h-96 w-full rounded-lg overflow-hidden shadow-lg">
            <MapContainer
              center={mapCenter}
              zoom={zoomLevel}
              style={{ height: '100%', width: '100%' }}
              key={`${mapCenter[0]}-${mapCenter[1]}-${zoomLevel}`}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {/* Route Creator Component */}
              <ErrorBoundary>
                <RouteCreator
                  isCreating={isCreatingRoute}
                  onAddPoint={addRoutePoint}
                  newRoutePoints={newRoutePoints}
                />
              </ErrorBoundary>
              
              {/* Current User Location */}
              {currentUserLocation && (
                <ErrorBoundary>
                  <Marker
                    position={[currentUserLocation.lat, currentUserLocation.lng]}
                    icon={L.divIcon({
                      className: 'current-location-marker',
                      html: `
                        <div style="
                          background-color: #3b82f6;
                          width: 16px;
                          height: 16px;
                          border-radius: 50%;
                          border: 3px solid white;
                          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
                          animation: pulse 2s infinite;
                        "></div>
                      `,
                      iconSize: [16, 16],
                      iconAnchor: [8, 8]
                    })}
                  >
                    <Popup>
                      <div className="text-center">
                        <p className="font-medium text-blue-600">Ihr Standort</p>
                        <p className="text-xs text-gray-500">
                          {currentUserLocation.lat.toFixed(6)}, {currentUserLocation.lng.toFixed(6)}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                </ErrorBoundary>
              )}
              
              {/* New Route Polyline */}
              {newRoutePoints.length > 1 && (
                <ErrorBoundary>
                  <Polyline
                    positions={newRoutePoints.map(point => [point.lat, point.lng])}
                    color="#3b82f6"
                    weight={3}
                    opacity={0.8}
                    dashArray="5, 5"
                  />
                </ErrorBoundary>
              )}
              
              {/* Mitarbeiter-Marker */}
              <ErrorBoundary>
                {workers && Array.isArray(workers) && workers.map(worker => {
                  if (!worker || !worker.position || typeof worker.position.lat !== 'number' || typeof worker.position.lng !== 'number') {
                    debugLogger.warn('MAP', 'Invalid worker data', worker);
                    return null;
                  }
                  
                  return (
                    <Marker
                      key={`worker-${worker.id}`}
                      position={[worker.position.lat, worker.position.lng]}
                      icon={createWorkerIcon(worker.status)}
                      eventHandlers={{
                        click: () => handleWorkerClick(worker)
                      }}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-bold text-lg">{worker.name}</h3>
                          <p className="text-sm text-gray-600">Route: {worker.currentRoute}</p>
                          <p className="text-sm text-gray-600">Arbeitszeit: {worker.workTime}</p>
                          <p className="text-sm">
                            Status: <span className={`font-medium ${worker.status === 'aktiv' ? 'text-green-600' : 'text-yellow-600'}`}>
                              {worker.status}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Letztes Update: {worker.lastUpdate}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </ErrorBoundary>
              
              {/* Routen-Linien */}
              <ErrorBoundary>
                {showRoutes && routes && Array.isArray(routes) && routes.map(route => {
                  if (!route || !route.coordinates || !Array.isArray(route.coordinates)) {
                    debugLogger.warn('MAP', 'Invalid route data', route);
                    return null;
                  }
                  
                  return (
                    <Polyline
                      key={`route-${route.id}`}
                      positions={route.coordinates.map(coord => [coord.lat, coord.lng])}
                      color={getRouteColor(route.status)}
                      weight={4}
                      opacity={0.7}
                      dashArray={route.status === 'geplant' ? '10, 10' : null}
                    />
                  );
                })}
              </ErrorBoundary>
            </MapContainer>
          </div>
        </ErrorBoundary>

        {/* Legende */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-lg shadow p-3">
          <h4 className="text-sm font-medium mb-2">Legende</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>Aktiver Mitarbeiter</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              <span>Pause</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span>Ihr Standort</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-1 bg-blue-500 mr-2"></div>
              <span>Aktive Route</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-1 mr-2" style={{borderTop: '2px dashed #fbbf24'}}></div>
              <span>Geplante Route</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-1 mr-2" style={{borderTop: '2px dashed #3b82f6'}}></div>
              <span>Neue Route</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2 text-white text-center text-xs">S</div>
              <span>Start/Ende Punkte</span>
            </div>
          </div>
        </div>

        {/* CSS for animations */}
        <style jsx>{`
          @keyframes pulse {
            0% {
              box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
            }
            70% {
              box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
            }
          }
        `}</style>
      </div>
    </ErrorBoundary>
  );
};

export default InteractiveMap;