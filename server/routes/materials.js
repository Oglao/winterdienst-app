const express = require('express');
const router = express.Router();
const Material = require('../models/Material');
const auth = require('../middleware/auth');

// GET /api/materials - Alle Materialien
router.get('/', auth, async (req, res) => {
  try {
    const materials = await Material.findAll();
    res.json(materials);
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Materialien' });
  }
});

// GET /api/materials/:id - Einzelnes Material
router.get('/:id', auth, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ error: 'Material nicht gefunden' });
    }
    res.json(material);
  } catch (error) {
    console.error('Error fetching material:', error);
    res.status(500).json({ error: 'Fehler beim Laden des Materials' });
  }
});

// POST /api/materials - Neues Material erstellen
router.post('/', auth, async (req, res) => {
  try {
    const material = await Material.create(req.body);
    res.status(201).json(material);
  } catch (error) {
    console.error('Error creating material:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen des Materials' });
  }
});

// PUT /api/materials/:id - Material aktualisieren
router.put('/:id', auth, async (req, res) => {
  try {
    const material = await Material.update(req.params.id, req.body);
    if (!material) {
      return res.status(404).json({ error: 'Material nicht gefunden' });
    }
    res.json(material);
  } catch (error) {
    console.error('Error updating material:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Materials' });
  }
});

// PUT /api/materials/:id/stock - Bestand aktualisieren
router.put('/:id/stock', auth, async (req, res) => {
  try {
    const { stock_change, reason } = req.body;
    
    if (!stock_change) {
      return res.status(400).json({ error: 'Bestandsänderung erforderlich' });
    }

    const material = await Material.updateStock(req.params.id, stock_change, reason);
    res.json(material);
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Bestands' });
  }
});

// POST /api/materials/usage - Verbrauch hinzufügen
router.post('/usage', auth, async (req, res) => {
  try {
    const usage = await Material.addUsage(req.body);
    res.status(201).json(usage);
  } catch (error) {
    console.error('Error adding usage:', error);
    res.status(500).json({ error: 'Fehler beim Hinzufügen des Verbrauchs' });
  }
});

// GET /api/materials/usage - Verbrauchshistorie
router.get('/usage', auth, async (req, res) => {
  try {
    const { route_id, session_id } = req.query;
    
    let usage;
    if (route_id) {
      usage = await Material.getUsageByRoute(route_id);
    } else if (session_id) {
      usage = await Material.getUsageBySession(session_id);
    } else {
      // Get recent usage across all routes
      usage = await Material.getUsageByRoute(); // This would need to be modified to get all
    }
    
    res.json(usage);
  } catch (error) {
    console.error('Error fetching usage:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Verbrauchsdaten' });
  }
});

// GET /api/materials/usage-summary - Verbrauchszusammenfassung
router.get('/usage-summary', auth, async (req, res) => {
  try {
    const { start, end } = req.query;
    const startDate = start ? new Date(start) : null;
    const endDate = end ? new Date(end) : null;
    
    const summary = await Material.getUsageSummary(startDate, endDate);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching usage summary:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Verbrauchszusammenfassung' });
  }
});

// GET /api/materials/:id/efficiency - Effizienz-Metriken
router.get('/:id/efficiency', auth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const metrics = await Material.getEfficiencyMetrics(req.params.id, days);
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching efficiency metrics:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Effizienz-Metriken' });
  }
});

// GET /api/materials/low-stock-alerts - Niedrigbestand-Alarme
router.get('/low-stock-alerts', auth, async (req, res) => {
  try {
    const alerts = await Material.getLowStockAlerts();
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching low stock alerts:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Bestandsalarme' });
  }
});

// GET /api/materials/costs - Materialkosten
router.get('/costs', auth, async (req, res) => {
  try {
    const { start, end } = req.query;
    
    if (!start || !end) {
      return res.status(400).json({ error: 'Start- und Enddatum erforderlich' });
    }
    
    const costs = await Material.getMaterialCosts(new Date(start), new Date(end));
    res.json(costs);
  } catch (error) {
    console.error('Error fetching material costs:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Materialkosten' });
  }
});

// DELETE /api/materials/:id - Material deaktivieren
router.delete('/:id', auth, async (req, res) => {
  try {
    const material = await Material.delete(req.params.id);
    if (!material) {
      return res.status(404).json({ error: 'Material nicht gefunden' });
    }
    res.json({ message: 'Material deaktiviert', material });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({ error: 'Fehler beim Löschen des Materials' });
  }
});

module.exports = router;