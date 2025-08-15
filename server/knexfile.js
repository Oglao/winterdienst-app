const path = require('path');

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5433,
      database: process.env.DB_NAME || 'winterdienst',
      user: process.env.DB_USER || 'azahel',
      password: process.env.DB_PASSWORD || 'admin'
    },
    migrations: {
      directory: path.join(__dirname, 'database/migrations')
    },
    seeds: {
      directory: path.join(__dirname, 'database/seeds')
    }
  },

  sqlite: {
    client: 'sqlite3',
    connection: {
      filename: path.join(__dirname, 'database/winterdienst.db')
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, 'database/migrations')
    },
    seeds: {
      directory: path.join(__dirname, 'database/seeds')
    }
  },

  postgresql: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'winterdienst',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password'
    },
    migrations: {
      directory: path.join(__dirname, 'database/migrations')
    },
    seeds: {
      directory: path.join(__dirname, 'database/seeds')
    }
  },

  production: {
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    },
    migrations: {
      directory: path.join(__dirname, 'database/migrations')
    },
    seeds: {
      directory: path.join(__dirname, 'database/seeds')
    }
  }
};