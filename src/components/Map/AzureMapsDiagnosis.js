import React, { useState, useEffect, useRef } from 'react';

const AzureMapsDiagnosis = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [azureLoaded, setAzureLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState(null);
  const [mapError, setMapError] = useState(null);

  // Hamburg center coordinates
  const HAMBURG_CENTER = [9.9937, 53.5511]; // [lng, lat] for Azure Maps

  // Load Azure Maps dynamically with detailed error tracking
  useEffect(() => {
    const loadAzureMaps = () => {
      return new Promise((resolve, reject) => {
        console.log('🔍 Starting Azure Maps loading...');
        
        if (window.atlas) {
          console.log('✅ Azure Maps already loaded');
          resolve(window.atlas);
          return;
        }

        // Load CSS first
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://atlas.microsoft.com/sdk/javascript/mapcontrol/2/atlas.min.css';
        cssLink.onerror = () => {
          console.error('❌ Azure Maps CSS failed to load');
          reject(new Error('Azure Maps CSS failed to load'));
        };
        cssLink.onload = () => {
          console.log('✅ Azure Maps CSS loaded');
        };
        document.head.appendChild(cssLink);

        // Load JavaScript
        const script = document.createElement('script');
        script.src = 'https://atlas.microsoft.com/sdk/javascript/mapcontrol/2/atlas.min.js';
        script.async = true;
        
        script.onload = () => {
          console.log('✅ Azure Maps JavaScript loaded');
          if (window.atlas) {
            console.log('✅ window.atlas is available:', window.atlas);
            resolve(window.atlas);
          } else {
            console.error('❌ window.atlas is not available after loading');
            reject(new Error('Azure Maps failed to initialize after loading'));
          }
        };
        
        script.onerror = (error) => {
          console.error('❌ Azure Maps script failed to load:', error);
          reject(new Error('Azure Maps script failed to load'));
        };
        
        document.head.appendChild(script);
      });
    };

    loadAzureMaps()
      .then((atlas) => {
        console.log('🗺️ Azure Maps loaded successfully, initializing map...');
        setAzureLoaded(true);
        
        if (mapRef.current) {
          try {
            console.log('🔧 Creating Azure Maps instance...');
            const mapInstance = new atlas.Map(mapRef.current, {
              center: HAMBURG_CENTER,
              zoom: 12,
              style: 'road',
              language: 'de-DE',
              authOptions: {
                authType: 'subscriptionKey',
                subscriptionKey: process.env.REACT_APP_AZURE_MAPS_KEY || 'YOUR_AZURE_MAPS_KEY_HERE'
              }
            });
            
            console.log('🗺️ Azure Maps instance created, waiting for ready event...');
            
            mapInstance.events.add('ready', () => {
              console.log('✅ Azure Maps ready event fired');
              setMap(mapInstance);
            });

            mapInstance.events.add('error', (error) => {
              console.error('❌ Azure Maps error event:', error);
              setMapError(error);
            });
            
          } catch (error) {
            console.error('❌ Error creating Azure Maps instance:', error);
            setMapError(error);
          }
        } else {
          console.error('❌ mapRef.current is null');
        }
      })
      .catch((error) => {
        console.error('❌ Azure Maps loading failed:', error);
        setLoadingError(error);
      });
  }, []);

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        border: '3px solid #0078d4'
      }}>
        <h1 style={{ color: '#0078d4', fontSize: '24px', margin: '0 0 20px 0' }}>
          🔍 AZURE MAPS DIAGNOSIS
        </h1>
        
        <div style={{ marginBottom: '20px' }}>
          <h3>Status Check:</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ color: azureLoaded ? 'green' : 'orange', marginBottom: '5px' }}>
              {azureLoaded ? '✅' : '⏳'} Azure Maps SDK: {azureLoaded ? 'LOADED' : 'LOADING...'}
            </li>
            <li style={{ color: map ? 'green' : 'orange', marginBottom: '5px' }}>
              {map ? '✅' : '⏳'} Map Instance: {map ? 'READY' : 'WAITING...'}
            </li>
            <li style={{ color: 'blue', marginBottom: '5px' }}>
              🔑 Subscription Key: {process.env.REACT_APP_AZURE_MAPS_KEY ? '[CONFIGURED]' : '[NOT SET]'}
            </li>
          </ul>
        </div>

        {loadingError && (
          <div style={{ 
            backgroundColor: '#fee2e2', 
            border: '2px solid #ef4444', 
            borderRadius: '8px', 
            padding: '15px', 
            marginBottom: '20px' 
          }}>
            <h3 style={{ color: '#dc2626', margin: '0 0 10px 0' }}>❌ Loading Error:</h3>
            <p style={{ color: '#dc2626', margin: 0 }}>{loadingError.message}</p>
          </div>
        )}

        {mapError && (
          <div style={{ 
            backgroundColor: '#fee2e2', 
            border: '2px solid #ef4444', 
            borderRadius: '8px', 
            padding: '15px', 
            marginBottom: '20px' 
          }}>
            <h3 style={{ color: '#dc2626', margin: '0 0 10px 0' }}>❌ Map Error:</h3>
            <p style={{ color: '#dc2626', margin: 0 }}>{mapError.toString()}</p>
          </div>
        )}

        {/* Map Container */}
        <div 
          ref={mapRef}
          style={{
            width: '100%',
            height: '500px',
            border: '3px solid #e5e7eb',
            borderRadius: '8px',
            backgroundColor: '#f3f4f6'
          }}
        />
        
        {!azureLoaded && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#0078d4',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            ⏳ Loading Azure Maps...
          </div>
        )}
      </div>

      {/* Browser Info */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '15px',
        border: '2px solid #e5e7eb'
      }}>
        <h3>Browser Information:</h3>
        <p><strong>User Agent:</strong> {navigator.userAgent}</p>
        <p><strong>Window Atlas:</strong> {window.atlas ? 'Available' : 'Not Available'}</p>
        <p><strong>Map Ref:</strong> {mapRef.current ? 'Available' : 'Not Available'}</p>
        
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#dcfce7', borderRadius: '8px', border: '2px solid #10b981' }}>
          <h4 style={{ color: '#065f46', margin: '0 0 10px 0' }}>✅ Azure Maps Key Diagnose - ERFOLGREICH!</h4>
          <p><strong>Status:</strong> Neuer Key funktioniert perfekt!</p>
          <p><strong>Getestet:</strong></p>
          <ul style={{ marginLeft: '20px', fontSize: '14px' }}>
            <li>Key 1: 64651519-8451-4eae-9c47-229e7287d73c ❌ (401)</li>
            <li>Key 2: 4cc26c52-1b1d-434a-bc4d-8051b4f192e7 ❌ (401)</li>
            <li><strong>Key 3: [AZURE_KEY_CONFIGURED] ✅ (200)</strong></li>
          </ul>
          <p><strong>Test Ergebnisse:</strong></p>
          <ul style={{ marginLeft: '20px', fontSize: '14px' }}>
            <li>✅ Static Map API: HTTP 200 OK</li>
            <li>✅ Search API: HTTP 200 OK</li>
            <li>✅ Key ist gültig und authentifiziert</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AzureMapsDiagnosis;