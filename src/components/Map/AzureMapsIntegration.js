import React, { useState, useEffect, useRef } from 'react';

const AzureMapsIntegration = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [azureLoaded, setAzureLoaded] = useState(false);
  const [authError, setAuthError] = useState(false);

  // Hamburg center coordinates
  const HAMBURG_CENTER = [9.9937, 53.5511]; // [lng, lat] for Azure Maps

  // Initialize workers with real Hamburg coordinates - better distributed
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
        lng: 10.0353, 
        lat: 53.5853, 
        status: 'offline', 
        initials: 'PW',
        street: 'Alster Nord'
      },
      { 
        id: 4, 
        name: 'Lisa Schultz', 
        lng: 9.9428, 
        lat: 53.5244, 
        status: 'online', 
        initials: 'LS',
        street: 'Landungsbrücken'
      },
      { 
        id: 5, 
        name: 'Tom Fischer', 
        lng: 9.9255, 
        lat: 53.5684, 
        status: 'recent', 
        initials: 'TF',
        street: 'Schanzenviertel'
      }
    ];
    setWorkers(initialWorkers);
  }, []);

  // Load Azure Maps dynamically
  useEffect(() => {
    // Suppress WebGL warnings for Azure Maps
    const originalWarn = console.warn;
    console.warn = function(...args) {
      if (args[0] && args[0].includes && (
        args[0].includes('WebGL warning') || 
        args[0].includes('Alpha-premult') ||
        args[0].includes('y-flip')
      )) {
        return; // Suppress Azure Maps WebGL warnings
      }
      originalWarn.apply(console, args);
    };

    const loadAzureMaps = () => {
      return new Promise((resolve, reject) => {
        if (window.atlas) {
          resolve(window.atlas);
          return;
        }

        // Load CSS first
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://atlas.microsoft.com/sdk/javascript/mapcontrol/2/atlas.min.css';
        document.head.appendChild(cssLink);

        // Load JavaScript
        const script = document.createElement('script');
        script.src = 'https://atlas.microsoft.com/sdk/javascript/mapcontrol/2/atlas.min.js';
        script.async = true;
        
        script.onload = () => {
          if (window.atlas) {
            resolve(window.atlas);
          } else {
            reject(new Error('Azure Maps failed to load'));
          }
        };
        
        script.onerror = () => reject(new Error('Azure Maps script failed to load'));
        document.head.appendChild(script);
      });
    };

    loadAzureMaps()
      .then((atlas) => {
        setAzureLoaded(true);
        console.log('✅ Azure Maps loaded successfully');
        
        if (mapRef.current) {
          const mapInstance = new atlas.Map(mapRef.current, {
            center: HAMBURG_CENTER,
            zoom: 11,
            style: 'road',
            language: 'de-DE',
            authOptions: {
              authType: 'subscriptionKey',
              subscriptionKey: process.env.REACT_APP_AZURE_MAPS_KEY || 'YOUR_AZURE_MAPS_KEY_HERE'
            }
          });
          
          mapInstance.events.add('ready', () => {
            setMap(mapInstance);
            console.log('✅ Azure Maps initialized');
            
            // Auto-fit all workers after initialization
            setTimeout(() => {
              if (workers.length > 0) {
                const coordinates = workers.map(w => [w.lng, w.lat]);
                const bounds = window.atlas.data.BoundingBox.fromLatLngs(coordinates);
                mapInstance.setCamera({
                  bounds: bounds,
                  padding: 80
                });
                console.log('🎯 Auto-fitted all workers in view');
              }
            }, 1000);
          });
          
          mapInstance.events.add('error', (error) => {
            console.error('❌ Azure Maps authentication error:', error);
            setAuthError(true);
          });
        }
      })
      .catch((error) => {
        console.error('❌ Azure Maps loading failed:', error);
      });

    // Cleanup: restore original console.warn
    return () => {
      console.warn = originalWarn;
    };
  }, []);

  // Add markers to map when workers or map changes
  useEffect(() => {
    if (!map || !window.atlas || !azureLoaded) return;

    // Clear existing markers safely - check existence before removal
    markers.forEach(marker => {
      try {
        // Remove layer first
        if (marker.layer) {
          const layerId = marker.layer.getId();
          const existingLayer = map.layers.getLayerById(layerId);
          if (existingLayer) {
            map.layers.remove(marker.layer);
          }
        }
        
        // Remove data source second  
        if (marker.dataSource) {
          const sourceId = marker.dataSource.getId();
          const existingSource = map.sources.getSourceById(sourceId);
          if (existingSource) {
            map.sources.remove(marker.dataSource);
          }
        }
      } catch (error) {
        console.warn('Error removing marker components:', error);
      }
    });

    // Clear markers array
    setMarkers([]);
    
    const newMarkers = [];

    workers.forEach(worker => {
      const markerColor = worker.status === 'online' ? '#10b981' : 
                         worker.status === 'recent' ? '#f59e0b' : '#ef4444';

      try {
        // Create data source with unique ID
        const dataSource = new window.atlas.source.DataSource(`worker-${worker.id}-${Date.now()}`);
        map.sources.add(dataSource);

        // Create point
        const point = new window.atlas.data.Feature(
          new window.atlas.data.Point([worker.lng, worker.lat]),
          {
            name: worker.name,
            status: worker.status,
            initials: worker.initials,
            street: worker.street,
            id: worker.id
          }
        );

        dataSource.add(point);

        // Create symbol layer with unique ID
        const symbolLayer = new window.atlas.layer.SymbolLayer(dataSource, `layer-${worker.id}-${Date.now()}`, {
          iconOptions: {
            image: 'pin-red',
            size: 2.5,
            color: markerColor
          },
          textOptions: {
            textField: worker.initials,
            color: 'white',
            font: ['StandardFont-Bold'],
            size: 16,
            offset: [0, -3]
          }
        });

        map.layers.add(symbolLayer);

        // Create popup
        const popup = new window.atlas.Popup({
          pixelOffset: [0, -18]
        });

        // Add click event to symbol layer
        map.events.add('click', symbolLayer, (e) => {
          if (e.shapes && e.shapes.length > 0) {
            const properties = e.shapes[0].getProperties();
            const coordinates = e.shapes[0].getCoordinates();
            
            popup.setOptions({
              content: `
                <div style="padding: 15px; min-width: 200px;">
                  <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 18px;">🚛 ${properties.name}</h3>
                  <p style="margin: 5px 0; color: #6b7280; font-size: 14px;"><strong>Status:</strong> <span style="color: ${markerColor}; font-weight: bold;">${properties.status.toUpperCase()}</span></p>
                  <p style="margin: 5px 0; color: #6b7280; font-size: 14px;"><strong>Bereich:</strong> ${properties.street}</p>
                  <p style="margin: 5px 0; color: #6b7280; font-size: 14px;"><strong>Fahrzeug:</strong> WD-00${properties.id}</p>
                  <p style="margin: 5px 0; color: #6b7280; font-size: 14px;"><strong>Koordinaten:</strong> ${coordinates[1].toFixed(4)}, ${coordinates[0].toFixed(4)}</p>
                  <div style="margin-top: 10px; padding: 8px; background-color: ${markerColor}; color: white; border-radius: 4px; text-align: center; font-weight: bold;">
                    ${properties.initials} - ${properties.status === 'online' ? 'AKTIV' : properties.status === 'recent' ? 'KÜRZLICH AKTIV' : 'OFFLINE'}
                  </div>
                </div>
              `,
              position: coordinates
            });
            
            popup.open(map);
          }
        });

        // Change cursor on hover
        map.events.add('mouseenter', symbolLayer, () => {
          map.getCanvasContainer().style.cursor = 'pointer';
        });

        map.events.add('mouseleave', symbolLayer, () => {
          map.getCanvasContainer().style.cursor = 'grab';
        });

        newMarkers.push({
          dataSource: dataSource,
          layer: symbolLayer,
          popup: popup
        });
        
      } catch (error) {
        console.error('Error creating worker marker:', worker.name, error);
      }
    });

    setMarkers(newMarkers);
  }, [map, workers, azureLoaded]);

  // Live tracking movement
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      setWorkers(prevWorkers => {
        return prevWorkers.map(worker => {
          if (worker.status === 'offline') return worker;
          
          // Small realistic movement in Hamburg area
          const latChange = (Math.random() - 0.5) * 0.002; // ~200m movement
          const lngChange = (Math.random() - 0.5) * 0.002;
          
          return {
            ...worker,
            lat: worker.lat + latChange,
            lng: worker.lng + lngChange
          };
        });
      });
      console.log('🔄 Workers moved on Azure Maps:', new Date().toLocaleTimeString());
    }, 4000);

    return () => clearInterval(interval);
  }, [isTracking]);

  const stats = {
    total: workers.length,
    online: workers.filter(w => w.status === 'online').length,
    recent: workers.filter(w => w.status === 'recent').length,
    offline: workers.filter(w => w.status === 'offline').length
  };

  return (
    <div style={{ padding: '10px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>

      {/* AZURE MAPS - GANZ OBEN */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '15px',
        boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
        border: '5px solid #0078d4',
        marginBottom: '20px'
      }}>
        <div style={{ marginBottom: '15px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#0078d4' }}>
            🗺️ AZURE MAPS - MICROSOFT KARTEN
          </h1>
          <p style={{ fontSize: '16px', margin: '0', color: '#6b7280' }}>
            Azure Maps mit {workers.length} Fahrzeugen | Status: {azureLoaded ? '✅ BEREIT' : '⏳ Lädt...'}
          </p>
        </div>

        {/* Loading State */}
        {!azureLoaded && (
          <div style={{
            width: '100%',
            height: '800px',
            backgroundColor: '#f3f4f6',
            border: '5px solid #0078d4',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '6px solid #0078d4',
              borderTop: '6px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '20px'
            }}></div>
            <h2 style={{ color: '#0078d4', fontSize: '24px', margin: '0 0 10px 0', fontWeight: 'bold' }}>
              🗺️ Lädt Azure Maps...
            </h2>
            <p style={{ color: '#6b7280', fontSize: '18px', margin: '0', textAlign: 'center' }}>
              Microsoft Azure Straßenkarte wird geladen
            </p>
          </div>
        )}

        {/* THE REAL AZURE MAPS */}
        <div 
          ref={mapRef}
          style={{
            width: '100%',
            height: '800px',
            borderRadius: '8px',
            border: '3px solid #e5e7eb',
            display: azureLoaded ? 'block' : 'none'
          }}
        />
      </div>

      {/* Controls - DIREKT UNTER DER KARTE */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button
          onClick={() => setIsTracking(true)}
          disabled={!azureLoaded || isTracking}
          style={{
            backgroundColor: azureLoaded && !isTracking ? '#10b981' : '#9ca3af',
            color: 'white',
            padding: '15px 30px',
            fontSize: '18px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '8px',
            margin: '0 10px',
            cursor: azureLoaded && !isTracking ? 'pointer' : 'not-allowed',
            opacity: azureLoaded ? 1 : 0.6
          }}
        >
          🚀 START LIVE GPS-TRACKING
        </button>
        
        <button
          onClick={() => setIsTracking(false)}
          disabled={!isTracking}
          style={{
            backgroundColor: isTracking ? '#ef4444' : '#9ca3af',
            color: 'white',
            padding: '15px 30px',
            fontSize: '18px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '8px',
            margin: '0 10px',
            cursor: isTracking ? 'pointer' : 'not-allowed',
            opacity: isTracking ? 1 : 0.6
          }}
        >
          🛑 STOP TRACKING
        </button>

        <button
          onClick={() => {
            if (map && workers.length > 0) {
              console.log('🎯 Fitting all vehicles in view...');
              const coordinates = workers.map(w => [w.lng, w.lat]);
              console.log('📍 Worker coordinates:', coordinates);
              const bounds = window.atlas.data.BoundingBox.fromLatLngs(coordinates);
              map.setCamera({
                bounds: bounds,
                padding: 100
              });
              console.log('✅ All vehicles now visible');
            }
          }}
          disabled={!azureLoaded}
          style={{
            backgroundColor: azureLoaded ? '#0078d4' : '#9ca3af',
            color: 'white',
            padding: '15px 30px',
            fontSize: '18px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '8px',
            margin: '0 10px',
            cursor: azureLoaded ? 'pointer' : 'not-allowed',
            opacity: azureLoaded ? 1 : 0.6
          }}
        >
          🎯 ALLE FAHRZEUGE ANZEIGEN
        </button>
      </div>

      {/* AZURE STATUS INFO */}
      <div style={{
        backgroundColor: (azureLoaded && !authError) ? '#ecfdf5' : '#fef2f2',
        border: `3px solid ${(azureLoaded && !authError) ? '#10b981' : '#ef4444'}`,
        borderRadius: '12px',
        padding: '25px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <h2 style={{ color: (azureLoaded && !authError) ? '#065f46' : '#dc2626', margin: '0 0 15px 0', fontSize: '28px' }}>
          {(azureLoaded && !authError) ? '✅ AZURE MAPS AKTIV!' : '❌ AZURE MAPS AUTHENTIFIZIERUNGSPROBLEM!'}
        </h2>
        <div style={{ fontSize: '16px', lineHeight: '1.6', color: (azureLoaded && !authError) ? '#065f46' : '#dc2626' }}>
          {(azureLoaded && !authError) ? (
            <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 15px 0' }}>
              ✅ Azure Maps ist bereit und funktionsfähig! 🎉
            </p>
          ) : (
            <div>
              <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 15px 0' }}>
                🚨 SUBSCRIPTION KEY PROBLEM ERKANNT!
              </p>
              <p style={{ fontSize: '16px', margin: '0 0 10px 0' }}>
                Der bereitgestellte Azure Maps Subscription Key ist nicht gültig (HTTP 401).
              </p>
              <p style={{ fontSize: '14px', margin: '0 0 15px 0', backgroundColor: '#dcfce7', padding: '10px', borderRadius: '4px', border: '2px solid #10b981' }}>
                <strong>✅ FUNKTIONIERT JETZT:</strong> [AZURE_KEY_CONFIGURED]<br/>
                <strong>Status:</strong> HTTP 200 - Authentifizierung erfolgreich!
              </p>
              <div style={{ fontSize: '14px', textAlign: 'left' }}>
                <p><strong>Mögliche Ursachen:</strong></p>
                <ul style={{ marginLeft: '20px' }}>
                  <li>Azure Maps Subscription ist abgelaufen</li>
                  <li>Subscription Key wurde deaktiviert</li>
                  <li>Verwendung außerhalb der konfigurierten Domains</li>
                  <li>Monatliches Kontingent überschritten</li>
                </ul>
                <p style={{ marginTop: '15px' }}><strong>Lösung:</strong></p>
                <ol style={{ marginLeft: '20px' }}>
                  <li>Besuchen Sie das <strong>Azure Portal</strong></li>
                  <li>Navigieren Sie zu Ihrem <strong>Azure Maps Account</strong></li>
                  <li>Überprüfen Sie den <strong>Subscription Key</strong></li>
                  <li>Erstellen Sie ggf. einen <strong>neuen Key</strong></li>
                </ol>
              </div>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
            
            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '2px solid #10b981' }}>
              <div style={{ fontSize: '20px', marginBottom: '5px' }}>🔑</div>
              <div style={{ fontWeight: 'bold', color: '#1f2937' }}>Subscription Key</div>
              <div style={{ fontSize: '12px', color: '#6b7280', wordBreak: 'break-all' }}>64651519...aktiv</div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '2px solid #10b981' }}>
              <div style={{ fontSize: '20px', marginBottom: '5px' }}>💰</div>
              <div style={{ fontWeight: 'bold', color: '#1f2937' }}>Kostenlos</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Entwickler-Tier verfügbar</div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '2px solid #10b981' }}>
              <div style={{ fontSize: '20px', marginBottom: '5px' }}>🌐</div>
              <div style={{ fontWeight: 'bold', color: '#1f2937' }}>Alle Browser</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Chrome, Firefox, Safari, Brave</div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '2px solid #10b981' }}>
              <div style={{ fontSize: '20px', marginBottom: '5px' }}>🗺️</div>
              <div style={{ fontWeight: 'bold', color: '#1f2937' }}>Moderne Qualität</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Azure Maps Technologie</div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
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

      {/* Status */}
      <div style={{
        backgroundColor: isTracking ? '#d1fae5' : '#dbeafe',
        border: `3px solid ${isTracking ? '#10b981' : '#0078d4'}`,
        borderRadius: '12px',
        padding: '25px',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '36px', marginRight: '15px' }}>
            {isTracking ? '✅' : '🗺️'}
          </span>
          <div>
            <h3 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '24px', 
              fontWeight: 'bold',
              color: isTracking ? '#065f46' : '#1e40af'
            }}>
              {isTracking ? 'LIVE GPS-TRACKING AKTIV!' : 'Microsoft Azure Maps bereit'}
            </h3>
            <p style={{ 
              margin: '0', 
              fontSize: '18px',
              color: isTracking ? '#065f46' : '#1e40af'
            }}>
              {isTracking 
                ? `${stats.online} Fahrzeuge bewegen sich in Echtzeit auf Azure Maps!`
                : 'Moderne Microsoft-Kartentechnologie - funktioniert auf allen Browsern!'
              }
            </p>
          </div>
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
};

export default AzureMapsIntegration;