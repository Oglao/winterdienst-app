/**
 * Automatisches Zeit-Tracking System
 * Überwacht Mitarbeiter-GPS und startet/stoppt Zeiterfassung automatisch
 */

import { geolocationService } from './geolocation';

class AutomaticTimeTrackingService {
  constructor() {
    this.trackingSessions = new Map(); // userId -> session data
    this.geofences = new Map(); // geofence areas for work zones
    this.settings = {
      autoStartThreshold: 100, // meters to work zone to auto-start
      autoStopThreshold: 300,  // meters from work zone to auto-stop
      inactivityTimeout: 15 * 60 * 1000, // 15 minutes of no movement = auto-stop
      minimumSessionTime: 5 * 60 * 1000,  // 5 minutes minimum session
      workingHoursStart: 5,    // 5:00 AM
      workingHoursEnd: 22,     // 10:00 PM
    };
    this.isActive = false;
  }

  // Initialize automatic tracking for user
  async startAutomaticTracking(userId, options = {}) {
    if (this.trackingSessions.has(userId)) {
      console.warn(`⚠️ User ${userId} already has active automatic tracking`);
      return { success: false, error: 'Already tracking' };
    }

    try {
      // Create tracking session
      const session = {
        userId,
        startTime: new Date(),
        isWorking: false,
        currentWorkSession: null,
        lastPosition: null,
        lastMovement: new Date(),
        totalWorkTime: 0,
        workSessions: [],
        options: { ...this.settings, ...options }
      };

      this.trackingSessions.set(userId, session);

      // Start GPS monitoring
      const gpsWatchId = geolocationService.startTracking(
        (position, error) => this.handlePositionUpdate(userId, position, error),
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30000
        }
      );

      session.gpsWatchId = gpsWatchId;

      console.log(`✅ Automatic time tracking started for user ${userId}`);
      return { success: true, sessionId: userId };

    } catch (error) {
      console.error('❌ Failed to start automatic tracking:', error);
      return { success: false, error: error.message };
    }
  }

  // Stop automatic tracking for user
  stopAutomaticTracking(userId) {
    const session = this.trackingSessions.get(userId);
    if (!session) {
      return { success: false, error: 'No active tracking session' };
    }

    try {
      // Stop any active work session
      if (session.isWorking && session.currentWorkSession) {
        this.endWorkSession(userId, 'Manual stop');
      }

      // Stop GPS monitoring
      if (session.gpsWatchId) {
        geolocationService.stopTracking();
      }

      // Calculate total session time
      const sessionDuration = new Date() - session.startTime;
      const summary = {
        userId,
        sessionDuration,
        totalWorkTime: session.totalWorkTime,
        workSessions: session.workSessions,
        endTime: new Date()
      };

      this.trackingSessions.delete(userId);

      console.log(`✅ Automatic tracking stopped for user ${userId}`, summary);
      return { success: true, summary };

    } catch (error) {
      console.error('❌ Failed to stop automatic tracking:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle GPS position updates
  handlePositionUpdate(userId, position, error) {
    const session = this.trackingSessions.get(userId);
    if (!session) return;

    if (error) {
      console.warn(`🚫 GPS error for user ${userId}:`, error.userFriendlyMessage || error.message || 'GPS Error');
      return;
    }

    try {
      const now = new Date();
      session.lastPosition = position;
      
      // Check if movement detected
      if (this.isMovementDetected(session, position)) {
        session.lastMovement = now;
      }

      // Check work zone proximity
      const workZoneDistance = this.calculateWorkZoneDistance(position);
      
      // Auto-start work session if close to work zone
      if (!session.isWorking && workZoneDistance <= session.options.autoStartThreshold) {
        if (this.isWorkingHours()) {
          this.startWorkSession(userId, 'Auto-start: Near work zone');
        }
      }

      // Auto-stop work session if far from work zone or inactive
      if (session.isWorking) {
        const timeSinceMovement = now - session.lastMovement;
        
        if (workZoneDistance > session.options.autoStopThreshold) {
          this.endWorkSession(userId, 'Auto-stop: Left work zone');
        } else if (timeSinceMovement > session.options.inactivityTimeout) {
          this.endWorkSession(userId, 'Auto-stop: Inactivity timeout');
        }
      }

    } catch (error) {
      console.error('❌ Error handling position update:', error);
    }
  }

  // Start a work session
  startWorkSession(userId, reason = 'Manual start') {
    const session = this.trackingSessions.get(userId);
    if (!session || session.isWorking) return false;

    const workSession = {
      id: Date.now(),
      startTime: new Date(),
      endTime: null,
      duration: 0,
      startReason: reason,
      endReason: null,
      startPosition: session.lastPosition,
      endPosition: null,
      route: this.detectCurrentRoute(session.lastPosition)
    };

    session.isWorking = true;
    session.currentWorkSession = workSession;

    console.log(`🚀 Work session started for user ${userId}: ${reason}`);
    
    // Notify system
    this.notifyWorkSessionChange(userId, 'started', workSession);
    
    return true;
  }

  // End current work session
  endWorkSession(userId, reason = 'Manual stop') {
    const session = this.trackingSessions.get(userId);
    if (!session || !session.isWorking || !session.currentWorkSession) return false;

    const workSession = session.currentWorkSession;
    const now = new Date();
    
    workSession.endTime = now;
    workSession.duration = now - workSession.startTime;
    workSession.endReason = reason;
    workSession.endPosition = session.lastPosition;

    // Only save session if it meets minimum time threshold
    if (workSession.duration >= session.options.minimumSessionTime) {
      session.workSessions.push(workSession);
      session.totalWorkTime += workSession.duration;
    }

    session.isWorking = false;
    session.currentWorkSession = null;

    console.log(`🛑 Work session ended for user ${userId}: ${reason} (Duration: ${this.formatDuration(workSession.duration)})`);
    
    // Notify system
    this.notifyWorkSessionChange(userId, 'ended', workSession);
    
    return true;
  }

  // Calculate distance to nearest work zone
  calculateWorkZoneDistance(position) {
    if (!position) return Infinity;

    // Hamburg city center as default work zone
    const workZones = [
      { lat: 53.5511, lng: 9.9937, radius: 1000 }, // Hamburg center
      { lat: 53.5600, lng: 10.0000, radius: 800 },  // North zone
      { lat: 53.5400, lng: 9.9800, radius: 800 }    // South zone
    ];

    let minDistance = Infinity;
    
    for (const zone of workZones) {
      const distance = this.calculateDistance(
        position.latitude, position.longitude,
        zone.lat, zone.lng
      );
      minDistance = Math.min(minDistance, Math.max(0, distance - zone.radius));
    }

    return minDistance;
  }

  // Detect current route based on position
  detectCurrentRoute(position) {
    if (!position) return 'Unbekannte Route';

    // Simple route detection based on GPS zones
    if (position.latitude > 53.56) return 'Nord-Route';
    if (position.latitude < 53.54) return 'Süd-Route';
    return 'Zentral-Route';
  }

  // Check if current time is within working hours
  isWorkingHours() {
    const now = new Date();
    const hour = now.getHours();
    return hour >= this.settings.workingHoursStart && hour <= this.settings.workingHoursEnd;
  }

  // Detect movement between positions
  isMovementDetected(session, newPosition) {
    if (!session.lastPosition || !newPosition) return false;

    const distance = this.calculateDistance(
      session.lastPosition.latitude, session.lastPosition.longitude,
      newPosition.latitude, newPosition.longitude
    );

    return distance > 10; // 10 meters minimum movement
  }

  // Calculate distance between two GPS points
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

    return R * c;
  }

  // Format duration in human readable format
  formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}min`;
    }
    return `${minutes}min`;
  }

  // Notify system of work session changes
  notifyWorkSessionChange(userId, action, session) {
    // Emit event for real-time updates
    const event = new CustomEvent('workSessionChange', {
      detail: { userId, action, session, timestamp: new Date() }
    });
    window.dispatchEvent(event);

    // Also log to console for now
    console.log(`📋 Work session ${action} for user ${userId}`, session);
  }

  // Get current tracking status for user
  getTrackingStatus(userId) {
    const session = this.trackingSessions.get(userId);
    if (!session) {
      return { isTracking: false, message: 'No active tracking session' };
    }

    return {
      isTracking: true,
      isWorking: session.isWorking,
      sessionStartTime: session.startTime,
      currentWorkSession: session.currentWorkSession,
      totalWorkTime: session.totalWorkTime,
      workSessionsCount: session.workSessions.length,
      lastPosition: session.lastPosition,
      lastMovement: session.lastMovement
    };
  }

  // Get all tracking sessions
  getAllTrackingSessions() {
    const sessions = {};
    for (const [userId, session] of this.trackingSessions) {
      sessions[userId] = this.getTrackingStatus(userId);
    }
    return sessions;
  }

  // Manual override to start work session
  manualStartWork(userId, route = null) {
    const session = this.trackingSessions.get(userId);
    if (!session) {
      return { success: false, error: 'No active tracking session' };
    }

    if (session.isWorking) {
      return { success: false, error: 'Work session already active' };
    }

    const success = this.startWorkSession(userId, 'Manual start by user');
    if (success && route) {
      session.currentWorkSession.route = route;
    }

    return { success };
  }

  // Manual override to stop work session
  manualStopWork(userId) {
    const session = this.trackingSessions.get(userId);
    if (!session) {
      return { success: false, error: 'No active tracking session' };
    }

    if (!session.isWorking) {
      return { success: false, error: 'No active work session' };
    }

    const success = this.endWorkSession(userId, 'Manual stop by user');
    return { success };
  }

  // Calculate work time for inactive workers (admin function)
  calculateInactiveWorkerTime(userId, date = new Date()) {
    // For workers who don't use automatic tracking,
    // calculate time based on route assignments and typical work patterns
    
    const estimatedHours = this.estimateWorkHoursFromSchedule(userId, date);
    
    return {
      userId,
      date,
      estimatedWorkTime: estimatedHours * 60 * 60 * 1000, // convert to milliseconds
      calculationMethod: 'Schedule-based estimation',
      isEstimate: true,
      confidence: this.calculateEstimateConfidence(userId, date)
    };
  }

  // Estimate work hours from schedule
  estimateWorkHoursFromSchedule(userId, date) {
    // Simple estimation - in real app this would check actual schedules
    const dayOfWeek = date.getDay();
    
    // Weekend = shorter shifts
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 6; // 6 hours weekend shift
    }
    
    // Weekday = standard shift
    return 8; // 8 hours standard shift
  }

  // Calculate confidence level for estimates
  calculateEstimateConfidence(userId, date) {
    // Factors that increase confidence:
    // - Worker has consistent schedule
    // - No reported absences
    // - Weather conditions normal
    
    return 0.75; // 75% confidence as default
  }
}

export const automaticTimeTrackingService = new AutomaticTimeTrackingService();
export default automaticTimeTrackingService;