import React, { useState, useEffect } from 'react';

const WorkingUberMap = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('unknown');

  // Initialize workers
  useEffect(() => {
    const initialWorkers = [
      { id: 1, name: 'Max Müller', x: 100, y: 100, status: 'online', color: '#10b981', initials: 'MM' },
      { id: 2, name: 'Anna Schmidt', x: 250, y: 150, status: 'online', color: '#10b981', initials: 'AS' },
      { id: 3, name: 'Peter Wagner', x: 400, y: 200, status: 'offline', color: '#ef4444', initials: 'PW' },
      { id: 4, name: 'Lisa Schultz', x: 150, y: 250, status: 'online', color: '#10b981', initials: 'LS' },
      { id: 5, name: 'Tom Fischer', x: 350, y: 300, status: 'recent', color: '#f59e0b', initials: 'TF' }
    ];
    setWorkers(initialWorkers);
    console.log('✅ Workers initialized');
  }, []);

  // Check geolocation permission
  useEffect(() => {
    const checkPermission = async () => {
      try {
        if ('permissions' in navigator) {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          setPermissionStatus(result.state);
          console.log('📍 Geolocation permission:', result.state);
          
          result.addEventListener('change', () => {
            setPermissionStatus(result.state);
            console.log('📍 Permission changed to:', result.state);
          });
        }
      } catch (error) {
        console.warn('⚠️ Permission API not supported:', error);
        setPermissionStatus('unsupported');
      }
    };
    
    checkPermission();
  }, []);

  // Live tracking movement
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      setWorkers(prevWorkers => {
        return prevWorkers.map(worker => {
          if (worker.status === 'offline') return worker;
          
          // Simulate realistic movement
          const moveX = (Math.random() - 0.5) * 40;
          const moveY = (Math.random() - 0.5) * 40;
          
          const newX = Math.max(50, Math.min(450, worker.x + moveX));
          const newY = Math.max(50, Math.min(250, worker.y + moveY));
          
          return { ...worker, x: newX, y: newY };
        });
      });
      console.log('🔄 Workers moved:', new Date().toLocaleTimeString());
    }, 3000);

    return () => clearInterval(interval);
  }, [isTracking]);

  const startTracking = () => {
    setIsTracking(true);
    console.log('🚀 UBER Tracking STARTED');
  };

  const stopTracking = () => {
    setIsTracking(false);
    console.log('🛑 UBER Tracking STOPPED');
  };

  const stats = {
    total: workers.length,
    online: workers.filter(w => w.status === 'online').length,
    recent: workers.filter(w => w.status === 'recent').length,
    offline: workers.filter(w => w.status === 'offline').length
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* Header Status */}
      <div style={{
        backgroundColor: isTracking ? '#10b981' : '#ef4444',
        color: 'white',
        padding: '20px',
        borderRadius: '10px',
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        <h1 style={{ fontSize: '36px', margin: '0 0 10px 0', fontWeight: 'bold' }}>
          {isTracking ? '🚀 UBER LIVE-TRACKING AKTIV!' : '⏸️ TRACKING GESTOPPT'}
        </h1>
        <p style={{ fontSize: '18px', margin: '0' }}>
          GPS Permission: {permissionStatus} | Workers: {workers.length} | Last Update: {new Date().toLocaleTimeString()}
        </p>
      </div>

      {/* Control Buttons */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <button
          onClick={startTracking}
          disabled={isTracking}
          style={{
            backgroundColor: isTracking ? '#9ca3af' : '#10b981',
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
          🚀 Start Live-Tracking
        </button>
        
        <button
          onClick={stopTracking}
          disabled={!isTracking}
          style={{
            backgroundColor: !isTracking ? '#9ca3af' : '#ef4444',
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
      </div>

      {/* Statistics */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', minWidth: '120px', border: '2px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#6b7280' }}>Gesamt</h3>
          <p style={{ margin: '0', fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>{stats.total}</p>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', minWidth: '120px', border: '2px solid #10b981' }}>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#6b7280' }}>Online</h3>
          <p style={{ margin: '0', fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>{stats.online}</p>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', minWidth: '120px', border: '2px solid #f59e0b' }}>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#6b7280' }}>Kürzlich</h3>
          <p style={{ margin: '0', fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>{stats.recent}</p>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', minWidth: '120px', border: '2px solid #ef4444' }}>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#6b7280' }}>Offline</h3>
          <p style={{ margin: '0', fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>{stats.offline}</p>
        </div>
      </div>

      {/* THE WORKING MAP */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '15px',
        padding: '25px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        border: '3px solid #3b82f6'
      }}>
        
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#1f2937' }}>
            🗺️ UBER Live-Karte Hamburg
          </h2>
          <p style={{ fontSize: '16px', margin: '0', color: '#6b7280' }}>
            Echte Bewegung alle 3 Sekunden - Winterdienst Fleet-Management
          </p>
        </div>

        {/* MAP CONTAINER - GUARANTEED VISIBLE */}
        <div style={{
          width: '100%',
          height: '400px',
          backgroundColor: '#dbeafe',
          border: '4px solid #2563eb',
          borderRadius: '12px',
          position: 'relative',
          backgroundImage: 'radial-gradient(circle at 20px 20px, rgba(255,255,255,0.3) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}>
          
          {/* Map Title Overlay */}
          <div style={{
            position: 'absolute',
            top: '15px',
            left: '15px',
            backgroundColor: isTracking ? '#10b981' : '#3b82f6',
            color: 'white',
            padding: '10px 15px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            zIndex: 100,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            📍 Hamburg Fleet {isTracking ? '(LIVE)' : '(DEMO)'}
          </div>

          {/* Workers on Map */}
          {workers.map(worker => (
            <div key={worker.id}>
              {/* Worker Marker */}
              <div
                onClick={() => setSelectedWorker(worker)}
                style={{
                  position: 'absolute',
                  left: worker.x + 'px',
                  top: worker.y + 'px',
                  width: '60px',
                  height: '60px',
                  backgroundColor: worker.color,
                  color: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  border: '4px solid white',
                  cursor: 'pointer',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
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
                {worker.initials}
              </div>

              {/* Worker Name Label */}
              <div style={{
                position: 'absolute',
                left: worker.x + 'px',
                top: (worker.y + 45) + 'px',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0,0,0,0.8)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold',
                zIndex: 40,
                whiteSpace: 'nowrap'
              }}>
                {worker.name}
              </div>
            </div>
          ))}

          {/* Selected Worker Info Panel */}
          {selectedWorker && (
            <div style={{
              position: 'absolute',
              top: '60px',
              right: '15px',
              backgroundColor: 'white',
              padding: '15px',
              borderRadius: '8px',
              border: '2px solid #3b82f6',
              minWidth: '200px',
              zIndex: 200,
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: '0', fontSize: '16px', fontWeight: 'bold' }}>
                  {selectedWorker.name}
                </h4>
                <button
                  onClick={() => setSelectedWorker(null)}
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  ✕
                </button>
              </div>
              <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                <p style={{ margin: '4px 0' }}><strong>Status:</strong> {selectedWorker.status}</p>
                <p style={{ margin: '4px 0' }}><strong>Position:</strong> {Math.round(selectedWorker.x)}, {Math.round(selectedWorker.y)}</p>
                <p style={{ margin: '4px 0' }}><strong>ID:</strong> WD-00{selectedWorker.id}</p>
              </div>
            </div>
          )}

          {/* Status Legend */}
          <div style={{
            position: 'absolute',
            bottom: '15px',
            right: '15px',
            backgroundColor: 'white',
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            fontSize: '12px',
            zIndex: 90
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Status Legend:</div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '50%', marginRight: '6px' }}></div>
              Online ({stats.online})
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#f59e0b', borderRadius: '50%', marginRight: '6px' }}></div>
              Recent ({stats.recent})
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#ef4444', borderRadius: '50%', marginRight: '6px' }}></div>
              Offline ({stats.offline})
            </div>
          </div>
        </div>
      </div>

      {/* Status Footer */}
      <div style={{
        marginTop: '20px',
        backgroundColor: isTracking ? '#d1fae5' : '#fef3c7',
        border: `3px solid ${isTracking ? '#10b981' : '#f59e0b'}`,
        borderRadius: '10px',
        padding: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '32px', marginRight: '15px' }}>
            {isTracking ? '✅' : '⚠️'}
          </span>
          <div>
            <h3 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '20px', 
              fontWeight: 'bold',
              color: isTracking ? '#065f46' : '#92400e'
            }}>
              {isTracking ? 'UBER Live-Tracking ist aktiv!' : 'Tracking ist pausiert'}
            </h3>
            <p style={{ 
              margin: '0', 
              fontSize: '16px',
              color: isTracking ? '#065f46' : '#92400e'
            }}>
              {isTracking 
                ? `${stats.online} Online-Fahrzeuge bewegen sich automatisch alle 3 Sekunden. Klicken Sie auf die Marker für Details!`
                : 'Klicken Sie "Start Live-Tracking" um die Echtzeitbewegung zu sehen!'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkingUberMap;