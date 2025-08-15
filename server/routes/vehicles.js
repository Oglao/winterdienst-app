const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const auth = require('../middleware/auth');
const { vehicleValidation, fuelEntryValidation } = require('../validation/schemas');

// GET /api/vehicles - Alle Fahrzeuge
router.get('/', auth, async (req, res) => {
  try {
    const vehicles = await Vehicle.findAll();
    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Fahrzeuge' });
  }
});

// GET /api/vehicles/:id - Einzelnes Fahrzeug
router.get('/:id', auth, async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Fahrzeug nicht gefunden' });
    }
    res.json(vehicle);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ error: 'Fehler beim Laden des Fahrzeugs' });
  }
});

// GET /api/vehicles/user/:userId - Fahrzeuge eines Benutzers
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const vehicles = await Vehicle.findByUser(req.params.userId);
    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching user vehicles:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Benutzer-Fahrzeuge' });
  }
});

// POST /api/vehicles - Neues Fahrzeug erstellen
router.post('/', auth, async (req, res) => {
  try {
    const { error } = vehicleValidation.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const vehicle = await Vehicle.create(req.body);
    res.status(201).json(vehicle);
  } catch (error) {
    console.error('Error creating vehicle:', error);
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Kennzeichen bereits vergeben' });
    }
    res.status(500).json({ error: 'Fehler beim Erstellen des Fahrzeugs' });
  }
});

// PUT /api/vehicles/:id - Fahrzeug aktualisieren
router.put('/:id', auth, async (req, res) => {
  try {
    const { error } = vehicleValidation.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const vehicle = await Vehicle.update(req.params.id, req.body);
    if (!vehicle) {
      return res.status(404).json({ error: 'Fahrzeug nicht gefunden' });
    }
    res.json(vehicle);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Fahrzeugs' });
  }
});

// PUT /api/vehicles/:id/fuel - Tankstand aktualisieren
router.put('/:id/fuel', auth, async (req, res) => {
  try {
    const { fuel_level, mileage } = req.body;
    
    if (!fuel_level || fuel_level < 0) {
      return res.status(400).json({ error: 'Gültiger Tankstand erforderlich' });
    }

    const vehicle = await Vehicle.updateFuelLevel(req.params.id, fuel_level, mileage);
    if (!vehicle) {
      return res.status(404).json({ error: 'Fahrzeug nicht gefunden' });
    }
    res.json(vehicle);
  } catch (error) {
    console.error('Error updating fuel level:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Tankstands' });
  }
});

// POST /api/vehicles/:id/fuel-entries - Tankvorgang hinzufügen
router.post('/:id/fuel-entries', auth, async (req, res) => {
  try {
    const { error } = fuelEntryValidation.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const entry = await Vehicle.addFuelEntry(req.params.id, req.body);
    
    // Nach dem Tanken auch Tankstand aktualisieren, wenn angegeben
    if (req.body.new_fuel_level) {
      await Vehicle.updateFuelLevel(
        req.params.id, 
        req.body.new_fuel_level, 
        req.body.mileage
      );
    }
    
    res.status(201).json(entry);
  } catch (error) {
    console.error('Error adding fuel entry:', error);
    res.status(500).json({ error: 'Fehler beim Hinzufügen des Tankvorgangs' });
  }
});

// GET /api/vehicles/:id/fuel-history - Tankhistorie
router.get('/:id/fuel-history', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const history = await Vehicle.getFuelHistory(req.params.id, limit);
    res.json(history);
  } catch (error) {
    console.error('Error fetching fuel history:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Tankhistorie' });
  }
});

// GET /api/vehicles/:id/consumption - Verbrauchsstatistiken
router.get('/:id/consumption', auth, async (req, res) => {
  try {
    const routeId = req.query.route_id || null;
    const consumption = await Vehicle.calculateConsumption(req.params.id, routeId);
    
    if (!consumption) {
      return res.json({ 
        message: 'Keine Verbrauchsdaten verfügbar',
        avg_consumption: 0,
        total_distance: 0,
        total_fuel: 0,
        sessions_count: 0
      });
    }
    
    res.json(consumption);
  } catch (error) {
    console.error('Error calculating consumption:', error);
    res.status(500).json({ error: 'Fehler beim Berechnen des Verbrauchs' });
  }
});

// GET /api/vehicles/:id/maintenance-alerts - Wartungsalarme
router.get('/:id/maintenance-alerts', auth, async (req, res) => {
  try {
    const alerts = await Vehicle.getMaintenanceAlerts(req.params.id);
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching maintenance alerts:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Wartungsalarme' });
  }
});

// DELETE /api/vehicles/:id - Fahrzeug deaktivieren
router.delete('/:id', auth, async (req, res) => {
  try {
    const vehicle = await Vehicle.delete(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Fahrzeug nicht gefunden' });
    }
    res.json({ message: 'Fahrzeug deaktiviert', vehicle });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ error: 'Fehler beim Löschen des Fahrzeugs' });
  }
});

module.exports = router;