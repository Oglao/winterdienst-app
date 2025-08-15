import React, { useState, useEffect, useRef } from 'react';

const SimpleBingMaps = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [bingLoaded, setBingLoaded] = useState(false);

  // Hamburg center coordinates
  const HAMBURG_CENTER = { latitude: 53.5511, longitude: 9.9937 };

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

  // Load Bing Maps dynamically
  useEffect(() => {
    const loadBingMaps = () => {
      return new Promise((resolve, reject) => {
        if (window.Microsoft && window.Microsoft.Maps) {
          resolve(window.Microsoft.Maps);
          return;
        }

        const script = document.createElement('script');
        // KOSTENLOSER BING MAPS API-SCHLÜSSEL - VIEL EINFACHER:
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
            zoom: 13,
            mapTypeId: BingMaps.MapTypeId.road,
            showDashboard: true,
            showMapTypeSelector: true,
            showScalebar: true
          });
          
          setMap(mapInstance);
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
    
    // Clear existing markers
    map.entities.clear();
    
    workers.forEach(worker => {
      const markerColor = worker.status === 'online' ? 'green' : 
                         worker.status === 'recent' ? 'orange' : 'red';

      const location = new BingMaps.Location(worker.lat, worker.lng);
      
      const pin = new BingMaps.Pushpin(location, {
        title: worker.name,
        text: worker.initials,
        color: markerColor,
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                 <circle cx="20" cy="20" r="18" fill="${worker.status === 'online' ? '#10b981' : worker.status === 'recent' ? '#f59e0b' : '#ef4444'}" stroke="white" stroke-width="3"/>
                 <text x="20" y="15" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">🚛</text>
                 <text x="20" y="30" text-anchor="middle" fill="white" font-family="Arial" font-size="10" font-weight="bold">${worker.initials}</text>
               </svg>`
      });

      const infobox = new BingMaps.Infobox(location, {
        title: `🚛 ${worker.name}`,
        description: `
          <div style="padding: 10px;">
            <p><strong>Status:</strong> <span style="color: ${worker.status === 'online' ? '#10b981' : worker.status === 'recent' ? '#f59e0b' : '#ef4444'}">${worker.status.toUpperCase()}</span></p>
            <p><strong>Bereich:</strong> ${worker.street}</p>
            <p><strong>Fahrzeug:</strong> WD-00${worker.id}</p>
            <p><strong>Koordinaten:</strong> ${worker.lat.toFixed(4)}, ${worker.lng.toFixed(4)}</p>
          </div>
        `,
        visible: false
      });

      BingMaps.Events.addHandler(pin, 'click', () => {
        infobox.setOptions({ visible: true });
        map.setView({ center: location, zoom: 15 });
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
          
          const latChange = (Math.random() - 0.5) * 0.002;
          const lngChange = (Math.random() - 0.5) * 0.002;
          
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
    <div style={{ padding: '10px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>

      {/* BING MAPS - GANZ OBEN */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '15px',
        boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
        border: '5px solid #0078d4',
        marginBottom: '20px'
      }}>
        <div style={{ marginBottom: '15px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#0078d4' }}>
            🗺️ BING MAPS - KOSTENLOSE ALTERNATIVE
          </h1>
          <p style={{ fontSize: '16px', margin: '0', color: '#6b7280' }}>
            Microsoft Karten mit {workers.length} Fahrzeugen | Status: {bingLoaded ? '✅ BEREIT' : '⏳ Lädt...'}
          </p>
        </div>

        {/* Loading State */}
        {!bingLoaded && (
          <div style={{
            width: '100%',
            height: '600px',
            backgroundColor: '#f3f4f6',
            border: '5px solid #0078d4',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '6px solid #0078d4',
              borderTop: '6px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '20px'
            }}></div>
            <h2 style={{ color: '#0078d4', fontSize: '24px', margin: '0 0 10px 0', fontWeight: 'bold' }}>
              🗺️ Lädt Microsoft Bing Maps...
            </h2>
            <p style={{ color: '#6b7280', fontSize: '18px', margin: '0', textAlign: 'center' }}>
              Kostenfreie Hamburg-Straßenkarte wird geladen
            </p>
          </div>
        )}

        {/* THE REAL BING MAPS */}
        <div 
          ref={mapRef}
          style={{
            width: '100%',
            height: '600px',
            borderRadius: '8px',
            border: '3px solid #e5e7eb',
            display: bingLoaded ? 'block' : 'none'
          }}
        />
      </div>

      {/* Controls - DIREKT UNTER DER KARTE */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button
          onClick={() => setIsTracking(true)}
          disabled={!bingLoaded || isTracking}
          style={{
            backgroundColor: bingLoaded && !isTracking ? '#10b981' : '#9ca3af',
            color: 'white',
            padding: '15px 30px',
            fontSize: '18px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '8px',
            margin: '0 10px',
            cursor: bingLoaded && !isTracking ? 'pointer' : 'not-allowed',
            opacity: bingLoaded ? 1 : 0.6
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
            if (map && workers.length > 0 && window.Microsoft) {
              const locations = workers.map(w => new window.Microsoft.Maps.Location(w.lat, w.lng));
              const bounds = window.Microsoft.Maps.LocationRect.fromLocations(locations);
              map.setView({ bounds: bounds, padding: 50 });
            }
          }}
          disabled={!bingLoaded}
          style={{
            backgroundColor: bingLoaded ? '#0078d4' : '#9ca3af',
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
          🎯 ALLE FAHRZEUGE ANZEIGEN
        </button>
      </div>

      {/* KOSTENLOS INFO */}
      <div style={{
        backgroundColor: '#ecfdf5',
        border: '3px solid #10b981',
        borderRadius: '12px',
        padding: '25px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#065f46', margin: '0 0 15px 0', fontSize: '28px' }}>
          💰 KOSTENLOSE BING MAPS ALTERNATIVE!
        </h2>
        <div style={{ fontSize: '16px', lineHeight: '1.6', color: '#065f46' }}>
          <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 15px 0' }}>
            Bing Maps ist viel günstiger als Google Maps! 🎉
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
            
            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '2px solid #10b981' }}>
              <div style={{ fontSize: '20px', marginBottom: '5px' }}>💰</div>
              <div style={{ fontWeight: 'bold', color: '#1f2937' }}>Kostenlos</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>125.000 Transaktionen/Jahr</div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '2px solid #10b981' }}>
              <div style={{ fontSize: '20px', marginBottom: '5px' }}>⚡</div>
              <div style={{ fontWeight: 'bold', color: '#1f2937' }}>Super einfach</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Nur Microsoft Account</div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '2px solid #10b981' }}>
              <div style={{ fontSize: '20px', marginBottom: '5px' }}>🌐</div>
              <div style={{ fontWeight: 'bold', color: '#1f2937' }}>Alle Browser</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Chrome, Firefox, Safari, Brave</div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '2px solid #10b981' }}>
              <div style={{ fontSize: '20px', marginBottom: '5px' }}>🗺️</div>
              <div style={{ fontWeight: 'bold', color: '#1f2937' }}>Gute Qualität</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Microsoft Straßenkarten</div>
            </div>
          </div>
        </div>
      </div>

      {/* BING API SETUP */}
      <div style={{
        backgroundColor: '#fef3c7',
        border: '3px solid #f59e0b',
        borderRadius: '12px',
        padding: '25px',
        marginBottom: '20px'
      }}>
        <h2 style={{ color: '#92400e', margin: '0 0 15px 0', fontSize: '24px' }}>
          🔑 BING MAPS API-SCHLÜSSEL (Super einfach!)
        </h2>
        <div style={{ fontSize: '16px', lineHeight: '1.6', color: '#92400e' }}>
          <p><strong>Viel einfacher als Google:</strong></p>
          <ol style={{ marginLeft: '20px' }}>
            <li><strong>Gehen Sie zu:</strong> <code style={{ backgroundColor: 'white', padding: '2px 8px', borderRadius: '4px' }}>www.bingmapsportal.com</code></li>
            <li><strong>Melden Sie sich an</strong> mit Ihrem Microsoft-Account (Office365/Hotmail/Outlook)</li>
            <li><strong>Klicken Sie</strong> "My Keys" → "Create a new key"</li>
            <li><strong>Wählen Sie</strong> "Public website" als Application type</li>
            <li><strong>Kopieren Sie</strong> den API-Schlüssel</li>
            <li><strong>Ersetzen Sie</strong> "YOUR_BING_API_KEY_HERE" in der Datei</li>
          </ol>
          <div style={{ marginTop: '15px', padding: '15px', backgroundColor: 'white', borderRadius: '8px', border: '2px solid #f59e0b' }}>
            <p style={{ margin: '0', fontWeight: 'bold' }}>💡 Viel großzügiger: 125.000 kostenlose Transaktionen pro JAHR!</p>
            <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Das sind ~340 Aufrufe pro Tag - völlig ausreichend für Ihr Winterdienst-Business!</p>
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
        border: `3px solid ${isTracking ? '#10b981' : '#0078d4'}`,
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
              {isTracking ? 'LIVE GPS-TRACKING AKTIV!' : 'Microsoft Bing Maps - Kostenlose Alternative'}
            </h3>
            <p style={{ 
              margin: '0', 
              fontSize: '18px',
              color: isTracking ? '#065f46' : '#1e40af'
            }}>
              {isTracking 
                ? `${stats.online} Fahrzeuge bewegen sich in Echtzeit auf Bing Maps!`
                : 'Viel günstiger als Google - 125.000 kostenlose Transaktionen pro Jahr!'
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

export default SimpleBingMaps;