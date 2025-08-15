const db = require('../database/db');

class Vehicle {
  static async findAll() {
    return await db('vehicles_with_details').select('*');
  }

  static async findById(id) {
    const vehicle = await db('vehicles_with_details').where({ id }).first();
    return vehicle;
  }

  static async findByUser(userId) {
    return await db('vehicles_with_details').where({ assigned_user_id: userId });
  }

  static async create(vehicleData) {
    const {
      license_plate,
      brand,
      model,
      year,
      fuel_type = 'diesel',
      tank_capacity,
      assigned_user_id,
      current_fuel_level = null
    } = vehicleData;
    
    const [vehicle] = await db('vehicles')
      .insert({
        license_plate,
        brand,
        model,
        year,
        fuel_type,
        tank_capacity,
        assigned_user_id,
        current_fuel_level
      })
      .returning('*');
    
    return vehicle;
  }

  static async update(id, vehicleData) {
    const [vehicle] = await db('vehicles')
      .where({ id })
      .update(vehicleData)
      .returning('*');
    
    return vehicle;
  }

  static async updateFuelLevel(id, fuelLevel, mileage = null) {
    const updateData = {
      current_fuel_level: fuelLevel,
      last_fuel_update: new Date()
    };
    
    if (mileage) {
      updateData.current_mileage = mileage;
    }
    
    const [vehicle] = await db('vehicles')
      .where({ id })
      .update(updateData)
      .returning('*');
    
    return vehicle;
  }

  static async addFuelEntry(vehicleId, fuelData) {
    const {
      amount,
      cost,
      price_per_liter,
      location,
      mileage,
      is_full_tank = false
    } = fuelData;
    
    const [entry] = await db('fuel_entries')
      .insert({
        vehicle_id: vehicleId,
        amount,
        cost,
        price_per_liter,
        location,
        mileage,
        is_full_tank,
        created_at: new Date()
      })
      .returning('*');
    
    return entry;
  }

  static async getFuelHistory(vehicleId, limit = 50) {
    return await db('fuel_entries')
      .where({ vehicle_id: vehicleId })
      .orderBy('created_at', 'desc')
      .limit(limit);
  }

  static async calculateConsumption(vehicleId, routeId = null) {
    let query = db('work_sessions as ws')
      .join('vehicles as v', 'v.assigned_user_id', 'ws.worker_id')
      .where('v.id', vehicleId);
    
    if (routeId) {
      query = query.where('ws.route_id', routeId);
    }
    
    const sessions = await query
      .select('ws.*', 'v.fuel_type')
      .whereNotNull('ws.distance_km')
      .whereNotNull('ws.fuel_consumed');
    
    if (sessions.length === 0) return null;
    
    const totalDistance = sessions.reduce((sum, s) => sum + (s.distance_km || 0), 0);
    const totalFuel = sessions.reduce((sum, s) => sum + (s.fuel_consumed || 0), 0);
    
    return {
      avg_consumption: totalDistance > 0 ? (totalFuel / totalDistance * 100).toFixed(2) : 0,
      total_distance: totalDistance,
      total_fuel: totalFuel,
      sessions_count: sessions.length
    };
  }

  static async getMaintenanceAlerts(vehicleId) {
    const vehicle = await this.findById(vehicleId);
    if (!vehicle) return [];
    
    const alerts = [];
    const currentMileage = vehicle.current_mileage || 0;
    
    // Ölwechsel (alle 15.000 km)
    if (vehicle.last_oil_change_mileage) {
      const oilChangeKm = currentMileage - vehicle.last_oil_change_mileage;
      if (oilChangeKm >= 15000) {
        alerts.push({
          type: 'oil_change',
          priority: 'high',
          message: 'Ölwechsel fällig',
          overdue_km: oilChangeKm - 15000
        });
      } else if (oilChangeKm >= 13000) {
        alerts.push({
          type: 'oil_change',
          priority: 'medium',
          message: 'Ölwechsel bald fällig',
          remaining_km: 15000 - oilChangeKm
        });
      }
    }
    
    // TÜV-Prüfung
    if (vehicle.tuv_expiry_date) {
      const tuvDate = new Date(vehicle.tuv_expiry_date);
      const today = new Date();
      const daysUntilTuv = Math.ceil((tuvDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntilTuv < 0) {
        alerts.push({
          type: 'tuv',
          priority: 'high',
          message: 'TÜV abgelaufen',
          overdue_days: Math.abs(daysUntilTuv)
        });
      } else if (daysUntilTuv <= 30) {
        alerts.push({
          type: 'tuv',
          priority: 'medium',
          message: 'TÜV läuft bald ab',
          remaining_days: daysUntilTuv
        });
      }
    }
    
    return alerts;
  }

  static async delete(id) {
    const [vehicle] = await db('vehicles')
      .where({ id })
      .update({ is_active: false })
      .returning(['id', 'license_plate']);
    
    return vehicle;
  }
}

module.exports = Vehicle;