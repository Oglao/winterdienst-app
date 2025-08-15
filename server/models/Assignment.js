const db = require('../database/db');

class Assignment {
  static async findAll() {
    return await db('assignments as a')
      .join('routes as r', 'a.route_id', 'r.id')
      .join('users as u', 'a.worker_id', 'u.id')
      .join('vehicles as v', 'a.vehicle_id', 'v.id')
      .select(
        'a.*',
        'r.name as route_name',
        'r.priority as route_priority',
        'r.status as route_status',
        'u.name as worker_name',
        'u.email as worker_email',
        'v.license_plate',
        'v.brand',
        'v.model'
      )
      .orderBy('a.created_at', 'desc');
  }

  static async findById(id) {
    return await db('assignments as a')
      .join('routes as r', 'a.route_id', 'r.id')
      .join('users as u', 'a.worker_id', 'u.id')
      .join('vehicles as v', 'a.vehicle_id', 'v.id')
      .where('a.id', id)
      .select(
        'a.*',
        'r.name as route_name',
        'r.priority as route_priority',
        'u.name as worker_name',
        'u.email as worker_email',
        'v.license_plate',
        'v.brand',
        'v.model'
      )
      .first();
  }

  static async create(assignmentData) {
    return await db.transaction(async (trx) => {
      const { route_id, worker_id, vehicle_id, scheduled_start, notes } = assignmentData;

      // Check if route is already assigned
      const existingAssignment = await trx('assignments')
        .where({ route_id, status: 'active' })
        .first();

      if (existingAssignment) {
        throw new Error('Route ist bereits zugewiesen');
      }

      // Check if worker is available
      const workerAssignments = await trx('assignments')
        .where({ worker_id, status: 'active' })
        .count('* as count')
        .first();

      if (parseInt(workerAssignments.count) > 0) {
        throw new Error('Mitarbeiter ist bereits einer Route zugewiesen');
      }

      // Check if vehicle is available
      const vehicleAssignments = await trx('assignments')
        .where({ vehicle_id, status: 'active' })
        .count('* as count')
        .first();

      if (parseInt(vehicleAssignments.count) > 0) {
        throw new Error('Fahrzeug ist bereits einer Route zugewiesen');
      }

      // Create assignment
      const [assignment] = await trx('assignments')
        .insert({
          route_id,
          worker_id,
          vehicle_id,
          scheduled_start: scheduled_start || new Date(),
          status: 'active',
          notes
        })
        .returning('*');

      // Update route assignment
      await trx('routes')
        .where({ id: route_id })
        .update({ assigned_worker_id: worker_id });

      // Update vehicle assignment
      await trx('vehicles')
        .where({ id: vehicle_id })
        .update({ assigned_user_id: worker_id });

      return assignment;
    });
  }

  static async update(id, assignmentData) {
    const [assignment] = await db('assignments')
      .where({ id })
      .update(assignmentData)
      .returning('*');
    return assignment;
  }

  static async delete(id) {
    return await db.transaction(async (trx) => {
      // Get assignment details
      const assignment = await trx('assignments').where({ id }).first();
      
      if (assignment) {
        // Remove route assignment
        await trx('routes')
          .where({ id: assignment.route_id })
          .update({ assigned_worker_id: null });

        // Remove vehicle assignment
        await trx('vehicles')
          .where({ id: assignment.vehicle_id })
          .update({ assigned_user_id: null });

        // Delete assignment
        await trx('assignments').where({ id }).del();
      }

      return assignment;
    });
  }

  static async getResourceAvailability(date = null) {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get available vehicles
    const availableVehicles = await db('vehicles as v')
      .leftJoin('assignments as a', function() {
        this.on('v.id', '=', 'a.vehicle_id')
            .andOn('a.status', '=', db.raw('?', ['active']))
            .andOn('a.scheduled_start', '>=', db.raw('?', [startOfDay]))
            .andOn('a.scheduled_start', '<=', db.raw('?', [endOfDay]));
      })
      .where('v.is_active', true)
      .whereNull('a.id')
      .select('v.*');

    // Get available workers
    const availableWorkers = await db('users as u')
      .leftJoin('assignments as a', function() {
        this.on('u.id', '=', 'a.worker_id')
            .andOn('a.status', '=', db.raw('?', ['active']))
            .andOn('a.scheduled_start', '>=', db.raw('?', [startOfDay]))
            .andOn('a.scheduled_start', '<=', db.raw('?', [endOfDay]));
      })
      .where('u.is_active', true)
      .where('u.role', 'worker')
      .whereNull('a.id')
      .select('u.*');

    // Get unassigned routes
    const unassignedRoutes = await db('routes as r')
      .leftJoin('assignments as a', function() {
        this.on('r.id', '=', 'a.route_id')
            .andOn('a.status', '=', db.raw('?', ['active']));
      })
      .where('r.status', '!=', 'abgeschlossen')
      .whereNull('a.id')
      .select('r.*');

    return {
      available_vehicles: availableVehicles,
      available_workers: availableWorkers,
      unassigned_routes: unassignedRoutes,
      resource_summary: {
        vehicles_available: availableVehicles.length,
        workers_available: availableWorkers.length,
        routes_needing_assignment: unassignedRoutes.length,
        can_fulfill_all: availableVehicles.length >= unassignedRoutes.length && 
                        availableWorkers.length >= unassignedRoutes.length
      }
    };
  }

  static async generateOptimalAssignments(date = null) {
    const availability = await this.getResourceAvailability(date);
    const { available_vehicles, available_workers, unassigned_routes } = availability;

    if (unassigned_routes.length === 0) {
      return { assignments: [], conflicts: [] };
    }

    const assignments = [];
    const conflicts = [];

    // Sort routes by priority (hoch, mittel, niedrig)
    const priorityOrder = { 'hoch': 3, 'mittel': 2, 'niedrig': 1 };
    unassigned_routes.sort((a, b) => 
      (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
    );

    let vehicleIndex = 0;
    let workerIndex = 0;

    for (const route of unassigned_routes) {
      const assignment = {
        route_id: route.id,
        route_name: route.name,
        route_priority: route.priority,
        vehicle_id: null,
        worker_id: null,
        conflicts: []
      };

      // Assign vehicle
      if (vehicleIndex < available_vehicles.length) {
        assignment.vehicle_id = available_vehicles[vehicleIndex].id;
        assignment.vehicle_info = available_vehicles[vehicleIndex];
        vehicleIndex++;
      } else {
        assignment.conflicts.push('Kein Fahrzeug verfügbar');
      }

      // Assign worker
      if (workerIndex < available_workers.length) {
        assignment.worker_id = available_workers[workerIndex].id;
        assignment.worker_info = available_workers[workerIndex];
        workerIndex++;
      } else {
        assignment.conflicts.push('Kein Mitarbeiter verfügbar');
      }

      assignments.push(assignment);

      // Track conflicts
      if (assignment.conflicts.length > 0) {
        conflicts.push({
          route: route.name,
          issues: assignment.conflicts
        });
      }
    }

    // Check for overall resource shortages
    if (unassigned_routes.length > available_vehicles.length) {
      conflicts.push({
        type: 'vehicle_shortage',
        message: `${unassigned_routes.length - available_vehicles.length} Routen können nicht mit Fahrzeugen versorgt werden`
      });
    }

    if (unassigned_routes.length > available_workers.length) {
      conflicts.push({
        type: 'worker_shortage',
        message: `${unassigned_routes.length - available_workers.length} Routen können nicht mit Mitarbeitern versorgt werden`
      });
    }

    return { assignments, conflicts };
  }

  static async createBulkAssignments(assignmentsList) {
    const results = [];
    const errors = [];

    for (const assignmentData of assignmentsList) {
      try {
        const assignment = await this.create(assignmentData);
        results.push(assignment);
      } catch (error) {
        errors.push({
          assignment: assignmentData,
          error: error.message
        });
      }
    }

    return { success: results, errors };
  }

  static async getAssignmentStats(startDate = null, endDate = null) {
    let query = db('assignments as a')
      .join('routes as r', 'a.route_id', 'r.id');

    if (startDate && endDate) {
      query = query.whereBetween('a.created_at', [startDate, endDate]);
    }

    const stats = await query
      .select(
        db.raw('COUNT(*) as total_assignments'),
        db.raw('COUNT(CASE WHEN a.status = \'active\' THEN 1 END) as active_assignments'),
        db.raw('COUNT(CASE WHEN a.status = \'completed\' THEN 1 END) as completed_assignments'),
        db.raw('COUNT(CASE WHEN r.status = \'abgeschlossen\' THEN 1 END) as successful_routes'),
        db.raw('AVG(CASE WHEN r.status = \'abgeschlossen\' THEN 1.0 ELSE 0.0 END) * 100 as success_rate')
      )
      .first();

    return stats;
  }
}

module.exports = Assignment;