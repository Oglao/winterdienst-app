-- GPS Tracking Schema für UBER-ähnliches Live-Tracking

-- GPS History Table - Speichert alle GPS-Positionen
CREATE TABLE IF NOT EXISTS gps_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(8, 2), -- GPS accuracy in meters
    speed DECIMAL(8, 2), -- Speed in km/h
    heading DECIMAL(5, 2), -- Direction in degrees (0-360)
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id UUID, -- Link to tracking session
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tracking Sessions Table - Tracking-Sitzungen für Routen
CREATE TABLE IF NOT EXISTS tracking_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    route_id UUID REFERENCES routes(id),
    vehicle_id UUID REFERENCES vehicles(id),
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    total_distance DECIMAL(10, 2), -- Total distance in km
    average_speed DECIMAL(8, 2), -- Average speed in km/h
    max_speed DECIMAL(8, 2), -- Maximum speed in km/h
    gps_points_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add unique constraint for active sessions
CREATE UNIQUE INDEX IF NOT EXISTS idx_tracking_sessions_active_user 
ON tracking_sessions(user_id) WHERE is_active = true;

-- Geofences Table - Virtuelle Zäune für Alerts
CREATE TABLE IF NOT EXISTS geofences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    center_lat DECIMAL(10, 8) NOT NULL,
    center_lng DECIMAL(11, 8) NOT NULL,
    radius_meters INTEGER NOT NULL,
    fence_type VARCHAR(50) DEFAULT 'circular' CHECK (fence_type IN ('circular', 'polygon')),
    polygon_coordinates JSONB, -- For complex shapes
    is_active BOOLEAN DEFAULT true,
    alert_on_enter BOOLEAN DEFAULT false,
    alert_on_exit BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Geofence Alerts Table - Alerts wenn Mitarbeiter Geofences verlassen/betreten
CREATE TABLE IF NOT EXISTS geofence_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    geofence_id UUID NOT NULL REFERENCES geofences(id),
    alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('enter', 'exit')),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMP
);

-- Indexes für Performance
CREATE INDEX IF NOT EXISTS idx_gps_history_user_timestamp ON gps_history(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_gps_history_session ON gps_history(session_id);
CREATE INDEX IF NOT EXISTS idx_gps_history_timestamp ON gps_history(timestamp);

CREATE INDEX IF NOT EXISTS idx_tracking_sessions_user ON tracking_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_tracking_sessions_active ON tracking_sessions(is_active, start_time);
CREATE INDEX IF NOT EXISTS idx_tracking_sessions_route ON tracking_sessions(route_id);

CREATE INDEX IF NOT EXISTS idx_geofences_active ON geofences(is_active);
CREATE INDEX IF NOT EXISTS idx_geofence_alerts_user ON geofence_alerts(user_id, triggered_at);

-- Enhanced Views für GPS Tracking

-- Live Positions View - Aktuelle Positionen aller Mitarbeiter
CREATE OR REPLACE VIEW live_worker_positions AS
SELECT 
    u.id as user_id,
    u.name,
    u.email,
    u.role,
    u.is_active,
    u.current_location_lat as latitude,
    u.current_location_lng as longitude,
    u.current_location_timestamp as last_update,
    ts.id as session_id,
    ts.route_id,
    ts.vehicle_id,
    r.name as route_name,
    v.license_plate,
    CASE 
        WHEN u.current_location_timestamp IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - u.current_location_timestamp)) / 60
        ELSE NULL
    END as minutes_since_update,
    CASE 
        WHEN u.current_location_timestamp > CURRENT_TIMESTAMP - INTERVAL '5 minutes' 
        THEN 'online'
        WHEN u.current_location_timestamp > CURRENT_TIMESTAMP - INTERVAL '30 minutes' 
        THEN 'recent'
        ELSE 'offline'
    END as status
FROM users u
LEFT JOIN tracking_sessions ts ON u.id = ts.user_id AND ts.is_active = true
LEFT JOIN routes r ON ts.route_id = r.id
LEFT JOIN vehicles v ON ts.vehicle_id = v.id
WHERE u.role = 'worker' 
    AND u.is_active = true;

-- Tracking Statistics View
CREATE OR REPLACE VIEW tracking_statistics AS
SELECT 
    ts.id as session_id,
    ts.user_id,
    u.name as worker_name,
    ts.route_id,
    r.name as route_name,
    ts.vehicle_id,
    v.license_plate,
    ts.start_time,
    ts.end_time,
    CASE 
        WHEN ts.end_time IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (ts.end_time - ts.start_time)) / 3600
        ELSE EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - ts.start_time)) / 3600
    END as duration_hours,
    ts.total_distance,
    ts.average_speed,
    ts.max_speed,
    ts.gps_points_count,
    ts.is_active
FROM tracking_sessions ts
JOIN users u ON ts.user_id = u.id
LEFT JOIN routes r ON ts.route_id = r.id
LEFT JOIN vehicles v ON ts.vehicle_id = v.id
ORDER BY ts.start_time DESC;

-- Functions für GPS Tracking

-- Function: Update GPS History
CREATE OR REPLACE FUNCTION insert_gps_point(
    p_user_id UUID,
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_accuracy DECIMAL DEFAULT NULL,
    p_speed DECIMAL DEFAULT NULL,
    p_heading DECIMAL DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    gps_id UUID;
    session_id UUID;
BEGIN
    -- Get active session for user
    SELECT id INTO session_id 
    FROM tracking_sessions 
    WHERE user_id = p_user_id AND is_active = true;
    
    -- Insert GPS point
    INSERT INTO gps_history (
        user_id, latitude, longitude, accuracy, speed, heading, session_id
    ) VALUES (
        p_user_id, p_latitude, p_longitude, p_accuracy, p_speed, p_heading, session_id
    ) RETURNING id INTO gps_id;
    
    -- Update session statistics if session exists
    IF session_id IS NOT NULL THEN
        UPDATE tracking_sessions 
        SET 
            gps_points_count = gps_points_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = session_id;
    END IF;
    
    RETURN gps_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate distance between two GPS points
CREATE OR REPLACE FUNCTION calculate_gps_distance(
    lat1 DECIMAL, lng1 DECIMAL, 
    lat2 DECIMAL, lng2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    dlat DECIMAL;
    dlng DECIMAL;
    a DECIMAL;
    c DECIMAL;
    r DECIMAL := 6371; -- Earth radius in km
BEGIN
    dlat := radians(lat2 - lat1);
    dlng := radians(lng2 - lng1);
    
    a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng/2) * sin(dlng/2);
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    
    RETURN r * c;
END;
$$ LANGUAGE plpgsql;

-- Function: Check geofence violations
CREATE OR REPLACE FUNCTION check_geofence_violations(
    p_user_id UUID,
    p_latitude DECIMAL,
    p_longitude DECIMAL
) RETURNS SETOF geofence_alerts AS $$
DECLARE
    fence RECORD;
    distance DECIMAL;
    alert_record geofence_alerts%ROWTYPE;
BEGIN
    FOR fence IN 
        SELECT * FROM geofences 
        WHERE is_active = true 
        AND (alert_on_enter = true OR alert_on_exit = true)
    LOOP
        -- Calculate distance from point to geofence center
        distance := calculate_gps_distance(
            p_latitude, p_longitude,
            fence.center_lat, fence.center_lng
        ) * 1000; -- Convert to meters
        
        -- Check if inside/outside geofence
        IF distance <= fence.radius_meters THEN
            -- User is inside geofence
            IF fence.alert_on_enter = true THEN
                -- Check if this is a new entry (no recent enter alert)
                IF NOT EXISTS (
                    SELECT 1 FROM geofence_alerts 
                    WHERE user_id = p_user_id 
                    AND geofence_id = fence.id 
                    AND alert_type = 'enter'
                    AND triggered_at > CURRENT_TIMESTAMP - INTERVAL '10 minutes'
                ) THEN
                    -- Create enter alert
                    INSERT INTO geofence_alerts (
                        user_id, geofence_id, alert_type, latitude, longitude
                    ) VALUES (
                        p_user_id, fence.id, 'enter', p_latitude, p_longitude
                    ) RETURNING * INTO alert_record;
                    
                    RETURN NEXT alert_record;
                END IF;
            END IF;
        ELSE
            -- User is outside geofence
            IF fence.alert_on_exit = true THEN
                -- Check if this is a new exit (no recent exit alert)
                IF NOT EXISTS (
                    SELECT 1 FROM geofence_alerts 
                    WHERE user_id = p_user_id 
                    AND geofence_id = fence.id 
                    AND alert_type = 'exit'
                    AND triggered_at > CURRENT_TIMESTAMP - INTERVAL '10 minutes'
                ) THEN
                    -- Create exit alert
                    INSERT INTO geofence_alerts (
                        user_id, geofence_id, alert_type, latitude, longitude
                    ) VALUES (
                        p_user_id, fence.id, 'exit', p_latitude, p_longitude
                    ) RETURNING * INTO alert_record;
                    
                    RETURN NEXT alert_record;
                END IF;
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Triggers

-- Trigger: Update tracking session statistics
CREATE OR REPLACE FUNCTION update_tracking_session_stats()
RETURNS TRIGGER AS $$
DECLARE
    session_id UUID;
    prev_point RECORD;
    distance_increment DECIMAL;
BEGIN
    -- Get active session for user
    SELECT id INTO session_id 
    FROM tracking_sessions 
    WHERE user_id = NEW.user_id AND is_active = true;
    
    IF session_id IS NOT NULL THEN
        -- Get previous GPS point for distance calculation
        SELECT latitude, longitude, speed INTO prev_point
        FROM gps_history 
        WHERE user_id = NEW.user_id 
        AND timestamp < NEW.timestamp
        ORDER BY timestamp DESC 
        LIMIT 1;
        
        IF prev_point IS NOT NULL THEN
            -- Calculate distance increment
            distance_increment := calculate_gps_distance(
                prev_point.latitude, prev_point.longitude,
                NEW.latitude, NEW.longitude
            );
            
            -- Update session with new statistics
            UPDATE tracking_sessions SET
                total_distance = COALESCE(total_distance, 0) + distance_increment,
                max_speed = GREATEST(COALESCE(max_speed, 0), COALESCE(NEW.speed, 0)),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = session_id;
            
            -- Update average speed
            UPDATE tracking_sessions SET
                average_speed = (
                    SELECT AVG(speed) 
                    FROM gps_history 
                    WHERE session_id = tracking_sessions.id 
                    AND speed IS NOT NULL
                )
            WHERE id = session_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tracking_stats
    AFTER INSERT ON gps_history
    FOR EACH ROW EXECUTE FUNCTION update_tracking_session_stats();

-- Sample Geofences für Hamburg Winterdienst
INSERT INTO geofences (name, center_lat, center_lng, radius_meters, alert_on_exit, is_active) VALUES
('Hamburg Zentrum', 53.5511, 9.9937, 2000, true, true),
('Hamburger Hafen', 53.5459, 9.9686, 1500, true, true),
('Flughafen Hamburg', 53.6304, 9.9882, 3000, false, true),
('Industriegebiet Harburg', 53.4609, 9.9896, 2500, true, true)
ON CONFLICT DO NOTHING;