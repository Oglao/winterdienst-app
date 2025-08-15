const knex = require('knex');
const knexConfig = require('../knexfile');

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

const db = knex(config);

// Test database connection
db.raw('SELECT 1')
  .then(() => {
    console.log('PostgreSQL verbunden');
  })
  .catch((err) => {
    console.error('PostgreSQL Verbindungsfehler:', err);
  });

module.exports = db;