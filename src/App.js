import React, { useState, useEffect } from 'react';
import FilteredDashboard from './components/Dashboard/FilteredDashboard';
import EnhancedDashboard from './components/Dashboard/EnhancedDashboard';
import RouteList from './components/Routes/RouteList';
import TimeTracker from './components/Tracking/TimeTracker';
import AutomaticTimeTracker from './components/Tracking/AutomaticTimeTracker';
import InactiveWorkerTimeCalculator from './components/Admin/InactiveWorkerTimeCalculator';
import UserManagement from './components/Admin/UserManagement';
import FilteredPhotoGallery from './components/Common/FilteredPhotoGallery';
import InteractiveMap from './components/Map/InteractiveMap';
import SimpleMap from './components/Map/SimpleMap';
import LiveMap from './components/Map/LiveMap';
import LiveMapFixed from './components/Map/LiveMapFixed';
import RealMapDesign from './components/Map/RealMapDesign';
import GoogleMapIntegration from './components/Map/GoogleMapIntegration';
import OpenStreetMapIntegration from './components/Map/OpenStreetMapIntegration';
import FixedOpenStreetMap from './components/Map/FixedOpenStreetMap';
import RealOpenStreetMap from './components/Map/RealOpenStreetMap';
import UltraSimpleMap from './components/Map/UltraSimpleMap';
import BasicDiagnosis from './components/Map/BasicDiagnosis';
import BraveCompatibleMap from './components/Map/BraveCompatibleMap';
import GoogleMapsReady from './components/Map/GoogleMapsReady';
import SimpleBingMaps from './components/Map/SimpleBingMaps';
import AzureMapsIntegration from './components/Map/AzureMapsIntegration';
import AzureMapsDiagnosis from './components/Map/AzureMapsDiagnosis';
import BingMapsIntegration from './components/Map/BingMapsIntegration';
import HereMapsIntegration from './components/Map/HereMapsIntegration';
import MapboxIntegration from './components/Map/MapboxIntegration';
import GPSTrackingDemo from './components/Map/GPSTrackingDemo';
import Navigation from './components/Common/Navigation';
import EmergencyNavigation from './components/Common/EmergencyNavigation';
import Header from './components/Common/Header';
import Login from './components/Auth/Login';
// Management Features
import VehicleList from './components/Vehicles/VehicleList';
import SaltTracker from './components/Management/SaltTracker';
import CustomerPortal from './components/Management/CustomerPortal';
import PerformanceDashboard from './components/Analytics/PerformanceDashboard';
import WeatherDashboard from './components/Weather/WeatherDashboard';
// Neue Features
import QRCodeScanner from './components/Scanning/QRCodeScanner';
import VoiceRecorder from './components/Audio/VoiceRecorder';
import BarcodeScanner from './components/Scanning/BarcodeScanner';
import AIWeatherPredictor from './components/Weather/AIWeatherPredictor';
import AutoRouteOptimizer from './components/Routes/AutoRouteOptimizer';
// Context
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import emergencyMode from './utils/emergencyMode';
import debugLogger from './utils/debugLogger';
import './index.css';

const AppContent = () => {
  const { isAuthenticated, currentUser, initAuth, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Initialize Auth and Emergency Mode Check
  useEffect(() => {
    debugLogger.log('APP', 'Starting Winterdienst App...');
    
    // Initialize authentication
    initAuth();
    
    if (emergencyMode.isEnabled()) {
      debugLogger.warn('APP', '🚨 Emergency Mode is ACTIVE');
      console.log('%c🚨 EMERGENCY MODE ACTIVE 🚨', 'color: red; font-size: 20px; font-weight: bold;');
      console.log('Safe mode with minimal features enabled.');
    }
  }, []); // Empty dependency array - only run once on mount

  const [currentPosition, setCurrentPosition] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [workTime, setWorkTime] = useState(0);
  const [useSimpleMap, setUseSimpleMap] = useState(false);
  const [photos, setPhotos] = useState([
    {
      id: 1,
      timestamp: '14.07.2025, 08:30',
      worker: 'Max Müller',
      route: 'Hauptstraße Nord',
      location: { lat: 53.6, lng: 9.9 },
      description: 'Straße erfolgreich geräumt',
      filename: 'route1_001.jpg'
    },
    {
      id: 2,
      timestamp: '14.07.2025, 09:15',
      worker: 'Anna Schmidt',
      route: 'Industriegebiet Süd',
      location: { lat: 53.58, lng: 9.95 },
      description: 'Salzstreuer in Aktion',
      filename: 'route2_001.jpg'
    },
    {
      id: 3,
      timestamp: '14.07.2025, 07:45',
      worker: 'Peter Wagner',
      route: 'Wohngebiet West',
      location: { lat: 53.55, lng: 9.88 },
      description: 'Vor/Nach Vergleich Gehweg',
      filename: 'route3_001.jpg'
    },
    {
      id: 4,
      timestamp: '14.07.2025, 10:00',
      worker: 'Max Müller',
      route: 'Hauptstraße Nord',
      location: { lat: 53.61, lng: 9.91 },
      description: 'Abschluss der Route dokumentiert',
      filename: 'route1_002.jpg'
    },
    {
      id: 5,
      timestamp: '14.07.2025, 11:30',
      worker: 'Anna Schmidt',
      route: 'Industriegebiet Süd',
      location: { lat: 53.57, lng: 9.96 },
      description: 'Salz nachgefüllt - Fortsetzung',
      filename: 'route2_002.jpg'
    }
  ]);
  
  const [routes, setRoutes] = useState([
    {
      id: 1,
      name: 'Hauptstraße Nord',
      status: 'geplant',
      startTime: '06:00',
      estimatedDuration: '2h 30min',
      priority: 'hoch',
      assignedWorker: 'Max Müller',
      coordinates: [
        { lat: 53.6, lng: 9.9 },
        { lat: 53.61, lng: 9.91 },
        { lat: 53.62, lng: 9.92 }
      ]
    },
    {
      id: 2,
      name: 'Industriegebiet Süd',
      status: 'in_arbeit',
      startTime: '07:00',
      estimatedDuration: '3h 15min',
      priority: 'mittel',
      assignedWorker: 'Anna Schmidt',
      coordinates: [
        { lat: 53.58, lng: 9.95 },
        { lat: 53.57, lng: 9.96 },
        { lat: 53.56, lng: 9.97 }
      ]
    },
    {
      id: 3,
      name: 'Wohngebiet West',
      status: 'abgeschlossen',
      startTime: '05:30',
      estimatedDuration: '1h 45min',
      priority: 'niedrig',
      assignedWorker: 'Peter Wagner',
      coordinates: [
        { lat: 53.55, lng: 9.88 },
        { lat: 53.54, lng: 9.87 },
        { lat: 53.53, lng: 9.86 }
      ]
    }
  ]);
  
  const [workers, setWorkers] = useState([
    {
      id: 1,
      name: 'Max Müller',
      position: { lat: 53.6, lng: 9.9 },
      status: 'aktiv',
      currentRoute: 'Hauptstraße Nord',
      workTime: '2h 15min',
      lastUpdate: '10:30'
    },
    {
      id: 2,
      name: 'Anna Schmidt',
      position: { lat: 53.58, lng: 9.95 },
      status: 'aktiv',
      currentRoute: 'Industriegebiet Süd',
      workTime: '3h 45min',
      lastUpdate: '10:28'
    },
    {
      id: 3,
      name: 'Peter Wagner',
      position: { lat: 53.55, lng: 9.88 },
      status: 'pause',
      currentRoute: 'Wohngebiet West',
      workTime: '1h 30min',
      lastUpdate: '10:25'
    }
  ]);

  const [workLog, setWorkLog] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  
  // Neue Features State
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [qrScannerType, setQrScannerType] = useState('route');
  const [voiceNotes, setVoiceNotes] = useState([]);
  const [materialScans, setMaterialScans] = useState([]);

  // Auth already initialized at component start

  // GPS-Verfolgung und Position-Updates
  useEffect(() => {
    if (isTracking) {
      // Start GPS tracking
      if (navigator.geolocation) {
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const newPosition = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date().toLocaleString('de-DE')
            };
            setCurrentPosition(newPosition);
            console.log('📍 GPS Position updated:', newPosition);
          },
          (error) => {
            console.error('❌ GPS Error:', error);
            // Fallback zu simulierter Position für Demo
            const simulatedPosition = {
              lat: 53.5511 + (Math.random() - 0.5) * 0.01,
              lng: 9.9937 + (Math.random() - 0.5) * 0.01,
              accuracy: 10,
              timestamp: new Date().toLocaleString('de-DE'),
              simulated: true
            };
            setCurrentPosition(simulatedPosition);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        );

        // Work time tracking
        const timeInterval = setInterval(() => {
          setWorkTime(prev => prev + 1);
        }, 1000);

        return () => {
          navigator.geolocation.clearWatch(watchId);
          clearInterval(timeInterval);
        };
      } else {
        console.warn('⚠️ GPS not supported, using simulated data');
        // Simulierte GPS-Daten für Demo
        const interval = setInterval(() => {
          setWorkTime(prev => prev + 1);
          const simulatedPosition = {
            lat: 53.5511 + (Math.random() - 0.5) * 0.01,
            lng: 9.9937 + (Math.random() - 0.5) * 0.01,
            accuracy: 10,
            timestamp: new Date().toLocaleString('de-DE'),
            simulated: true
          };
          setCurrentPosition(simulatedPosition);
        }, 5000);
        
        return () => clearInterval(interval);
      }
    }
  }, [isTracking]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePhotoCapture = () => {
    const newPhoto = {
      id: Date.now(),
      timestamp: new Date().toLocaleString('de-DE'),
      worker: currentUser?.name || 'Aktueller Nutzer',
      route: 'Aktuelle Route',
      location: currentPosition || { lat: 53.6, lng: 9.9 },
      description: 'Arbeitsfortschritt dokumentiert',
      filename: `photo_${Date.now()}.jpg`
    };
    setPhotos([...photos, newPhoto]);
    
    const logEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleString('de-DE'),
      action: 'Foto aufgenommen',
      location: 'Aktuelle Position',
      worker: currentUser?.name || 'Aktueller Nutzer'
    };
    setWorkLog([...workLog, logEntry]);
  };

  const updateRouteStatus = (routeId, newStatus) => {
    setRoutes(routes.map(route => 
      route.id === routeId ? { ...route, status: newStatus } : route
    ));
  };

  // Neue Features Handler
  const handleQRScan = (scanData) => {
    console.log('QR-Code gescannt:', scanData);
    const logEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleString('de-DE'),
      action: `${scanData.scannedType} QR-Code gescannt`,
      location: scanData.raw,
      worker: currentUser?.name || 'Aktueller Nutzer'
    };
    setWorkLog([...workLog, logEntry]);
    setShowQRScanner(false);
  };

  const handleVoiceSave = (audioData) => {
    console.log('Sprachnotiz gespeichert:', audioData);
    const newVoiceNote = {
      ...audioData,
      id: Date.now(),
      worker: currentUser?.name || 'Aktueller Nutzer'
    };
    setVoiceNotes([...voiceNotes, newVoiceNote]);
    
    const logEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleString('de-DE'),
      action: 'Sprachnotiz aufgenommen',
      location: `${Math.round(audioData.duration)}s Aufnahme`,
      worker: currentUser?.name || 'Aktueller Nutzer'
    };
    setWorkLog([...workLog, logEntry]);
    setShowVoiceRecorder(false);
  };

  const handleBarcodeScan = (scanData) => {
    console.log('Barcode gescannt:', scanData);
    setMaterialScans([...materialScans, scanData]);
    
    const logEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleString('de-DE'),
      action: `Material erfasst: ${scanData.material?.name || 'Unbekannt'}`,
      location: `${scanData.quantity} x ${scanData.material?.unit || 'Stück'}`,
      worker: currentUser?.name || 'Aktueller Nutzer'
    };
    setWorkLog([...workLog, logEntry]);
    setShowBarcodeScanner(false);
  };

  const openQRScanner = (type) => {
    setQrScannerType(type);
    setShowQRScanner(true);
  };

  const appState = {
    activeTab,
    setActiveTab,
    routes,
    setRoutes,
    workers,
    setWorkers,
    workLog,
    setWorkLog,
    photos,
    setPhotos,
    currentPosition,
    setCurrentPosition,
    isTracking,
    setIsTracking,
    workTime,
    setWorkTime,
    selectedWorker,
    setSelectedWorker,
    formatTime,
    handlePhotoCapture,
    updateRouteStatus,
    useSimpleMap,
    setUseSimpleMap,
    // Neue Features
    voiceNotes,
    setVoiceNotes,
    materialScans,
    setMaterialScans,
    openQRScanner,
    setShowVoiceRecorder,
    setShowBarcodeScanner
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard':
        return <EnhancedDashboard />;
      case 'routes':
        return <RouteList />;
      case 'tracking':
        return <TimeTracker />;
      case 'auto-tracking':
        return <AutomaticTimeTracker />;
      case 'time-calculation':
        return <InactiveWorkerTimeCalculator />;
      case 'user-management':
        return <UserManagement />;
      case 'photos':
        return <FilteredPhotoGallery photos={photos} />;
      case 'vehicles':
        return <VehicleList />;
      case 'materials':
        return <SaltTracker />;
      case 'weather':
        return <WeatherDashboard />;
      case 'customers':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Kundenportal</h2>
            <CustomerPortal customerId="demo-customer-id" />
          </div>
        );
      case 'invoices':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Rechnungsverwaltung</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600">Rechnungsübersicht wird geladen...</p>
              <p className="text-sm text-gray-500 mt-2">
                Automatische Rechnungsstellung aus Arbeitssitzungen
              </p>
            </div>
          </div>
        );
      case 'analytics':
        return <PerformanceDashboard />;
      case 'ai-weather':
        return <AIWeatherPredictor />;
      case 'route-optimizer':
        return <AutoRouteOptimizer routes={routes} vehicles={[]} workers={workers} />;
      case 'live-tracking':
        console.log('🚨 RENDERING BRAVE COMPATIBLE MAP');
        return <BraveCompatibleMap />;
      case 'basic-diagnosis':
        return <BasicDiagnosis />;
      case 'ultra-simple':
        return <UltraSimpleMap />;
      case 'fixed-openstreetmap':
        return <RealOpenStreetMap />;
      case 'openstreetmap-problem':
        return <OpenStreetMapIntegration />;
      case 'google-maps':
        return <GoogleMapsReady />;
      case 'google-maps-old':
        return <GoogleMapIntegration />;
      case 'bing-maps':
        return <AzureMapsIntegration />;
      case 'azure-diagnosis':
        return <AzureMapsDiagnosis />;
      case 'simple-bing':
        return <SimpleBingMaps />;
      case 'bing-maps-old':
        return <BingMapsIntegration />;
      case 'here-maps':
        return <HereMapsIntegration />;
      case 'mapbox':
        return <MapboxIntegration />;
      case 'real-map':
        return <RealMapDesign />;
      case 'live-map':
        return <LiveMap />;
      case 'live-map-fixed':
        return <LiveMapFixed />;
      case 'gps-demo':
        return <GPSTrackingDemo />;
      case 'map':
        return (
          <div className="space-y-4">
            {/* Map Toggle */}
            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-bold text-gray-900">Karten-Ansicht</h2>
              <div className="flex items-center space-x-3">
                <label className="text-sm font-medium text-gray-700">
                  Einfache Karte verwenden:
                </label>
                <button
                  onClick={() => setUseSimpleMap(!useSimpleMap)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    useSimpleMap ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      useSimpleMap ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
            
            {/* Map Component */}
            {useSimpleMap || emergencyMode.isEnabled() ? (
              <SimpleMap workers={workers} routes={routes} />
            ) : (
              <InteractiveMap workers={workers} routes={routes} />
            )}
          </div>
        );
      case 'protocol':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Arbeitsprotokoll</h2>
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Aktivitäten</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {workLog.map(entry => (
                  <div key={entry.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{entry.action}</p>
                        <p className="text-sm text-gray-500">{entry.location}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{entry.worker}</p>
                        <p className="text-xs text-gray-500">{entry.timestamp}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {workLog.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    Keine Protokoll-Einträge vorhanden
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      default:
        return <FilteredDashboard />;
    }
  };

  // Loading-Screen während Authentication-Check
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Winterdienst Manager...</p>
        </div>
      </div>
    );
  }

  // Login-Screen anzeigen wenn nicht authentifiziert
  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <AppProvider value={appState}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex space-x-8">
            {emergencyMode.isEnabled() ? (
              <EmergencyNavigation 
                activeTab={activeTab} 
                onTabChange={setActiveTab}
              />
            ) : (
              <Navigation />
            )}
            <div className="flex-1">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Neue Features Modals */}
      {showQRScanner && (
        <QRCodeScanner
          type={qrScannerType}
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}

      {showVoiceRecorder && (
        <VoiceRecorder
          onSave={handleVoiceSave}
          onClose={() => setShowVoiceRecorder(false)}
        />
      )}

      {showBarcodeScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}
    </AppProvider>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;