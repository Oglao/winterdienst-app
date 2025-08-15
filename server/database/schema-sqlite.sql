-- Winterdienst App SQLite Schema (für Entwicklung)

-- Users Table
CREATE TABLE users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'worker' CHECK (role IN ('worker', 'admin')),
    is_active BOOLEAN DEFAULT 1,
    current_location_lat REAL,
    current_location_lng REAL,
    current_location_timestamp DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Routes Table
CREATE TABLE routes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
    name TEXT NOT NULL,
    start_time TEXT NOT NULL,
    estimated_duration TEXT NOT NULL,
    priority TEXT DEFAULT 'mittel' CHECK (priority IN ('niedrig', 'mittel', 'hoch')),
    status TEXT DEFAULT 'geplant' CHECK (status IN ('geplant', 'in_arbeit', 'abgeschlossen')),
    assigned_worker_id TEXT REFERENCES users(id),
    coordinates TEXT NOT NULL, -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Work Sessions Table
CREATE TABLE work_sessions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
    worker_id TEXT NOT NULL REFERENCES users(id),
    route_id TEXT NOT NULL REFERENCES routes(id),
    start_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    total_duration INTEGER, -- in minutes
    gps_track TEXT, -- JSON string
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Photos Table
CREATE TABLE photos (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    worker_id TEXT NOT NULL REFERENCES users(id),
    route_id TEXT REFERENCES routes(id),
    work_session_id TEXT REFERENCES work_sessions(id),
    location_lat REAL NOT NULL,
    location_lng REAL NOT NULL,
    description TEXT,
    tags TEXT, -- JSON array as string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_routes_status ON routes(status);
CREATE INDEX idx_routes_assigned_worker ON routes(assigned_worker_id);
CREATE INDEX idx_work_sessions_worker ON work_sessions(worker_id);
CREATE INDEX idx_photos_worker ON photos(worker_id);

-- Views for compatibility
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

-- Sample data
INSERT INTO users (id, name, email, password_hash, role) VALUES 
('user-1', 'Admin User', 'admin@winterdienst.de', '$2a$10$test.hash.for.admin', 'admin'),
('user-2', 'Max Müller', 'max@winterdienst.de', '$2a$10$test.hash.for.max', 'worker'),
('user-3', 'Anna Schmidt', 'anna@winterdienst.de', '$2a$10$test.hash.for.anna', 'worker');