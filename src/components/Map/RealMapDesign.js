import React, { useState, useEffect } from 'react';

const RealMapDesign = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);

  useEffect(() => {
    const initialWorkers = [
      { id: 1, name: 'Max Müller', x: 150, y: 120, status: 'online', color: '#10b981', initials: 'MM', street: 'Hauptstraße' },
      { id: 2, name: 'Anna Schmidt', x: 300, y: 180, status: 'online', color: '#10b981', initials: 'AS', street: 'Industriestraße' },
      { id: 3, name: 'Peter Wagner', x: 450, y: 140, status: 'offline', color: '#ef4444', initials: 'PW', street: 'Wohnstraße' },
      { id: 4, name: 'Lisa Schultz', x: 200, y: 280, status: 'online', color: '#10b981', initials: 'LS', street: 'Altonaer Str.' },
      { id: 5, name: 'Tom Fischer', x: 400, y: 250, status: 'recent', color: '#f59e0b', initials: 'TF', street: 'Eimsbütteler Str.' }
    ];
    setWorkers(initialWorkers);
  }, []);

  useEffect(() => {
    if (!isTracking) return;
    const interval = setInterval(() => {
      setWorkers(prev => prev.map(worker => {
        if (worker.status === 'offline') return worker;
        const newX = Math.max(50, Math.min(550, worker.x + (Math.random() - 0.5) * 30));
        const newY = Math.max(50, Math.min(300, worker.y + (Math.random() - 0.5) * 30));
        return { ...worker, x: newX, y: newY };
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, [isTracking]);

  return (
    <div style={{ padding: '20px', backgroundColor: '#f1f5f9', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{
        backgroundColor: isTracking ? '#059669' : '#dc2626',
        color: 'white',
        padding: '25px',
        borderRadius: '12px',
        textAlign: 'center',
        marginBottom: '25px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ fontSize: '42px', margin: '0 0 10px 0', fontWeight: 'bold' }}>
          🗺️ HAMBURG WINTERDIENST KARTE
        </h1>
        <p style={{ fontSize: '20px', margin: '0' }}>
          {isTracking ? 'LIVE-TRACKING AKTIV - Fahrzeuge bewegen sich in Echtzeit' : 'Tracking pausiert - Klicken Sie Start für Live-Updates'}
        </p>
      </div>

      {/* Controls */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <button
          onClick={() => setIsTracking(true)}
          style={{
            backgroundColor: '#059669',
            color: 'white',
            padding: '18px 40px',
            fontSize: '20px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '10px',
            margin: '0 15px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          🚀 START LIVE-TRACKING
        </button>
        
        <button
          onClick={() => setIsTracking(false)}
          style={{
            backgroundColor: '#dc2626',
            color: 'white',
            padding: '18px 40px',
            fontSize: '20px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '10px',
            margin: '0 15px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          🛑 STOP TRACKING
        </button>
      </div>

      {/* MAP WITH STREET-LIKE DESIGN */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '15px',
        padding: '25px',
        boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
        border: '3px solid #2563eb',
        marginBottom: '25px'
      }}>
        
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
            📍 HAMBURG STADTGEBIET - WINTERDIENST FLOTTE
          </h2>
          <p style={{ fontSize: '18px', margin: '0', color: '#6b7280' }}>
            Echtzeitpositionierung von {workers.length} Winterdienst-Fahrzeugen
          </p>
        </div>

        {/* KARTE MIT STRAßEN-DESIGN */}
        <div style={{
          width: '100%',
          height: '400px',
          backgroundColor: '#f0f9ff', // Heller blauer Hintergrund
          border: '4px solid #1e40af',
          borderRadius: '12px',
          position: 'relative',
          overflow: 'hidden',
          backgroundImage: `
            linear-gradient(90deg, #e0e7ff 50%, transparent 50%),
            linear-gradient(#e0e7ff 50%, transparent 50%)
          `,
          backgroundSize: '40px 40px'
        }}>
          
          {/* STRAßEN-LINIEN (simuliert) */}
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundImage: `
              linear-gradient(0deg, #cbd5e1 2px, transparent 2px),
              linear-gradient(90deg, #cbd5e1 2px, transparent 2px),
              linear-gradient(45deg, #e2e8f0 1px, transparent 1px),
              linear-gradient(-45deg, #e2e8f0 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px, 80px 80px, 60px 60px, 60px 60px',
            opacity: 0.6
          }} />

          {/* STADT-BEREICHE (simuliert) */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            width: '120px',
            height: '80px',
            backgroundColor: 'rgba(34, 197, 94, 0.2)',
            borderRadius: '8px',
            border: '2px solid #22c55e'
          }} />
          
          <div style={{
            position: 'absolute',
            top: '30px',
            right: '30px',
            width: '100px',
            height: '70px',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderRadius: '8px',
            border: '2px solid #3b82f6'
          }} />
          
          <div style={{
            position: 'absolute',
            bottom: '40px',
            left: '50px',
            width: '140px',
            height: '60px',
            backgroundColor: 'rgba(245, 158, 11, 0.2)',
            borderRadius: '8px',
            border: '2px solid #f59e0b'
          }} />

          {/* BEREICHS-LABELS */}
          <div style={{
            position: 'absolute',
            top: '30px',
            left: '30px',
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#065f46',
            backgroundColor: 'white',
            padding: '4px 8px',
            borderRadius: '4px'
          }}>
            INNENSTADT
          </div>
          
          <div style={{
            position: 'absolute',
            top: '40px',
            right: '40px',
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#1e40af',
            backgroundColor: 'white',
            padding: '4px 8px',
            borderRadius: '4px'
          }}>
            HAFEN
          </div>
          
          <div style={{
            position: 'absolute',
            bottom: '50px',
            left: '60px',
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#92400e',
            backgroundColor: 'white',
            padding: '4px 8px',
            borderRadius: '4px'
          }}>
            ALTONA
          </div>

          {/* KARTEN-TITEL */}
          <div style={{
            position: 'absolute',
            top: '15px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: isTracking ? '#059669' : '#1e40af',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 'bold',
            zIndex: 100,
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }}>
            🗺️ HAMBURG WINTERDIENST {isTracking ? '(LIVE)' : '(DEMO)'}
          </div>

          {/* FAHRZEUG-MARKER AUF DER "KARTE" */}
          {workers.map(worker => (
            <div key={worker.id}>
              {/* Fahrzeug-Symbol */}
              <div
                onClick={() => setSelectedWorker(worker)}
                style={{
                  position: 'absolute',
                  left: worker.x + 'px',
                  top: worker.y + 'px',
                  width: '70px',
                  height: '70px',
                  backgroundColor: worker.color,
                  color: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  border: '5px solid white',
                  cursor: 'pointer',
                  boxShadow: '0 6px 12px rgba(0,0,0,0.3)',
                  zIndex: 50,
                  transform: 'translate(-50%, -50%)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translate(-50%, -50%) scale(1.3)';
                  e.target.style.zIndex = '100';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translate(-50%, -50%) scale(1)';
                  e.target.style.zIndex = '50';
                }}
              >
                🚛
              </div>

              {/* Fahrzeug-Info */}
              <div style={{
                position: 'absolute',
                left: worker.x + 'px',
                top: (worker.y + 50) + 'px',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0,0,0,0.85)',
                color: 'white',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 'bold',
                zIndex: 40,
                whiteSpace: 'nowrap',
                border: '2px solid white'
              }}>
                {worker.initials} - {worker.street}
              </div>
            </div>
          ))}

          {/* AUSGEWÄHLTES FAHRZEUG INFO */}
          {selectedWorker && (
            <div style={{
              position: 'absolute',
              top: '70px',
              right: '20px',
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '10px',
              border: '3px solid #2563eb',
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
                <p style={{ margin: '6px 0' }}><strong>🆔 Fahrzeug:</strong> WD-00{selectedWorker.id}</p>
              </div>
            </div>
          )}

          {/* KARTEN-LEGENDE */}
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
              Online ({workers.filter(w => w.status === 'online').length})
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{ width: '16px', height: '16px', backgroundColor: '#f59e0b', borderRadius: '50%', marginRight: '8px' }}></div>
              Kürzlich ({workers.filter(w => w.status === 'recent').length})
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '16px', height: '16px', backgroundColor: '#ef4444', borderRadius: '50%', marginRight: '8px' }}></div>
              Offline ({workers.filter(w => w.status === 'offline').length})
            </div>
          </div>
        </div>
      </div>

      {/* STATUS */}
      <div style={{
        backgroundColor: isTracking ? '#d1fae5' : '#fef3c7',
        border: `4px solid ${isTracking ? '#059669' : '#f59e0b'}`,
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
              fontSize: '28px', 
              fontWeight: 'bold',
              color: isTracking ? '#065f46' : '#92400e'
            }}>
              {isTracking ? 'WINTERDIENST LIVE-TRACKING AKTIV!' : 'Tracking pausiert'}
            </h3>
            <p style={{ 
              margin: '0', 
              fontSize: '18px',
              color: isTracking ? '#065f46' : '#92400e'
            }}>
              {isTracking 
                ? `${workers.filter(w => w.status === 'online').length} Fahrzeuge sind online und bewegen sich alle 3 Sekunden in Hamburg!`
                : 'Starten Sie das Live-Tracking um die Fahrzeugbewegungen in Echtzeit zu verfolgen!'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealMapDesign;