const db = require('../database/db');

class Route {
  static async findAll() {
    return await db('routes_with_worker').select('*');
  }

  static async findById(id) {
    const route = await db('routes_with_worker').where({ id }).first();
    return route;
  }

  static async create(routeData) {
    const [route] = await db('routes')
      .insert(routeData)
      .returning('*');
    
    // Return with worker details
    return await this.findById(route.id);
  }

  static async update(id, routeData) {
    const [route] = await db('routes')
      .where({ id })
      .update(routeData)
      .returning('*');
    
    if (!route) return null;
    
    // Return with worker details
    return await this.findById(route.id);
  }

  static async delete(id) {
    const [route] = await db('routes')
      .where({ id })
      .del()
      .returning(['id', 'name']);
    
    return route;
  }

  static async findByWorker(workerId) {
    return await db('routes_with_worker')
      .where({ assigned_worker_id: workerId })
      .select('*');
  }

  static async findByStatus(status) {
    return await db('routes_with_worker')
      .where({ status })
      .select('*');
  }

  static async updateStatus(id, status) {
    const [route] = await db('routes')
      .where({ id })
      .update({ 
        status,
        ...(status === 'in_arbeit' && { started_at: new Date() }),
        ...(status === 'abgeschlossen' && { completed_at: new Date() })
      })
      .returning('*');
    
    if (!route) return null;
    
    return await this.findById(route.id);
  }
}

module.exports = Route;