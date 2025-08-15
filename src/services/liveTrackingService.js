// Live Tracking Service - UBER-ähnliches GPS Tracking

import io from 'socket.io-client';
import { createGPSErrorHandler, getFallbackPosition } from '../utils/gpsErrorHandler';

class LiveTrackingService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.watchId = null;
    this.trackingInterval = null;
    this.lastPosition = null;
    this.callbacks = {
      positionUpdate: [],
      trackingStarted: [],
      trackingStopped: [],
      connectionChange: [],
      positionError: []
    };
    
    // Tracking settings
    this.trackingEnabled = false;
    this.updateInterval = 5000; // 5 seconds
    this.minMovementDistance = 10; // meters
    this.highAccuracyMode = true;
  }

  /**
   * Initialize Socket.IO connection
   */
  connect() {
    if (this.socket) {
      this.socket.disconnect();
    }

    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    
    this.socket = io(socketUrl, {
      autoConnect: true,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('🔗 Live tracking connected');
      this.isConnected = true;
      this.notifyCallbacks('connectionChange', { connected: true });
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Live tracking disconnected');
      this.isConnected = false;
      this.notifyCallbacks('connectionChange', { connected: false });
    });

    // Listen for position updates from other workers
    this.socket.on('position-update', (data) => {
      console.log('📍 Position update received:', data);
      this.notifyCallbacks('positionUpdate', data);
    });

    this.socket.on('tracking-started', (data) => {
      console.log('🚀 Tracking started:', data);
      this.notifyCallbacks('trackingStarted', data);
    });

    this.socket.on('tracking-stopped', (data) => {
      console.log('🛑 Tracking stopped:', data);
      this.notifyCallbacks('trackingStopped', data);
    });

    return this.socket;
  }

  /**
   * Disconnect from socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
  }

  /**
   * Start GPS tracking for current user
   */
  async startTracking(routeId = null, vehicleId = null) {
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      // Start tracking session on server
      const token = localStorage.getItem('authToken');
      if (token) {
        const response = await fetch('/api/gps-tracking/start-tracking', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ routeId, vehicleId })
        });

        if (!response.ok) {
          throw new Error('Failed to start tracking session');
        }
      }

      // Start GPS watching
      this.watchId = navigator.geolocation.watchPosition(
        (position) => this.handlePositionUpdate(position),
        (error) => this.handlePositionError(error),
        {
          enableHighAccuracy: this.highAccuracyMode,
          timeout: 10000,
          maximumAge: 1000
        }
      );

      // Start interval-based updates
      this.trackingInterval = setInterval(() => {
        this.getCurrentPosition();
      }, this.updateInterval);

      this.trackingEnabled = true;
      console.log('🎯 GPS tracking started');
      
      return { success: true, message: 'Tracking started' };

    } catch (error) {
      console.error('❌ Failed to start tracking:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Stop GPS tracking
   */
  async stopTracking() {
    try {
      // Stop GPS watching
      if (this.watchId) {
        navigator.geolocation.clearWatch(this.watchId);
        this.watchId = null;
      }

      // Stop interval updates
      if (this.trackingInterval) {
        clearInterval(this.trackingInterval);
        this.trackingInterval = null;
      }

      // Stop tracking session on server
      const token = localStorage.getItem('authToken');
      if (token) {
        const response = await fetch('/api/gps-tracking/stop-tracking', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          console.warn('Failed to stop tracking session on server');
        }
      }

      this.trackingEnabled = false;
      this.lastPosition = null;
      console.log('🛑 GPS tracking stopped');

      return { success: true, message: 'Tracking stopped' };

    } catch (error) {
      console.error('❌ Failed to stop tracking:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current position once
   */
  async getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.handlePositionUpdate(position);
          resolve(position);
        },
        (error) => {
          this.handlePositionError(error);
          reject(error);
        },
        {
          enableHighAccuracy: this.highAccuracyMode,
          timeout: 10000,
          maximumAge: 5000
        }
      );
    });
  }

  /**
   * Handle position updates
   */
  async handlePositionUpdate(position) {
    const { latitude, longitude, accuracy, speed, heading } = position.coords;
    const timestamp = new Date(position.timestamp);

    // Check if position has changed significantly
    if (this.lastPosition && this.calculateDistance(
      this.lastPosition.latitude, this.lastPosition.longitude,
      latitude, longitude
    ) < this.minMovementDistance) {
      return; // Skip update if movement is too small
    }

    const positionData = {
      latitude,
      longitude,
      accuracy,
      speed: speed ? speed * 3.6 : null, // Convert m/s to km/h
      heading,
      timestamp
    };

    console.log('📍 Position updated:', positionData);

    // Send to server
    await this.sendPositionToServer(positionData);

    // Update last position
    this.lastPosition = positionData;

    // Notify local callbacks
    this.notifyCallbacks('positionUpdate', {
      ...positionData,
      userId: 'current-user',
      isCurrentUser: true
    });
  }

  /**
   * Handle position errors
   */
  handlePositionError(error) {
    const gpsErrorHandler = createGPSErrorHandler('LiveTrackingService', (errorInfo) => {
      // Notify callbacks with detailed error info
      this.notifyCallbacks('positionError', errorInfo);
    });
    
    return gpsErrorHandler(error);
  }

  /**
   * Send position to server
   */
  async sendPositionToServer(positionData) {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/gps-tracking/update-position', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(positionData)
      });

      if (!response.ok) {
        console.error('Failed to send position to server');
      }

    } catch (error) {
      console.error('Error sending position to server:', error);
    }
  }

  /**
   * Get all worker positions
   */
  async getAllPositions() {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No auth token');

      const response = await fetch('/api/gps-tracking/positions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch positions');
      }

      const data = await response.json();
      return data.data || [];

    } catch (error) {
      console.error('Error fetching positions:', error);
      return [];
    }
  }

  /**
   * Get active tracking sessions
   */
  async getActiveSessions() {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No auth token');

      const response = await fetch('/api/gps-tracking/active-sessions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const data = await response.json();
      return data.data || [];

    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  }

  /**
   * Calculate distance between two points in meters
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  /**
   * Event system
   */
  on(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback);
    }
  }

  off(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
    }
  }

  notifyCallbacks(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Callback error:', error);
        }
      });
    }
  }

  /**
   * Update tracking settings
   */
  updateSettings(settings) {
    if (settings.updateInterval) {
      this.updateInterval = settings.updateInterval;
      
      // Restart interval if tracking is active
      if (this.trackingEnabled && this.trackingInterval) {
        clearInterval(this.trackingInterval);
        this.trackingInterval = setInterval(() => {
          this.getCurrentPosition();
        }, this.updateInterval);
      }
    }

    if (settings.minMovementDistance !== undefined) {
      this.minMovementDistance = settings.minMovementDistance;
    }

    if (settings.highAccuracyMode !== undefined) {
      this.highAccuracyMode = settings.highAccuracyMode;
    }
  }

  /**
   * Get current tracking status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      trackingEnabled: this.trackingEnabled,
      lastPosition: this.lastPosition,
      settings: {
        updateInterval: this.updateInterval,
        minMovementDistance: this.minMovementDistance,
        highAccuracyMode: this.highAccuracyMode
      }
    };
  }
}

// Export singleton instance
const liveTrackingService = new LiveTrackingService();
export default liveTrackingService;