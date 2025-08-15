-- Fahrzeug-Tracking Schema Erweiterung

-- Vehicles Table
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    fuel_type VARCHAR(20) DEFAULT 'diesel' CHECK (fuel_type IN ('diesel', 'benzin', 'elektro', 'hybrid')),
    tank_capacity DECIMAL(6,2) NOT NULL, -- in Litern
    current_fuel_level DECIMAL(6,2), -- in Litern
    current_mileage INTEGER DEFAULT 0, -- in km
    last_fuel_update TIMESTAMP,
    last_oil_change_mileage INTEGER,
    last_oil_change_date DATE,
    tuv_expiry_date DATE,
    insurance_expiry_date DATE,
    assigned_user_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fuel Entries Table (Tankbuch)
CREATE TABLE fuel_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    amount DECIMAL(6,2) NOT NULL, -- Liter getankt
    cost DECIMAL(8,2), -- Gesamtkosten
    price_per_liter DECIMAL(5,3), -- Preis pro Liter
    location VARCHAR(255), -- Tankstelle
    mileage INTEGER, -- KM-Stand beim Tanken
    is_full_tank BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance Records Table
CREATE TABLE maintenance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    type VARCHAR(50) NOT NULL, -- oil_change, tuv, repair, etc.
    description TEXT NOT NULL,
    cost DECIMAL(8,2),
    mileage INTEGER,
    performed_by VARCHAR(255),
    location VARCHAR(255),
    next_due_mileage INTEGER,
    next_due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Route Sessions erweitern für Verbrauchsdaten
ALTER TABLE work_sessions ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES vehicles(id);
ALTER TABLE work_sessions ADD COLUMN IF NOT EXISTS start_mileage INTEGER;
ALTER TABLE work_sessions ADD COLUMN IF NOT EXISTS end_mileage INTEGER;
ALTER TABLE work_sessions ADD COLUMN IF NOT EXISTS distance_km DECIMAL(8,2);
ALTER TABLE work_sessions ADD COLUMN IF NOT EXISTS fuel_consumed DECIMAL(6,2);
ALTER TABLE work_sessions ADD COLUMN IF NOT EXISTS fuel_consumption_per_100km DECIMAL(5,2);

-- Indexes für bessere Performance
CREATE INDEX idx_vehicles_license_plate ON vehicles(license_plate);
CREATE INDEX idx_vehicles_assigned_user ON vehicles(assigned_user_id);
CREATE INDEX idx_vehicles_is_active ON vehicles(is_active);

CREATE INDEX idx_fuel_entries_vehicle ON fuel_entries(vehicle_id);
CREATE INDEX idx_fuel_entries_created_at ON fuel_entries(created_at);

CREATE INDEX idx_maintenance_vehicle ON maintenance_records(vehicle_id);
CREATE INDEX idx_maintenance_type ON maintenance_records(type);
CREATE INDEX idx_maintenance_next_due_date ON maintenance_records(next_due_date);

-- Triggers für auto-update
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views für API access
CREATE VIEW vehicles_with_details AS
SELECT 
    v.*,
    u.name as assigned_user_name,
    u.email as assigned_user_email,
    CASE 
        WHEN v.current_fuel_level IS NOT NULL AND v.tank_capacity > 0 
        THEN ROUND((v.current_fuel_level / v.tank_capacity * 100)::numeric, 1)
        ELSE NULL 
    END as fuel_percentage
FROM vehicles v
LEFT JOIN users u ON v.assigned_user_id = u.id
WHERE v.is_active = true;

CREATE VIEW fuel_consumption_summary AS
SELECT 
    v.id as vehicle_id,
    v.license_plate,
    v.brand,
    v.model,
    COUNT(ws.id) as total_sessions,
    COALESCE(SUM(ws.distance_km), 0) as total_distance_km,
    COALESCE(SUM(ws.fuel_consumed), 0) as total_fuel_consumed,
    CASE 
        WHEN SUM(ws.distance_km) > 0 
        THEN ROUND((SUM(ws.fuel_consumed) / SUM(ws.distance_km) * 100)::numeric, 2)
        ELSE 0 
    END as avg_consumption_per_100km,
    COALESCE(SUM(fe.cost), 0) as total_fuel_cost
FROM vehicles v
LEFT JOIN work_sessions ws ON v.id = ws.vehicle_id
LEFT JOIN fuel_entries fe ON v.id = fe.vehicle_id
WHERE v.is_active = true
GROUP BY v.id, v.license_plate, v.brand, v.model;

CREATE VIEW maintenance_alerts AS
SELECT 
    v.id as vehicle_id,
    v.license_plate,
    v.brand,
    v.model,
    v.current_mileage,
    v.last_oil_change_mileage,
    v.tuv_expiry_date,
    v.insurance_expiry_date,
    CASE 
        WHEN v.last_oil_change_mileage IS NOT NULL 
             AND (v.current_mileage - v.last_oil_change_mileage) >= 15000
        THEN 'Ölwechsel überfällig'
        WHEN v.last_oil_change_mileage IS NOT NULL 
             AND (v.current_mileage - v.last_oil_change_mileage) >= 13000
        THEN 'Ölwechsel bald fällig'
        ELSE NULL
    END as oil_change_status,
    CASE 
        WHEN v.tuv_expiry_date < CURRENT_DATE
        THEN 'TÜV abgelaufen'
        WHEN v.tuv_expiry_date <= CURRENT_DATE + INTERVAL '30 days'
        THEN 'TÜV läuft bald ab'
        ELSE NULL
    END as tuv_status,
    CASE 
        WHEN v.insurance_expiry_date < CURRENT_DATE
        THEN 'Versicherung abgelaufen'
        WHEN v.insurance_expiry_date <= CURRENT_DATE + INTERVAL '30 days'
        THEN 'Versicherung läuft bald ab'
        ELSE NULL
    END as insurance_status
FROM vehicles v
WHERE v.is_active = true;