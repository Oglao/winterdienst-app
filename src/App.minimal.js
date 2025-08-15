import React, { useState } from 'react';

// ULTRA-EINFACHE VERSION - Nur JavaScript, kein komplexes React
const MinimalApp = () => {
  const [page, setPage] = useState('start');

  // Inline styles um CSS-Probleme zu vermeiden
  const styles = {
    container: {
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    },
    header: {
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    nav: {
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '20px'
    },
    button: {
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      margin: '5px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '16px'
    },
    content: {
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }
  };

  const handleClick = (newPage) => {
    console.log('Button clicked:', newPage);
    alert(`Navigation zu: ${newPage}`);
    setPage(newPage);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>🚨 Winterdienst App - MINIMAL VERSION</h1>
        <p>Ultra-einfache Version ohne komplexe Features</p>
        <p><strong>Aktuelle Seite: {page}</strong></p>
      </div>

      <div style={styles.nav}>
        <h3>Navigation:</h3>
        <button 
          style={styles.button} 
          onClick={() => handleClick('dashboard')}
        >
          🏠 Dashboard
        </button>
        <button 
          style={styles.button} 
          onClick={() => handleClick('routen')}
        >
          🛣️ Routen
        </button>
        <button 
          style={styles.button} 
          onClick={() => handleClick('mitarbeiter')}
        >
          👥 Mitarbeiter
        </button>
        <button 
          style={styles.button} 
          onClick={() => handleClick('karte')}
        >
          🗺️ Karte
        </button>
      </div>

      <div style={styles.content}>
        {page === 'start' && (
          <div>
            <h2>👋 Willkommen!</h2>
            <p>Dies ist die minimale Version der Winterdienst App.</p>
            <p><strong>Klicken Sie auf einen der Buttons oben, um zu navigieren.</strong></p>
            <p>Jeder Klick zeigt ein Alert und ändert diese Seite.</p>
          </div>
        )}

        {page === 'dashboard' && (
          <div>
            <h2>🏠 Dashboard</h2>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px'}}>
              <div style={{padding: '20px', backgroundColor: '#dbeafe', borderRadius: '8px'}}>
                <h3>Aktive Mitarbeiter</h3>
                <p style={{fontSize: '24px', fontWeight: 'bold'}}>3</p>
              </div>
              <div style={{padding: '20px', backgroundColor: '#dcfce7', borderRadius: '8px'}}>
                <h3>Routen heute</h3>
                <p style={{fontSize: '24px', fontWeight: 'bold'}}>12</p>
              </div>
              <div style={{padding: '20px', backgroundColor: '#fef3c7', borderRadius: '8px'}}>
                <h3>Geplante Routen</h3>
                <p style={{fontSize: '24px', fontWeight: 'bold'}}>5</p>
              </div>
            </div>
          </div>
        )}

        {page === 'routen' && (
          <div>
            <h2>🛣️ Routen</h2>
            <div style={{marginBottom: '15px', padding: '15px', border: '1px solid #e5e7eb', borderRadius: '8px'}}>
              <h3>Hauptstraße Nord</h3>
              <p>Status: ✅ Abgeschlossen - Max Müller</p>
              <p>Zeit: 06:00 - 10:30</p>
            </div>
            <div style={{marginBottom: '15px', padding: '15px', border: '1px solid #e5e7eb', borderRadius: '8px'}}>
              <h3>Industriegebiet Süd</h3>
              <p>Status: 🔄 In Arbeit - Anna Schmidt</p>
              <p>Zeit: 07:00 - Läuft</p>
            </div>
            <div style={{marginBottom: '15px', padding: '15px', border: '1px solid #e5e7eb', borderRadius: '8px'}}>
              <h3>Wohngebiet West</h3>
              <p>Status: ⏱️ Geplant - Peter Wagner</p>
              <p>Zeit: 14:00 - Geplant</p>
            </div>
          </div>
        )}

        {page === 'mitarbeiter' && (
          <div>
            <h2>👥 Mitarbeiter</h2>
            <div style={{marginBottom: '15px', padding: '15px', border: '1px solid #e5e7eb', borderRadius: '8px'}}>
              <h3>Max Müller</h3>
              <p>Status: 🟢 Aktiv</p>
              <p>Route: Hauptstraße Nord</p>
              <p>Arbeitszeit: 4h 30min</p>
            </div>
            <div style={{marginBottom: '15px', padding: '15px', border: '1px solid #e5e7eb', borderRadius: '8px'}}>
              <h3>Anna Schmidt</h3>
              <p>Status: 🟢 Aktiv</p>
              <p>Route: Industriegebiet Süd</p>
              <p>Arbeitszeit: 3h 15min</p>
            </div>
            <div style={{marginBottom: '15px', padding: '15px', border: '1px solid #e5e7eb', borderRadius: '8px'}}>
              <h3>Peter Wagner</h3>
              <p>Status: 🟡 Bereit</p>
              <p>Route: Wohngebiet West (geplant)</p>
              <p>Arbeitszeit: 0h 0min</p>
            </div>
          </div>
        )}

        {page === 'karte' && (
          <div>
            <h2>🗺️ Karte (Vereinfacht)</h2>
            <div style={{
              height: '300px', 
              backgroundColor: '#f3f4f6', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '2px dashed #9ca3af'
            }}>
              <div style={{textAlign: 'center'}}>
                <div style={{fontSize: '48px', marginBottom: '10px'}}>🗺️</div>
                <p>Vereinfachte Kartenansicht</p>
                <p>Hamburg Gebiet</p>
              </div>
            </div>
            <div style={{marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px'}}>
              <div style={{textAlign: 'center', padding: '15px', backgroundColor: '#dbeafe', borderRadius: '8px'}}>
                <div style={{fontSize: '24px'}}>📍</div>
                <p><strong>Max Müller</strong></p>
                <p>Hauptstraße Nord</p>
              </div>
              <div style={{textAlign: 'center', padding: '15px', backgroundColor: '#dcfce7', borderRadius: '8px'}}>
                <div style={{fontSize: '24px'}}>📍</div>
                <p><strong>Anna Schmidt</strong></p>
                <p>Industriegebiet Süd</p>
              </div>
              <div style={{textAlign: 'center', padding: '15px', backgroundColor: '#fef3c7', borderRadius: '8px'}}>
                <div style={{fontSize: '24px'}}>📍</div>
                <p><strong>Peter Wagner</strong></p>
                <p>Wohngebiet West</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{...styles.nav, backgroundColor: '#f0fdf4', border: '2px solid #22c55e'}}>
        <h3 style={{color: '#15803d'}}>✅ Status</h3>
        <p style={{color: '#166534'}}>
          <strong>Navigation funktioniert!</strong> Aktuelle Seite: {page}
        </p>
        <p style={{color: '#166534', fontSize: '14px'}}>
          Jeder Button-Klick zeigt ein Alert und wechselt die Seite.
        </p>
      </div>
    </div>
  );
};

export default MinimalApp;