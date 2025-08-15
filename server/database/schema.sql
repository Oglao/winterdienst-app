-- Winterdienst App PostgreSQL Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for geographic data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'worker' CHECK (role IN ('worker', 'admin')),
    is_active BOOLEAN DEFAULT true,
    current_location_lat DECIMAL(10, 8),
    current_location_lng DECIMAL(11, 8),
    current_location_timestamp TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Routes Table
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    start_time TIME NOT NULL,
    estimated_duration VARCHAR(100) NOT NULL,
    priority VARCHAR(20) DEFAULT 'mittel' CHECK (priority IN ('niedrig', 'mittel', 'hoch')),
    status VARCHAR(20) DEFAULT 'geplant' CHECK (status IN ('geplant', 'in_arbeit', 'abgeschlossen')),
    assigned_worker_id UUID REFERENCES users(id),
    coordinates JSONB NOT NULL, -- Array of {lat, lng} objects
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Work Sessions Table
CREATE TABLE work_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES users(id),
    route_id UUID NOT NULL REFERENCES routes(id),
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    total_duration INTEGER, -- in minutes
    gps_track JSONB, -- Array of GPS points
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Photos Table
CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    worker_id UUID NOT NULL REFERENCES users(id),
    route_id UUID REFERENCES routes(id),
    work_session_id UUID REFERENCES work_sessions(id),
    location_lat DECIMAL(10, 8) NOT NULL,
    location_lng DECIMAL(11, 8) NOT NULL,
    description TEXT,
    tags TEXT[], -- Array of tags
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

CREATE INDEX idx_routes_status ON routes(status);
CREATE INDEX idx_routes_priority ON routes(priority);
CREATE INDEX idx_routes_assigned_worker ON routes(assigned_worker_id);

CREATE INDEX idx_work_sessions_worker ON work_sessions(worker_id);
CREATE INDEX idx_work_sessions_route ON work_sessions(route_id);
CREATE INDEX idx_work_sessions_start_time ON work_sessions(start_time);

CREATE INDEX idx_photos_worker ON photos(worker_id);
CREATE INDEX idx_photos_route ON photos(route_id);
CREATE INDEX idx_photos_work_session ON photos(work_session_id);
CREATE INDEX idx_photos_created_at ON photos(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_sessions_updated_at BEFORE UPDATE ON work_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photos_updated_at BEFORE UPDATE ON photos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for API access
CREATE VIEW users_public AS
SELECT 
    id,
    name,
    email,
    role,
    is_active,
    current_location_lat,
    current_location_lng,
    current_location_timestamp,
    created_at,
    updated_at
FROM users;

CREATE VIEW routes_with_worker AS
SELECT 
    r.*,
    u.name as worker_name,
    u.email as worker_email
FROM routes r
LEFT JOIN users u ON r.assigned_worker_id = u.id;

CREATE VIEW work_sessions_with_details AS
SELECT 
    ws.*,
    u.name as worker_name,
    r.name as route_name
FROM work_sessions ws
JOIN users u ON ws.worker_id = u.id
JOIN routes r ON ws.route_id = r.id;

CREATE VIEW photos_with_details AS
SELECT 
    p.*,
    u.name as worker_name,
    r.name as route_name
FROM photos p
JOIN users u ON p.worker_id = u.id
LEFT JOIN routes r ON p.route_id = r.id;