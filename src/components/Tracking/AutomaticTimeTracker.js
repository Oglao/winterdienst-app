import React, { useState, useEffect } from 'react';
import { Clock, Play, Square, Users, MapPin, Settings, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import automaticTimeTrackingService from '../../services/automaticTimeTracking';

const AutomaticTimeTracker = () => {
  const { currentUser } = useAuth();
  const [trackingStatus, setTrackingStatus] = useState(null);
  const [allSessions, setAllSessions] = useState({});
  const [settings, setSettings] = useState({
    autoStartEnabled: true,
    autoStopEnabled: true,
    notificationsEnabled: true,
    workingHoursStart: 5,
    workingHoursEnd: 22
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Initialize tracking status
    loadTrackingStatus();
    
    // Listen for work session changes
    const handleWorkSessionChange = (event) => {
      console.log('📋 Work session change detected:', event.detail);
      loadTrackingStatus();
      loadAllSessions();
    };

    window.addEventListener('workSessionChange', handleWorkSessionChange);
    
    // Refresh status every 30 seconds
    const interval = setInterval(loadTrackingStatus, 30000);

    return () => {
      window.removeEventListener('workSessionChange', handleWorkSessionChange);
      clearInterval(interval);
    };
  }, [currentUser]);

  const loadTrackingStatus = () => {
    if (!currentUser) return;
    
    const status = automaticTimeTrackingService.getTrackingStatus(currentUser.id);
    setTrackingStatus(status);
  };

  const loadAllSessions = () => {
    const sessions = automaticTimeTrackingService.getAllTrackingSessions();
    setAllSessions(sessions);
  };

  const startAutomaticTracking = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const result = await automaticTimeTrackingService.startAutomaticTracking(
        currentUser.id,
        {
          autoStartThreshold: 100,
          autoStopThreshold: 300,
          workingHoursStart: settings.workingHoursStart,
          workingHoursEnd: settings.workingHoursEnd
        }
      );

      if (result.success) {
        console.log('✅ Automatic tracking started');
        loadTrackingStatus();
      } else {
        console.error('❌ Failed to start tracking:', result.error);
      }
    } catch (error) {
      console.error('❌ Tracking start error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stopAutomaticTracking = () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const result = automaticTimeTrackingService.stopAutomaticTracking(currentUser.id);
      
      if (result.success) {
        console.log('✅ Automatic tracking stopped');
        setTrackingStatus(null);
      } else {
        console.error('❌ Failed to stop tracking:', result.error);
      }
    } catch (error) {
      console.error('❌ Tracking stop error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const manualStartWork = () => {
    if (!currentUser) return;
    
    const result = automaticTimeTrackingService.manualStartWork(currentUser.id);
    if (result.success) {
      console.log('✅ Work session started manually');
      loadTrackingStatus();
    }
  };

  const manualStopWork = () => {
    if (!currentUser) return;
    
    const result = automaticTimeTrackingService.manualStopWork(currentUser.id);
    if (result.success) {
      console.log('✅ Work session stopped manually');
      loadTrackingStatus();
    }
  };

  const formatTime = (milliseconds) => {
    if (!milliseconds) return '0min';
    
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}min`;
    }
    return `${minutes}min`;
  };

  const formatTimeOfDay = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!currentUser) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-600">Bitte loggen Sie sich ein, um das automatische Zeit-Tracking zu verwenden.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automatisches Zeit-Tracking</h1>
          <p className="text-gray-600">UBER-ähnliche automatische Zeiterfassung basierend auf GPS</p>
        </div>
        
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>

      {/* Current Status Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Aktueller Status</h2>
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            trackingStatus?.isTracking 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              trackingStatus?.isTracking ? 'bg-green-500' : 'bg-gray-500'
            }`} />
            <span>{trackingStatus?.isTracking ? 'Aktiv' : 'Inaktiv'}</span>
          </div>
        </div>

        {trackingStatus?.isTracking ? (
          <div className="space-y-4">
            {/* Tracking Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Session Zeit</span>
                </div>
                <p className="text-lg font-bold text-blue-900">
                  {trackingStatus.sessionStartTime 
                    ? formatTime(new Date() - new Date(trackingStatus.sessionStartTime))
                    : '0min'
                  }
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-900">Arbeitszeit</span>
                </div>
                <p className="text-lg font-bold text-green-900">
                  {formatTime(trackingStatus.totalWorkTime)}
                </p>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium text-yellow-900">Work Sessions</span>
                </div>
                <p className="text-lg font-bold text-yellow-900">
                  {trackingStatus.workSessionsCount || 0}
                </p>
              </div>
            </div>

            {/* Current Work Session */}
            {trackingStatus.isWorking && trackingStatus.currentWorkSession ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Play className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900">Aktive Arbeitssitzung</span>
                  </div>
                  <button
                    onClick={manualStopWork}
                    className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <Square className="h-4 w-4" />
                    <span>Stop</span>
                  </button>
                </div>
                <div className="text-sm text-green-800">
                  <p>Gestartet: {formatTimeOfDay(trackingStatus.currentWorkSession.startTime)}</p>
                  <p>Route: {trackingStatus.currentWorkSession.route || 'Automatisch erkannt'}</p>
                  <p>Grund: {trackingStatus.currentWorkSession.startReason}</p>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium text-yellow-900">Bereit für Arbeit</span>
                  </div>
                  <button
                    onClick={manualStartWork}
                    className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Play className="h-4 w-4" />
                    <span>Start</span>
                  </button>
                </div>
                <p className="text-sm text-yellow-800">
                  Tracking aktiv - Arbeitssitzung startet automatisch wenn Sie sich einer Arbeitszone nähern
                </p>
              </div>
            )}

            {/* Position Info */}
            {trackingStatus.lastPosition && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>
                    Position: {trackingStatus.lastPosition.latitude.toFixed(4)}, {trackingStatus.lastPosition.longitude.toFixed(4)}
                  </span>
                  <span className="mx-2">•</span>
                  <span>
                    Letzte Bewegung: {formatTimeOfDay(trackingStatus.lastMovement)}
                  </span>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex justify-center">
              <button
                onClick={stopAutomaticTracking}
                disabled={isLoading}
                className="flex items-center space-x-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <Square className="h-4 w-4" />
                <span>Automatisches Tracking beenden</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Automatisches Tracking starten</h3>
            <p className="text-gray-600 mb-6">
              Das System überwacht Ihre Position und startet/stoppt die Zeiterfassung automatisch 
              basierend auf Ihrer Nähe zu Arbeitszonen.
            </p>
            
            <button
              onClick={startAutomaticTracking}
              disabled={isLoading}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 mx-auto"
            >
              <Play className="h-5 w-5" />
              <span>Automatisches Tracking starten</span>
            </button>
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tracking Einstellungen</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Auto-Start bei Arbeitszone</span>
              <button
                onClick={() => setSettings({...settings, autoStartEnabled: !settings.autoStartEnabled})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.autoStartEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.autoStartEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Auto-Stop bei Verlassen</span>
              <button
                onClick={() => setSettings({...settings, autoStopEnabled: !settings.autoStopEnabled})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.autoStopEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.autoStopEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Arbeitszeit Start
                </label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={settings.workingHoursStart}
                  onChange={(e) => setSettings({...settings, workingHoursStart: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Arbeitszeit Ende
                </label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={settings.workingHoursEnd}
                  onChange={(e) => setSettings({...settings, workingHoursEnd: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Wie funktioniert automatisches Zeit-Tracking?</p>
            <ul className="space-y-1">
              <li>• Das System überwacht kontinuierlich Ihre GPS-Position</li>
              <li>• Arbeitssitzungen starten automatisch wenn Sie sich Arbeitszonen nähern (100m)</li>
              <li>• Sitzungen enden automatisch wenn Sie Arbeitszonen verlassen (300m) oder 15min inaktiv sind</li>
              <li>• Manuelle Kontrolle ist jederzeit möglich</li>
              <li>• Für Mitarbeiter ohne aktives Tracking wird die Zeit basierend auf Schichtplänen berechnet</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomaticTimeTracker;