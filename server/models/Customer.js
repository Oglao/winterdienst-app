const db = require('../database/db');
const bcrypt = require('bcryptjs');

class Customer {
  static async findAll() {
    return await db('customers').where({ is_active: true }).orderBy('name');
  }

  static async findById(id) {
    return await db('customers').where({ id }).first();
  }

  static async findByEmail(email) {
    return await db('customers').where({ email }).first();
  }

  static async create(customerData) {
    const [customer] = await db('customers')
      .insert(customerData)
      .returning('*');
    return customer;
  }

  static async update(id, customerData) {
    const [customer] = await db('customers')
      .where({ id })
      .update(customerData)
      .returning('*');
    return customer;
  }

  static async delete(id) {
    const [customer] = await db('customers')
      .where({ id })
      .update({ is_active: false })
      .returning(['id', 'name']);
    return customer;
  }

  // Projects Management
  static async getProjects(customerId) {
    return await db('projects')
      .where({ customer_id: customerId })
      .orderBy('created_at', 'desc');
  }

  static async createProject(customerId, projectData) {
    const [project] = await db('projects')
      .insert({
        customer_id: customerId,
        ...projectData
      })
      .returning('*');
    return project;
  }

  static async updateProject(projectId, projectData) {
    const [project] = await db('projects')
      .where({ id: projectId })
      .update(projectData)
      .returning('*');
    return project;
  }

  // Portal Access Management
  static async createPortalAccess(customerId, email, password) {
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    const [access] = await db('customer_portal_access')
      .insert({
        customer_id: customerId,
        email,
        password_hash
      })
      .returning(['id', 'email', 'is_active']);
    
    return access;
  }

  static async validatePortalLogin(email, password) {
    const access = await db('customer_portal_access')
      .where({ email, is_active: true })
      .first();
    
    if (!access) return null;
    
    const isValid = await bcrypt.compare(password, access.password_hash);
    if (!isValid) return null;
    
    // Update last login
    await db('customer_portal_access')
      .where({ id: access.id })
      .update({ last_login: new Date() });
    
    return access;
  }

  static async getCustomerStatus(customerId) {
    const customer = await this.findById(customerId);
    if (!customer) return null;

    // Get active projects
    const projects = await db('projects')
      .where({ customer_id: customerId, status: 'active' });

    // Get recent work sessions
    const recentSessions = await db('work_sessions as ws')
      .join('routes as r', 'ws.route_id', 'r.id')
      .join('projects as p', 'r.project_id', 'p.id')
      .join('users as u', 'ws.worker_id', 'u.id')
      .where('p.customer_id', customerId)
      .where('ws.start_time', '>=', db.raw("CURRENT_DATE - INTERVAL '7 days'"))
      .select(
        'ws.*',
        'r.name as route_name',
        'p.name as project_name',
        'u.name as worker_name'
      )
      .orderBy('ws.start_time', 'desc');

    // Get billing summary
    const billingSummary = await db('project_billing_summary')
      .where('customer_name', customer.name);

    // Get pending invoices
    const pendingInvoices = await db('invoices')
      .where({ customer_id: customerId })
      .whereIn('status', ['sent', 'overdue'])
      .orderBy('due_date', 'asc');

    return {
      customer,
      projects,
      recent_sessions: recentSessions,
      billing_summary: billingSummary,
      pending_invoices: pendingInvoices,
      total_active_projects: projects.length,
      recent_activity_count: recentSessions.length
    };
  }

  static async getCustomerRoutes(customerId, status = null) {
    let query = db('routes as r')
      .join('projects as p', 'r.project_id', 'p.id')
      .join('customers as c', 'p.customer_id', 'c.id')
      .where('c.id', customerId)
      .select('r.*', 'p.name as project_name');

    if (status) {
      query = query.where('r.status', status);
    }

    return await query.orderBy('r.created_at', 'desc');
  }

  static async getCustomerInvoices(customerId, status = null) {
    let query = db('invoices').where({ customer_id: customerId });
    
    if (status) {
      query = query.where('status', status);
    }
    
    return await query.orderBy('invoice_date', 'desc');
  }

  static async getCustomerMetrics(customerId, startDate = null, endDate = null) {
    let baseQuery = db('work_sessions as ws')
      .join('routes as r', 'ws.route_id', 'r.id')
      .join('projects as p', 'r.project_id', 'p.id')
      .where('p.customer_id', customerId);

    if (startDate && endDate) {
      baseQuery = baseQuery.whereBetween('ws.start_time', [startDate, endDate]);
    } else {
      // Default to last 30 days
      baseQuery = baseQuery.where('ws.start_time', '>=', db.raw("CURRENT_DATE - INTERVAL '30 days'"));
    }

    const metrics = await baseQuery
      .select(
        db.raw('COUNT(DISTINCT ws.id) as total_sessions'),
        db.raw('COUNT(DISTINCT r.id) as routes_serviced'),
        db.raw('SUM(ws.total_duration) as total_minutes'),
        db.raw('ROUND(SUM(ws.total_duration) / 60.0, 2) as total_hours'),
        db.raw('SUM(ws.distance_km) as total_distance'),
        db.raw('COUNT(DISTINCT ws.worker_id) as workers_involved')
      )
      .first();

    // Get material usage for this customer
    const materialUsage = await db('material_usage as mu')
      .join('routes as r', 'mu.route_id', 'r.id')
      .join('projects as p', 'r.project_id', 'p.id')
      .join('materials as m', 'mu.material_id', 'm.id')
      .where('p.customer_id', customerId)
      .select(
        'm.name as material_name',
        db.raw('SUM(mu.amount_used) as total_amount'),
        'm.unit'
      )
      .groupBy('m.id', 'm.name', 'm.unit');

    return {
      ...metrics,
      material_usage: materialUsage
    };
  }

  static async searchCustomers(searchTerm) {
    return await db('customers')
      .where('is_active', true)
      .where(function() {
        this.whereILike('name', `%${searchTerm}%`)
          .orWhereILike('contact_person', `%${searchTerm}%`)
          .orWhereILike('email', `%${searchTerm}%`);
      })
      .orderBy('name');
  }
}

module.exports = Customer;