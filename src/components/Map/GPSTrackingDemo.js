import React, { useState, useEffect } from 'react';
import { MapPin, Play, Square, Wifi, WifiOff } from 'lucide-react';
import liveTrackingService from '../../services/liveTrackingService';
import { logGPSError } from '../../utils/gpsErrorHandler';
import GPSTestHelper from './GPSTestHelper';

const GPSTrackingDemo = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [position, setPosition] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [gpsError, setGpsError] = useState(null);

  useEffect(() => {
    // Connect to live tracking service
    liveTrackingService.connect();

    // Listen for events
    liveTrackingService.on('connectionChange', (data) => {
      setIsConnected(data.connected);
      addLog(`Connection: ${data.connected ? 'Connected' : 'Disconnected'}`);
    });

    liveTrackingService.on('positionUpdate', (data) => {
      addLog(`Position Update: ${data.name || data.userId} at ${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`);
      setGpsError(null); // Clear any previous GPS errors
      
      if (data.isCurrentUser) {
        setPosition({
          latitude: data.latitude,
          longitude: data.longitude,
          timestamp: data.timestamp
        });
      }
      
      // Update workers list
      loadWorkers();
    });

    // Listen for GPS errors
    liveTrackingService.on('positionError', (error) => {
      setGpsError(error);
      addLog(`GPS Error: ${error.message}`);
    });

    return () => {
      liveTrackingService.disconnect();
    };
  }, []);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [{
      timestamp,
      message
    }, ...prev.slice(0, 9)]); // Keep last 10 logs
  };

  const loadWorkers = async () => {
    try {
      const positions = await liveTrackingService.getAllPositions();
      setWorkers(positions);
    } catch (error) {
      addLog(`Error loading workers: ${error.message}`);
    }
  };

  const startTracking = async () => {
    try {
      const result = await liveTrackingService.startTracking();
      if (result.success) {
        setIsTracking(true);
        addLog('GPS tracking started successfully');
      } else {
        addLog(`Failed to start tracking: ${result.error}`);
      }
    } catch (error) {
      addLog(`Tracking error: ${error.message}`);
    }
  };

  const stopTracking = async () => {
    try {
      const result = await liveTrackingService.stopTracking();
      if (result.success) {
        setIsTracking(false);
        addLog('GPS tracking stopped successfully');
      } else {
        addLog(`Failed to stop tracking: ${result.error}`);
      }
    } catch (error) {
      addLog(`Stop tracking error: ${error.message}`);
    }
  };

  const simulateMovement = async () => {
    // Simulate GPS position for testing
    const hamburgLat = 53.5511;
    const hamburgLng = 9.9937;
    
    // Add small random movement
    const lat = hamburgLat + (Math.random() - 0.5) * 0.01;
    const lng = hamburgLng + (Math.random() - 0.5) * 0.01;
    
    try {
      // Clear any GPS errors when simulating
      setGpsError(null);
      
      // Update local position immediately for testing
      const simulatedPosition = {
        latitude: lat,
        longitude: lng,
        timestamp: new Date()
      };
      setPosition(simulatedPosition);
      
      // Send to server
      await liveTrackingService.sendPositionToServer({
        latitude: lat,
        longitude: lng,
        accuracy: 10,
        speed: Math.random() * 50,
        heading: Math.random() * 360,
        timestamp: new Date()
      });
      
      addLog(`✅ Simulated position: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      addLog(`📡 Position sent to server successfully`);
    } catch (error) {
      addLog(`❌ Simulation error: ${error.message}`);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* GPS Test Helper */}
      <GPSTestHelper />
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <MapPin className="h-6 w-6 text-blue-600" />
          <span>GPS Tracking Demo</span>
        </h2>

        {/* Status Row */}
        <div className="flex items-center space-x-4 mb-6">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
            isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>

          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
            isTracking ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {isTracking ? <Play className="h-4 w-4" /> : <Square className="h-4 w-4" />}
            <span>{isTracking ? 'Tracking Active' : 'Tracking Stopped'}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex space-x-3 mb-6">
          <button
            onClick={isTracking ? stopTracking : startTracking}
            disabled={!isConnected}
            className={`px-4 py-2 rounded-lg font-medium ${
              isTracking 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-green-600 text-white hover:bg-green-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </button>

          <button
            onClick={simulateMovement}
            disabled={!isConnected}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Simulate Movement
          </button>

          <button
            onClick={loadWorkers}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Refresh Workers
          </button>
        </div>

        {/* GPS Error Display */}
        {gpsError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-red-900 mb-2">📍 GPS Error</h3>
            <div className="text-sm text-red-700">
              <p className="font-medium">{gpsError.userFriendlyMessage || gpsError.userMessage}</p>
              <p className="text-xs mt-1">Error Code: {gpsError.code}</p>
              {gpsError.recommendation && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-blue-800 text-xs">
                    ℹ️ <strong>Empfehlung:</strong> {gpsError.recommendation}
                  </p>
                </div>
              )}
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-yellow-800 text-xs">
                  💡 <strong>Tipp für Tests:</strong> Verwenden Sie die "Simulate Movement" Funktion zum Testen ohne echten GPS.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Current Position */}
        {position && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2">Current Position</h3>
            <div className="text-sm text-blue-700">
              <p>Latitude: {position.latitude}</p>
              <p>Longitude: {position.longitude}</p>
              <p>Updated: {new Date(position.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
        )}

        {/* Workers List */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Active Workers ({workers.length})</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {workers.map((worker, index) => (
              <div key={worker.user_id || index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{worker.name || 'Unknown'}</span>
                  <span className="text-sm text-gray-600 ml-2">
                    {worker.latitude?.toFixed(4)}, {worker.longitude?.toFixed(4)}
                  </span>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  worker.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {worker.status || 'offline'}
                </span>
              </div>
            ))}
            {workers.length === 0 && (
              <p className="text-gray-500 text-center py-4">No workers found</p>
            )}
          </div>
        </div>

        {/* Activity Log */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Activity Log</h3>
          <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm max-h-40 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="mb-1">
                <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-gray-500">No activity yet...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GPSTrackingDemo;