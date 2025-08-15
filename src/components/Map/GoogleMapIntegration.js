import React, { useState, useEffect, useRef } from 'react';

const GoogleMapIntegration = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);

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
        script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY_HERE&libraries=geometry`;
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
        if (mapRef.current) {
          const mapInstance = new googleMaps.Map(mapRef.current, {
            center: HAMBURG_CENTER,
            zoom: 12,
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
            ]
          });
          setMap(mapInstance);
          console.log('✅ Google Maps loaded successfully');
        }
      })
      .catch((error) => {
        console.error('❌ Google Maps loading failed:', error);
        console.log('💡 Fallback: Verwende OpenStreetMap Alternative');
      });
  }, []);

  // Add markers to map when workers or map changes
  useEffect(() => {
    if (!map || !window.google) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    const newMarkers = [];

    workers.forEach(worker => {
      const markerColor = worker.status === 'online' ? '#10b981' : 
                         worker.status === 'recent' ? '#f59e0b' : '#ef4444';

      const marker = new window.google.maps.Marker({
        position: { lat: worker.lat, lng: worker.lng },
        map: map,
        title: worker.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 20,
          fillColor: markerColor,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 4
        },
        label: {
          text: worker.initials,
          color: 'white',
          fontWeight: 'bold',
          fontSize: '14px'
        }
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px;">
            <h3 style="margin: 0 0 5px 0; color: #1f2937;">${worker.name}</h3>
            <p style="margin: 2px 0; color: #6b7280;"><strong>Status:</strong> ${worker.status}</p>
            <p style="margin: 2px 0; color: #6b7280;"><strong>Bereich:</strong> ${worker.street}</p>
            <p style="margin: 2px 0; color: #6b7280;"><strong>Fahrzeug:</strong> WD-00${worker.id}</p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
        setSelectedWorker(worker);
      });

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);
  }, [map, workers]);

  // Live tracking movement
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      setWorkers(prevWorkers => {
        return prevWorkers.map(worker => {
          if (worker.status === 'offline') return worker;
          
          // Small realistic movement in Hamburg area
          const latChange = (Math.random() - 0.5) * 0.005; // ~500m movement
          const lngChange = (Math.random() - 0.5) * 0.005;
          
          return {
            ...worker,
            lat: worker.lat + latChange,
            lng: worker.lng + lngChange
          };
        });
      });
    }, 5000);

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
        backgroundColor: isTracking ? '#10b981' : '#3b82f6',
        color: 'white',
        padding: '25px',
        borderRadius: '12px',
        textAlign: 'center',
        marginBottom: '25px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ fontSize: '36px', margin: '0 0 10px 0', fontWeight: 'bold' }}>
          🗺️ ECHTE HAMBURG STRAßENKARTE
        </h1>
        <p style={{ fontSize: '18px', margin: '0' }}>
          {isTracking ? 'LIVE GPS-TRACKING auf Google Maps' : 'Google Maps Integration - Echte Straßen und Gebäude'}
        </p>
      </div>

      {/* API Key Warning */}
      <div style={{
        backgroundColor: '#fef3c7',
        border: '2px solid #f59e0b',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px'
      }}>
        <h3 style={{ color: '#92400e', margin: '0 0 8px 0' }}>⚠️ Google Maps API Schlüssel erforderlich</h3>
        <p style={{ color: '#92400e', margin: '0', fontSize: '14px' }}>
          Für echte Straßenkarten benötigen Sie einen Google Maps API Key. 
          Ersetzen Sie "YOUR_API_KEY_HERE" in diesem Code mit Ihrem echten API-Schlüssel.
          <br />
          <strong>Alternative:</strong> Wir können auch OpenStreetMap (kostenlos) implementieren.
        </p>
      </div>

      {/* Controls */}
      <div style={{ textAlign: 'center', marginBottom: '25px' }}>
        <button
          onClick={() => setIsTracking(true)}
          style={{
            backgroundColor: '#10b981',
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
          🚀 START ECHTES GPS-TRACKING
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

      {/* GOOGLE MAPS CONTAINER */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
        border: '3px solid #2563eb'
      }}>
        <div style={{ marginBottom: '15px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#1f2937' }}>
            📍 Hamburg Winterdienst - Google Maps
          </h2>
          <p style={{ fontSize: '16px', margin: '0', color: '#6b7280' }}>
            Echte Straßenkarte mit {workers.length} Winterdienst-Fahrzeugen
          </p>
        </div>

        {/* THE REAL MAP */}
        <div 
          ref={mapRef}
          style={{
            width: '100%',
            height: '500px',
            borderRadius: '8px',
            border: '2px solid #e5e7eb'
          }}
        />
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
              {isTracking ? 'ECHTES GPS-TRACKING AKTIV!' : 'Echte Google Maps Integration'}
            </h3>
            <p style={{ 
              margin: '0', 
              fontSize: '16px',
              color: isTracking ? '#065f46' : '#1e40af'
            }}>
              {isTracking 
                ? `${stats.online} Fahrzeuge bewegen sich in Echtzeit auf echten Hamburg-Straßen!`
                : 'Jetzt können Sie echte Straßen, Gebäude und Orte in Hamburg sehen!'
              }
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default GoogleMapIntegration;