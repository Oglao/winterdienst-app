const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');

// GET /api/customers - Alle Kunden
router.get('/', auth, async (req, res) => {
  try {
    const { search } = req.query;
    
    let customers;
    if (search) {
      customers = await Customer.searchCustomers(search);
    } else {
      customers = await Customer.findAll();
    }
    
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Kunden' });
  }
});

// GET /api/customers/:id - Einzelner Kunde
router.get('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Kunde nicht gefunden' });
    }
    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Fehler beim Laden des Kunden' });
  }
});

// POST /api/customers - Neuen Kunden erstellen
router.post('/', auth, async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'E-Mail bereits vergeben' });
    }
    res.status(500).json({ error: 'Fehler beim Erstellen des Kunden' });
  }
});

// PUT /api/customers/:id - Kunde aktualisieren
router.put('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.update(req.params.id, req.body);
    if (!customer) {
      return res.status(404).json({ error: 'Kunde nicht gefunden' });
    }
    res.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Kunden' });
  }
});

// DELETE /api/customers/:id - Kunde deaktivieren
router.delete('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.delete(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Kunde nicht gefunden' });
    }
    res.json({ message: 'Kunde deaktiviert', customer });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Fehler beim Löschen des Kunden' });
  }
});

// GET /api/customers/:id/status - Kundenstatus für Portal
router.get('/:id/status', auth, async (req, res) => {
  try {
    const status = await Customer.getCustomerStatus(req.params.id);
    if (!status) {
      return res.status(404).json({ error: 'Kunde nicht gefunden' });
    }
    res.json(status);
  } catch (error) {
    console.error('Error fetching customer status:', error);
    res.status(500).json({ error: 'Fehler beim Laden des Kundenstatus' });
  }
});

// GET /api/customers/:id/projects - Kundenprojekte
router.get('/:id/projects', auth, async (req, res) => {
  try {
    const projects = await Customer.getProjects(req.params.id);
    res.json(projects);
  } catch (error) {
    console.error('Error fetching customer projects:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Kundenprojekte' });
  }
});

// POST /api/customers/:id/projects - Neues Projekt erstellen
router.post('/:id/projects', auth, async (req, res) => {
  try {
    const project = await Customer.createProject(req.params.id, req.body);
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen des Projekts' });
  }
});

// PUT /api/customers/projects/:projectId - Projekt aktualisieren
router.put('/projects/:projectId', auth, async (req, res) => {
  try {
    const project = await Customer.updateProject(req.params.projectId, req.body);
    if (!project) {
      return res.status(404).json({ error: 'Projekt nicht gefunden' });
    }
    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Projekts' });
  }
});

// GET /api/customers/:id/routes - Kundenrouten
router.get('/:id/routes', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const routes = await Customer.getCustomerRoutes(req.params.id, status);
    res.json(routes);
  } catch (error) {
    console.error('Error fetching customer routes:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Kundenrouten' });
  }
});

// GET /api/customers/:id/invoices - Kundenrechnungen
router.get('/:id/invoices', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const invoices = await Customer.getCustomerInvoices(req.params.id, status);
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching customer invoices:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Kundenrechnungen' });
  }
});

// GET /api/customers/:id/metrics - Kunden-Metriken
router.get('/:id/metrics', auth, async (req, res) => {
  try {
    const { start, end } = req.query;
    const startDate = start ? new Date(start) : null;
    const endDate = end ? new Date(end) : null;
    
    const metrics = await Customer.getCustomerMetrics(req.params.id, startDate, endDate);
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching customer metrics:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Kunden-Metriken' });
  }
});

// POST /api/customers/:id/portal-access - Portal-Zugang erstellen
router.post('/:id/portal-access', auth, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'E-Mail und Passwort erforderlich' });
    }
    
    const access = await Customer.createPortalAccess(req.params.id, email, password);
    res.status(201).json(access);
  } catch (error) {
    console.error('Error creating portal access:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'E-Mail bereits für Portal-Zugang verwendet' });
    }
    res.status(500).json({ error: 'Fehler beim Erstellen des Portal-Zugangs' });
  }
});

// POST /api/customers/portal-login - Portal-Login
router.post('/portal-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'E-Mail und Passwort erforderlich' });
    }
    
    const access = await Customer.validatePortalLogin(email, password);
    if (!access) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }
    
    // Here you would typically generate a JWT token for the customer portal
    res.json({ 
      message: 'Login erfolgreich',
      customer_id: access.customer_id,
      email: access.email
    });
  } catch (error) {
    console.error('Error during portal login:', error);
    res.status(500).json({ error: 'Fehler beim Login' });
  }
});

module.exports = router;