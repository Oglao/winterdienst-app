import React, { useState, useEffect } from 'react';

const UberTrackingFinal = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);

  // Worker initialisieren
  useEffect(() => {
    const initialWorkers = [
      { id: 1, name: 'Max Müller', x: 150, y: 100, status: 'online', color: '#10b981' },
      { id: 2, name: 'Anna Schmidt', x: 300, y: 200, status: 'online', color: '#10b981' },
      { id: 3, name: 'Peter Wagner', x: 450, y: 150, status: 'offline', color: '#ef4444' },
      { id: 4, name: 'Lisa Schultz', x: 200, y: 300, status: 'online', color: '#10b981' },
      { id: 5, name: 'Tom Fischer', x: 400, y: 250, status: 'recent', color: '#f59e0b' }
    ];
    setWorkers(initialWorkers);
  }, []);

  // Live-Bewegung
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      setWorkers(prev => prev.map(worker => {
        if (worker.status === 'offline') return worker;
        
        const newX = Math.max(50, Math.min(550, worker.x + (Math.random() - 0.5) * 30));
        const newY = Math.max(50, Math.min(350, worker.y + (Math.random() - 0.5) * 30));
        
        return { ...worker, x: newX, y: newY };
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [isTracking]);

  return (
    <div>
      {/* TITEL - ABSOLUT SICHTBAR */}
      <div style={{
        width: '100%',
        height: '80px',
        backgroundColor: isTracking ? '#059669' : '#dc2626',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '32px',
        fontWeight: 'bold',
        marginBottom: '20px'
      }}>
        {isTracking ? '🚀 UBER TRACKING AKTIV!' : '⏸️ TRACKING GESTOPPT!'}
      </div>

      {/* BUTTONS - ABSOLUT SICHTBAR */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <button
          onClick={() => setIsTracking(true)}
          style={{
            width: '200px',
            height: '60px',
            backgroundColor: '#059669',
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '8px',
            margin: '0 10px',
            cursor: 'pointer'
          }}
        >
          🚀 START TRACKING
        </button>
        
        <button
          onClick={() => setIsTracking(false)}
          style={{
            width: '200px',
            height: '60px',
            backgroundColor: '#dc2626',
            color: 'white',
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

      {/* KARTE - MAXIMALE SICHTBARKEIT */}
      <div style={{
        width: '600px',
        height: '400px',
        backgroundColor: '#87CEEB', // HIMMELBLAUE KARTE
        border: '10px solid #000000', // SCHWARZER RAHMEN
        margin: '0 auto',
        position: 'relative',
        borderRadius: '15px'
      }}>
        
        {/* KARTEN-TITEL */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          backgroundColor: '#000000',
          color: '#FFFFFF',
          padding: '10px 15px',
          borderRadius: '5px',
          fontSize: '16px',
          fontWeight: 'bold',
          zIndex: 100
        }}>
          📍 HAMBURG WINTERDIENST KARTE
        </div>

        {/* WORKER MARKER */}
        {workers.map(worker => (
          <div
            key={worker.id}
            onClick={() => setSelectedWorker(worker)}
            style={{
              position: 'absolute',
              left: worker.x + 'px',
              top: worker.y + 'px',
              width: '80px',
              height: '80px',
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
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              zIndex: 50,
              transform: 'translate(-50%, -50%)'
            }}
          >
            {worker.name.split(' ').map(n => n[0]).join('')}
          </div>
        ))}

        {/* AUSGEWÄHLTER WORKER INFO */}
        {selectedWorker && (
          <div style={{
            position: 'absolute',
            top: '50px',
            right: '10px',
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '8px',
            border: '3px solid #3b82f6',
            minWidth: '200px',
            zIndex: 200
          }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>
              {selectedWorker.name}
            </h4>
            <p style={{ margin: '5px 0', fontSize: '14px' }}>
              <strong>Status:</strong> {selectedWorker.status}
            </p>
            <p style={{ margin: '5px 0', fontSize: '14px' }}>
              <strong>Position:</strong> {Math.round(selectedWorker.x)}, {Math.round(selectedWorker.y)}
            </p>
            <button
              onClick={() => setSelectedWorker(null)}
              style={{
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '10px',
                fontSize: '12px'
              }}
            >
              ✕ Schließen
            </button>
          </div>
        )}

        {/* STATUS LEGENDE */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          backgroundColor: 'white',
          padding: '10px',
          borderRadius: '6px',
          border: '2px solid #ccc',
          fontSize: '12px',
          zIndex: 90
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Status:</div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
            <div style={{ width: '15px', height: '15px', backgroundColor: '#10b981', borderRadius: '50%', marginRight: '8px' }}></div>
            Online ({workers.filter(w => w.status === 'online').length})
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
            <div style={{ width: '15px', height: '15px', backgroundColor: '#f59e0b', borderRadius: '50%', marginRight: '8px' }}></div>
            Kürzlich ({workers.filter(w => w.status === 'recent').length})
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '15px', height: '15px', backgroundColor: '#ef4444', borderRadius: '50%', marginRight: '8px' }}></div>
            Offline ({workers.filter(w => w.status === 'offline').length})
          </div>
        </div>
      </div>

      {/* LIVE STATUS */}
      <div style={{
        width: '600px',
        margin: '20px auto',
        padding: '20px',
        backgroundColor: isTracking ? '#d1fae5' : '#fef3c7',
        border: `3px solid ${isTracking ? '#059669' : '#d97706'}`,
        borderRadius: '10px',
        textAlign: 'center'
      }}>
        <h3 style={{ 
          margin: '0 0 10px 0', 
          fontSize: '24px', 
          color: isTracking ? '#065f46' : '#92400e'
        }}>
          {isTracking ? '✅ UBER TRACKING LÄUFT!' : '⏸️ TRACKING PAUSIERT'}
        </h3>
        <p style={{ 
          margin: '0', 
          fontSize: '16px',
          color: isTracking ? '#065f46' : '#92400e'
        }}>
          {isTracking 
            ? '5 Fahrzeuge bewegen sich alle 2 Sekunden automatisch. Klicken Sie auf die Marker!'
            : 'Klicken Sie "START TRACKING" um die Live-Bewegung zu sehen!'
          }
        </p>
      </div>
    </div>
  );
};

export default UberTrackingFinal;