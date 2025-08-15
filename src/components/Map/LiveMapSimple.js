import React, { useState, useEffect } from 'react';

const LiveMapSimple = () => {
  console.log('🗺️ LiveMapSimple rendering - FUNCTIONAL VERSION');
  
  // State für echte Funktionalität
  const [isTracking, setIsTracking] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Initialisiere Demo-Worker
  useEffect(() => {
    const initialWorkers = [
      {
        id: 'mm',
        name: 'Max Müller',
        initials: 'MM',
        status: 'online',
        x: 80,
        y: 80,
        color: '#10b981',
        route: 'Hauptstraße Nord',
        speed: Math.random() * 2 + 1
      },
      {
        id: 'as', 
        name: 'Anna Schmidt',
        initials: 'AS',
        status: 'online',
        x: 240,
        y: 160,
        color: '#10b981',
        route: 'Industriegebiet Süd',
        speed: Math.random() * 2 + 1
      },
      {
        id: 'pw',
        name: 'Peter Wagner', 
        initials: 'PW',
        status: 'offline',
        x: 160,
        y: 240,
        color: '#ef4444',
        route: 'Wohngebiet West',
        speed: 0
      },
      {
        id: 'ls',
        name: 'Lisa Schultz',
        initials: 'LS', 
        status: 'online',
        x: 320,
        y: 320,
        color: '#10b981',
        route: 'Altona Bezirk',
        speed: Math.random() * 2 + 1
      },
      {
        id: 'tf',
        name: 'Tom Fischer',
        initials: 'TF',
        status: 'recent',
        x: 400,
        y: 128,
        color: '#f59e0b', 
        route: 'Eimsbüttel Route',
        speed: Math.random() * 1 + 0.5
      }
    ];
    setWorkers(initialWorkers);
    console.log('✅ Workers initialized:', initialWorkers.length);
  }, []);

  // Live-Bewegungsanimation
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      setWorkers(prevWorkers => {
        return prevWorkers.map(worker => {
          if (worker.status === 'offline') return worker;
          
          // Bewegung simulieren
          const newX = worker.x + (Math.random() - 0.5) * worker.speed * 10;
          const newY = worker.y + (Math.random() - 0.5) * worker.speed * 10;
          
          // In Map-Grenzen halten (800px x 800px minus margin)
          const boundedX = Math.max(50, Math.min(750, newX));
          const boundedY = Math.max(50, Math.min(750, newY));
          
          return {
            ...worker,
            x: boundedX,
            y: boundedY
          };
        });
      });
      
      setLastUpdate(new Date());
      console.log('🔄 Workers moved at:', new Date().toLocaleTimeString());
    }, 2000); // Alle 2 Sekunden bewegen

    return () => clearInterval(interval);
  }, [isTracking]);

  // Button-Handler
  const handleStartTracking = () => {
    console.log('🚀 START TRACKING CLICKED!');
    setIsTracking(true);
    alert('GPS Live-Tracking GESTARTET! Worker bewegen sich jetzt alle 2 Sekunden.');
  };

  const handleStopTracking = () => {
    console.log('🛑 STOP TRACKING CLICKED!');
    setIsTracking(false);
    alert('GPS Live-Tracking GESTOPPT! Worker bewegen sich nicht mehr.');
  };

  const handleRefreshDemo = () => {
    console.log('🔄 REFRESH DEMO CLICKED!');
    // Worker-Positionen zurücksetzen
    setWorkers(prevWorkers => 
      prevWorkers.map((worker, index) => ({
        ...worker,
        x: 80 + (index * 80),
        y: 80 + ((index % 3) * 80),
        speed: Math.random() * 2 + 1
      }))
    );
    setSelectedWorker(null);
    alert('Demo aktualisiert! Alle Worker sind zu ihren Startpositionen zurückgekehrt.');
  };

  const handleWorkerClick = (worker) => {
    console.log('👤 WORKER CLICKED:', worker.name);
    setSelectedWorker(worker);
    alert(`Worker angeklickt: ${worker.name}\nRoute: ${worker.route}\nStatus: ${worker.status}`);
  };

  // Inline styles
  const containerStyle = {
    padding: '24px',
    minHeight: '100vh',
    backgroundColor: '#f3f4f6'
  };

  const alertBoxStyle = {
    backgroundColor: isTracking ? '#16a34a' : '#dc2626',
    color: 'white',
    textAlign: 'center',
    padding: '32px',
    borderRadius: '8px',
    border: `4px solid ${isTracking ? '#15803d' : '#b91c1c'}`,
    marginBottom: '24px'
  };

  const buttonStyle = {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    margin: '8px',
    display: 'inline-block',
    transition: 'all 0.2s'
  };

  const mapAreaStyle = {
    width: '100%',
    height: '800px',
    minWidth: '1200px', // MINIMUM Breite
    minHeight: '800px', // MINIMUM Höhe
    backgroundColor: '#4299e1', // SCHÖNES BLAU statt rot
    border: '8px solid #2d3748',
    borderRadius: '8px',
    position: 'relative',
    overflow: 'visible',
    display: 'block',
    visibility: 'visible',
    opacity: '1',
    zIndex: '1',
    transform: 'scale(1)', // Normale Größe
    transformOrigin: 'top left'
  };

  const getWorkerStats = () => {
    const online = workers.filter(w => w.status === 'online').length;
    const recent = workers.filter(w => w.status === 'recent').length;
    const offline = workers.filter(w => w.status === 'offline').length;
    return { online, recent, offline };
  };

  const stats = getWorkerStats();

  return (
    <div style={containerStyle}>
      {/* Status Alert */}
      <div style={alertBoxStyle}>
        <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '16px' }}>
          {isTracking ? '✅ LIVE-TRACKING AKTIV!' : '🚨 TRACKING GESTOPPT!'}
        </h1>
        <p style={{ fontSize: '24px' }}>
          {isTracking 
            ? 'Worker bewegen sich alle 2 Sekunden automatisch!' 
            : 'Klicken Sie "Start Tracking" um die Live-Bewegung zu starten!'
          }
        </p>
        <p style={{ fontSize: '18px', marginTop: '8px' }}>
          Letzte Aktualisierung: {lastUpdate.toLocaleTimeString()}
        </p>
      </div>

      {/* Functional Buttons */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <button 
          style={{ 
            ...buttonStyle, 
            backgroundColor: isTracking ? '#16a34a' : '#10b981',
            transform: isTracking ? 'scale(1.05)' : 'scale(1)'
          }}
          onClick={handleStartTracking}
          disabled={isTracking}
        >
          🚀 {isTracking ? 'TRACKING LÄUFT' : 'Start Tracking'}
        </button>
        <button 
          style={{ 
            ...buttonStyle, 
            backgroundColor: isTracking ? '#ef4444' : '#9ca3af'
          }}
          onClick={handleStopTracking}
          disabled={!isTracking}
        >
          🛑 Stop Tracking
        </button>
        <button 
          style={buttonStyle}
          onClick={handleRefreshDemo}
        >
          🔄 Demo Zurücksetzen
        </button>
      </div>

      {/* Live Stats */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '2px solid #e5e7eb',
          margin: '8px',
          minWidth: '200px',
          display: 'inline-block'
        }}>
          <h3 style={{ fontSize: '18px', color: '#4b5563', marginBottom: '8px' }}>Gesamt</h3>
          <p style={{ fontSize: '48px', fontWeight: 'bold', color: '#111827', margin: '0' }}>{workers.length}</p>
        </div>
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '2px solid #10b981',
          margin: '8px',
          minWidth: '200px',
          display: 'inline-block'
        }}>
          <h3 style={{ fontSize: '18px', color: '#4b5563', marginBottom: '8px' }}>Online</h3>
          <p style={{ fontSize: '48px', fontWeight: 'bold', color: '#10b981', margin: '0' }}>{stats.online}</p>
        </div>
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',  
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '2px solid #f59e0b',
          margin: '8px',
          minWidth: '200px',
          display: 'inline-block'
        }}>
          <h3 style={{ fontSize: '18px', color: '#4b5563', marginBottom: '8px' }}>Kürzlich</h3>
          <p style={{ fontSize: '48px', fontWeight: 'bold', color: '#f59e0b', margin: '0' }}>{stats.recent}</p>
        </div>
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '2px solid #ef4444',
          margin: '8px',
          minWidth: '200px',
          display: 'inline-block'
        }}>
          <h3 style={{ fontSize: '18px', color: '#4b5563', marginBottom: '8px' }}>Offline</h3>
          <p style={{ fontSize: '48px', fontWeight: 'bold', color: '#ef4444', margin: '0' }}>{stats.offline}</p>
        </div>
      </div>

      {/* Interactive Map */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        padding: '24px',
        border: '4px solid #3b82f6',
        marginBottom: '24px'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#111827', margin: '0 0 8px 0' }}>
            UBER Live GPS Tracking
          </h1>
          <p style={{ fontSize: '18px', color: '#6b7280', margin: '0' }}>
            Funktionale Version mit echter Bewegung alle 2 Sekunden
          </p>
        </div>

        {/* MEGA-SICHTBARE Map Area */}
        <div style={mapAreaStyle}>
          {/* GRID Hintergrund für bessere Orientierung */}
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            zIndex: '1'
          }}></div>

          {/* Map Title */}
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            backgroundColor: '#000000', // SCHWARZ für maximalen Kontrast
            color: '#FFFFFF',
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
            zIndex: 100,
            border: '2px solid #FFFF00'
          }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
              📍 KARTE {isTracking ? '(LIVE)' : '(STATISCH)'}
            </span>
          </div>

          {/* DEBUG: Worker-Positionen anzeigen */}
          <div style={{
            position: 'absolute',
            top: '60px',
            left: '16px',
            backgroundColor: 'yellow',
            color: 'black',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 25
          }}>
            Workers: {workers.map(w => `${w.initials}(${Math.round(w.x)},${Math.round(w.y)})`).join(' ')}
          </div>

          {/* EXTRA SICHTBARE Workers */}
          {workers.map((worker) => (
            <div key={worker.id}>
              {/* Großer Schatten für bessere Sichtbarkeit */}
              <div
                style={{
                  position: 'absolute',
                  left: `${worker.x - 10}px`,
                  top: `${worker.y - 10}px`,
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  zIndex: 5
                }}
              />
              
              {/* GROSSE Worker-Marker */}
              <div 
                style={{
                  position: 'absolute',
                  left: `${worker.x}px`,
                  top: `${worker.y}px`,
                  width: '120px', // VIEL GRÖSSER!
                  height: '120px', // VIEL GRÖSSER!
                  borderRadius: '50%',
                  backgroundColor: worker.color,
                  color: 'white',
                  fontSize: '36px', // GRÖSSERE Schrift
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '8px solid white',
                  boxShadow: '0 12px 24px rgba(0,0,0,0.4)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  zIndex: 50,
                  transform: 'translate(-50%, -50%)',
                  animation: isTracking && worker.status !== 'offline' ? 
                    'pulse 2s infinite' : 'none'
                }}
                onClick={() => handleWorkerClick(worker)}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translate(-50%, -50%) scale(1.2)';
                  e.target.style.zIndex = '100';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translate(-50%, -50%) scale(1)';
                  e.target.style.zIndex = '50';
                }}
              >
                {worker.initials}
              </div>

              {/* GROSSE Text-Labels */}
              <div
                style={{
                  position: 'absolute',
                  left: `${worker.x}px`,
                  top: `${worker.y + 80}px`, // Mehr Abstand wegen größerem Marker
                  transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(0,0,0,0.9)',
                  color: 'white',
                  padding: '8px 12px', // Größeres Padding
                  borderRadius: '6px',
                  fontSize: '16px', // GRÖSSERE Schrift
                  fontWeight: 'bold',
                  zIndex: 40,
                  whiteSpace: 'nowrap',
                  border: '2px solid white'
                }}
              >
                {worker.name}
              </div>
            </div>
          ))}

          {/* Selected Worker Info */}
          {selectedWorker && (
            <div style={{
              position: 'absolute',
              top: '60px',
              right: '16px',
              backgroundColor: 'white',
              padding: '16px',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '2px solid #d1d5db',
              zIndex: 25,
              minWidth: '200px'
            }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
                Ausgewählt: {selectedWorker.name}
              </h4>
              <p style={{ margin: '4px 0', fontSize: '14px' }}>Route: {selectedWorker.route}</p>
              <p style={{ margin: '4px 0', fontSize: '14px' }}>Status: {selectedWorker.status}</p>
              <p style={{ margin: '4px 0', fontSize: '14px' }}>
                Position: {Math.round(selectedWorker.x)}, {Math.round(selectedWorker.y)}
              </p>
              <button
                style={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  marginTop: '8px'
                }}
                onClick={() => setSelectedWorker(null)}
              >
                ✕ Schließen
              </button>
            </div>
          )}

          {/* Map Legend */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            backgroundColor: 'white',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '2px solid #d1d5db',
            zIndex: 20
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '12px' }}>
              Status {isTracking ? '(LIVE)' : '(STATISCH)'}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                display: 'inline-block',
                marginRight: '12px'
              }}></div>
              <span style={{ fontSize: '16px', fontWeight: '500' }}>Online ({stats.online})</span>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#f59e0b',
                display: 'inline-block',
                marginRight: '12px'
              }}></div>
              <span style={{ fontSize: '16px', fontWeight: '500' }}>Kürzlich ({stats.recent})</span>
            </div>
            <div>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                display: 'inline-block',
                marginRight: '12px'
              }}></div>
              <span style={{ fontSize: '16px', fontWeight: '500' }}>Offline ({stats.offline})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Final Status */}
      <div style={{
        backgroundColor: isTracking ? '#dcfce7' : '#fef3c7',
        border: `4px solid ${isTracking ? '#16a34a' : '#f59e0b'}`,
        borderRadius: '8px',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <div style={{ marginRight: '16px', fontSize: '32px' }}>
            {isTracking ? '✅' : '⚠️'}
          </div>
          <div style={{ color: isTracking ? '#166534' : '#92400e', fontSize: '18px' }}>
            <p style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
              {isTracking ? 
                '🚀 UBER Live-Tracking läuft!' : 
                '⏸️ UBER Live-Tracking ist pausiert'
              }
            </p>
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>
              {isTracking ?
                'Worker bewegen sich automatisch alle 2 Sekunden. Klicken Sie auf die Marker für Details!' :
                'Starten Sie das Tracking um die Live-Bewegung zu sehen!'
              }
            </p>
            <p style={{ fontSize: '16px', fontWeight: '600' }}>
              Alle Buttons sind funktional und Worker reagieren auf Klicks!
            </p>
          </div>
        </div>
      </div>

      {/* CSS für Pulse-Animation */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { 
              box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
            }
            50% { 
              box-shadow: 0 0 0 20px rgba(16, 185, 129, 0);
            }
          }
        `}
      </style>
    </div>
  );
};

export default LiveMapSimple;