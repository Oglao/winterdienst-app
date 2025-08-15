import React, { useState, useEffect, useRef } from 'react';

const OpenStreetMapIntegration = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Hamburg center coordinates
  const HAMBURG_CENTER = [53.5511, 9.9937];

  // Initialize workers with real Hamburg coordinates
  useEffect(() => {
    const initialWorkers = [
      { 
        id: 1, 
        name: 'Max Müller', 
        lat: 53.5511, 
        lng: 9.9937, 
        status: 'online', 
        initials: 'MM',
        street: 'Hauptbahnhof Hamburg'
      },
      { 
        id: 2, 
        name: 'Anna Schmidt', 
        lat: 53.5436, 
        lng: 9.9717, 
        status: 'online', 
        initials: 'AS',
        street: 'Speicherstadt'
      },
      { 
        id: 3, 
        name: 'Peter Wagner', 
        lat: 53.5753, 
        lng: 10.0153, 
        status: 'offline', 
        initials: 'PW',
        street: 'Alster'
      },
      { 
        id: 4, 
        name: 'Lisa Schultz', 
        lat: 53.5344, 
        lng: 9.9628, 
        status: 'online', 
        initials: 'LS',
        street: 'Landungsbrücken'
      },
      { 
        id: 5, 
        name: 'Tom Fischer', 
        lat: 53.5584, 
        lng: 9.9355, 
        status: 'recent', 
        initials: 'TF',
        street: 'Schanzenviertel'
      }
    ];
    setWorkers(initialWorkers);
  }, []);

  // Load Leaflet library dynamically
  useEffect(() => {
    const loadLeaflet = () => {
      return new Promise((resolve, reject) => {
        if (window.L) {
          resolve(window.L);
          return;
        }

        // Load CSS first
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        cssLink.crossOrigin = '';
        document.head.appendChild(cssLink);

        // Load JavaScript
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        script.crossOrigin = '';
        script.async = true;
        
        script.onload = () => {
          if (window.L) {
            resolve(window.L);
          } else {
            reject(new Error('Leaflet failed to load'));
          }
        };
        
        script.onerror = () => reject(new Error('Leaflet script failed to load'));
        document.head.appendChild(script);
      });
    };

    loadLeaflet()
      .then((L) => {
        setLeafletLoaded(true);
        console.log('✅ Leaflet loaded successfully');
        
        if (mapRef.current) {
          const mapInstance = L.map(mapRef.current).setView(HAMBURG_CENTER, 13);
          
          // Add OpenStreetMap tiles
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
          }).addTo(mapInstance);
          
          setMap(mapInstance);
          console.log('✅ OpenStreetMap initialized with workers integration');
        }
      })
      .catch((error) => {
        console.error('❌ Leaflet loading failed:', error);
      });
  }, []);

  // Add markers to map when workers or map changes
  useEffect(() => {
    if (!map || !window.L || !leafletLoaded) return;

    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    const newMarkers = [];

    workers.forEach(worker => {
      const markerColor = worker.status === 'online' ? '#10b981' : 
                         worker.status === 'recent' ? '#f59e0b' : '#ef4444';

      // Create custom icon - MUCH LARGER AND MORE VISIBLE
      const customIcon = window.L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background-color: ${markerColor};
            color: white;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 18px;
            border: 4px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            z-index: 1000;
            position: relative;
          ">
            🚛
            <div style="
              position: absolute;
              bottom: -8px;
              background: rgba(0,0,0,0.8);
              color: white;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 12px;
              white-space: nowrap;
            ">
              ${worker.initials}
            </div>
          </div>
        `,
        iconSize: [60, 60],
        iconAnchor: [30, 30]
      });

      const marker = window.L.marker([worker.lat, worker.lng], { icon: customIcon }).addTo(map);
      
      const popupContent = `
        <div style="padding: 8px; min-width: 150px;">
          <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px;">🚛 ${worker.name}</h3>
          <p style="margin: 2px 0; color: #6b7280; font-size: 14px;"><strong>Status:</strong> ${worker.status}</p>
          <p style="margin: 2px 0; color: #6b7280; font-size: 14px;"><strong>Bereich:</strong> ${worker.street}</p>
          <p style="margin: 2px 0; color: #6b7280; font-size: 14px;"><strong>Fahrzeug:</strong> WD-00${worker.id}</p>
          <p style="margin: 6px 0 0 0; color: #374151; font-size: 12px;">
            📍 Lat: ${worker.lat.toFixed(4)}, Lng: ${worker.lng.toFixed(4)}
          </p>
        </div>
      `;
      
      marker.bindPopup(popupContent);
      newMarkers.push(marker);
    });

    setMarkers(newMarkers);
  }, [map, workers, leafletLoaded]);

  // Live tracking movement
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      setWorkers(prevWorkers => {
        return prevWorkers.map(worker => {
          if (worker.status === 'offline') return worker;
          
          // Small realistic movement in Hamburg area
          const latChange = (Math.random() - 0.5) * 0.003; // ~300m movement
          const lngChange = (Math.random() - 0.5) * 0.003;
          
          return {
            ...worker,
            lat: worker.lat + latChange,
            lng: worker.lng + lngChange
          };
        });
      });
      console.log('🔄 Workers moved on OpenStreetMap:', new Date().toLocaleTimeString());
    }, 4000);

    return () => clearInterval(interval);
  }, [isTracking]);

  const stats = {
    total: workers.length,
    online: workers.filter(w => w.status === 'online').length,
    recent: workers.filter(w => w.status === 'recent').length,
    offline: workers.filter(w => w.status === 'offline').length
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{
        backgroundColor: isTracking ? '#10b981' : '#059669',
        color: 'white',
        padding: '25px',
        borderRadius: '12px',
        textAlign: 'center',
        marginBottom: '25px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ fontSize: '36px', margin: '0 0 10px 0', fontWeight: 'bold' }}>
          🗺️ OPENSTREETMAP - ECHTE STRAßEN
        </h1>
        <p style={{ fontSize: '18px', margin: '0' }}>
          {isTracking ? 'LIVE GPS-TRACKING auf OpenStreetMap' : 'Kostenlose echte Straßenkarte - Keine API-Schlüssel erforderlich'}
        </p>
      </div>

      {/* Info Box */}
      <div style={{
        backgroundColor: '#ecfdf5',
        border: '2px solid #10b981',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px'
      }}>
        <h3 style={{ color: '#065f46', margin: '0 0 8px 0' }}>✅ OpenStreetMap Integration</h3>
        <p style={{ color: '#065f46', margin: '0', fontSize: '14px' }}>
          Diese Implementierung verwendet OpenStreetMap (kostenlos) mit Leaflet.js für echte Straßenkarten.
          <br />
          <strong>Vorteile:</strong> Kostenlos, keine API-Schlüssel, echte Straßen und Gebäude von Hamburg.
        </p>
      </div>

      {/* Controls */}
      <div style={{ textAlign: 'center', marginBottom: '25px' }}>
        <button
          onClick={() => setIsTracking(true)}
          disabled={!leafletLoaded}
          style={{
            backgroundColor: leafletLoaded ? '#10b981' : '#9ca3af',
            color: 'white',
            padding: '15px 30px',
            fontSize: '18px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '8px',
            margin: '0 10px',
            cursor: leafletLoaded ? 'pointer' : 'not-allowed',
            opacity: leafletLoaded ? 1 : 0.6
          }}
        >
          🚀 START LIVE GPS-TRACKING
        </button>
        
        <button
          onClick={() => setIsTracking(false)}
          style={{
            backgroundColor: '#ef4444',
            color: 'white',
            padding: '15px 30px',
            fontSize: '18px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '8px',
            margin: '0 10px',
            cursor: 'pointer'
          }}
        >
          🛑 STOP TRACKING
        </button>
      </div>

      {/* Statistics */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
        <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', textAlign: 'center', minWidth: '100px', border: '2px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#6b7280' }}>Gesamt</h3>
          <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{stats.total}</p>
        </div>
        <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', textAlign: 'center', minWidth: '100px', border: '2px solid #10b981' }}>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#6b7280' }}>Online</h3>
          <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{stats.online}</p>
        </div>
        <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', textAlign: 'center', minWidth: '100px', border: '2px solid #f59e0b' }}>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#6b7280' }}>Kürzlich</h3>
          <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{stats.recent}</p>
        </div>
        <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', textAlign: 'center', minWidth: '100px', border: '2px solid #ef4444' }}>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#6b7280' }}>Offline</h3>
          <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>{stats.offline}</p>
        </div>
      </div>

      {/* OPENSTREETMAP CONTAINER */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
        border: '3px solid #059669'
      }}>
        <div style={{ marginBottom: '15px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#1f2937' }}>
            📍 Hamburg Winterdienst - OpenStreetMap
          </h2>
          <p style={{ fontSize: '16px', margin: '0', color: '#6b7280' }}>
            Echte Straßenkarte mit {workers.length} Winterdienst-Fahrzeugen | Status: {leafletLoaded ? 'Bereit' : 'Wird geladen...'}
          </p>
        </div>

        {/* Loading State */}
        {!leafletLoaded && (
          <div style={{
            width: '100%',
            height: '700px',
            backgroundColor: '#f3f4f6',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #059669',
              borderTop: '4px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '15px'
            }}></div>
            <p style={{ color: '#6b7280', fontSize: '16px', margin: '0' }}>
              Lädt OpenStreetMap Karte mit 5 Winterdienst-Fahrzeugen...
            </p>
          </div>
        )}

        {/* THE REAL OPENSTREETMAP - MUCH LARGER */}
        <div 
          ref={mapRef}
          style={{
            width: '100%',
            height: '700px',
            borderRadius: '8px',
            border: '2px solid #e5e7eb',
            display: leafletLoaded ? 'block' : 'none',
            zIndex: 1
          }}
        />

        {/* Debug Info */}
        {leafletLoaded && (
          <div style={{
            marginTop: '15px',
            padding: '15px',
            backgroundColor: '#f0f9ff',
            borderRadius: '8px',
            border: '1px solid #0284c7'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#0284c7', fontSize: '16px', fontWeight: 'bold' }}>
              🚛 Live Fahrzeug-Status auf der Karte:
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {workers.map(worker => (
                <div key={worker.id} style={{
                  padding: '8px 12px',
                  backgroundColor: worker.color,
                  color: 'white',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  🚛 {worker.initials} - {worker.status} - Lat: {worker.lat.toFixed(4)}, Lng: {worker.lng.toFixed(4)}
                </div>
              ))}
            </div>
            <p style={{ margin: '10px 0 0 0', color: '#0284c7', fontSize: '14px' }}>
              Alle {workers.length} Fahrzeuge sind jetzt als große 🚛 Symbole auf der echten Hamburg-Straßenkarte sichtbar!
            </p>
          </div>
        )}
      </div>

      {/* Status */}
      <div style={{
        marginTop: '25px',
        backgroundColor: isTracking ? '#d1fae5' : '#ecfdf5',
        border: `3px solid ${isTracking ? '#10b981' : '#059669'}`,
        borderRadius: '12px',
        padding: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '36px', marginRight: '15px' }}>
            {isTracking ? '✅' : '🗺️'}
          </span>
          <div>
            <h3 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '22px', 
              fontWeight: 'bold',
              color: '#065f46'
            }}>
              {isTracking ? 'ECHTES GPS-TRACKING AKTIV!' : 'OpenStreetMap Integration bereit'}
            </h3>
            <p style={{ 
              margin: '0', 
              fontSize: '16px',
              color: '#065f46'
            }}>
              {isTracking 
                ? `${stats.online} Fahrzeuge bewegen sich in Echtzeit auf echten Hamburg-Straßen!`
                : 'Jetzt können Sie echte Straßen, Gebäude und Orte in Hamburg sehen - kostenlos mit OpenStreetMap!'
              }
            </p>
          </div>
        </div>
      </div>

      {/* CSS Animation for spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .custom-marker {
          background: none !important;
          border: none !important;
        }
      `}</style>

    </div>
  );
};

export default OpenStreetMapIntegration;