const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const auth = require('../middleware/auth');

// GET /api/invoices - Alle Rechnungen
router.get('/', auth, async (req, res) => {
  try {
    const invoices = await Invoice.findAll();
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Rechnungen' });
  }
});

// GET /api/invoices/:id - Einzelne Rechnung
router.get('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Rechnung nicht gefunden' });
    }
    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Rechnung' });
  }
});

// POST /api/invoices - Neue Rechnung erstellen
router.post('/', auth, async (req, res) => {
  try {
    const invoice = await Invoice.create(req.body);
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen der Rechnung' });
  }
});

// PUT /api/invoices/:id - Rechnung aktualisieren
router.put('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.update(req.params.id, req.body);
    if (!invoice) {
      return res.status(404).json({ error: 'Rechnung nicht gefunden' });
    }
    res.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Rechnung' });
  }
});

// DELETE /api/invoices/:id - Rechnung löschen
router.delete('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.delete(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Rechnung nicht gefunden' });
    }
    res.json({ message: 'Rechnung gelöscht', invoice });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: 'Fehler beim Löschen der Rechnung' });
  }
});

// GET /api/invoices/:id/items - Rechnungspositionen
router.get('/:id/items', auth, async (req, res) => {
  try {
    const items = await Invoice.getInvoiceItems(req.params.id);
    res.json(items);
  } catch (error) {
    console.error('Error fetching invoice items:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Rechnungspositionen' });
  }
});

// POST /api/invoices/:id/items - Rechnungsposition hinzufügen
router.post('/:id/items', auth, async (req, res) => {
  try {
    const item = await Invoice.addItem(req.params.id, req.body);
    res.status(201).json(item);
  } catch (error) {
    console.error('Error adding invoice item:', error);
    res.status(500).json({ error: 'Fehler beim Hinzufügen der Rechnungsposition' });
  }
});

// DELETE /api/invoices/items/:itemId - Rechnungsposition entfernen
router.delete('/items/:itemId', auth, async (req, res) => {
  try {
    const item = await Invoice.removeItem(req.params.itemId);
    res.json({ message: 'Rechnungsposition entfernt', item });
  } catch (error) {
    console.error('Error removing invoice item:', error);
    res.status(500).json({ error: 'Fehler beim Entfernen der Rechnungsposition' });
  }
});

// POST /api/invoices/generate-from-sessions - Rechnung aus Arbeitssitzungen generieren
router.post('/generate-from-sessions', auth, async (req, res) => {
  try {
    const { customer_id, project_id, session_ids, billing_data } = req.body;
    
    if (!customer_id || !session_ids || !Array.isArray(session_ids)) {
      return res.status(400).json({ error: 'Kunden-ID und Sitzungs-IDs erforderlich' });
    }
    
    const invoice = await Invoice.generateFromWorkSessions(
      customer_id, 
      project_id, 
      session_ids, 
      billing_data
    );
    
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Error generating invoice from sessions:', error);
    res.status(500).json({ error: 'Fehler beim Generieren der Rechnung' });
  }
});

// PUT /api/invoices/:id/mark-paid - Rechnung als bezahlt markieren
router.put('/:id/mark-paid', auth, async (req, res) => {
  try {
    const { payment_date } = req.body;
    const invoice = await Invoice.markAsPaid(req.params.id, payment_date);
    res.json(invoice);
  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    res.status(500).json({ error: 'Fehler beim Markieren als bezahlt' });
  }
});

// PUT /api/invoices/:id/recalculate - Rechnung neu berechnen
router.put('/:id/recalculate', auth, async (req, res) => {
  try {
    const totals = await Invoice.recalculateInvoice(req.params.id);
    res.json(totals);
  } catch (error) {
    console.error('Error recalculating invoice:', error);
    res.status(500).json({ error: 'Fehler beim Neuberechnen der Rechnung' });
  }
});

// GET /api/invoices/overdue - Überfällige Rechnungen
router.get('/overdue', auth, async (req, res) => {
  try {
    const overdueInvoices = await Invoice.getOverdueInvoices();
    res.json(overdueInvoices);
  } catch (error) {
    console.error('Error fetching overdue invoices:', error);
    res.status(500).json({ error: 'Fehler beim Laden der überfälligen Rechnungen' });
  }
});

// GET /api/invoices/stats - Rechnungsstatistiken
router.get('/stats', auth, async (req, res) => {
  try {
    const { start, end } = req.query;
    const startDate = start ? new Date(start) : null;
    const endDate = end ? new Date(end) : null;
    
    const stats = await Invoice.getInvoiceStats(startDate, endDate);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching invoice stats:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Rechnungsstatistiken' });
  }
});

module.exports = router;