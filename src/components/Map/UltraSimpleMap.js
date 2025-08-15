import React, { useState, useEffect } from 'react';

const UltraSimpleMap = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [workers, setWorkers] = useState([]);

  // Initialize workers
  useEffect(() => {
    const initialWorkers = [
      { id: 1, name: 'Max Müller', x: 150, y: 120, status: 'online', initials: 'MM' },
      { id: 2, name: 'Anna Schmidt', x: 300, y: 180, status: 'online', initials: 'AS' },
      { id: 3, name: 'Peter Wagner', x: 450, y: 140, status: 'offline', initials: 'PW' },
      { id: 4, name: 'Lisa Schultz', x: 200, y: 280, status: 'online', initials: 'LS' },
      { id: 5, name: 'Tom Fischer', x: 400, y: 250, status: 'recent', initials: 'TF' }
    ];
    setWorkers(initialWorkers);
  }, []);

  // Live tracking
  useEffect(() => {
    if (!isTracking) return;
    const interval = setInterval(() => {
      setWorkers(prev => prev.map(worker => {
        if (worker.status === 'offline') return worker;
        const newX = Math.max(50, Math.min(650, worker.x + (Math.random() - 0.5) * 30));
        const newY = Math.max(50, Math.min(350, worker.y + (Math.random() - 0.5) * 30));
        return { ...worker, x: newX, y: newY };
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, [isTracking]);

  return (
    <div>
      {/* ULTRA SIMPLE TEST - KÖNNEN SIE DAS SEHEN? */}
      <div style={{
        width: '100%',
        height: '200px',
        backgroundColor: 'red',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '40px',
        fontWeight: 'bold',
        marginBottom: '20px'
      }}>
        🚨 KÖNNEN SIE DIESE ROTE BOX SEHEN? 🚨
      </div>

      {/* TITEL */}
      <h1 style={{ 
        fontSize: '36px', 
        textAlign: 'center', 
        color: 'blue',
        backgroundColor: 'yellow',
        padding: '20px',
        margin: '20px 0'
      }}>
        🗺️ ULTRA SIMPLE MAP TEST
      </h1>

      {/* BUTTONS */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <button
          onClick={() => setIsTracking(true)}
          style={{
            backgroundColor: 'green',
            color: 'white',
            padding: '20px 40px',
            fontSize: '20px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '10px',
            margin: '0 15px',
            cursor: 'pointer'
          }}
        >
          🚀 START
        </button>
        
        <button
          onClick={() => setIsTracking(false)}
          style={{
            backgroundColor: 'red',
            color: 'white',
            padding: '20px 40px',
            fontSize: '20px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '10px',
            margin: '0 15px',
            cursor: 'pointer'
          }}
        >
          🛑 STOP
        </button>
      </div>

      {/* STATUS */}
      <div style={{
        textAlign: 'center',
        fontSize: '24px',
        fontWeight: 'bold',
        color: isTracking ? 'green' : 'red',
        backgroundColor: 'lightgray',
        padding: '15px',
        marginBottom: '30px'
      }}>
        STATUS: {isTracking ? '✅ TRACKING LÄUFT' : '⛔ TRACKING GESTOPPT'}
      </div>

      {/* DIE KARTE - ABSOLUT SIMPEL */}
      <div style={{
        width: '700px',
        height: '400px',
        backgroundColor: 'lightblue',
        border: '10px solid black',
        margin: '0 auto',
        position: 'relative'
      }}>
        
        {/* KARTEN-TITEL DIREKT IM DIV */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          backgroundColor: 'black',
          color: 'white',
          padding: '10px',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          🗺️ HAMBURG KARTE {isTracking ? '(LIVE)' : '(STOP)'}
        </div>

        {/* STADT-BEREICHE - DIREKTE INLINE STYLES */}
        <div style={{
          position: 'absolute',
          top: '60px',
          left: '50px',
          width: '150px',
          height: '80px',
          backgroundColor: 'green',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '14px'
        }}>
          🏢 INNENSTADT
        </div>

        <div style={{
          position: 'absolute',
          top: '80px',
          right: '80px',
          width: '120px',
          height: '70px',
          backgroundColor: 'blue',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '14px'
        }}>
          🌊 ALSTER
        </div>

        <div style={{
          position: 'absolute',
          bottom: '60px',
          left: '80px',
          width: '140px',
          height: '60px',
          backgroundColor: 'orange',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '14px'
        }}>
          ⚓ HAFEN
        </div>

        <div style={{
          position: 'absolute',
          bottom: '80px',
          right: '100px',
          width: '100px',
          height: '50px',
          backgroundColor: 'purple',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '12px'
        }}>
          🏭 INDUSTRIE
        </div>

        {/* STRAßEN - EINFACHE LINIEN */}
        <div style={{
          position: 'absolute',
          top: '150px',
          left: '0px',
          right: '0px',
          height: '4px',
          backgroundColor: 'gray'
        }}></div>

        <div style={{
          position: 'absolute',
          top: '250px',
          left: '0px',
          right: '0px',
          height: '4px',
          backgroundColor: 'gray'
        }}></div>

        <div style={{
          position: 'absolute',
          top: '0px',
          bottom: '0px',
          left: '200px',
          width: '4px',
          backgroundColor: 'gray'
        }}></div>

        <div style={{
          position: 'absolute',
          top: '0px',
          bottom: '0px',
          left: '400px',
          width: '4px',
          backgroundColor: 'gray'
        }}></div>

        <div style={{
          position: 'absolute',
          top: '0px',
          bottom: '0px',
          left: '500px',
          width: '4px',
          backgroundColor: 'gray'
        }}></div>

        {/* ARBEITER - GROSSE SYMBOLE */}
        {workers.map(worker => (
          <div key={worker.id}>
            {/* ARBEITER SYMBOL */}
            <div
              style={{
                position: 'absolute',
                left: worker.x + 'px',
                top: worker.y + 'px',
                width: '60px',
                height: '60px',
                backgroundColor: worker.status === 'online' ? 'lime' : worker.status === 'recent' ? 'yellow' : 'red',
                color: 'black',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 'bold',
                border: '5px solid white',
                cursor: 'pointer',
                transform: 'translate(-50%, -50%)',
                zIndex: '100'
              }}
            >
              🚛
            </div>

            {/* ARBEITER NAME */}
            <div style={{
              position: 'absolute',
              left: worker.x + 'px',
              top: (worker.y + 40) + 'px',
              transform: 'translateX(-50%)',
              backgroundColor: 'black',
              color: 'white',
              padding: '5px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
              zIndex: '90'
            }}>
              {worker.initials} - {worker.status}
            </div>
          </div>
        ))}

        {/* LEGENDE */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          backgroundColor: 'white',
          padding: '15px',
          border: '3px solid black',
          fontSize: '14px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>🚛 STATUS:</div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
            <div style={{ width: '16px', height: '16px', backgroundColor: 'lime', borderRadius: '50%', marginRight: '8px' }}></div>
            Online ({workers.filter(w => w.status === 'online').length})
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
            <div style={{ width: '16px', height: '16px', backgroundColor: 'yellow', borderRadius: '50%', marginRight: '8px' }}></div>
            Kürzlich ({workers.filter(w => w.status === 'recent').length})
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '16px', height: '16px', backgroundColor: 'red', borderRadius: '50%', marginRight: '8px' }}></div>
            Offline ({workers.filter(w => w.status === 'offline').length})
          </div>
        </div>
      </div>

      {/* ARBEITER LISTE */}
      <div style={{
        marginTop: '30px',
        backgroundColor: 'lightgray',
        padding: '20px',
        border: '5px solid black'
      }}>
        <h3 style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center' }}>
          🚛 ARBEITER POSITIONEN:
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center' }}>
          {workers.map(worker => (
            <div key={worker.id} style={{
              padding: '10px 15px',
              backgroundColor: worker.status === 'online' ? 'lime' : worker.status === 'recent' ? 'yellow' : 'red',
              color: 'black',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              border: '3px solid black'
            }}>
              🚛 {worker.initials} - {worker.name} - X:{Math.round(worker.x)}, Y:{Math.round(worker.y)} - {worker.status}
            </div>
          ))}
        </div>
      </div>

      {/* FINAL STATUS */}
      <div style={{
        marginTop: '30px',
        backgroundColor: isTracking ? 'lightgreen' : 'lightyellow',
        border: `10px solid ${isTracking ? 'green' : 'orange'}`,
        padding: '30px',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '32px', color: isTracking ? 'green' : 'orange', margin: '0 0 15px 0' }}>
          {isTracking ? '✅ LIVE-TRACKING FUNKTIONIERT!' : '⚠️ TRACKING GESTOPPT'}
        </h2>
        <p style={{ fontSize: '20px', margin: '0', color: isTracking ? 'green' : 'orange', fontWeight: 'bold' }}>
          {isTracking 
            ? `${workers.filter(w => w.status === 'online').length} Online-Fahrzeuge bewegen sich alle 3 Sekunden!`
            : 'Klicken Sie START um die Fahrzeuge zu bewegen!'
          }
        </p>
        <div style={{ marginTop: '15px', fontSize: '18px', color: 'black' }}>
          <strong>KÖNNEN SIE FOLGENDES SEHEN?</strong>
          <ul style={{ textAlign: 'left', display: 'inline-block', marginTop: '10px' }}>
            <li>✅ Rote Box oben?</li>
            <li>✅ Gelbe Titel-Box?</li>
            <li>✅ Grüne und rote Buttons?</li>
            <li>✅ Hellblaue Karte mit schwarzem Rahmen?</li>
            <li>✅ 5 große 🚛 LKW-Symbole auf der Karte?</li>
            <li>✅ Bunte Bereiche (grün, blau, orange, lila)?</li>
            <li>✅ Graue Straßenlinien?</li>
            <li>✅ Weiße Legende unten rechts?</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UltraSimpleMap;