const express = require('express');
const router = express.Router();
const Weather = require('../models/Weather');
const auth = require('../middleware/auth');

// GET /api/weather/current - Aktuelles Wetter für Standort
router.get('/current', auth, async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude und Longitude erforderlich' });
    }
    
    const weather = await Weather.getCurrentWeather(parseFloat(lat), parseFloat(lng));
    res.json(weather);
  } catch (error) {
    console.error('Error fetching current weather:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Wetterdaten' });
  }
});

// GET /api/weather/forecast - Wettervorhersage
router.get('/forecast', auth, async (req, res) => {
  try {
    const { lat, lng, hours } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude und Longitude erforderlich' });
    }
    
    const hoursAhead = parseInt(hours) || 24;
    const forecast = await Weather.getForecast(parseFloat(lat), parseFloat(lng), hoursAhead);
    res.json(forecast);
  } catch (error) {
    console.error('Error fetching forecast:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Wettervorhersage' });
  }
});

// GET /api/weather/deployment-triggers - Einsatz-Trigger
router.get('/deployment-triggers', auth, async (req, res) => {
  try {
    const triggers = await Weather.getDeploymentTriggers();
    res.json(triggers);
  } catch (error) {
    console.error('Error fetching deployment triggers:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Einsatz-Trigger' });
  }
});

// POST /api/weather/check-deployment - Einsatzbedingungen prüfen
router.post('/check-deployment', auth, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude und Longitude erforderlich' });
    }
    
    const conditions = await Weather.checkDeploymentConditions(lat, lng);
    res.json(conditions);
  } catch (error) {
    console.error('Error checking deployment conditions:', error);
    res.status(500).json({ error: 'Fehler beim Prüfen der Einsatzbedingungen' });
  }
});

// POST /api/weather/fetch - Wetterdaten von API abrufen
router.post('/fetch', auth, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenWeatherMap API Key nicht konfiguriert' });
    }
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude und Longitude erforderlich' });
    }
    
    const weatherData = await Weather.fetchWeatherFromAPI(lat, lng, apiKey);
    res.json(weatherData);
  } catch (error) {
    console.error('Error fetching weather from API:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Wetterdaten' });
  }
});

// GET /api/weather/history - Wetterhistorie
router.get('/history', auth, async (req, res) => {
  try {
    const { lat, lng, days } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude und Longitude erforderlich' });
    }
    
    const daysBack = parseInt(days) || 7;
    const history = await Weather.getWeatherHistory(parseFloat(lat), parseFloat(lng), daysBack);
    res.json(history);
  } catch (error) {
    console.error('Error fetching weather history:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Wetterhistorie' });
  }
});

// GET /api/weather/location/:name - Wetter für benannten Ort
router.get('/location/:name', auth, async (req, res) => {
  try {
    const weather = await Weather.getWeatherForLocation(req.params.name);
    res.json(weather);
  } catch (error) {
    console.error('Error fetching weather for location:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Wetterdaten für den Ort' });
  }
});

// POST /api/weather/locations-summary - Wetter-Übersicht für mehrere Standorte
router.post('/locations-summary', auth, async (req, res) => {
  try {
    const { locations } = req.body;
    
    if (!locations || !Array.isArray(locations)) {
      return res.status(400).json({ error: 'Array von Standorten erforderlich' });
    }
    
    const summary = await Weather.getLocationWeatherSummary(locations);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching locations weather summary:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Wetter-Übersicht' });
  }
});

// POST /api/weather/save - Wetterdaten manuell speichern
router.post('/save', auth, async (req, res) => {
  try {
    const weather = await Weather.saveWeatherData(req.body);
    res.status(201).json(weather);
  } catch (error) {
    console.error('Error saving weather data:', error);
    res.status(500).json({ error: 'Fehler beim Speichern der Wetterdaten' });
  }
});

// DELETE /api/weather/cleanup - Alte Wetterdaten löschen
router.delete('/cleanup', auth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const deletedCount = await Weather.cleanOldWeatherData(days);
    res.json({ message: `${deletedCount} alte Wetterdaten-Einträge gelöscht` });
  } catch (error) {
    console.error('Error cleaning weather data:', error);
    res.status(500).json({ error: 'Fehler beim Bereinigen der Wetterdaten' });
  }
});

module.exports = router;