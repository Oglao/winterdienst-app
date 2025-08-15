-- Management Features Schema Erweiterung

-- Salt/Material Consumption Tracking
CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL, -- Streusalz, Split, etc.
    unit VARCHAR(20) NOT NULL DEFAULT 'kg', -- kg, l, t
    cost_per_unit DECIMAL(8,3), -- Kosten pro Einheit
    current_stock DECIMAL(10,2) DEFAULT 0, -- Aktueller Bestand
    min_stock_alert DECIMAL(10,2), -- Mindestbestand für Alarm
    supplier VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Material Usage per Route/Session
CREATE TABLE material_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_session_id UUID NOT NULL REFERENCES work_sessions(id),
    route_id UUID NOT NULL REFERENCES routes(id),
    material_id UUID NOT NULL REFERENCES materials(id),
    amount_used DECIMAL(10,2) NOT NULL, -- Verbrauchte Menge
    area_covered DECIMAL(10,2), -- Bearbeitete Fläche in qm
    weather_condition VARCHAR(50), -- Wetterbedingungen
    surface_type VARCHAR(50), -- Straßentyp
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers and Projects
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    billing_address TEXT,
    tax_number VARCHAR(50),
    payment_terms INTEGER DEFAULT 14, -- Zahlungsziel in Tagen
    hourly_rate DECIMAL(8,2), -- Stundensatz
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer Projects/Contracts
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    contract_value DECIMAL(12,2),
    billing_type VARCHAR(20) DEFAULT 'hourly' CHECK (billing_type IN ('hourly', 'fixed', 'per_route')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Link Routes to Projects
ALTER TABLE routes ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS estimated_area DECIMAL(10,2); -- Geschätzte Fläche in qm
ALTER TABLE routes ADD COLUMN IF NOT EXISTS surface_type VARCHAR(50); -- Straßentyp

-- Weather Conditions and Forecasts
CREATE TABLE weather_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    temperature DECIMAL(5,2), -- in Celsius
    feels_like DECIMAL(5,2),
    humidity INTEGER, -- in %
    wind_speed DECIMAL(5,2), -- in km/h
    wind_direction INTEGER, -- in Grad
    precipitation DECIMAL(5,2), -- in mm
    snow_depth DECIMAL(5,2), -- in cm
    weather_condition VARCHAR(100), -- sunny, cloudy, snow, rain, etc.
    visibility DECIMAL(5,2), -- in km
    forecast_time TIMESTAMP NOT NULL, -- Für Vorhersagen
    is_forecast BOOLEAN DEFAULT false,
    data_source VARCHAR(50) DEFAULT 'api', -- api, manual, sensor
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Automatic Deployment Planning
CREATE TABLE deployment_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    trigger_conditions JSONB, -- Weather conditions that trigger deployment
    priority_routes UUID[], -- Array of route IDs in priority order
    required_teams INTEGER DEFAULT 1,
    estimated_duration INTEGER, -- in minutes
    material_requirements JSONB, -- Required materials per route
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'triggered', 'completed')),
    triggered_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices and Billing
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    project_id UUID REFERENCES projects(id),
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 19.0, -- Steuersatz in %
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoice Line Items
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    work_session_id UUID REFERENCES work_sessions(id),
    route_id UUID REFERENCES routes(id),
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    item_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance Metrics
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES users(id),
    route_id UUID REFERENCES routes(id),
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    routes_completed INTEGER DEFAULT 0,
    total_hours DECIMAL(8,2) DEFAULT 0,
    total_distance DECIMAL(10,2) DEFAULT 0,
    material_efficiency DECIMAL(5,2), -- kg/qm or similar
    customer_rating DECIMAL(3,2), -- 1-5 stars
    incidents_count INTEGER DEFAULT 0,
    fuel_efficiency DECIMAL(5,2), -- l/100km
    cost_efficiency DECIMAL(10,2), -- €/route
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer Portal Access
CREATE TABLE customer_portal_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    access_token VARCHAR(255),
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes für Performance
CREATE INDEX idx_materials_name ON materials(name);
CREATE INDEX idx_materials_is_active ON materials(is_active);

CREATE INDEX idx_material_usage_session ON material_usage(work_session_id);
CREATE INDEX idx_material_usage_route ON material_usage(route_id);
CREATE INDEX idx_material_usage_material ON material_usage(material_id);

CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_is_active ON customers(is_active);

CREATE INDEX idx_projects_customer ON projects(customer_id);
CREATE INDEX idx_projects_status ON projects(status);

CREATE INDEX idx_weather_location ON weather_data(latitude, longitude);
CREATE INDEX idx_weather_forecast_time ON weather_data(forecast_time);
CREATE INDEX idx_weather_is_forecast ON weather_data(is_forecast);

CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);

CREATE INDEX idx_performance_worker ON performance_metrics(worker_id);
CREATE INDEX idx_performance_date ON performance_metrics(metric_date);

-- Triggers für auto-update
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deployment_plans_updated_at BEFORE UPDATE ON deployment_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views für Management Features
CREATE VIEW material_usage_summary AS
SELECT 
    m.name as material_name,
    m.unit,
    SUM(mu.amount_used) as total_used,
    AVG(mu.amount_used) as avg_per_session,
    COUNT(mu.id) as usage_count,
    SUM(mu.amount_used * m.cost_per_unit) as total_cost
FROM materials m
JOIN material_usage mu ON m.id = mu.material_id
WHERE m.is_active = true
GROUP BY m.id, m.name, m.unit;

CREATE VIEW project_billing_summary AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    c.name as customer_name,
    COUNT(ws.id) as total_sessions,
    SUM(ws.total_duration) as total_minutes,
    ROUND(SUM(ws.total_duration) / 60.0, 2) as total_hours,
    COUNT(DISTINCT r.id) as routes_count,
    COALESCE(SUM(ii.total_price), 0) as billed_amount,
    p.contract_value - COALESCE(SUM(ii.total_price), 0) as remaining_value
FROM projects p
JOIN customers c ON p.customer_id = c.id
LEFT JOIN routes r ON r.project_id = p.id
LEFT JOIN work_sessions ws ON ws.route_id = r.id
LEFT JOIN invoice_items ii ON ii.work_session_id = ws.id
WHERE p.status = 'active'
GROUP BY p.id, p.name, c.name, p.contract_value;

CREATE VIEW worker_performance_summary AS
SELECT 
    u.id as worker_id,
    u.name as worker_name,
    DATE_TRUNC('month', pm.metric_date) as month,
    AVG(pm.routes_completed) as avg_routes_per_day,
    AVG(pm.total_hours) as avg_hours_per_day,
    AVG(pm.material_efficiency) as avg_material_efficiency,
    AVG(pm.customer_rating) as avg_customer_rating,
    AVG(pm.fuel_efficiency) as avg_fuel_efficiency
FROM users u
JOIN performance_metrics pm ON u.id = pm.worker_id
GROUP BY u.id, u.name, DATE_TRUNC('month', pm.metric_date)
ORDER BY month DESC, u.name;

-- Weather-based deployment triggers
CREATE VIEW weather_deployment_triggers AS
SELECT 
    wd.location_name,
    wd.forecast_time,
    wd.temperature,
    wd.precipitation,
    wd.snow_depth,
    wd.weather_condition,
    CASE 
        WHEN wd.temperature <= 3 AND wd.precipitation > 0 THEN 'high'
        WHEN wd.temperature <= 0 THEN 'high'
        WHEN wd.snow_depth > 2 THEN 'high'
        WHEN wd.temperature <= 5 AND wd.precipitation > 2 THEN 'medium'
        ELSE 'low'
    END as deployment_priority
FROM weather_data wd
WHERE wd.is_forecast = true
    AND wd.forecast_time >= CURRENT_TIMESTAMP
    AND wd.forecast_time <= CURRENT_TIMESTAMP + INTERVAL '24 hours';