const express = require('express');
const router = express.Router();
const Route = require('../models/Route');
const auth = require('../middleware/auth');
const { validate, validateParams } = require('../middleware/validation');
const { routeSchemas, paramSchemas } = require('../validation/schemas');

// Alle Routen abrufen
router.get('/', auth, async (req, res) => {
  try {
    const routes = await Route.findAll();
    res.json({
      success: true,
      data: routes
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Route erstellen
router.post('/', auth, validate(routeSchemas.create), async (req, res) => {
  try {
    const route = new Route(req.body);
    await route.save();
    
    const populatedRoute = await Route.findById(route._id)
      .populate('assignedWorker', 'name email');
    
    req.io.emit('route-created', populatedRoute);
    res.status(201).json({
      success: true,
      data: populatedRoute,
      message: 'Route erfolgreich erstellt'
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Route aktualisieren
router.put('/:id', auth, validateParams(paramSchemas.id), validate(routeSchemas.update), async (req, res) => {
  try {
    const route = await Route.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('assignedWorker', 'name email');
    
    if (!route) {
      return res.status(404).json({ 
        success: false, 
        error: 'Route nicht gefunden' 
      });
    }
    
    req.io.emit('route-updated', route);
    res.json({
      success: true,
      data: route,
      message: 'Route erfolgreich aktualisiert'
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Route löschen
router.delete('/:id', auth, validateParams(paramSchemas.id), async (req, res) => {
  try {
    const route = await Route.findByIdAndDelete(req.params.id);
    
    if (!route) {
      return res.status(404).json({ 
        success: false, 
        error: 'Route nicht gefunden' 
      });
    }
    
    req.io.emit('route-deleted', { id: req.params.id });
    res.json({ 
      success: true, 
      message: 'Route erfolgreich gelöscht' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;