const express = require('express');
const router = express.Router();
const db = require('../database/db');
const auth = require('../middleware/auth');

// Get all active worker positions
router.get('/positions', auth, async (req, res) => {
  try {
    const positions = await db('live_worker_positions')
      .whereNotNull('latitude')
      .whereNotNull('longitude')
      .select('*');

    res.json({
      success: true,
      data: positions
    });
  } catch (error) {
    console.error('GPS positions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get GPS positions'
    });
  }
});

// Update worker position
router.post('/update-position', auth, async (req, res) => {
  try {
    const { latitude, longitude, accuracy, speed, heading } = req.body;
    const userId = req.user.userId;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    // Update user position in database
    const [updatedUser] = await db('users')
      .where('id', userId)
      .update({
        current_location_lat: latitude,
        current_location_lng: longitude,
        current_location_timestamp: new Date(),
        updated_at: new Date()
      })
      .returning(['id', 'name', 'email', 'role', 'current_location_lat', 'current_location_lng', 'current_location_timestamp']);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Insert GPS point using function
    try {
      await db.raw('SELECT insert_gps_point(?, ?, ?, ?, ?, ?)', [
        userId, latitude, longitude, accuracy, speed, heading
      ]);
    } catch (gpsError) {
      console.warn('GPS history insert failed:', gpsError);
    }

    // Check for geofence violations
    try {
      const violations = await db.raw('SELECT * FROM check_geofence_violations(?, ?, ?)', [
        userId, latitude, longitude
      ]);
      
      if (violations.rows && violations.rows.length > 0) {
        // Emit geofence alerts
        violations.rows.forEach(alert => {
          req.io.emit('geofence-alert', {
            ...alert,
            userName: updatedUser.name
          });
        });
      }
    } catch (geofenceError) {
      console.warn('Geofence check failed:', geofenceError);
    }

    // Broadcast position update to all connected clients
    const positionUpdate = {
      userId: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      latitude: updatedUser.current_location_lat,
      longitude: updatedUser.current_location_lng,
      timestamp: updatedUser.current_location_timestamp,
      accuracy: accuracy || null,
      speed: speed || null,
      heading: heading || null
    };

    // Emit to all connected admin/supervisor clients
    req.io.emit('position-update', positionUpdate);

    res.json({
      success: true,
      message: 'Position updated successfully',
      data: positionUpdate
    });

  } catch (error) {
    console.error('Position update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update position'
    });
  }
});

// Get position history for a specific worker
router.get('/history/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, limit = 100 } = req.query;

    let query = db('gps_history')
      .where('user_id', userId)
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit));

    if (startDate && endDate) {
      query = query.whereBetween('timestamp', [startDate, endDate]);
    }

    const history = await query;

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('GPS history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get GPS history'
    });
  }
});

// Start tracking session
router.post('/start-tracking', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { routeId, vehicleId } = req.body;

    // Create or update tracking session
    const [session] = await db('tracking_sessions')
      .insert({
        user_id: userId,
        route_id: routeId,
        vehicle_id: vehicleId,
        start_time: new Date(),
        is_active: true
      })
      .onConflict(['user_id'])
      .merge({
        route_id: routeId,
        vehicle_id: vehicleId,
        start_time: new Date(),
        is_active: true,
        updated_at: new Date()
      })
      .returning('*');

    // Notify admins about tracking start
    req.io.emit('tracking-started', {
      sessionId: session.id,
      userId: userId,
      routeId: routeId,
      vehicleId: vehicleId,
      timestamp: session.start_time
    });

    res.json({
      success: true,
      message: 'Tracking started',
      data: session
    });

  } catch (error) {
    console.error('Start tracking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start tracking'
    });
  }
});

// Stop tracking session
router.post('/stop-tracking', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Update tracking session
    const [session] = await db('tracking_sessions')
      .where('user_id', userId)
      .where('is_active', true)
      .update({
        end_time: new Date(),
        is_active: false,
        updated_at: new Date()
      })
      .returning('*');

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'No active tracking session found'
      });
    }

    // Notify admins about tracking stop
    req.io.emit('tracking-stopped', {
      sessionId: session.id,
      userId: userId,
      timestamp: session.end_time
    });

    res.json({
      success: true,
      message: 'Tracking stopped',
      data: session
    });

  } catch (error) {
    console.error('Stop tracking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop tracking'
    });
  }
});

// Get active tracking sessions
router.get('/active-sessions', auth, async (req, res) => {
  try {
    const sessions = await db('tracking_sessions as ts')
      .join('users as u', 'ts.user_id', 'u.id')
      .leftJoin('routes as r', 'ts.route_id', 'r.id')
      .leftJoin('vehicles as v', 'ts.vehicle_id', 'v.id')
      .where('ts.is_active', true)
      .select(
        'ts.*',
        'u.name as user_name',
        'u.email as user_email',
        'u.current_location_lat',
        'u.current_location_lng',
        'u.current_location_timestamp',
        'r.name as route_name',
        'v.license_plate as vehicle_plate'
      );

    res.json({
      success: true,
      data: sessions
    });

  } catch (error) {
    console.error('Active sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get active sessions'
    });
  }
});

module.exports = router;