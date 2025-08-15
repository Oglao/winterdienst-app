const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../database/db');
const auth = require('../middleware/auth');

// Registrierung (öffentlich zugänglich)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'worker' } = req.body;

    // Validierung
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, E-Mail und Passwort sind erforderlich'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Passwort muss mindestens 6 Zeichen haben'
      });
    }

    // E-Mail-Validierung
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Ungültige E-Mail-Adresse'
      });
    }

    // Prüfen ob E-Mail bereits existiert
    const existingUser = await db('users').where('email', email).first();
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'E-Mail-Adresse ist bereits registriert'
      });
    }

    // Passwort hashen
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Benutzer erstellen
    const [user] = await db('users')
      .insert({
        name,
        email: email.toLowerCase(),
        password_hash,
        role: ['worker', 'admin'].includes(role) ? role : 'worker',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning(['id', 'name', 'email', 'role', 'is_active', 'created_at']);

    // JWT Token erstellen
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'winterdienst_jwt_secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Registrierung erfolgreich',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          is_active: user.is_active
        },
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registrierung fehlgeschlagen'
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'E-Mail und Passwort sind erforderlich'
      });
    }

    // Benutzer finden
    const user = await db('users').where('email', email.toLowerCase()).first();
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Ungültige Anmeldedaten'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Konto ist deaktiviert'
      });
    }

    // Passwort prüfen
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Ungültige Anmeldedaten'
      });
    }

    // JWT Token erstellen
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'winterdienst_jwt_secret',
      { expiresIn: '24h' }
    );

    // Letzten Login aktualisieren
    await db('users')
      .where('id', user.id)
      .update({ 
        updated_at: new Date(),
        current_location_timestamp: new Date() // Kann als "last seen" verwendet werden
      });

    res.json({
      success: true,
      message: 'Anmeldung erfolgreich',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          is_active: user.is_active
        },
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Anmeldung fehlgeschlagen'
    });
  }
});

// Profil abrufen (authentifiziert)
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await db('users')
      .where('id', req.user.userId)
      .select(['id', 'name', 'email', 'role', 'is_active', 'current_location_lat', 'current_location_lng', 'current_location_timestamp', 'created_at', 'updated_at'])
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Benutzer nicht gefunden'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Profil konnte nicht geladen werden'
    });
  }
});

// Profil aktualisieren
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, current_location_lat, current_location_lng } = req.body;
    const updateData = { updated_at: new Date() };

    if (name) updateData.name = name;
    if (current_location_lat !== undefined) updateData.current_location_lat = current_location_lat;
    if (current_location_lng !== undefined) updateData.current_location_lng = current_location_lng;
    if (current_location_lat !== undefined || current_location_lng !== undefined) {
      updateData.current_location_timestamp = new Date();
    }

    const [user] = await db('users')
      .where('id', req.user.userId)
      .update(updateData)
      .returning(['id', 'name', 'email', 'role', 'is_active', 'current_location_lat', 'current_location_lng', 'current_location_timestamp']);

    res.json({
      success: true,
      message: 'Profil aktualisiert',
      data: user
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Profil-Update fehlgeschlagen'
    });
  }
});

// Passwort ändern
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Aktuelles und neues Passwort sind erforderlich'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Neues Passwort muss mindestens 6 Zeichen haben'
      });
    }

    // Aktueller Benutzer
    const user = await db('users').where('id', req.user.userId).first();
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Benutzer nicht gefunden'
      });
    }

    // Aktuelles Passwort prüfen
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Aktuelles Passwort ist falsch'
      });
    }

    // Neues Passwort hashen
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Passwort aktualisieren
    await db('users')
      .where('id', req.user.userId)
      .update({ 
        password_hash: newPasswordHash,
        updated_at: new Date()
      });

    res.json({
      success: true,
      message: 'Passwort erfolgreich geändert'
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      error: 'Passwort-Änderung fehlgeschlagen'
    });
  }
});

// Token validieren
router.get('/validate', auth, (req, res) => {
  res.json({
    success: true,
    message: 'Token ist gültig',
    data: {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role
    }
  });
});

module.exports = router;