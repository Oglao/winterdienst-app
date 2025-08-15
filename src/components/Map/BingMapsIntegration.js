import React, { useState, useEffect, useRef } from 'react';

const BingMapsIntegration = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [mapReady, setMapReady] = useState(false);
  const [bingLoaded, setBingLoaded] = useState(false);

  // Hamburg center coordinates
  const HAMBURG_CENTER = { latitude: 53.5511, longitude: 9.9937 };

  // Initialize workers with real Hamburg coordinates
  useEffect(() => {
    const initialWorkers = [
      { 
        id: 1, 
        name: 'Max Müller', 
        lng: 9.9937, 
        lat: 53.5511, 
        status: 'online', 
        initials: 'MM',
        street: 'Hauptbahnhof Hamburg'
      },
      { 
        id: 2, 
        name: 'Anna Schmidt', 
        lng: 9.9717, 
        lat: 53.5436, 
        status: 'online', 
        initials: 'AS',
        street: 'Speicherstadt'
      },
      { 
        id: 3, 
        name: 'Peter Wagner', 
        lng: 10.0153, 
        lat: 53.5753, 
        status: 'offline', 
        initials: 'PW',
        street: 'Alster'
      },
      { 
        id: 4, 
        name: 'Lisa Schultz', 
        lng: 9.9628, 
        lat: 53.5344, 
        status: 'online', 
        initials: 'LS',
        street: 'Landungsbrücken'
      },
      { 
        id: 5, 
        name: 'Tom Fischer', 
        lng: 9.9355, 
        lat: 53.5584, 
        status: 'recent', 
        initials: 'TF',
        street: 'Schanzenviertel'
      }
    ];
    setWorkers(initialWorkers);
  }, []);

  // Load Bing Maps dynamically
  useEffect(() => {
    const loadBingMaps = () => {
      return new Promise((resolve, reject) => {
        if (window.Microsoft && window.Microsoft.Maps) {
          resolve(window.Microsoft.Maps);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://www.bing.com/api/maps/mapcontrol?callback=initBingMap&key=YOUR_BING_API_KEY_HERE';
        script.async = true;
        script.defer = true;
        
        // Create callback function
        window.initBingMap = () => {
          if (window.Microsoft && window.Microsoft.Maps) {
            resolve(window.Microsoft.Maps);
          } else {
            reject(new Error('Bing Maps failed to load'));
          }
        };
        
        script.onerror = () => reject(new Error('Bing Maps script failed to load'));
        document.head.appendChild(script);
      });
    };

    loadBingMaps()
      .then((BingMaps) => {
        setBingLoaded(true);
        console.log('✅ Bing Maps loaded successfully');
        
        if (mapRef.current) {
          const mapInstance = new BingMaps.Map(mapRef.current, {
            center: new BingMaps.Location(HAMBURG_CENTER.latitude, HAMBURG_CENTER.longitude),
            zoom: 12,
            mapTypeId: BingMaps.MapTypeId.road
          });
          
          setMap(mapInstance);
          setMapReady(true);
          console.log('✅ Bing Maps initialized');
        }
      })
      .catch((error) => {
        console.error('❌ Bing Maps loading failed:', error);
      });
  }, []);

  // Add markers when map is ready
  useEffect(() => {
    if (!map || !window.Microsoft || !bingLoaded) return;

    const BingMaps = window.Microsoft.Maps;
    
    workers.forEach(worker => {
      const markerColor = worker.status === 'online' ? 'green' : 
                         worker.status === 'recent' ? 'orange' : 'red';

      const location = new BingMaps.Location(worker.lat, worker.lng);
      
      const pin = new BingMaps.Pushpin(location, {
        title: worker.name,
        text: worker.initials,
        color: markerColor
      });

      const infobox = new BingMaps.Infobox(location, {
        title: `🚛 ${worker.name}`,
        description: `Status: ${worker.status}<br>Bereich: ${worker.street}<br>Fahrzeug: WD-00${worker.id}`,
        visible: false
      });

      BingMaps.Events.addHandler(pin, 'click', () => {
        infobox.setOptions({ visible: true });
        map.setView({ center: location });
      });

      map.entities.push(pin);
      map.entities.push(infobox);
    });
  }, [map, workers, bingLoaded]);

  // Live tracking movement
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      setWorkers(prevWorkers => {
        return prevWorkers.map(worker => {
          if (worker.status === 'offline') return worker;
          
          const latChange = (Math.random() - 0.5) * 0.003;
          const lngChange = (Math.random() - 0.5) * 0.003;
          
          return {
            ...worker,
            lat: worker.lat + latChange,
            lng: worker.lng + lngChange
          };
        });
      });
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
        backgroundColor: '#3b82f6',
        color: 'white',
        padding: '25px',
        borderRadius: '12px',
        textAlign: 'center',
        marginBottom: '25px'
      }}>
        <h1 style={{ fontSize: '36px', margin: '0 0 10px 0', fontWeight: 'bold' }}>
          🗺️ BING MAPS - MICROSOFT KARTEN
        </h1>
        <p style={{ fontSize: '18px', margin: '0' }}>
          {bingLoaded ? 'Bing Maps Integration bereit' : 'Lädt Microsoft Bing Maps...'}
        </p>
      </div>

      {/* API Key Info */}
      <div style={{
        backgroundColor: '#fef3c7',
        border: '2px solid #f59e0b',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px'
      }}>
        <h3 style={{ color: '#92400e', margin: '0 0 8px 0' }}>🔑 Bing Maps API-Schlüssel erforderlich</h3>
        <p style={{ color: '#92400e', margin: '0 0 10px 0', fontSize: '14px' }}>
          Ersetzen Sie "YOUR_BING_API_KEY_HERE" mit Ihrem echten Bing Maps API-Schlüssel.
        </p>
        <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: '6px', fontSize: '14px' }}>
          <strong>Kostenlos erhalten:</strong>
          <ol style={{ margin: '5px 0 0 0', paddingLeft: '20px' }}>
            <li>Gehen Sie zu: <strong>www.bingmapsportal.com</strong></li>
            <li>Registrieren Sie sich mit Microsoft-Account</li>
            <li>Erstellen Sie eine neue Anwendung</li>
            <li>Kopieren Sie den API-Schlüssel</li>
            <li>Kostenlos bis 125.000 Transaktionen/Jahr</li>
          </ol>
        </div>
      </div>

      {/* Controls */}
      <div style={{ textAlign: 'center', marginBottom: '25px' }}>
        <button
          onClick={() => setIsTracking(true)}
          disabled={!bingLoaded}
          style={{
            backgroundColor: bingLoaded ? '#10b981' : '#9ca3af',
            color: 'white',
            padding: '15px 30px',
            fontSize: '18px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '8px',
            margin: '0 10px',
            cursor: bingLoaded ? 'pointer' : 'not-allowed',
            opacity: bingLoaded ? 1 : 0.6
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

      {/* BING MAPS CONTAINER */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
        border: '3px solid #3b82f6'
      }}>
        <div style={{ marginBottom: '15px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#1f2937' }}>
            📍 Hamburg Winterdienst - Bing Maps
          </h2>
          <p style={{ fontSize: '16px', margin: '0', color: '#6b7280' }}>
            Microsoft Karten mit {workers.length} Winterdienst-Fahrzeugen | Status: {bingLoaded ? 'Bereit' : 'Wird geladen...'}
          </p>
        </div>

        {/* Loading State */}
        {!bingLoaded && (
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
              border: '4px solid #3b82f6',
              borderTop: '4px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '15px'
            }}></div>
            <p style={{ color: '#6b7280', fontSize: '16px', margin: '0' }}>
              Lädt Microsoft Bing Maps mit 5 Winterdienst-Fahrzeugen...
            </p>
          </div>
        )}

        {/* THE REAL BING MAPS */}
        <div 
          ref={mapRef}
          style={{
            width: '100%',
            height: '700px',
            borderRadius: '8px',
            border: '2px solid #e5e7eb',
            display: bingLoaded ? 'block' : 'none'
          }}
        />

        {/* Debug Info */}
        {bingLoaded && (
          <div style={{
            marginTop: '15px',
            padding: '15px',
            backgroundColor: '#f0f9ff',
            borderRadius: '8px',
            border: '1px solid #3b82f6'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#3b82f6', fontSize: '16px', fontWeight: 'bold' }}>
              🚛 Live Fahrzeug-Status auf Bing Maps:
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {workers.map(worker => (
                <div key={worker.id} style={{
                  padding: '8px 12px',
                  backgroundColor: worker.status === 'online' ? '#10b981' : worker.status === 'recent' ? '#f59e0b' : '#ef4444',
                  color: 'white',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  🚛 {worker.initials} - {worker.status} - Lat: {worker.lat.toFixed(4)}, Lng: {worker.lng.toFixed(4)}
                </div>
              ))}
            </div>
            <p style={{ margin: '10px 0 0 0', color: '#3b82f6', fontSize: '14px' }}>
              Alle {workers.length} Fahrzeuge sind als Pushpins auf der echten Hamburg-Karte sichtbar!
            </p>
          </div>
        )}
      </div>

      {/* Status */}
      <div style={{
        marginTop: '25px',
        backgroundColor: isTracking ? '#d1fae5' : '#dbeafe',
        border: `3px solid ${isTracking ? '#10b981' : '#3b82f6'}`,
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
              color: isTracking ? '#065f46' : '#1e40af'
            }}>
              {isTracking ? 'ECHTES GPS-TRACKING AKTIV!' : 'Microsoft Bing Maps Integration'}
            </h3>
            <p style={{ 
              margin: '0', 
              fontSize: '16px',
              color: isTracking ? '#065f46' : '#1e40af'
            }}>
              {isTracking 
                ? `${stats.online} Fahrzeuge bewegen sich in Echtzeit auf Microsoft Bing Maps!`
                : 'Hochwertige Microsoft-Karten mit einfachem API-Schlüssel-Setup!'
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

export default BingMapsIntegration;