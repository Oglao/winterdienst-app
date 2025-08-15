const db = require('../database/db');
const bcrypt = require('bcryptjs');

class User {
  static async findAll() {
    return await db('users_public').select('*');
  }

  static async findById(id) {
    const user = await db('users_public').where({ id }).first();
    return user;
  }

  static async findByEmail(email) {
    const user = await db('users').where({ email }).first();
    return user;
  }

  static async create(userData) {
    const { name, email, password, role = 'worker' } = userData;
    
    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    const [user] = await db('users')
      .insert({
        name,
        email,
        password_hash,
        role
      })
      .returning(['id', 'name', 'email', 'role', 'is_active', 'created_at', 'updated_at']);
    
    return user;
  }

  static async update(id, userData) {
    const updateData = { ...userData };
    
    // Hash password if provided
    if (updateData.password) {
      const saltRounds = 10;
      updateData.password_hash = await bcrypt.hash(updateData.password, saltRounds);
      delete updateData.password;
    }
    
    const [user] = await db('users')
      .where({ id })
      .update(updateData)
      .returning(['id', 'name', 'email', 'role', 'is_active', 'created_at', 'updated_at']);
    
    return user;
  }

  static async delete(id) {
    const [user] = await db('users')
      .where({ id })
      .update({ is_active: false })
      .returning(['id', 'name', 'email']);
    
    return user;
  }

  static async updateLocation(id, location) {
    const [user] = await db('users')
      .where({ id })
      .update({
        current_location_lat: location.lat,
        current_location_lng: location.lng,
        current_location_timestamp: new Date()
      })
      .returning(['id', 'name']);
    
    return user;
  }

  static async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;