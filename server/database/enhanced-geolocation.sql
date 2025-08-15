-- Enhanced Geolocation with PostGIS Support
-- This file extends the existing schema with PostGIS functionality

-- Add PostGIS geometry columns to existing tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_point GEOMETRY(POINT, 4326);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS route_geometry GEOMETRY(LINESTRING, 4326);
ALTER TABLE photos ADD COLUMN IF NOT EXISTS photo_location GEOMETRY(POINT, 4326);
ALTER TABLE work_sessions ADD COLUMN IF NOT EXISTS gps_track_geometry GEOMETRY(LINESTRING, 4326);
ALTER TABLE weather_data ADD COLUMN IF NOT EXISTS location_point GEOMETRY(POINT, 4326);

-- Create spatial indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_location_point ON users USING GIST (location_point);
CREATE INDEX IF NOT EXISTS idx_routes_geometry ON routes USING GIST (route_geometry);
CREATE INDEX IF NOT EXISTS idx_photos_location ON photos USING GIST (photo_location);
CREATE INDEX IF NOT EXISTS idx_work_sessions_track ON work_sessions USING GIST (gps_track_geometry);
CREATE INDEX IF NOT EXISTS idx_weather_location_point ON weather_data USING GIST (location_point);

-- Function to update geometry from lat/lng coordinates
CREATE OR REPLACE FUNCTION update_user_geometry() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.current_location_lat IS NOT NULL AND NEW.current_location_lng IS NOT NULL THEN
        NEW.location_point := ST_SetSRID(ST_MakePoint(NEW.current_location_lng, NEW.current_location_lat), 4326);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update route geometry from coordinates JSON
CREATE OR REPLACE FUNCTION update_route_geometry() 
RETURNS TRIGGER AS $$
DECLARE
    coord JSON;
    points GEOMETRY[];
    point_array GEOMETRY;
BEGIN
    IF NEW.coordinates IS NOT NULL THEN
        points := ARRAY[]::GEOMETRY[];
        
        FOR coord IN SELECT jsonb_array_elements(NEW.coordinates)
        LOOP
            points := array_append(points, 
                ST_SetSRID(ST_MakePoint(
                    (coord->>'lng')::DECIMAL, 
                    (coord->>'lat')::DECIMAL
                ), 4326)
            );
        END LOOP;
        
        IF array_length(points, 1) > 1 THEN
            NEW.route_geometry := ST_MakeLine(points);
        ELSIF array_length(points, 1) = 1 THEN
            NEW.route_geometry := ST_MakeLine(ARRAY[points[1], points[1]]);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update photo location from lat/lng
CREATE OR REPLACE FUNCTION update_photo_geometry() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.location_lat IS NOT NULL AND NEW.location_lng IS NOT NULL THEN
        NEW.photo_location := ST_SetSRID(ST_MakePoint(NEW.location_lng, NEW.location_lat), 4326);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update weather location
CREATE OR REPLACE FUNCTION update_weather_geometry() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location_point := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update geometry
CREATE TRIGGER trigger_update_user_geometry
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_user_geometry();

CREATE TRIGGER trigger_update_route_geometry
    BEFORE INSERT OR UPDATE ON routes
    FOR EACH ROW EXECUTE FUNCTION update_route_geometry();

CREATE TRIGGER trigger_update_photo_geometry
    BEFORE INSERT OR UPDATE ON photos
    FOR EACH ROW EXECUTE FUNCTION update_photo_geometry();

CREATE TRIGGER trigger_update_weather_geometry
    BEFORE INSERT OR UPDATE ON weather_data
    FOR EACH ROW EXECUTE FUNCTION update_weather_geometry();

-- Enhanced geographic functions using PostGIS

-- Function to find nearby workers within radius (in meters)
CREATE OR REPLACE FUNCTION find_nearby_workers(
    center_lat DECIMAL(10,8),
    center_lng DECIMAL(11,8),
    radius_meters INTEGER DEFAULT 5000
) RETURNS TABLE (
    worker_id UUID,
    worker_name VARCHAR(255),
    distance_meters DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.name,
        ROUND(ST_Distance(
            u.location_point,
            ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography
        )::DECIMAL, 2)
    FROM users u
    WHERE u.role = 'worker' 
        AND u.is_active = true
        AND u.location_point IS NOT NULL
        AND ST_DWithin(
            u.location_point::geography,
            ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography,
            radius_meters
        )
    ORDER BY u.location_point <-> ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326);
END;
$$ LANGUAGE plpgsql;

-- Function to get route length in meters
CREATE OR REPLACE FUNCTION get_route_length(route_id UUID) 
RETURNS DECIMAL AS $$
DECLARE
    route_length DECIMAL;
BEGIN
    SELECT ST_Length(route_geometry::geography)
    INTO route_length
    FROM routes
    WHERE id = route_id;
    
    RETURN COALESCE(route_length, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to check if point is within route buffer (useful for verification)
CREATE OR REPLACE FUNCTION point_near_route(
    check_lat DECIMAL(10,8),
    check_lng DECIMAL(11,8),
    route_id UUID,
    buffer_meters INTEGER DEFAULT 100
) RETURNS BOOLEAN AS $$
DECLARE
    is_near BOOLEAN := false;
BEGIN
    SELECT ST_DWithin(
        route_geometry::geography,
        ST_SetSRID(ST_MakePoint(check_lng, check_lat), 4326)::geography,
        buffer_meters
    )
    INTO is_near
    FROM routes
    WHERE id = route_id AND route_geometry IS NOT NULL;
    
    RETURN COALESCE(is_near, false);
END;
$$ LANGUAGE plpgsql;

-- Function to find routes within area (bounding box)
CREATE OR REPLACE FUNCTION find_routes_in_area(
    min_lat DECIMAL(10,8),
    min_lng DECIMAL(11,8),
    max_lat DECIMAL(10,8),
    max_lng DECIMAL(11,8)
) RETURNS TABLE (
    route_id UUID,
    route_name VARCHAR(255),
    route_priority VARCHAR(20),
    route_status VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.name,
        r.priority,
        r.status
    FROM routes r
    WHERE r.route_geometry IS NOT NULL
        AND ST_Intersects(
            r.route_geometry,
            ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
        );
END;
$$ LANGUAGE plpgsql;

-- Function to calculate area coverage (for material usage efficiency)
CREATE OR REPLACE FUNCTION calculate_coverage_area(
    route_id UUID,
    coverage_width_meters DECIMAL DEFAULT 10.0
) RETURNS DECIMAL AS $$
DECLARE
    coverage_area DECIMAL;
BEGIN
    SELECT ST_Area(ST_Buffer(route_geometry::geography, coverage_width_meters))
    INTO coverage_area
    FROM routes
    WHERE id = route_id;
    
    RETURN COALESCE(coverage_area, 0);
END;
$$ LANGUAGE plpgsql;

-- Enhanced views with PostGIS calculations

-- Routes with geographic enrichment
CREATE OR REPLACE VIEW routes_with_enhanced_geography AS
SELECT 
    r.*,
    u.name as worker_name,
    u.email as worker_email,
    CASE 
        WHEN r.route_geometry IS NOT NULL 
        THEN ST_AsGeoJSON(ST_Centroid(r.route_geometry))::JSON
        ELSE get_route_center(r.coordinates)
    END as center_point,
    CASE 
        WHEN r.route_geometry IS NOT NULL 
        THEN ROUND(ST_Length(r.route_geometry::geography)::DECIMAL, 2)
        ELSE NULL
    END as route_length_meters,
    jsonb_array_length(r.coordinates) as waypoint_count,
    CASE 
        WHEN r.route_geometry IS NOT NULL 
        THEN ST_AsGeoJSON(r.route_geometry)::JSON
        ELSE NULL
    END as geometry_geojson
FROM routes r
LEFT JOIN users u ON r.assigned_worker_id = u.id;

-- Workers with location and proximity info
CREATE OR REPLACE VIEW workers_with_location AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    u.is_active,
    u.current_location_lat,
    u.current_location_lng,
    u.current_location_timestamp,
    CASE 
        WHEN u.location_point IS NOT NULL 
        THEN ST_AsGeoJSON(u.location_point)::JSON
        ELSE NULL
    END as location_geojson,
    CASE 
        WHEN u.current_location_timestamp IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - u.current_location_timestamp)) / 60
        ELSE NULL
    END as minutes_since_last_update
FROM users u
WHERE u.role = 'worker' AND u.is_active = true;

-- Work sessions with track analysis
CREATE OR REPLACE VIEW work_sessions_with_geography AS
SELECT 
    ws.*,
    u.name as worker_name,
    r.name as route_name,
    CASE 
        WHEN ws.gps_track_geometry IS NOT NULL 
        THEN ROUND(ST_Length(ws.gps_track_geometry::geography)::DECIMAL, 2)
        ELSE ws.distance_km * 1000
    END as actual_distance_meters,
    CASE 
        WHEN ws.gps_track_geometry IS NOT NULL 
        THEN ST_AsGeoJSON(ws.gps_track_geometry)::JSON
        ELSE NULL
    END as track_geojson
FROM work_sessions ws
JOIN users u ON ws.worker_id = u.id
JOIN routes r ON ws.route_id = r.id;

-- Material usage with spatial efficiency
CREATE OR REPLACE VIEW material_usage_with_efficiency AS
SELECT 
    mu.*,
    m.name as material_name,
    m.unit,
    r.name as route_name,
    CASE 
        WHEN mu.area_covered IS NOT NULL AND mu.area_covered > 0
        THEN ROUND((mu.amount_used / mu.area_covered)::DECIMAL, 4)
        WHEN r.route_geometry IS NOT NULL 
        THEN ROUND((mu.amount_used / NULLIF(ST_Area(ST_Buffer(r.route_geometry::geography, 5)), 0))::DECIMAL, 8)
        ELSE NULL
    END as usage_per_sqm,
    CASE 
        WHEN r.route_geometry IS NOT NULL 
        THEN ROUND(ST_Area(ST_Buffer(r.route_geometry::geography, 5))::DECIMAL, 2)
        ELSE mu.area_covered
    END as calculated_area_sqm
FROM material_usage mu
JOIN materials m ON mu.material_id = m.id
JOIN routes r ON mu.route_id = r.id;

-- Function to update existing data with geometry
CREATE OR REPLACE FUNCTION migrate_existing_coordinates_to_geometry() 
RETURNS TEXT AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    -- Update users
    UPDATE users 
    SET location_point = ST_SetSRID(ST_MakePoint(current_location_lng, current_location_lat), 4326)
    WHERE current_location_lat IS NOT NULL 
        AND current_location_lng IS NOT NULL 
        AND location_point IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    -- Update photos
    UPDATE photos 
    SET photo_location = ST_SetSRID(ST_MakePoint(location_lng, location_lat), 4326)
    WHERE location_lat IS NOT NULL 
        AND location_lng IS NOT NULL 
        AND photo_location IS NULL;
    
    -- Update weather data
    UPDATE weather_data 
    SET location_point = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
    WHERE latitude IS NOT NULL 
        AND longitude IS NOT NULL 
        AND location_point IS NULL;
    
    RETURN 'Migration completed. Updated ' || updated_count || ' user locations.';
END;
$$ LANGUAGE plpgsql;

-- Automatically migrate existing data
SELECT migrate_existing_coordinates_to_geometry();