const db = require('../database/db');

class WorkSession {
  static async findAll() {
    return await db('work_sessions_with_details').select('*');
  }

  static async findById(id) {
    const session = await db('work_sessions_with_details').where({ id }).first();
    return session;
  }

  static async create(sessionData) {
    const [session] = await db('work_sessions')
      .insert(sessionData)
      .returning('*');
    
    // Return with details
    return await this.findById(session.id);
  }

  static async update(id, sessionData) {
    const [session] = await db('work_sessions')
      .where({ id })
      .update(sessionData)
      .returning('*');
    
    if (!session) return null;
    
    // Return with details
    return await this.findById(session.id);
  }

  static async findByWorker(workerId) {
    return await db('work_sessions_with_details')
      .where({ worker_id: workerId })
      .orderBy('start_time', 'desc')
      .select('*');
  }

  static async findByRoute(routeId) {
    return await db('work_sessions_with_details')
      .where({ route_id: routeId })
      .orderBy('start_time', 'desc')
      .select('*');
  }

  static async findActive(workerId) {
    return await db('work_sessions_with_details')
      .where({ worker_id: workerId })
      .whereNull('end_time')
      .first();
  }

  static async addGpsTrack(id, gpsPoint) {
    const session = await db('work_sessions').where({ id }).first();
    if (!session) return null;

    const currentTrack = session.gps_track || [];
    currentTrack.push(gpsPoint);

    const [updatedSession] = await db('work_sessions')
      .where({ id })
      .update({ gps_track: JSON.stringify(currentTrack) })
      .returning('*');

    return updatedSession;
  }

  static async endSession(id, endData) {
    const [session] = await db('work_sessions')
      .where({ id })
      .update({
        end_time: endData.endTime,
        total_duration: endData.totalDuration,
        ...endData
      })
      .returning('*');

    if (!session) return null;

    return await this.findById(session.id);
  }
}

module.exports = WorkSession;