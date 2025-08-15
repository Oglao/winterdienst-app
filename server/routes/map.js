const express = require('express');
const router = express.Router();
const db = require('../database/db');
const auth = require('../middleware/auth');

// Alle Routen mit geografischen Daten für Karte
router.get('/routes', auth, async (req, res) => {
  try {
    const routes = await db('routes_with_geography').select('*');
    
    // Konvertiere coordinates JSON string zu Array für Frontend
    const routesWithCoords = routes.map(route => ({
      ...route,
      coordinates: typeof route.coordinates === 'string' 
        ? JSON.parse(route.coordinates) 
        : route.coordinates,
      center_point: typeof route.center_point === 'string'
        ? JSON.parse(route.center_point)
        : route.center_point
    }));
    
    res.json({
      success: true,
      data: routesWithCoords
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Mitarbeiter-Positionen für Karte
router.get('/workers', auth, async (req, res) => {
  try {
    const workers = await db('users')
      .select([
        'id', 'name', 'role',
        'current_location_lat as lat',
        'current_location_lng as lng',
        'current_location_timestamp'
      ])
      .where('is_active', true)
      .whereNotNull('current_location_lat');
    
    // Format für Frontend
    const workersForMap = workers.map(worker => ({
      id: worker.id,
      name: worker.name,
      position: {
        lat: parseFloat(worker.lat) || 53.5511,
        lng: parseFloat(worker.lng) || 9.9937
      },
      status: 'aktiv', // TODO: Dynamisch aus work_sessions bestimmen
      currentRoute: 'Aktuelle Route', // TODO: Aus work_sessions holen
      workTime: '2h 15min', // TODO: Berechnen
      lastUpdate: worker.current_location_timestamp 
        ? new Date(worker.current_location_timestamp).toLocaleTimeString('de-DE')
        : 'Unbekannt'
    }));
    
    res.json({
      success: true,
      data: workersForMap
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route zur Karte hinzufügen (für "Auf Karte anzeigen" Button)
router.get('/route/:id', auth, async (req, res) => {
  try {
    const route = await db('routes_with_geography')
      .where('id', req.params.id)
      .first();
    
    if (!route) {
      return res.status(404).json({
        success: false,
        error: 'Route nicht gefunden'
      });
    }
    
    // Konvertiere coordinates
    const routeWithCoords = {
      ...route,
      coordinates: typeof route.coordinates === 'string' 
        ? JSON.parse(route.coordinates) 
        : route.coordinates,
      center_point: typeof route.center_point === 'string'
        ? JSON.parse(route.center_point)
        : route.center_point
    };
    
    res.json({
      success: true,
      data: routeWithCoords,
      mapCenter: routeWithCoords.center_point
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Berechne Entfernung zwischen zwei Punkten
router.post('/distance', auth, async (req, res) => {
  try {
    const { from, to } = req.body;
    
    const result = await db.raw(`
      SELECT calculate_distance(?, ?, ?, ?) as distance
    `, [from.lat, from.lng, to.lat, to.lng]);
    
    const distance = parseFloat(result.rows[0].distance);
    
    res.json({
      success: true,
      data: {
        distance_meters: Math.round(distance),
        distance_km: Math.round(distance / 1000 * 100) / 100
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;