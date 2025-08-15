#!/bin/bash

# Winterdienst App - PostgreSQL Database Setup Script

echo "🏗️  Setting up PostgreSQL database for Winterdienst App..."

# Load environment variables
source .env

# Check if PostgreSQL is running
if ! pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    echo "   - macOS: brew services start postgresql"
    echo "   - Ubuntu: sudo systemctl start postgresql"
    echo "   - Windows: net start postgresql-x64-14"
    exit 1
fi

echo "✅ PostgreSQL is running"

# Create database if it doesn't exist
echo "📦 Creating database '$DB_NAME'..."
createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME 2>/dev/null || echo "Database already exists"

# Run schema setup
echo "🗄️  Setting up database schema..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/schema.sql

# Setup PostgREST roles and permissions
echo "🔐 Setting up PostgREST authentication..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/setup-postgrest.sql

echo "✅ Database setup complete!"
echo ""
echo "🚀 Next steps:"
echo "   1. Install PostgREST: https://postgrest.org/en/stable/install.html"
echo "   2. Start PostgREST: postgrest postgrest.conf"
echo "   3. Start the Node.js server: npm run dev"
echo ""
echo "📋 Connection details:"
echo "   - Database: postgres://$DB_USER:****@$DB_HOST:$DB_PORT/$DB_NAME"
echo "   - PostgREST API: http://localhost:3001"
echo "   - Node.js API: http://localhost:$PORT"