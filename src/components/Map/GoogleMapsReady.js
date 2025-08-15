import React, { useState, useEffect, useRef } from 'react';

const GoogleMapsReady = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);

  // Hamburg center coordinates
  const HAMBURG_CENTER = { lat: 53.5511, lng: 9.9937 };

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

  // Load Google Maps API dynamically
  useEffect(() => {
    const loadGoogleMaps = () => {
      return new Promise((resolve, reject) => {
        if (window.google && window.google.maps) {
          resolve(window.google.maps);
          return;
        }

        const script = document.createElement('script');
        // IHR GOOGLE MAPS API-SCHLÜSSEL IST AKTIV:
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDFS7DziqWYyvz30gEWJzDkv0CCabgdeRY&libraries=geometry`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          if (window.google && window.google.maps) {
            resolve(window.google.maps);
          } else {
            reject(new Error('Google Maps failed to load'));
          }
        };
        
        script.onerror = () => reject(new Error('Google Maps script failed to load'));
        document.head.appendChild(script);
      });
    };

    loadGoogleMaps()
      .then((googleMaps) => {
        setGoogleLoaded(true);
        console.log('✅ Google Maps loaded successfully');
        
        if (mapRef.current) {
          const mapInstance = new googleMaps.Map(mapRef.current, {
            center: HAMBURG_CENTER,
            zoom: 13,
            mapTypeId: googleMaps.MapTypeId.ROADMAP,
            styles: [
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "on" }]
              },
              {
                featureType: "transit",
                elementType: "labels", 
                stylers: [{ visibility: "on" }]
              }
            ],
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
            zoomControl: true
          });
          setMap(mapInstance);
          console.log('✅ Google Maps initialized');
        }
      })
      .catch((error) => {
        console.error('❌ Google Maps loading failed:', error);
      });
  }, []);

  // Add markers to map when workers or map changes
  useEffect(() => {
    if (!map || !window.google || !googleLoaded) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    const newMarkers = [];

    workers.forEach(worker => {
      const markerColor = worker.status === 'online' ? '#10b981' : 
                         worker.status === 'recent' ? '#f59e0b' : '#ef4444';

      // Create custom marker with truck icon
      const marker = new window.google.maps.Marker({
        position: { lat: worker.lat, lng: worker.lng },
        map: map,
        title: worker.name,
        icon: {
          path: 'M-20,-8 L-20,8 L20,8 L20,-8 z M-12,-20 L-12,-8 M12,-20 L12,-8',
          fillColor: markerColor,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
          scale: 1.5,
          anchor: new window.google.maps.Point(0, 0)
        },
        label: {
          text: '🚛',
          fontSize: '20px',
          fontWeight: 'bold'
        },
        animation: worker.status === 'online' ? window.google.maps.Animation.BOUNCE : null
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 15px; min-width: 200px;">
            <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 18px;">🚛 ${worker.name}</h3>
            <p style="margin: 5px 0; color: #6b7280; font-size: 14px;"><strong>Status:</strong> <span style="color: ${markerColor}; font-weight: bold;">${worker.status.toUpperCase()}</span></p>
            <p style="margin: 5px 0; color: #6b7280; font-size: 14px;"><strong>Bereich:</strong> ${worker.street}</p>
            <p style="margin: 5px 0; color: #6b7280; font-size: 14px;"><strong>Fahrzeug:</strong> WD-00${worker.id}</p>
            <p style="margin: 5px 0; color: #6b7280; font-size: 14px;"><strong>Koordinaten:</strong> ${worker.lat.toFixed(4)}, ${worker.lng.toFixed(4)}</p>
            <div style="margin-top: 10px; padding: 8px; background-color: ${markerColor}; color: white; border-radius: 4px; text-align: center; font-weight: bold;">
              ${worker.initials} - ${worker.status === 'online' ? 'AKTIV' : worker.status === 'recent' ? 'KÜRZLICH AKTIV' : 'OFFLINE'}
            </div>
          </div>
        `
      });

      marker.addListener('click', () => {
        // Close all other info windows
        markers.forEach(m => {
          if (m.infoWindow) m.infoWindow.close();
        });
        
        infoWindow.open(map, marker);
        setSelectedWorker(worker);
        
        // Center map on marker
        map.panTo(marker.getPosition());
        map.setZoom(15);
      });

      marker.infoWindow = infoWindow;
      newMarkers.push(marker);
    });

    setMarkers(newMarkers);
  }, [map, workers, googleLoaded]);

  // Live tracking movement
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      setWorkers(prevWorkers => {
        return prevWorkers.map(worker => {
          if (worker.status === 'offline') return worker;
          
          // Small realistic movement in Hamburg area
          const latChange = (Math.random() - 0.5) * 0.002; // ~200m movement
          const lngChange = (Math.random() - 0.5) * 0.002;
          
          return {
            ...worker,
            lat: worker.lat + latChange,
            lng: worker.lng + lngChange
          };
        });
      });
      console.log('🔄 Workers moved on Google Maps:', new Date().toLocaleTimeString());
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
    <div style={{ padding: '10px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>

      {/* GOOGLE MAPS - GANZ OBEN */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '15px',
        boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
        border: '5px solid #4285f4',
        marginBottom: '20px'
      }}>
        <div style={{ marginBottom: '15px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#4285f4' }}>
            🗺️ GOOGLE MAPS - HAMBURG WINTERDIENST
          </h1>
          <p style={{ fontSize: '16px', margin: '0', color: '#6b7280' }}>
            Professionelle Google Karten mit {workers.length} Fahrzeugen | Status: {googleLoaded ? '✅ BEREIT' : '⏳ Lädt...'}
          </p>
        </div>

        {/* Loading State */}
        {!googleLoaded && (
          <div style={{
            width: '100%',
            height: '600px',
            backgroundColor: '#f3f4f6',
            border: '5px solid #4285f4',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '6px solid #4285f4',
              borderTop: '6px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '20px'
            }}></div>
            <h2 style={{ color: '#4285f4', fontSize: '24px', margin: '0 0 10px 0', fontWeight: 'bold' }}>
              🗺️ Lädt Google Maps...
            </h2>
            <p style={{ color: '#6b7280', fontSize: '18px', margin: '0', textAlign: 'center' }}>
              Professionelle Hamburg-Straßenkarte wird geladen
            </p>
          </div>
        )}

        {/* THE REAL GOOGLE MAPS */}
        <div 
          ref={mapRef}
          style={{
            width: '100%',
            height: '600px',
            borderRadius: '8px',
            border: '3px solid #e5e7eb',
            display: googleLoaded ? 'block' : 'none'
          }}
        />
      </div>

      {/* Controls - DIREKT UNTER DER KARTE */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button
          onClick={() => setIsTracking(true)}
          disabled={!googleLoaded || isTracking}
          style={{
            backgroundColor: googleLoaded && !isTracking ? '#10b981' : '#9ca3af',
            color: 'white',
            padding: '15px 30px',
            fontSize: '18px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '8px',
            margin: '0 10px',
            cursor: googleLoaded && !isTracking ? 'pointer' : 'not-allowed',
            opacity: googleLoaded ? 1 : 0.6
          }}
        >
          🚀 START LIVE GPS-TRACKING
        </button>
        
        <button
          onClick={() => setIsTracking(false)}
          disabled={!isTracking}
          style={{
            backgroundColor: isTracking ? '#ef4444' : '#9ca3af',
            color: 'white',
            padding: '15px 30px',
            fontSize: '18px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '8px',
            margin: '0 10px',
            cursor: isTracking ? 'pointer' : 'not-allowed',
            opacity: isTracking ? 1 : 0.6
          }}
        >
          🛑 STOP TRACKING
        </button>

        <button
          onClick={() => {
            if (map && workers.length > 0) {
              const bounds = new window.google.maps.LatLngBounds();
              workers.forEach(worker => {
                bounds.extend(new window.google.maps.LatLng(worker.lat, worker.lng));
              });
              map.fitBounds(bounds);
              map.setZoom(Math.min(map.getZoom(), 14));
            }
          }}
          disabled={!googleLoaded}
          style={{
            backgroundColor: googleLoaded ? '#4285f4' : '#9ca3af',
            color: 'white',
            padding: '15px 30px',
            fontSize: '18px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '8px',
            margin: '0 10px',
            cursor: googleLoaded ? 'pointer' : 'not-allowed',
            opacity: googleLoaded ? 1 : 0.6
          }}
        >
          🎯 ALLE FAHRZEUGE ANZEIGEN
        </button>
      </div>

      {/* API Key Success Info */}
      <div style={{
        backgroundColor: '#ecfdf5',
        border: '3px solid #10b981',
        borderRadius: '12px',
        padding: '25px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#065f46', margin: '0 0 15px 0', fontSize: '28px' }}>
          ✅ GOOGLE MAPS API-SCHLÜSSEL AKTIVIERT!
        </h2>
        <div style={{ fontSize: '16px', lineHeight: '1.6', color: '#065f46' }}>
          <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 15px 0' }}>
            Ihr Google Maps API-Schlüssel ist konfiguriert und einsatzbereit! 🎉
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
            
            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '2px solid #10b981' }}>
              <div style={{ fontSize: '20px', marginBottom: '5px' }}>🔑</div>
              <div style={{ fontWeight: 'bold', color: '#1f2937' }}>API-Schlüssel</div>
              <div style={{ fontSize: '12px', color: '#6b7280', wordBreak: 'break-all' }}>AIzaSyDFS7...aktiv</div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '2px solid #10b981' }}>
              <div style={{ fontSize: '20px', marginBottom: '5px' }}>📊</div>
              <div style={{ fontWeight: 'bold', color: '#1f2937' }}>Kostenlose Nutzung</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>25.000 Loads/Monat</div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '2px solid #10b981' }}>
              <div style={{ fontSize: '20px', marginBottom: '5px' }}>🌐</div>
              <div style={{ fontWeight: 'bold', color: '#1f2937' }}>Alle Browser</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Chrome, Firefox, Safari, Brave</div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '2px solid #10b981' }}>
              <div style={{ fontSize: '20px', marginBottom: '5px' }}>🗺️</div>
              <div style={{ fontWeight: 'bold', color: '#1f2937' }}>Höchste Qualität</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Satellit, Straßen, Hybrid</div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
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

      {/* Status */}
      <div style={{
        backgroundColor: isTracking ? '#d1fae5' : '#dbeafe',
        border: `3px solid ${isTracking ? '#10b981' : '#4285f4'}`,
        borderRadius: '12px',
        padding: '25px',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '36px', marginRight: '15px' }}>
            {isTracking ? '✅' : '🗺️'}
          </span>
          <div>
            <h3 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '24px', 
              fontWeight: 'bold',
              color: isTracking ? '#065f46' : '#1e40af'
            }}>
              {isTracking ? 'LIVE GPS-TRACKING AKTIV!' : 'Google Maps Integration bereit'}
            </h3>
            <p style={{ 
              margin: '0', 
              fontSize: '18px',
              color: isTracking ? '#065f46' : '#1e40af'
            }}>
              {isTracking 
                ? `${stats.online} Fahrzeuge bewegen sich in Echtzeit auf Google Maps!`
                : 'Höchste Kartenqualität - funktioniert auf allen Browsern!'
              }
            </p>
          </div>
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
};

export default GoogleMapsReady;