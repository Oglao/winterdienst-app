const db = require('../database/db');

class Material {
  static async findAll() {
    return await db('materials').where({ is_active: true }).orderBy('name');
  }

  static async findById(id) {
    return await db('materials').where({ id }).first();
  }

  static async create(materialData) {
    const [material] = await db('materials')
      .insert(materialData)
      .returning('*');
    return material;
  }

  static async update(id, materialData) {
    const [material] = await db('materials')
      .where({ id })
      .update(materialData)
      .returning('*');
    return material;
  }

  static async updateStock(id, stockChange, reason = null) {
    const material = await this.findById(id);
    if (!material) throw new Error('Material nicht gefunden');

    const newStock = parseFloat(material.current_stock) + parseFloat(stockChange);
    
    await db.transaction(async (trx) => {
      await trx('materials')
        .where({ id })
        .update({ current_stock: newStock });

      // Log stock change
      await trx('stock_movements').insert({
        material_id: id,
        change_amount: stockChange,
        new_stock: newStock,
        reason: reason,
        created_at: new Date()
      });
    });

    return await this.findById(id);
  }

  static async addUsage(usageData) {
    const {
      work_session_id,
      route_id,
      material_id,
      amount_used,
      area_covered,
      weather_condition,
      surface_type,
      notes
    } = usageData;

    return await db.transaction(async (trx) => {
      // Add usage record
      const [usage] = await trx('material_usage')
        .insert({
          work_session_id,
          route_id,
          material_id,
          amount_used,
          area_covered,
          weather_condition,
          surface_type,
          notes
        })
        .returning('*');

      // Update material stock
      await trx('materials')
        .where({ id: material_id })
        .decrement('current_stock', amount_used);

      return usage;
    });
  }

  static async getUsageByRoute(routeId) {
    return await db('material_usage as mu')
      .join('materials as m', 'mu.material_id', 'm.id')
      .join('routes as r', 'mu.route_id', 'r.id')
      .where('mu.route_id', routeId)
      .select(
        'mu.*',
        'm.name as material_name',
        'm.unit',
        'm.cost_per_unit',
        'r.name as route_name'
      )
      .orderBy('mu.created_at', 'desc');
  }

  static async getUsageBySession(sessionId) {
    return await db('material_usage as mu')
      .join('materials as m', 'mu.material_id', 'm.id')
      .where('mu.work_session_id', sessionId)
      .select(
        'mu.*',
        'm.name as material_name',
        'm.unit',
        'm.cost_per_unit'
      );
  }

  static async getUsageSummary(startDate = null, endDate = null) {
    let query = db('material_usage_summary');
    
    if (startDate && endDate) {
      query = db('material_usage as mu')
        .join('materials as m', 'mu.material_id', 'm.id')
        .whereBetween('mu.created_at', [startDate, endDate])
        .select(
          'm.name as material_name',
          'm.unit',
          db.raw('SUM(mu.amount_used) as total_used'),
          db.raw('AVG(mu.amount_used) as avg_per_session'),
          db.raw('COUNT(mu.id) as usage_count'),
          db.raw('SUM(mu.amount_used * m.cost_per_unit) as total_cost')
        )
        .groupBy('m.id', 'm.name', 'm.unit');
    }
    
    return await query;
  }

  static async getEfficiencyMetrics(materialId, days = 30) {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

    return await db('material_usage as mu')
      .join('materials as m', 'mu.material_id', 'm.id')
      .join('routes as r', 'mu.route_id', 'r.id')
      .where('mu.material_id', materialId)
      .whereBetween('mu.created_at', [startDate, endDate])
      .select(
        db.raw('AVG(mu.amount_used / NULLIF(mu.area_covered, 0)) as avg_usage_per_sqm'),
        db.raw('AVG(mu.amount_used / NULLIF(EXTRACT(EPOCH FROM (ws.end_time - ws.start_time))/3600, 0)) as avg_usage_per_hour'),
        db.raw('COUNT(DISTINCT mu.route_id) as routes_covered'),
        db.raw('SUM(mu.area_covered) as total_area_covered'),
        db.raw('SUM(mu.amount_used) as total_amount_used')
      )
      .leftJoin('work_sessions as ws', 'mu.work_session_id', 'ws.id')
      .first();
  }

  static async getLowStockAlerts() {
    return await db('materials')
      .where('is_active', true)
      .whereRaw('current_stock <= min_stock_alert')
      .select('*');
  }

  static async getMaterialCosts(startDate, endDate) {
    return await db('material_usage as mu')
      .join('materials as m', 'mu.material_id', 'm.id')
      .whereBetween('mu.created_at', [startDate, endDate])
      .select(
        'm.name as material_name',
        db.raw('SUM(mu.amount_used) as total_used'),
        db.raw('SUM(mu.amount_used * m.cost_per_unit) as total_cost'),
        db.raw('AVG(m.cost_per_unit) as avg_unit_cost')
      )
      .groupBy('m.id', 'm.name')
      .orderBy('total_cost', 'desc');
  }

  static async delete(id) {
    const [material] = await db('materials')
      .where({ id })
      .update({ is_active: false })
      .returning(['id', 'name']);
    return material;
  }
}

module.exports = Material;