-- Geographic functions without PostGIS
-- Using Haversine formula for distance calculations

-- Function to calculate distance between two points in meters
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL(10,8), 
    lng1 DECIMAL(11,8), 
    lat2 DECIMAL(10,8), 
    lng2 DECIMAL(11,8)
) RETURNS DECIMAL AS $$
DECLARE
    dlat DECIMAL;
    dlng DECIMAL;
    a DECIMAL;
    c DECIMAL;
    r DECIMAL := 6371000; -- Earth radius in meters
BEGIN
    dlat := radians(lat2 - lat1);
    dlng := radians(lng2 - lng1);
    
    a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng/2) * sin(dlng/2);
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    
    RETURN r * c;
END;
$$ LANGUAGE plpgsql;

-- Function to check if point is within bounding box
CREATE OR REPLACE FUNCTION point_in_bounds(
    lat DECIMAL(10,8), 
    lng DECIMAL(11,8),
    min_lat DECIMAL(10,8), 
    min_lng DECIMAL(11,8),
    max_lat DECIMAL(10,8), 
    max_lng DECIMAL(11,8)
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN lat >= min_lat AND lat <= max_lat AND lng >= min_lng AND lng <= max_lng;
END;
$$ LANGUAGE plpgsql;

-- Function to get center point of route coordinates
CREATE OR REPLACE FUNCTION get_route_center(route_coords JSONB) 
RETURNS JSON AS $$
DECLARE
    coord JSON;
    total_lat DECIMAL := 0;
    total_lng DECIMAL := 0;
    coord_count INTEGER := 0;
BEGIN
    FOR coord IN SELECT jsonb_array_elements(route_coords)
    LOOP
        total_lat := total_lat + (coord->>'lat')::DECIMAL;
        total_lng := total_lng + (coord->>'lng')::DECIMAL;
        coord_count := coord_count + 1;
    END LOOP;
    
    IF coord_count = 0 THEN
        RETURN json_build_object('lat', 0, 'lng', 0);
    END IF;
    
    RETURN json_build_object(
        'lat', total_lat / coord_count,
        'lng', total_lng / coord_count
    );
END;
$$ LANGUAGE plpgsql;

-- View for routes with geographic calculations
CREATE OR REPLACE VIEW routes_with_geography AS
SELECT 
    r.*,
    u.name as worker_name,
    u.email as worker_email,
    get_route_center(r.coordinates) as center_point,
    jsonb_array_length(r.coordinates) as waypoint_count
FROM routes r
LEFT JOIN users u ON r.assigned_worker_id = u.id;

-- Sample route data with real coordinates (Hamburg area)
INSERT INTO routes (name, start_time, estimated_duration, priority, status, assigned_worker_id, coordinates) 
VALUES 
(
    'Hauptstraße Nord', 
    '06:00', 
    '2h 30min', 
    'hoch', 
    'geplant',
    (SELECT id FROM users WHERE email = 'max@winterdienst.de'),
    '[
        {"lat": 53.5511, "lng": 9.9937},
        {"lat": 53.5521, "lng": 9.9947},
        {"lat": 53.5531, "lng": 9.9957}
    ]'::jsonb
),
(
    'Industriegebiet Süd', 
    '07:00', 
    '3h 15min', 
    'mittel', 
    'in_arbeit',
    (SELECT id FROM users WHERE email = 'anna@winterdienst.de'),
    '[
        {"lat": 53.5311, "lng": 9.9837},
        {"lat": 53.5321, "lng": 9.9847},
        {"lat": 53.5331, "lng": 9.9857}
    ]'::jsonb
),
(
    'Wohngebiet West', 
    '05:30', 
    '1h 45min', 
    'niedrig', 
    'abgeschlossen',
    (SELECT id FROM users WHERE email = 'anna@winterdienst.de'),
    '[
        {"lat": 53.5411, "lng": 9.9737},
        {"lat": 53.5421, "lng": 9.9747},
        {"lat": 53.5431, "lng": 9.9757}
    ]'::jsonb
);