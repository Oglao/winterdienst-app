-- Test Data für PostGIS Integration
-- Erstellt Beispieldaten für Geolocation Features

-- Testbenutzer mit Standorten in Hamburg
INSERT INTO users (name, email, password_hash, role, is_active, current_location_lat, current_location_lng, current_location_timestamp) VALUES
('Max Mustermann', 'max@winterdienst.de', '$2b$10$hashedpassword', 'worker', true, 53.5511, 9.9937, CURRENT_TIMESTAMP),
('Anna Schmidt', 'anna@winterdienst.de', '$2b$10$hashedpassword', 'worker', true, 53.5411, 9.9737, CURRENT_TIMESTAMP),
('Peter Weber', 'peter@winterdienst.de', '$2b$10$hashedpassword', 'worker', true, 53.5611, 10.0137, CURRENT_TIMESTAMP),
('Admin User', 'admin@winterdienst.de', '$2b$10$hashedpassword', 'admin', true, 53.5505, 9.9920, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO UPDATE SET 
  current_location_lat = EXCLUDED.current_location_lat,
  current_location_lng = EXCLUDED.current_location_lng,
  current_location_timestamp = EXCLUDED.current_location_timestamp;

-- Testfahrzeuge
INSERT INTO vehicles (license_plate, brand, model, year, fuel_type, fuel_capacity, current_fuel_level, is_active) VALUES
('HH-WD-001', 'Mercedes', 'Actros', 2023, 'diesel', 400.0, 320.0, true),
('HH-WD-002', 'Volvo', 'FH16', 2022, 'diesel', 450.0, 380.0, true),
('HH-WD-003', 'MAN', 'TGS', 2023, 'diesel', 350.0, 280.0, true),
('HH-WD-004', 'Scania', 'R-Series', 2021, 'diesel', 420.0, 150.0, true)
ON CONFLICT (license_plate) DO UPDATE SET
  current_fuel_level = EXCLUDED.current_fuel_level;

-- Teststrecken mit Koordinaten in Hamburg
INSERT INTO routes (name, start_time, estimated_duration, priority, status, coordinates) VALUES
('Hauptstraße Nord', '06:00', '2h 30min', 'hoch', 'geplant', 
'[
  {"lat": 53.5511, "lng": 9.9937},
  {"lat": 53.5521, "lng": 9.9947},
  {"lat": 53.5531, "lng": 9.9957},
  {"lat": 53.5541, "lng": 9.9967}
]'::jsonb),
('Industriegebiet Süd', '07:00', '3h 15min', 'mittel', 'geplant',
'[
  {"lat": 53.5311, "lng": 9.9837},
  {"lat": 53.5321, "lng": 9.9847},
  {"lat": 53.5331, "lng": 9.9857},
  {"lat": 53.5341, "lng": 9.9867}
]'::jsonb),
('Wohngebiet West', '05:30', '1h 45min', 'niedrig', 'geplant',
'[
  {"lat": 53.5411, "lng": 9.9737},
  {"lat": 53.5421, "lng": 9.9747},
  {"lat": 53.5431, "lng": 9.9757}
]'::jsonb),
('Autobahn A7 Abschnitt', '04:00', '4h 00min', 'hoch', 'geplant',
'[
  {"lat": 53.5200, "lng": 9.9500},
  {"lat": 53.5300, "lng": 9.9600},
  {"lat": 53.5400, "lng": 9.9700},
  {"lat": 53.5500, "lng": 9.9800}
]'::jsonb)
ON CONFLICT (name) DO UPDATE SET
  coordinates = EXCLUDED.coordinates;

-- Materialien für Salzverbrauch-Tests
INSERT INTO materials (name, unit, current_stock, minimum_stock, cost_per_unit) VALUES
('Streusalz', 'kg', 10000.0, 2000.0, 0.15),
('Splitt', 'kg', 5000.0, 1000.0, 0.25),
('Auftaumittel', 'liter', 2000.0, 500.0, 1.20)
ON CONFLICT (name) DO UPDATE SET
  current_stock = EXCLUDED.current_stock;

-- Wetterdaten für Hamburg
INSERT INTO weather_data (location_name, latitude, longitude, temperature, humidity, wind_speed, conditions, forecast_type, recorded_at) VALUES
('Hamburg Zentrum', 53.5511, 9.9937, -2.5, 85, 15.2, 'Schnefall', 'current', CURRENT_TIMESTAMP),
('Hamburg Nord', 53.5711, 9.9937, -3.0, 88, 18.5, 'Starker Schnefall', 'current', CURRENT_TIMESTAMP),
('Hamburg Süd', 53.5311, 9.9937, -1.8, 82, 12.8, 'Leichter Schnefall', 'current', CURRENT_TIMESTAMP)
ON CONFLICT (location_name, forecast_type, recorded_at) DO NOTHING;

-- Testfotos mit Standorten
INSERT INTO photos (filename, original_name, mime_type, file_size, worker_id, location_lat, location_lng, description, tags) 
SELECT 
    'test_photo_1.jpg',
    'Straßenzustand_Hauptstraße.jpg',
    'image/jpeg',
    1024000,
    u.id,
    53.5511,
    9.9937,
    'Straßenzustand vor Behandlung',
    ARRAY['before', 'ice', 'dangerous']
FROM users u WHERE u.email = 'max@winterdienst.de'
ON CONFLICT (filename) DO NOTHING;

-- Test Work Sessions
INSERT INTO work_sessions (worker_id, route_id, start_time, end_time, total_duration, distance_km, fuel_consumed, notes)
SELECT 
    u.id,
    r.id,
    CURRENT_TIMESTAMP - INTERVAL '2 hours',
    CURRENT_TIMESTAMP - INTERVAL '30 minutes',
    90,
    15.5,
    18.2,
    'Testfahrt abgeschlossen - gute Straßenverhältnisse nach Behandlung'
FROM users u, routes r 
WHERE u.email = 'max@winterdienst.de' 
AND r.name = 'Hauptstraße Nord'
ON CONFLICT DO NOTHING;

-- Trigger die geometry updates für bestehende Daten
UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE current_location_lat IS NOT NULL;
UPDATE routes SET updated_at = CURRENT_TIMESTAMP WHERE coordinates IS NOT NULL;
UPDATE photos SET updated_at = CURRENT_TIMESTAMP WHERE location_lat IS NOT NULL;
UPDATE weather_data SET updated_at = CURRENT_TIMESTAMP WHERE latitude IS NOT NULL;