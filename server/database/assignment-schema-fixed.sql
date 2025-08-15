-- Assignment System Schema (Fixed)

-- Assignments Table - Verknüpfung von Routen, Fahrzeugen und Mitarbeitern
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES routes(id),
    worker_id UUID NOT NULL REFERENCES users(id),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    scheduled_start TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actual_start TIMESTAMP,
    actual_end TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create unique constraints separately
CREATE UNIQUE INDEX idx_assignments_unique_active_route ON assignments(route_id) WHERE status = 'active';
CREATE UNIQUE INDEX idx_assignments_unique_active_worker ON assignments(worker_id) WHERE status IN ('active', 'in_progress');
CREATE UNIQUE INDEX idx_assignments_unique_active_vehicle ON assignments(vehicle_id) WHERE status IN ('active', 'in_progress');

-- Assignment History Table - Für Audit und Änderungsverfolgung
CREATE TABLE assignment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES assignments(id),
    changed_by UUID REFERENCES users(id),
    change_type VARCHAR(50) NOT NULL, -- created, updated, deleted, reassigned
    old_values JSONB,
    new_values JSONB,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resource Conflicts Table - Zur Verfolgung von Ressourcenkonflikten
CREATE TABLE resource_conflicts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conflict_type VARCHAR(50) NOT NULL, -- vehicle_shortage, worker_shortage, double_booking
    route_id UUID REFERENCES routes(id),
    resource_type VARCHAR(20) NOT NULL, -- vehicle, worker
    resource_id UUID, -- vehicle_id or worker_id
    conflict_date DATE NOT NULL DEFAULT CURRENT_DATE,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resource Availability View - Für einfache Abfrage verfügbarer Ressourcen
CREATE VIEW resource_availability AS
SELECT 
    'vehicle' as resource_type,
    v.id as resource_id,
    v.license_plate as resource_name,
    v.brand || ' ' || v.model as resource_details,
    CASE 
        WHEN a.id IS NOT NULL THEN false 
        ELSE true 
    END as is_available,
    a.route_id as assigned_route_id,
    r.name as assigned_route_name,
    u.name as assigned_worker_name
FROM vehicles v
LEFT JOIN assignments a ON v.id = a.vehicle_id AND a.status IN ('active', 'in_progress')
LEFT JOIN routes r ON a.route_id = r.id
LEFT JOIN users u ON a.worker_id = u.id
WHERE v.is_active = true

UNION ALL

SELECT 
    'worker' as resource_type,
    u.id as resource_id,
    u.name as resource_name,
    u.email as resource_details,
    CASE 
        WHEN a.id IS NOT NULL THEN false 
        ELSE true 
    END as is_available,
    a.route_id as assigned_route_id,
    r.name as assigned_route_name,
    v.license_plate as assigned_vehicle_name
FROM users u
LEFT JOIN assignments a ON u.id = a.worker_id AND a.status IN ('active', 'in_progress')
LEFT JOIN routes r ON a.route_id = r.id
LEFT JOIN vehicles v ON a.vehicle_id = v.id
WHERE u.is_active = true AND u.role = 'worker';

-- Assignment Performance View - Für Performance-Analyse
CREATE VIEW assignment_performance AS
SELECT 
    a.id as assignment_id,
    r.name as route_name,
    r.priority as route_priority,
    u.name as worker_name,
    v.license_plate as vehicle_plate,
    a.scheduled_start,
    a.actual_start,
    a.actual_end,
    CASE 
        WHEN a.actual_start IS NOT NULL AND a.actual_end IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (a.actual_end - a.actual_start)) / 3600 
        ELSE NULL 
    END as duration_hours,
    CASE 
        WHEN a.actual_start IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (a.actual_start - a.scheduled_start)) / 60 
        ELSE NULL 
    END as start_delay_minutes,
    a.status,
    r.status as route_status
FROM assignments a
JOIN routes r ON a.route_id = r.id
JOIN users u ON a.worker_id = u.id
JOIN vehicles v ON a.vehicle_id = v.id
ORDER BY a.scheduled_start DESC;

-- Workload Distribution View - Für gleichmäßige Arbeitsverteilung
CREATE VIEW workload_distribution AS
SELECT 
    u.id as worker_id,
    u.name as worker_name,
    COUNT(a.id) as total_assignments,
    COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_assignments,
    COUNT(CASE WHEN a.status IN ('active', 'in_progress') THEN 1 END) as current_assignments,
    AVG(CASE 
        WHEN a.actual_start IS NOT NULL AND a.actual_end IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (a.actual_end - a.actual_start)) / 3600 
        ELSE NULL 
    END) as avg_duration_hours,
    DATE_TRUNC('month', CURRENT_TIMESTAMP) as period
FROM users u
LEFT JOIN assignments a ON u.id = a.worker_id 
    AND a.created_at >= DATE_TRUNC('month', CURRENT_TIMESTAMP)
WHERE u.is_active = true AND u.role = 'worker'
GROUP BY u.id, u.name, DATE_TRUNC('month', CURRENT_TIMESTAMP);

-- Vehicle Utilization View
CREATE VIEW vehicle_utilization AS
SELECT 
    v.id as vehicle_id,
    v.license_plate,
    v.brand,
    v.model,
    COUNT(a.id) as total_assignments,
    COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_assignments,
    COUNT(CASE WHEN a.status IN ('active', 'in_progress') THEN 1 END) as current_assignments,
    SUM(CASE 
        WHEN a.actual_start IS NOT NULL AND a.actual_end IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (a.actual_end - a.actual_start)) / 3600 
        ELSE 0 
    END) as total_hours_used,
    AVG(ws.distance_km) as avg_distance_per_assignment,
    AVG(ws.fuel_consumed) as avg_fuel_per_assignment,
    DATE_TRUNC('month', CURRENT_TIMESTAMP) as period
FROM vehicles v
LEFT JOIN assignments a ON v.id = a.vehicle_id 
    AND a.created_at >= DATE_TRUNC('month', CURRENT_TIMESTAMP)
LEFT JOIN work_sessions ws ON a.route_id = ws.route_id AND v.assigned_user_id = ws.worker_id
WHERE v.is_active = true
GROUP BY v.id, v.license_plate, v.brand, v.model, DATE_TRUNC('month', CURRENT_TIMESTAMP);

-- Indexes für bessere Performance
CREATE INDEX idx_assignments_route ON assignments(route_id);
CREATE INDEX idx_assignments_worker ON assignments(worker_id);
CREATE INDEX idx_assignments_vehicle ON assignments(vehicle_id);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_assignments_scheduled_start ON assignments(scheduled_start);
CREATE INDEX idx_assignments_date ON assignments(DATE(scheduled_start));

CREATE INDEX idx_assignment_history_assignment ON assignment_history(assignment_id);
CREATE INDEX idx_assignment_history_changed_by ON assignment_history(changed_by);
CREATE INDEX idx_assignment_history_created_at ON assignment_history(created_at);

CREATE INDEX idx_resource_conflicts_date ON resource_conflicts(conflict_date);
CREATE INDEX idx_resource_conflicts_resolved ON resource_conflicts(resolved);
CREATE INDEX idx_resource_conflicts_type ON resource_conflicts(conflict_type);

-- Triggers für auto-update und history
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger für Assignment History
CREATE OR REPLACE FUNCTION log_assignment_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO assignment_history (assignment_id, change_type, old_values, new_values)
        VALUES (
            NEW.id, 
            'updated',
            row_to_json(OLD),
            row_to_json(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO assignment_history (assignment_id, change_type, new_values)
        VALUES (
            NEW.id,
            'created',
            row_to_json(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO assignment_history (assignment_id, change_type, old_values)
        VALUES (
            OLD.id,
            'deleted',
            row_to_json(OLD)
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assignment_history_trigger
    AFTER INSERT OR UPDATE OR DELETE ON assignments
    FOR EACH ROW EXECUTE FUNCTION log_assignment_changes();

-- Function für automatische Konfliktserkennung
CREATE OR REPLACE FUNCTION detect_resource_conflicts()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for double vehicle booking
    IF EXISTS (
        SELECT 1 FROM assignments 
        WHERE vehicle_id = NEW.vehicle_id 
        AND status IN ('active', 'in_progress')
        AND id != NEW.id
        AND DATE(scheduled_start) = DATE(NEW.scheduled_start)
    ) THEN
        INSERT INTO resource_conflicts (
            conflict_type, route_id, resource_type, resource_id, 
            description, severity
        ) VALUES (
            'double_booking', NEW.route_id, 'vehicle', NEW.vehicle_id,
            'Fahrzeug ist bereits für einen anderen Auftrag eingeplant',
            'high'
        );
    END IF;

    -- Check for double worker booking
    IF EXISTS (
        SELECT 1 FROM assignments 
        WHERE worker_id = NEW.worker_id 
        AND status IN ('active', 'in_progress')
        AND id != NEW.id
        AND DATE(scheduled_start) = DATE(NEW.scheduled_start)
    ) THEN
        INSERT INTO resource_conflicts (
            conflict_type, route_id, resource_type, resource_id,
            description, severity
        ) VALUES (
            'double_booking', NEW.route_id, 'worker', NEW.worker_id,
            'Mitarbeiter ist bereits für einen anderen Auftrag eingeplant',
            'high'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER detect_conflicts_trigger
    AFTER INSERT OR UPDATE ON assignments
    FOR EACH ROW EXECUTE FUNCTION detect_resource_conflicts();