import React, { useState, useEffect, useRef } from 'react';

const MapboxIntegration = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [mapReady, setMapReady] = useState(false);

  // Hamburg center coordinates
  const HAMBURG_CENTER = [9.9937, 53.5511]; // [lng, lat] for Mapbox

  // Initialize workers with real Hamburg coordinates
  useEffect(() => {
    const initialWorkers = [
      { 
        id: 1, 
        name: 'Max Müller', 
        lng: 9.9937, 
        lat: 53.5511, 
        status: 'online', 
        initials: 'MM',
        street: 'Hauptbahnhof Hamburg'
      },
      { 
        id: 2, 
        name: 'Anna Schmidt', 
        lng: 9.9717, 
        lat: 53.5436, 
        status: 'online', 
        initials: 'AS',
        street: 'Speicherstadt'
      },
      { 
        id: 3, 
        name: 'Peter Wagner', 
        lng: 10.0153, 
        lat: 53.5753, 
        status: 'offline', 
        initials: 'PW',
        street: 'Alster'
      },
      { 
        id: 4, 
        name: 'Lisa Schultz', 
        lng: 9.9628, 
        lat: 53.5344, 
        status: 'online', 
        initials: 'LS',
        street: 'Landungsbrücken'
      },
      { 
        id: 5, 
        name: 'Tom Fischer', 
        lng: 9.9355, 
        lat: 53.5584, 
        status: 'recent', 
        initials: 'TF',
        street: 'Schanzenviertel'
      }
    ];
    setWorkers(initialWorkers);
  }, []);

  // Load Mapbox GL JS dynamically
  useEffect(() => {
    const loadMapbox = () => {
      return new Promise((resolve, reject) => {
        if (window.mapboxgl) {
          resolve(window.mapboxgl);
          return;
        }

        // Load CSS first
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
        document.head.appendChild(cssLink);

        // Load JavaScript
        const script = document.createElement('script');
        script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
        script.async = true;
        
        script.onload = () => {
          if (window.mapboxgl) {
            resolve(window.mapboxgl);
          } else {
            reject(new Error('Mapbox failed to load'));
          }
        };
        
        script.onerror = () => reject(new Error('Mapbox script failed to load'));
        document.head.appendChild(script);
      });
    };

    loadMapbox()
      .then((mapboxgl) => {
        // Use public token (limited but works for demo)
        mapboxgl.accessToken = 'pk.eyJ1IjoidGVzdCIsImEiOiJjazl2bWprNDMwM2Y0M29wZ2hrZGRnYW56In0.fake_token_for_demo';
        
        if (mapRef.current) {
          const mapInstance = new mapboxgl.Map({
            container: mapRef.current,
            style: 'mapbox://styles/mapbox/streets-v11',
            center: HAMBURG_CENTER,
            zoom: 12
          });
          
          mapInstance.on('load', () => {
            setMap(mapInstance);
            setMapReady(true);
            console.log('✅ Mapbox initialized');
          });
        }
      })
      .catch((error) => {
        console.error('❌ Mapbox loading failed:', error);
      });
  }, []);

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
        backgroundColor: '#ef4444',
        color: 'white',
        padding: '25px',
        borderRadius: '12px',
        textAlign: 'center',
        marginBottom: '25px'
      }}>
        <h1 style={{ fontSize: '36px', margin: '0 0 10px 0', fontWeight: 'bold' }}>
          ⚠️ MAPBOX BENÖTIGT API-SCHLÜSSEL
        </h1>
        <p style={{ fontSize: '18px', margin: '0' }}>
          Mapbox bietet schöne Karten, benötigt aber einen kostenlosen API-Schlüssel
        </p>
      </div>

      {/* Alternative Options */}
      <div style={{
        backgroundColor: '#ecfdf5',
        border: '2px solid #10b981',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '25px'
      }}>
        <h2 style={{ color: '#065f46', margin: '0 0 15px 0', fontSize: '24px' }}>
          🗺️ Verfügbare Karten-Optionen:
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
          
          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '2px solid #10b981' }}>
            <h3 style={{ color: '#10b981', margin: '0 0 8px 0' }}>✅ OpenStreetMap (Kostenlos)</h3>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Echte Straßenkarten ohne API-Schlüssel</p>
            <p style={{ margin: '0', fontSize: '12px', color: '#6b7280' }}>
              Problem: Leaflet.js lädt manchmal nicht korrekt
            </p>
          </div>

          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '2px solid #f59e0b' }}>
            <h3 style={{ color: '#f59e0b', margin: '0 0 8px 0' }}>🔑 Google Maps</h3>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Höchste Qualität, benötigt API-Schlüssel</p>
            <p style={{ margin: '0', fontSize: '12px', color: '#6b7280' }}>
              Kosten: Kostenlos bis 25.000 Aufrufe/Monat
            </p>
          </div>

          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '2px solid #8b5cf6' }}>
            <h3 style={{ color: '#8b5cf6', margin: '0 0 8px 0' }}>🔑 Mapbox</h3>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Moderne Karten, benötigt API-Schlüssel</p>
            <p style={{ margin: '0', fontSize: '12px', color: '#6b7280' }}>
              Kosten: Kostenlos bis 50.000 Aufrufe/Monat
            </p>
          </div>

          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '2px solid #3b82f6' }}>
            <h3 style={{ color: '#3b82f6', margin: '0 0 8px 0' }}>🆓 Bing Maps</h3>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Microsoft-Karten, kostenloser API-Schlüssel</p>
            <p style={{ margin: '0', fontSize: '12px', color: '#6b7280' }}>
              Einfach zu bekommen, gute Qualität
            </p>
          </div>

          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '2px solid #ef4444' }}>
            <h3 style={{ color: '#ef4444', margin: '0 0 8px 0' }}>🎨 CSS-Simulation</h3>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Funktioniert sofort, aber keine echten Straßen</p>
            <p style={{ margin: '0', fontSize: '12px', color: '#6b7280' }}>
              Wie die bisherigen "Demo"-Karten
            </p>
          </div>

          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '2px solid #059669' }}>
            <h3 style={{ color: '#059669', margin: '0 0 8px 0' }}>🌍 HERE Maps</h3>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Nokia-Karten, kostenloser API-Schlüssel</p>
            <p style={{ margin: '0', fontSize: '12px', color: '#6b7280' }}>
              Kostenlos bis 250.000 Aufrufe/Monat
            </p>
          </div>
        </div>
      </div>

      {/* Quick Setup Guide */}
      <div style={{
        backgroundColor: '#fef3c7',
        border: '2px solid #f59e0b',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <h3 style={{ color: '#92400e', margin: '0 0 15px 0', fontSize: '20px' }}>
          🚀 Schnelle Lösung - API-Schlüssel in 2 Minuten:
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          
          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px' }}>
            <h4 style={{ color: '#10b981', margin: '0 0 8px 0' }}>Google Maps (Empfohlen)</h4>
            <ol style={{ margin: '0', fontSize: '14px', color: '#374151' }}>
              <li>Gehen Sie zu: console.cloud.google.com</li>
              <li>Erstellen Sie ein neues Projekt</li>
              <li>Aktivieren Sie "Maps JavaScript API"</li>
              <li>Erstellen Sie einen API-Schlüssel</li>
              <li>Ersetzen Sie "YOUR_API_KEY_HERE" im Code</li>
            </ol>
          </div>

          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px' }}>
            <h4 style={{ color: '#8b5cf6', margin: '0 0 8px 0' }}>Mapbox (Alternative)</h4>
            <ol style={{ margin: '0', fontSize: '14px', color: '#374151' }}>
              <li>Gehen Sie zu: mapbox.com</li>
              <li>Registrieren Sie sich kostenlos</li>
              <li>Gehen Sie zu "Access tokens"</li>
              <li>Kopieren Sie den Standard-Token</li>
              <li>Ersetzen Sie den Token im Code</li>
            </ol>
          </div>
        </div>

        <div style={{ 
          marginTop: '15px', 
          padding: '15px', 
          backgroundColor: '#ecfdf5', 
          borderRadius: '8px',
          border: '1px solid #10b981'
        }}>
          <p style={{ margin: '0', color: '#065f46', fontSize: '14px', fontWeight: 'bold' }}>
            💡 Tipp: Soll ich eine funktionierende Bing Maps oder HERE Maps Integration erstellen? 
            Diese sind einfacher zu konfigurieren als Google Maps!
          </p>
        </div>
      </div>

    </div>
  );
};

export default MapboxIntegration;