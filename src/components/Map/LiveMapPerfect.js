import React, { useState, useEffect } from 'react';

const LiveMapPerfect = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Worker initialisieren
  useEffect(() => {
    const initialWorkers = [
      {
        id: 'mm',
        name: 'Max Müller',
        initials: 'MM',
        status: 'online',
        x: 200,
        y: 200,
        color: '#10b981',
        route: 'Hauptstraße Nord',
        vehicle: 'WD-001',
        speed: 2.5
      },
      {
        id: 'as', 
        name: 'Anna Schmidt',
        initials: 'AS',
        status: 'online',
        x: 500,
        y: 300,
        color: '#10b981',
        route: 'Industriegebiet Süd',
        vehicle: 'WD-002',
        speed: 1.8
      },
      {
        id: 'pw',
        name: 'Peter Wagner', 
        initials: 'PW',
        status: 'offline',
        x: 350,
        y: 450,
        color: '#ef4444',
        route: 'Wohngebiet West',
        vehicle: 'WD-003',
        speed: 0
      },
      {
        id: 'ls',
        name: 'Lisa Schultz',
        initials: 'LS', 
        status: 'online',
        x: 700,
        y: 200,
        color: '#10b981',
        route: 'Altona Bezirk',
        vehicle: 'WD-004',
        speed: 3.2
      },
      {
        id: 'tf',
        name: 'Tom Fischer',
        initials: 'TF',
        status: 'recent',
        x: 600,
        y: 500,
        color: '#f59e0b', 
        route: 'Eimsbüttel Route',
        vehicle: 'WD-005',
        speed: 1.2
      }
    ];
    setWorkers(initialWorkers);
  }, []);

  // Live-Bewegung
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      setWorkers(prevWorkers => {
        return prevWorkers.map(worker => {
          if (worker.status === 'offline') return worker;
          
          // Realistische Bewegung
          const moveX = (Math.random() - 0.5) * worker.speed * 15;
          const moveY = (Math.random() - 0.5) * worker.speed * 15;
          
          const newX = Math.max(100, Math.min(900, worker.x + moveX));
          const newY = Math.max(100, Math.min(600, worker.y + moveY));
          
          return {
            ...worker,
            x: newX,
            y: newY
          };
        });
      });
      
      setLastUpdate(new Date());
    }, 3000); // Alle 3 Sekunden

    return () => clearInterval(interval);
  }, [isTracking]);

  // Event Handlers
  const startTracking = () => {
    setIsTracking(true);
    console.log('🚀 UBER Live-Tracking GESTARTET!');
  };

  const stopTracking = () => {
    setIsTracking(false);
    console.log('🛑 UBER Live-Tracking GESTOPPT!');
  };

  const resetDemo = () => {
    setWorkers(prev => prev.map((worker, index) => ({
      ...worker,
      x: 200 + (index * 150),
      y: 200 + (index % 2) * 200,
      speed: Math.random() * 2 + 1
    })));
    setSelectedWorker(null);
    console.log('🔄 Demo zurückgesetzt!');
  };

  const selectWorker = (worker) => {
    setSelectedWorker(worker);
    console.log('👤 Worker ausgewählt:', worker.name);
  };

  // Statistiken
  const stats = {
    total: workers.length,
    online: workers.filter(w => w.status === 'online').length,
    recent: workers.filter(w => w.status === 'recent').length,
    offline: workers.filter(w => w.status === 'offline').length
  };

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: isTracking ? '#059669' : '#dc2626',
        color: 'white',
        padding: '30px',
        borderRadius: '12px',
        textAlign: 'center',
        marginBottom: '20px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          fontSize: '48px', 
          margin: '0 0 10px 0',
          fontWeight: 'bold'
        }}>
          {isTracking ? '🚀 UBER LIVE-TRACKING AKTIV!' : '⏸️ TRACKING PAUSIERT'}
        </h1>
        <p style={{ fontSize: '20px', margin: '0' }}>
          {isTracking ? 
            `Letzte Aktualisierung: ${lastUpdate.toLocaleTimeString()}` :
            'Klicken Sie "Start" um Live-Bewegung zu beginnen'
          }
        </p>
      </div>

      {/* Controls */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button
          onClick={startTracking}
          disabled={isTracking}
          style={{
            backgroundColor: isTracking ? '#6b7280' : '#059669',
            color: 'white',
            padding: '15px 30px',
            fontSize: '18px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '8px',
            margin: '0 10px',
            cursor: isTracking ? 'not-allowed' : 'pointer',
            opacity: isTracking ? 0.6 : 1
          }}
        >
          🚀 Start Tracking
        </button>
        
        <button
          onClick={stopTracking}
          disabled={!isTracking}
          style={{
            backgroundColor: !isTracking ? '#6b7280' : '#dc2626',
            color: 'white',
            padding: '15px 30px',
            fontSize: '18px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '8px',
            margin: '0 10px',
            cursor: !isTracking ? 'not-allowed' : 'pointer',
            opacity: !isTracking ? 0.6 : 1
          }}
        >
          🛑 Stop Tracking
        </button>

        <button
          onClick={resetDemo}
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
          🔄 Reset Demo
        </button>
      </div>

      {/* Stats */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '20px', 
        marginBottom: '30px',
        flexWrap: 'wrap'
      }}>
        {[
          { label: 'Gesamt', value: stats.total, color: '#6b7280' },
          { label: 'Online', value: stats.online, color: '#059669' },
          { label: 'Kürzlich', value: stats.recent, color: '#d97706' },
          { label: 'Offline', value: stats.offline, color: '#dc2626' }
        ].map((stat, index) => (
          <div key={index} style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '12px',
            textAlign: 'center',
            minWidth: '150px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            border: `3px solid ${stat.color}`
          }}>
            <h3 style={{ 
              margin: '0 0 10px 0', 
              fontSize: '16px', 
              color: '#6b7280' 
            }}>
              {stat.label}
            </h3>
            <p style={{ 
              margin: '0', 
              fontSize: '48px', 
              fontWeight: 'bold', 
              color: stat.color 
            }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* PERFEKTE KARTE - GARANTIERT SICHTBAR */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
        border: '4px solid #3b82f6'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            margin: '0 0 8px 0',
            color: '#1f2937'
          }}>
            🗺️ UBER Live-Karte Hamburg
          </h2>
          <p style={{ 
            fontSize: '18px', 
            margin: '0',
            color: '#6b7280'
          }}>
            Echte Bewegung alle 3 Sekunden - {workers.length} Winterdienst-Fahrzeuge
          </p>
        </div>

        {/* KARTEN-BEREICH - 100% SICHTBAR */}
        <div style={{
          width: '100%',
          height: '700px',
          backgroundColor: '#e0f2fe',
          border: '6px solid #0369a1',
          borderRadius: '12px',
          position: 'relative',
          backgroundImage: `
            radial-gradient(circle at 25px 25px, rgba(255,255,255,0.2) 2px, transparent 0),
            radial-gradient(circle at 75px 75px, rgba(255,255,255,0.2) 2px, transparent 0)
          `,
          backgroundSize: '100px 100px',
          overflow: 'hidden'
        }}>
          
          {/* Karten-Titel */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            backgroundColor: isTracking ? '#059669' : '#3b82f6',
            color: 'white',
            padding: '15px 25px',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 100
          }}>
            📍 Hamburg Winterdienst {isTracking ? '(LIVE)' : '(DEMO)'}
          </div>

          {/* Worker mit MAXIMALER Sichtbarkeit */}
          {workers.map((worker) => (
            <div key={worker.id}>
              {/* Schatten-Ring für bessere Sichtbarkeit */}
              <div style={{
                position: 'absolute',
                left: worker.x - 20,
                top: worker.y - 20,
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0,0,0,0.1)',
                zIndex: 10
              }} />

              {/* Haupt-Worker-Marker */}
              <div
                onClick={() => selectWorker(worker)}
                style={{
                  position: 'absolute',
                  left: worker.x - 50,
                  top: worker.y - 50,
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  backgroundColor: worker.color,
                  color: 'white',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '6px solid white',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.25)',
                  cursor: 'pointer',
                  zIndex: 50,
                  transition: 'all 0.3s ease',
                  animation: isTracking && worker.status !== 'offline' ? 
                    'pulse 2s infinite' : 'none'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.2)';
                  e.target.style.zIndex = 100;
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.zIndex = 50;
                }}
              >
                {worker.initials}
              </div>

              {/* Worker Name Label */}
              <div style={{
                position: 'absolute',
                left: worker.x - 75,
                top: worker.y + 70,
                width: '150px',
                textAlign: 'center',
                backgroundColor: 'rgba(0,0,0,0.8)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                zIndex: 40,
                border: '2px solid white'
              }}>
                {worker.name}
                <br />
                <span style={{ fontSize: '12px', opacity: 0.9 }}>
                  {worker.vehicle} • {worker.route}
                </span>
              </div>
            </div>
          ))}

          {/* Worker Info Panel */}
          {selectedWorker && (
            <div style={{
              position: 'absolute',
              top: '80px',
              right: '20px',
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
              border: '3px solid #3b82f6',
              minWidth: '250px',
              zIndex: 200
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '15px'
              }}>
                <h4 style={{ 
                  margin: '0', 
                  fontSize: '18px', 
                  fontWeight: 'bold',
                  color: '#1f2937'
                }}>
                  {selectedWorker.name}
                </h4>
                <button
                  onClick={() => setSelectedWorker(null)}
                  style={{
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  ✕
                </button>
              </div>
              
              <div style={{ fontSize: '14px', lineHeight: '1.5', color: '#4b5563' }}>
                <p style={{ margin: '5px 0' }}><strong>Status:</strong> {selectedWorker.status}</p>
                <p style={{ margin: '5px 0' }}><strong>Fahrzeug:</strong> {selectedWorker.vehicle}</p>
                <p style={{ margin: '5px 0' }}><strong>Route:</strong> {selectedWorker.route}</p>
                <p style={{ margin: '5px 0' }}>
                  <strong>Position:</strong> {Math.round(selectedWorker.x)}, {Math.round(selectedWorker.y)}
                </p>
                <p style={{ margin: '5px 0' }}>
                  <strong>Geschwindigkeit:</strong> {selectedWorker.speed} km/h
                </p>
              </div>
            </div>
          )}

          {/* Status Legend */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '2px solid #e5e7eb',
            zIndex: 90
          }}>
            <h5 style={{ 
              margin: '0 0 10px 0', 
              fontSize: '16px', 
              fontWeight: 'bold',
              color: '#1f2937'
            }}>
              Status-Legende
            </h5>
            {[
              { color: '#10b981', label: 'Online', count: stats.online },
              { color: '#f59e0b', label: 'Kürzlich', count: stats.recent },
              { color: '#ef4444', label: 'Offline', count: stats.offline }
            ].map((item, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '5px'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: item.color,
                  marginRight: '10px'
                }} />
                <span style={{ fontSize: '14px', color: '#4b5563' }}>
                  {item.label} ({item.count})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Message */}
      <div style={{
        marginTop: '30px',
        backgroundColor: isTracking ? '#d1fae5' : '#fef3c7',
        border: `4px solid ${isTracking ? '#059669' : '#d97706'}`,
        borderRadius: '12px',
        padding: '25px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '48px', marginRight: '20px' }}>
            {isTracking ? '✅' : '⚠️'}
          </span>
          <div>
            <h3 style={{ 
              margin: '0 0 10px 0', 
              fontSize: '24px', 
              fontWeight: 'bold',
              color: isTracking ? '#065f46' : '#92400e'
            }}>
              {isTracking ? 
                '🚀 UBER Live-Tracking läuft perfekt!' : 
                '⏸️ Tracking ist pausiert'
              }
            </h3>
            <p style={{ 
              margin: '0', 
              fontSize: '18px',
              color: isTracking ? '#065f46' : '#92400e'
            }}>
              {isTracking ?
                'Alle 5 Fahrzeuge bewegen sich automatisch alle 3 Sekunden. Klicken Sie auf die Marker für Details!' :
                'Klicken Sie "Start Tracking" um die Live-Bewegung zu sehen. Alle Buttons und Interaktionen funktionieren!'
              }
            </p>
          </div>
        </div>
      </div>

      {/* CSS Animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0%, 100% { 
              box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
            }
            50% { 
              box-shadow: 0 0 0 30px rgba(16, 185, 129, 0);
            }
          }
        `
      }} />
    </div>
  );
};

export default LiveMapPerfect;