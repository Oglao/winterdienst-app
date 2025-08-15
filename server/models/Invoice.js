const db = require('../database/db');

class Invoice {
  static async findAll() {
    return await db('invoices as i')
      .join('customers as c', 'i.customer_id', 'c.id')
      .leftJoin('projects as p', 'i.project_id', 'p.id')
      .select(
        'i.*',
        'c.name as customer_name',
        'p.name as project_name'
      )
      .orderBy('i.invoice_date', 'desc');
  }

  static async findById(id) {
    const invoice = await db('invoices as i')
      .join('customers as c', 'i.customer_id', 'c.id')
      .leftJoin('projects as p', 'i.project_id', 'p.id')
      .where('i.id', id)
      .select(
        'i.*',
        'c.name as customer_name',
        'c.email as customer_email',
        'c.billing_address',
        'c.tax_number as customer_tax_number',
        'p.name as project_name'
      )
      .first();

    if (invoice) {
      invoice.items = await this.getInvoiceItems(id);
    }

    return invoice;
  }

  static async getInvoiceItems(invoiceId) {
    return await db('invoice_items as ii')
      .leftJoin('work_sessions as ws', 'ii.work_session_id', 'ws.id')
      .leftJoin('routes as r', 'ii.route_id', 'r.id')
      .where('ii.invoice_id', invoiceId)
      .select(
        'ii.*',
        'r.name as route_name',
        'ws.start_time',
        'ws.end_time'
      )
      .orderBy('ii.item_date', 'desc');
  }

  static async create(invoiceData) {
    return await db.transaction(async (trx) => {
      // Generate invoice number
      const year = new Date().getFullYear();
      const lastInvoice = await trx('invoices')
        .whereRaw('EXTRACT(YEAR FROM invoice_date) = ?', [year])
        .orderBy('invoice_number', 'desc')
        .first();

      let invoiceNumber;
      if (lastInvoice) {
        const lastNumber = parseInt(lastInvoice.invoice_number.split('-')[1]);
        invoiceNumber = `${year}-${String(lastNumber + 1).padStart(4, '0')}`;
      } else {
        invoiceNumber = `${year}-0001`;
      }

      const [invoice] = await trx('invoices')
        .insert({
          ...invoiceData,
          invoice_number: invoiceNumber
        })
        .returning('*');

      return invoice;
    });
  }

  static async update(id, invoiceData) {
    const [invoice] = await db('invoices')
      .where({ id })
      .update(invoiceData)
      .returning('*');
    return invoice;
  }

  static async addItem(invoiceId, itemData) {
    const [item] = await db('invoice_items')
      .insert({
        invoice_id: invoiceId,
        ...itemData
      })
      .returning('*');

    // Recalculate invoice totals
    await this.recalculateInvoice(invoiceId);
    
    return item;
  }

  static async removeItem(itemId) {
    const item = await db('invoice_items').where({ id: itemId }).first();
    if (!item) throw new Error('Rechnungsposition nicht gefunden');

    await db('invoice_items').where({ id: itemId }).del();
    await this.recalculateInvoice(item.invoice_id);
    
    return item;
  }

  static async recalculateInvoice(invoiceId) {
    const items = await db('invoice_items')
      .where({ invoice_id: invoiceId })
      .select('total_price');

    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
    
    const invoice = await db('invoices').where({ id: invoiceId }).first();
    const taxRate = invoice.tax_rate || 19.0;
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;

    await db('invoices')
      .where({ id: invoiceId })
      .update({
        subtotal: subtotal.toFixed(2),
        tax_amount: taxAmount.toFixed(2),
        total_amount: totalAmount.toFixed(2)
      });

    return { subtotal, taxAmount, totalAmount };
  }

  static async generateFromWorkSessions(customerId, projectId, sessionIds, billingData = {}) {
    return await db.transaction(async (trx) => {
      // Get work sessions with route info
      const sessions = await trx('work_sessions as ws')
        .join('routes as r', 'ws.route_id', 'r.id')
        .join('users as u', 'ws.worker_id', 'u.id')
        .whereIn('ws.id', sessionIds)
        .select(
          'ws.*',
          'r.name as route_name',
          'u.name as worker_name'
        );

      if (sessions.length === 0) {
        throw new Error('Keine Arbeitssitzungen gefunden');
      }

      // Get customer and project info
      const customer = await trx('customers').where({ id: customerId }).first();
      const project = projectId ? await trx('projects').where({ id: projectId }).first() : null;

      if (!customer) {
        throw new Error('Kunde nicht gefunden');
      }

      // Create invoice
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (customer.payment_terms || 14));

      const [invoice] = await trx('invoices')
        .insert({
          customer_id: customerId,
          project_id: projectId,
          invoice_date: new Date(),
          due_date: dueDate,
          tax_rate: billingData.tax_rate || 19.0,
          notes: billingData.notes || '',
          status: 'draft'
        })
        .returning('*');

      // Generate invoice number
      const year = new Date().getFullYear();
      const lastInvoice = await trx('invoices')
        .whereRaw('EXTRACT(YEAR FROM invoice_date) = ?', [year])
        .where('id', '!=', invoice.id)
        .orderBy('invoice_number', 'desc')
        .first();

      let invoiceNumber;
      if (lastInvoice) {
        const lastNumber = parseInt(lastInvoice.invoice_number.split('-')[1]);
        invoiceNumber = `${year}-${String(lastNumber + 1).padStart(4, '0')}`;
      } else {
        invoiceNumber = `${year}-0001`;
      }

      await trx('invoices')
        .where({ id: invoice.id })
        .update({ invoice_number: invoiceNumber });

      // Add invoice items for each work session
      let subtotal = 0;
      const hourlyRate = project?.hourly_rate || customer.hourly_rate || 50.0;

      for (const session of sessions) {
        const hours = session.total_duration ? session.total_duration / 60 : 0;
        const itemTotal = hours * hourlyRate;
        
        await trx('invoice_items').insert({
          invoice_id: invoice.id,
          work_session_id: session.id,
          route_id: session.route_id,
          description: `${session.route_name} - ${session.worker_name}`,
          quantity: parseFloat(hours.toFixed(2)),
          unit_price: hourlyRate,
          total_price: parseFloat(itemTotal.toFixed(2)),
          item_date: session.start_time
        });

        subtotal += itemTotal;
      }

      // Calculate tax and total
      const taxAmount = (subtotal * (billingData.tax_rate || 19.0)) / 100;
      const totalAmount = subtotal + taxAmount;

      // Update invoice totals
      await trx('invoices')
        .where({ id: invoice.id })
        .update({
          subtotal: subtotal.toFixed(2),
          tax_amount: taxAmount.toFixed(2),
          total_amount: totalAmount.toFixed(2)
        });

      return { ...invoice, invoice_number: invoiceNumber };
    });
  }

  static async markAsPaid(id, paymentDate = null) {
    const [invoice] = await db('invoices')
      .where({ id })
      .update({
        status: 'paid',
        notes: db.raw(`COALESCE(notes, '') || '\nBezahlt am: ${paymentDate || new Date().toISOString().split('T')[0]}'`)
      })
      .returning('*');
    
    return invoice;
  }

  static async getOverdueInvoices() {
    return await db('invoices as i')
      .join('customers as c', 'i.customer_id', 'c.id')
      .where('i.due_date', '<', new Date())
      .whereIn('i.status', ['sent'])
      .select(
        'i.*',
        'c.name as customer_name',
        'c.email as customer_email'
      )
      .orderBy('i.due_date', 'asc');
  }

  static async getInvoiceStats(startDate = null, endDate = null) {
    let query = db('invoices');
    
    if (startDate && endDate) {
      query = query.whereBetween('invoice_date', [startDate, endDate]);
    }

    const stats = await query
      .select(
        db.raw('COUNT(*) as total_invoices'),
        db.raw('SUM(CASE WHEN status = \'paid\' THEN total_amount ELSE 0 END) as paid_amount'),
        db.raw('SUM(CASE WHEN status IN (\'sent\', \'overdue\') THEN total_amount ELSE 0 END) as outstanding_amount'),
        db.raw('SUM(total_amount) as total_amount'),
        db.raw('COUNT(CASE WHEN status = \'paid\' THEN 1 END) as paid_count'),
        db.raw('COUNT(CASE WHEN status IN (\'sent\', \'overdue\') THEN 1 END) as outstanding_count')
      )
      .first();

    return stats;
  }

  static async delete(id) {
    return await db.transaction(async (trx) => {
      // Delete invoice items first
      await trx('invoice_items').where({ invoice_id: id }).del();
      
      // Delete invoice
      const [invoice] = await trx('invoices')
        .where({ id })
        .del()
        .returning(['id', 'invoice_number']);
      
      return invoice;
    });
  }
}

module.exports = Invoice;