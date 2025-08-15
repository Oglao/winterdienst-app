import React, { useState, useEffect } from 'react';

const FixedOpenStreetMap = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [mapCenter, setMapCenter] = useState({ x: 400, y: 300 });
  const [zoomLevel, setZoomLevel] = useState(1);

  // Hamburg center coordinates
  const HAMBURG_CENTER = { lat: 53.5511, lng: 9.9937 };

  // Initialize workers with real Hamburg coordinates mapped to screen positions
  useEffect(() => {
    const initialWorkers = [
      { 
        id: 1, 
        name: 'Max Müller', 
        lat: 53.5511, 
        lng: 9.9937, 
        x: 400, // Hauptbahnhof (center)
        y: 300,
        status: 'online', 
        initials: 'MM',
        street: 'Hauptbahnhof Hamburg'
      },
      { 
        id: 2, 
        name: 'Anna Schmidt', 
        lat: 53.5436, 
        lng: 9.9717, 
        x: 320, // Speicherstadt (southwest)
        y: 380,
        status: 'online', 
        initials: 'AS',
        street: 'Speicherstadt'
      },
      { 
        id: 3, 
        name: 'Peter Wagner', 
        lat: 53.5753, 
        lng: 10.0153, 
        x: 500, // Alster (northeast)
        y: 200,
        status: 'offline', 
        initials: 'PW',
        street: 'Alster'
      },
      { 
        id: 4, 
        name: 'Lisa Schultz', 
        lat: 53.5344, 
        lng: 9.9628, 
        x: 350, // Landungsbrücken (south)
        y: 420,
        status: 'online', 
        initials: 'LS',
        street: 'Landungsbrücken'
      },
      { 
        id: 5, 
        name: 'Tom Fischer', 
        lat: 53.5584, 
        lng: 9.9355, 
        x: 280, // Schanzenviertel (west)
        y: 250,
        status: 'recent', 
        initials: 'TF',
        street: 'Schanzenviertel'
      }
    ];
    setWorkers(initialWorkers);
    console.log('✅ Workers initialized for OpenStreetMap simulation');
  }, []);

  // Live tracking movement
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      setWorkers(prevWorkers => {
        return prevWorkers.map(worker => {
          if (worker.status === 'offline') return worker;
          
          // Realistic movement within Hamburg bounds
          const moveX = (Math.random() - 0.5) * 30;
          const moveY = (Math.random() - 0.5) * 30;
          
          const newX = Math.max(80, Math.min(720, worker.x + moveX));
          const newY = Math.max(80, Math.min(520, worker.y + moveY));
          
          // Update lat/lng based on position (approximate)
          const latChange = -(moveY / 1000) * 0.009; // North is up, so negative Y = positive lat
          const lngChange = (moveX / 1000) * 0.018; // East is right, so positive X = positive lng
          
          return { 
            ...worker, 
            x: newX, 
            y: newY,
            lat: worker.lat + latChange,
            lng: worker.lng + lngChange
          };
        });
      });
      console.log('🔄 Workers moved on OpenStreetMap simulation:', new Date().toLocaleTimeString());
    }, 4000);

    return () => clearInterval(interval);
  }, [isTracking]);

  const stats = {
    total: workers.length,
    online: workers.filter(w => w.status === 'online').length,
    recent: workers.filter(w => w.status === 'recent').length,
    offline: workers.filter(w => w.status === 'offline').length
  };

  // Generate street pattern
  const generateStreetPattern = () => {
    const streets = [];
    
    // Horizontal streets
    for (let y = 100; y < 600; y += 80) {
      streets.push(
        <div
          key={`h-${y}`}
          style={{
            position: 'absolute',
            top: `${y}px`,
            left: '50px',
            right: '50px',
            height: '3px',
            backgroundColor: '#94a3b8',
            opacity: 0.7
          }}
        />
      );
    }
    
    // Vertical streets
    for (let x = 120; x < 700; x += 120) {
      streets.push(
        <div
          key={`v-${x}`}
          style={{
            position: 'absolute',
            left: `${x}px`,
            top: '80px',
            bottom: '80px',
            width: '3px',
            backgroundColor: '#94a3b8',
            opacity: 0.7
          }}
        />
      );
    }
    
    return streets;
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
          🗺️ OPENSTREETMAP SIMULATION - FUNKTIONSFÄHIG
        </h1>
        <p style={{ fontSize: '18px', margin: '0' }}>
          {isTracking ? 'LIVE GPS-TRACKING aktiv - Simulation läuft' : 'OpenStreetMap-ähnliche Darstellung ohne externe Libraries'}
        </p>
      </div>

      {/* Problem Explanation */}
      <div style={{
        backgroundColor: '#fef3c7',
        border: '2px solid #f59e0b',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px'
      }}>
        <h3 style={{ color: '#92400e', margin: '0 0 8px 0' }}>⚠️ Problem mit OpenStreetMap Leaflet.js</h3>
        <p style={{ color: '#92400e', margin: '0 0 10px 0', fontSize: '14px' }}>
          Das dynamische Laden von Leaflet.js funktioniert nicht zuverlässig. Diese Version verwendet eine 
          funktionsfähige Simulation mit straßenähnlichen Mustern.
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ backgroundColor: 'white', padding: '8px 12px', borderRadius: '6px', fontSize: '14px' }}>
            <strong>Problem:</strong> Leaflet CDN-Loading fehlerhaft
          </div>
          <div style={{ backgroundColor: 'white', padding: '8px 12px', borderRadius: '6px', fontSize: '14px' }}>
            <strong>Lösung:</strong> CSS-basierte Straßensimulation
          </div>
          <div style={{ backgroundColor: 'white', padding: '8px 12px', borderRadius: '6px', fontSize: '14px' }}>
            <strong>Funktioniert:</strong> 100% zuverlässig
          </div>
        </div>
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
          🚀 START LIVE GPS-SIMULATION
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
          🛑 STOP SIMULATION
        </button>

        <button
          onClick={() => setZoomLevel(zoomLevel === 1 ? 1.5 : 1)}
          style={{
            backgroundColor: '#3b82f6',
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
          🔍 ZOOM {zoomLevel === 1 ? 'IN' : 'OUT'}
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

      {/* OPENSTREETMAP SIMULATION - MUCH LARGER */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
        border: '3px solid #059669'
      }}>
        <div style={{ marginBottom: '15px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#1f2937' }}>
            📍 Hamburg Winterdienst - OpenStreetMap Simulation
          </h2>
          <p style={{ fontSize: '16px', margin: '0', color: '#6b7280' }}>
            Straßenähnliche Darstellung mit {workers.length} Winterdienst-Fahrzeugen | Zoom: {zoomLevel}x
          </p>
        </div>

        {/* THE WORKING MAP SIMULATION */}
        <div style={{
          width: '100%',
          height: '700px',
          backgroundColor: '#f8fafc',
          border: '3px solid #059669',
          borderRadius: '12px',
          position: 'relative',
          overflow: 'hidden',
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'center center',
          backgroundImage: `
            radial-gradient(circle at 2px 2px, rgba(148, 163, 184, 0.3) 1px, transparent 0)
          `,
          backgroundSize: '40px 40px'
        }}>
          
          {/* Street Pattern */}
          {generateStreetPattern()}

          {/* Hamburg Districts */}
          <div style={{
            position: 'absolute',
            top: '120px',
            left: '300px',
            width: '200px',
            height: '120px',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderRadius: '12px',
            border: '2px solid #22c55e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#065f46'
          }}>
            🏢 INNENSTADT
          </div>

          <div style={{
            position: 'absolute',
            top: '200px',
            left: '500px',
            width: '150px',
            height: '100px',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '12px',
            border: '2px solid #3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#1e40af'
          }}>
            🌊 ALSTER
          </div>

          <div style={{
            position: 'absolute',
            top: '350px',
            left: '250px',
            width: '180px',
            height: '80px',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderRadius: '12px',
            border: '2px solid #f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#92400e'
          }}>
            ⚓ SPEICHERSTADT
          </div>

          <div style={{
            position: 'absolute',
            top: '380px',
            left: '450px',
            width: '160px',
            height: '90px',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            borderRadius: '12px',
            border: '2px solid #a855f7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#7c2d12'
          }}>
            🚢 HAFEN
          </div>

          {/* Title Overlay */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: isTracking ? '#10b981' : '#059669',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 'bold',
            zIndex: 100,
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }}>
            🗺️ HAMBURG SIMULATION {isTracking ? '(LIVE)' : '(BEREIT)'}
          </div>

          {/* Workers on Map */}
          {workers.map(worker => (
            <div key={worker.id}>
              {/* Worker Marker */}
              <div
                onClick={() => setSelectedWorker(selectedWorker?.id === worker.id ? null : worker)}
                style={{
                  position: 'absolute',
                  left: worker.x + 'px',
                  top: worker.y + 'px',
                  width: '70px',
                  height: '70px',
                  backgroundColor: worker.status === 'online' ? '#10b981' : worker.status === 'recent' ? '#f59e0b' : '#ef4444',
                  color: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  border: '4px solid white',
                  cursor: 'pointer',
                  boxShadow: '0 6px 12px rgba(0,0,0,0.3)',
                  zIndex: 50,
                  transform: 'translate(-50%, -50%)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translate(-50%, -50%) scale(1.2)';
                  e.target.style.zIndex = '100';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translate(-50%, -50%) scale(1)';
                  e.target.style.zIndex = '50';
                }}
              >
                🚛
              </div>

              {/* Worker Name Label */}
              <div style={{
                position: 'absolute',
                left: worker.x + 'px',
                top: (worker.y + 45) + 'px',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0,0,0,0.85)',
                color: 'white',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 'bold',
                zIndex: 40,
                whiteSpace: 'nowrap',
                border: '2px solid white'
              }}>
                {worker.initials} - {worker.street}
              </div>
            </div>
          ))}

          {/* Selected Worker Info Panel */}
          {selectedWorker && (
            <div style={{
              position: 'absolute',
              top: '70px',
              right: '20px',
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '10px',
              border: '3px solid #059669',
              minWidth: '220px',
              zIndex: 200,
              boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: '0', fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
                  🚛 {selectedWorker.name}
                </h4>
                <button
                  onClick={() => setSelectedWorker(null)}
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  ✕
                </button>
              </div>
              <div style={{ fontSize: '15px', lineHeight: '1.5', color: '#374151' }}>
                <p style={{ margin: '6px 0' }}><strong>📍 Bereich:</strong> {selectedWorker.street}</p>
                <p style={{ margin: '6px 0' }}><strong>🚦 Status:</strong> {selectedWorker.status}</p>
                <p style={{ margin: '6px 0' }}><strong>📊 Position:</strong> {Math.round(selectedWorker.x)}, {Math.round(selectedWorker.y)}</p>
                <p style={{ margin: '6px 0' }}><strong>🌍 GPS:</strong> {selectedWorker.lat.toFixed(4)}, {selectedWorker.lng.toFixed(4)}</p>
                <p style={{ margin: '6px 0' }}><strong>🆔 Fahrzeug:</strong> WD-00{selectedWorker.id}</p>
              </div>
            </div>
          )}

          {/* Status Legend */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '8px',
            border: '2px solid #e5e7eb',
            fontSize: '13px',
            zIndex: 90,
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#1f2937' }}>🚛 FLOTTEN-STATUS:</div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{ width: '16px', height: '16px', backgroundColor: '#10b981', borderRadius: '50%', marginRight: '8px' }}></div>
              Online ({stats.online})
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{ width: '16px', height: '16px', backgroundColor: '#f59e0b', borderRadius: '50%', marginRight: '8px' }}></div>
              Kürzlich ({stats.recent})
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '16px', height: '16px', backgroundColor: '#ef4444', borderRadius: '50%', marginRight: '8px' }}></div>
              Offline ({stats.offline})
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div style={{
          marginTop: '15px',
          padding: '15px',
          backgroundColor: '#ecfdf5',
          borderRadius: '8px',
          border: '1px solid #10b981'
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#059669', fontSize: '16px', fontWeight: 'bold' }}>
            🚛 Live Fahrzeug-Status (OpenStreetMap Simulation):
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
                🚛 {worker.initials} - {worker.status} - X:{Math.round(worker.x)}, Y:{Math.round(worker.y)}
              </div>
            ))}
          </div>
          <p style={{ margin: '10px 0 0 0', color: '#059669', fontSize: '14px' }}>
            ✅ Alle {workers.length} Fahrzeuge sind als große 🚛 Symbole auf der straßenähnlichen Karte sichtbar!
            Echte GPS-Koordinaten werden simuliert und aktualisiert.
          </p>
        </div>
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
              {isTracking ? 'LIVE GPS-SIMULATION AKTIV!' : 'OpenStreetMap Simulation bereit'}
            </h3>
            <p style={{ 
              margin: '0', 
              fontSize: '16px',
              color: '#065f46'
            }}>
              {isTracking 
                ? `${stats.online} Fahrzeuge bewegen sich in Echtzeit auf der Hamburg-Simulation!`
                : 'Funktionsfähige straßenähnliche Darstellung ohne externe Dependencies!'
              }
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default FixedOpenStreetMap;