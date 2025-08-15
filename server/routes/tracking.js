const express = require('express');
const router = express.Router();
const WorkSession = require('../models/WorkSession');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { validate, validateParams } = require('../middleware/validation');
const { trackingSchemas, paramSchemas } = require('../validation/schemas');

// Arbeitszeit starten
router.post('/start', auth, validate(trackingSchemas.start), async (req, res) => {
  try {
    const { routeId, location } = req.body;
    
    const session = new WorkSession({
      worker: req.user.id,
      route: routeId,
      startTime: new Date(),
      gpsTrack: [{
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date(),
        accuracy: location.accuracy
      }]
    });
    
    await session.save();
    
    // Real-time Update senden
    req.io.emit('work-session-started', {
      workerId: req.user.id,
      sessionId: session._id,
      routeId
    });
    
    res.json({ success: true, sessionId: session._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GPS Position aktualisieren
router.post('/location', auth, validate(trackingSchemas.locationUpdate), async (req, res) => {
  try {
    const { sessionId, location } = req.body;
    
    await WorkSession.findByIdAndUpdate(sessionId, {
      $push: {
        gpsTrack: {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: new Date(),
          accuracy: location.accuracy
        }
      }
    });
    
    // Benutzer-Position aktualisieren
    await User.findByIdAndUpdate(req.user.id, {
      currentLocation: {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date()
      }
    });
    
    // Real-time Update
    req.io.emit('worker-location-update', {
      workerId: req.user.id,
      location
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Arbeitszeit beenden
router.post('/stop', auth, validate(trackingSchemas.stop), async (req, res) => {
  try {
    const { sessionId, location } = req.body;
    
    const session = await WorkSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session nicht gefunden' });
    }
    
    const endTime = new Date();
    const totalDuration = Math.floor((endTime - session.startTime) / (1000 * 60));
    
    await WorkSession.findByIdAndUpdate(sessionId, {
      endTime,
      totalDuration,
      $push: {
        gpsTrack: {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: endTime,
          accuracy: location.accuracy
        }
      }
    });
    
    req.io.emit('work-session-ended', {
      workerId: req.user.id,
      sessionId,
      duration: totalDuration
    });
    
    res.json({ success: true, duration: totalDuration });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
