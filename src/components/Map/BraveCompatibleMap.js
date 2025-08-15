import React, { Component } from 'react';

// BRAVE BROWSER KOMPATIBLE VERSION - VERWENDET CLASS COMPONENTS
class BraveCompatibleMap extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isTracking: false,
      workers: [
        { id: 1, name: 'Max Müller', x: 150, y: 120, status: 'online', initials: 'MM' },
        { id: 2, name: 'Anna Schmidt', x: 300, y: 180, status: 'online', initials: 'AS' },
        { id: 3, name: 'Peter Wagner', x: 450, y: 140, status: 'offline', initials: 'PW' },
        { id: 4, name: 'Lisa Schultz', x: 200, y: 280, status: 'online', initials: 'LS' },
        { id: 5, name: 'Tom Fischer', x: 400, y: 250, status: 'recent', initials: 'TF' }
      ],
      currentTime: new Date().toLocaleString()
    };
    
    // Bind methods
    this.startTracking = this.startTracking.bind(this);
    this.stopTracking = this.stopTracking.bind(this);
    this.moveWorkers = this.moveWorkers.bind(this);
    
    console.log('🚨 BraveCompatibleMap initialized');
  }

  startTracking() {
    console.log('🚀 START clicked in Brave browser');
    this.setState({ isTracking: true });
    
    // Start movement interval
    this.movementInterval = setInterval(this.moveWorkers, 3000);
  }

  stopTracking() {
    console.log('🛑 STOP clicked in Brave browser');
    this.setState({ isTracking: false });
    
    // Clear movement interval
    if (this.movementInterval) {
      clearInterval(this.movementInterval);
    }
  }

  moveWorkers() {
    console.log('🔄 Moving workers for Brave browser');
    this.setState(prevState => ({
      workers: prevState.workers.map(worker => {
        if (worker.status === 'offline') return worker;
        
        const newX = Math.max(50, Math.min(650, worker.x + (Math.random() - 0.5) * 30));
        const newY = Math.max(50, Math.min(350, worker.y + (Math.random() - 0.5) * 30));
        
        console.log(`Worker ${worker.initials} moved to: ${newX}, ${newY}`);
        return { ...worker, x: newX, y: newY };
      }),
      currentTime: new Date().toLocaleString()
    }));
  }

  componentWillUnmount() {
    if (this.movementInterval) {
      clearInterval(this.movementInterval);
    }
  }

  render() {
    const { isTracking, workers, currentTime } = this.state;
    
    const onlineWorkers = workers.filter(w => w.status === 'online').length;
    const recentWorkers = workers.filter(w => w.status === 'recent').length;
    const offlineWorkers = workers.filter(w => w.status === 'offline').length;

    // INLINE STYLES - KEINE EXTERNEN CSS
    const containerStyle = {
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    };

    const headerStyle = {
      backgroundColor: isTracking ? '#28a745' : '#dc3545',
      color: 'white',
      padding: '30px',
      textAlign: 'center',
      marginBottom: '30px',
      borderRadius: '10px'
    };

    const buttonStyle = {
      padding: '20px 40px',
      fontSize: '20px',
      fontWeight: 'bold',
      border: 'none',
      borderRadius: '8px',
      margin: '0 15px',
      cursor: 'pointer'
    };

    const startButtonStyle = {
      ...buttonStyle,
      backgroundColor: '#28a745',
      color: 'white'
    };

    const stopButtonStyle = {
      ...buttonStyle,
      backgroundColor: '#dc3545',
      color: 'white'
    };

    const mapStyle = {
      width: '700px',
      height: '400px',
      backgroundColor: '#e3f2fd',
      border: '5px solid #1976d2',
      borderRadius: '10px',
      margin: '30px auto',
      position: 'relative',
      overflow: 'hidden'
    };

    const workerStyle = (worker) => ({
      position: 'absolute',
      left: worker.x + 'px',
      top: worker.y + 'px',
      width: '60px',
      height: '60px',
      backgroundColor: worker.status === 'online' ? '#28a745' : 
                     worker.status === 'recent' ? '#ffc107' : '#dc3545',
      color: 'white',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      fontWeight: 'bold',
      border: '4px solid white',
      transform: 'translate(-50%, -50%)',
      zIndex: 100,
      boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
      cursor: 'pointer'
    });

    const labelStyle = (worker) => ({
      position: 'absolute',
      left: worker.x + 'px',
      top: (worker.y + 40) + 'px',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '5px 10px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 'bold',
      zIndex: 90,
      whiteSpace: 'nowrap'
    });

    return (
      <div style={containerStyle}>
        
        {/* BRAVE BROWSER INFO */}
        <div style={{
          backgroundColor: '#fff3cd',
          border: '2px solid #ffeaa7',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#856404', margin: '0 0 10px 0' }}>
            🛡️ BRAVE BROWSER ERKANNT
          </h2>
          <p style={{ color: '#856404', margin: '0', fontSize: '16px' }}>
            Diese Version ist speziell für Brave Browser optimiert mit Class Components und inline Styles.
            <br />
            <strong>Falls Probleme:</strong> Deaktivieren Sie Brave Shields für diese Seite (Klicken Sie das Löwen-Symbol)
          </p>
        </div>

        {/* HEADER */}
        <div style={headerStyle}>
          <h1 style={{ fontSize: '36px', margin: '0 0 15px 0' }}>
            🗺️ BRAVE BROWSER KOMPATIBLE KARTE
          </h1>
          <p style={{ fontSize: '18px', margin: '0' }}>
            {isTracking ? 'LIVE-TRACKING AKTIV für Brave Browser' : 'Bereit für Brave Browser - Klicken Sie START'}
          </p>
          <div style={{ marginTop: '15px', fontSize: '14px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '5px' }}>
            Letzte Aktualisierung: {currentTime}
          </div>
        </div>

        {/* CONTROLS */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <button
            onClick={this.startTracking}
            style={startButtonStyle}
            disabled={isTracking}
          >
            🚀 START TRACKING
          </button>
          
          <button
            onClick={this.stopTracking}
            style={stopButtonStyle}
            disabled={!isTracking}
          >
            🛑 STOP TRACKING
          </button>
        </div>

        {/* STATUS */}
        <div style={{
          backgroundColor: isTracking ? '#d4edda' : '#f8d7da',
          border: `2px solid ${isTracking ? '#28a745' : '#dc3545'}`,
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          marginBottom: '30px',
          fontSize: '18px',
          fontWeight: 'bold',
          color: isTracking ? '#155724' : '#721c24'
        }}>
          STATUS: {isTracking ? '✅ TRACKING LÄUFT' : '⛔ TRACKING GESTOPPT'}
          <br />
          Online: {onlineWorkers} | Kürzlich: {recentWorkers} | Offline: {offlineWorkers}
        </div>

        {/* MAP */}
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#1976d2' }}>
            📍 HAMBURG WINTERDIENST KARTE (BRAVE KOMPATIBEL)
          </h2>
          
          <div style={mapStyle}>
            
            {/* MAP TITLE */}
            <div style={{
              position: 'absolute',
              top: '15px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: isTracking ? '#28a745' : '#1976d2',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              zIndex: 200
            }}>
              🗺️ HAMBURG {isTracking ? '(LIVE)' : '(BEREIT)'}
            </div>

            {/* CITY AREAS */}
            <div style={{
              position: 'absolute',
              top: '60px',
              left: '80px',
              width: '140px',
              height: '70px',
              backgroundColor: 'rgba(76, 175, 80, 0.3)',
              border: '2px solid #4caf50',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#2e7d32'
            }}>
              🏢 INNENSTADT
            </div>

            <div style={{
              position: 'absolute',
              top: '80px',
              right: '60px',
              width: '120px',
              height: '60px',
              backgroundColor: 'rgba(33, 150, 243, 0.3)',
              border: '2px solid #2196f3',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#1565c0'
            }}>
              🌊 ALSTER
            </div>

            <div style={{
              position: 'absolute',
              bottom: '60px',
              left: '100px',
              width: '130px',
              height: '50px',
              backgroundColor: 'rgba(255, 152, 0, 0.3)',
              border: '2px solid #ff9800',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#e65100'
            }}>
              ⚓ HAFEN
            </div>

            {/* STREETS */}
            <div style={{
              position: 'absolute',
              top: '150px',
              left: '0',
              right: '0',
              height: '3px',
              backgroundColor: '#9e9e9e',
              opacity: 0.7
            }}></div>

            <div style={{
              position: 'absolute',
              top: '250px',
              left: '0',
              right: '0',
              height: '3px',
              backgroundColor: '#9e9e9e',
              opacity: 0.7
            }}></div>

            <div style={{
              position: 'absolute',
              top: '0',
              bottom: '0',
              left: '200px',
              width: '3px',
              backgroundColor: '#9e9e9e',
              opacity: 0.7
            }}></div>

            <div style={{
              position: 'absolute',
              top: '0',
              bottom: '0',
              left: '400px',
              width: '3px',
              backgroundColor: '#9e9e9e',
              opacity: 0.7
            }}></div>

            {/* WORKERS */}
            {workers.map(worker => (
              <div key={worker.id}>
                <div style={workerStyle(worker)}>
                  🚛
                </div>
                <div style={labelStyle(worker)}>
                  {worker.initials} - {worker.status}
                </div>
              </div>
            ))}

            {/* LEGEND */}
            <div style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              backgroundColor: 'white',
              padding: '15px',
              borderRadius: '6px',
              border: '2px solid #ccc',
              fontSize: '12px',
              zIndex: 150
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>🚛 STATUS:</div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#28a745', borderRadius: '50%', marginRight: '6px' }}></div>
                Online ({onlineWorkers})
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#ffc107', borderRadius: '50%', marginRight: '6px' }}></div>
                Kürzlich ({recentWorkers})
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#dc3545', borderRadius: '50%', marginRight: '6px' }}></div>
                Offline ({offlineWorkers})
              </div>
            </div>
          </div>
        </div>

        {/* WORKER LIST */}
        <div style={{
          backgroundColor: 'white',
          border: '3px solid #1976d2',
          borderRadius: '10px',
          padding: '25px',
          marginTop: '30px'
        }}>
          <h3 style={{ fontSize: '24px', textAlign: 'center', color: '#1976d2', marginBottom: '20px' }}>
            🚛 FAHRZEUG POSITIONEN (LIVE)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
            {workers.map(worker => (
              <div key={worker.id} style={{
                padding: '15px',
                backgroundColor: worker.status === 'online' ? '#28a745' : 
                               worker.status === 'recent' ? '#ffc107' : '#dc3545',
                color: 'white',
                borderRadius: '8px',
                fontWeight: 'bold'
              }}>
                🚛 {worker.name} ({worker.initials})
                <br />
                Position: X:{Math.round(worker.x)}, Y:{Math.round(worker.y)}
                <br />
                Status: {worker.status.toUpperCase()}
              </div>
            ))}
          </div>
        </div>

        {/* BRAVE TROUBLESHOOTING */}
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '2px solid #6c757d',
          borderRadius: '10px',
          padding: '25px',
          marginTop: '30px'
        }}>
          <h3 style={{ color: '#495057', marginBottom: '15px' }}>
            🛡️ BRAVE BROWSER TROUBLESHOOTING
          </h3>
          <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#6c757d' }}>
            <p><strong>Falls die Karte oder Buttons nicht funktionieren:</strong></p>
            <ol>
              <li>Klicken Sie das <strong>Löwen-Symbol</strong> in der Adressleiste</li>
              <li>Deaktivieren Sie <strong>"Shields"</strong> für diese Seite</li>
              <li>Erlauben Sie <strong>JavaScript</strong> und <strong>Cookies</strong></li>
              <li>Laden Sie die Seite neu (F5)</li>
            </ol>
            <p><strong>Alternative:</strong> Probieren Sie es in <strong>Opera</strong> - das sollte ohne Probleme funktionieren.</p>
          </div>
        </div>

      </div>
    );
  }
}

export default BraveCompatibleMap;