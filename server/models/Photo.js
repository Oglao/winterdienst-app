const db = require('../database/db');

class Photo {
  static async findAll() {
    return await db('photos_with_details').select('*');
  }

  static async findById(id) {
    const photo = await db('photos_with_details').where({ id }).first();
    return photo;
  }

  static async create(photoData) {
    const [photo] = await db('photos')
      .insert(photoData)
      .returning('*');
    
    // Return with details
    return await this.findById(photo.id);
  }

  static async update(id, photoData) {
    const [photo] = await db('photos')
      .where({ id })
      .update(photoData)
      .returning('*');
    
    if (!photo) return null;
    
    // Return with details
    return await this.findById(photo.id);
  }

  static async delete(id) {
    const [photo] = await db('photos')
      .where({ id })
      .del()
      .returning(['id', 'filename']);
    
    return photo;
  }

  static async findByWorker(workerId) {
    return await db('photos_with_details')
      .where({ worker_id: workerId })
      .orderBy('created_at', 'desc')
      .select('*');
  }

  static async findByRoute(routeId) {
    return await db('photos_with_details')
      .where({ route_id: routeId })
      .orderBy('created_at', 'desc')
      .select('*');
  }

  static async findByWorkSession(workSessionId) {
    return await db('photos_with_details')
      .where({ work_session_id: workSessionId })
      .orderBy('created_at', 'desc')
      .select('*');
  }

  static async findByDateRange(startDate, endDate) {
    return await db('photos_with_details')
      .where('created_at', '>=', startDate)
      .where('created_at', '<=', endDate)
      .orderBy('created_at', 'desc')
      .select('*');
  }
}

module.exports = Photo;