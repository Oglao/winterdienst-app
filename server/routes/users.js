const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const { validate, validateParams } = require('../middleware/validation');
const { userSchemas, paramSchemas } = require('../validation/schemas');

// Alle Benutzer abrufen
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({ isActive: true }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Benutzer erstellen
router.post('/', auth, validate(userSchemas.register), async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json({
      success: true,
      data: userResponse,
      message: 'Benutzer erfolgreich erstellt'
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});
// Benutzer aktualisieren
router.put('/:id', auth, validateParams(paramSchemas.id), validate(userSchemas.update), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Benutzer nicht gefunden' 
      });
    }
    
    res.json({
      success: true,
      data: user,
      message: 'Benutzer erfolgreich aktualisiert'
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});
// Benutzer löschen (soft delete)
router.delete('/:id', auth, validateParams(paramSchemas.id), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Benutzer nicht gefunden' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Benutzer erfolgreich deaktiviert' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
  
  module.exports = router;
  