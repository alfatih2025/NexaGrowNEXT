-- =====================================================================
-- NEXAGROW SUPABASE TABLES SETUP
-- =====================================================================
-- Copy-paste seluruh SQL ini di Supabase SQL Editor untuk membuat semua tables
-- Perhatian: Jalankan satu kali saja, atau gunakan DROP TABLE IF EXISTS sebelum CREATE
-- =====================================================================

-- 1. SENSOR_DATA TABLE - Menyimpan data sensor dari IoT devices
-- =====================================================================
CREATE TABLE IF NOT EXISTS sensor_data (
    id BIGSERIAL PRIMARY KEY,
    node_id INT NOT NULL,
    device_id VARCHAR(50) DEFAULT 'ESP32_001',
    
    -- Pembacaan Sensor
    temperature NUMERIC(6, 2),
    humidity NUMERIC(6, 2),
    soil_moisture NUMERIC(6, 2),
    soil_raw_dry NUMERIC(8, 2),
    rain NUMERIC(8, 3),
    
    -- Scoring & Calculations
    score NUMERIC(6, 2),
    soil_score NUMERIC(6, 2),
    vdp_score NUMERIC(6, 2),
    rain_score NUMERIC(6, 2),
    vpd NUMERIC(6, 2),
    duration_estimate VARCHAR(100),
    
    -- Status Perangkat
    pump_status BOOLEAN DEFAULT FALSE,
    led_status BOOLEAN DEFAULT FALSE,
    device_mode VARCHAR(50),
    wifi_status VARCHAR(50),
    
    -- Threshold Values
    threshold_kritis NUMERIC(6, 2),
    threshold_atas NUMERIC(6, 2),
    threshold_bawah NUMERIC(6, 2),
    
    -- Watering Schedule
    watering_time VARCHAR(10),
    watering_duration INT,
    schedule_enabled BOOLEAN DEFAULT TRUE,
    
    -- Formula References
    formula_name VARCHAR(100),
    formula_soil VARCHAR(100),
    formula_vpd VARCHAR(100),
    formula_score VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk optimasi query
CREATE INDEX IF NOT EXISTS idx_sensor_node_id ON sensor_data(node_id);
CREATE INDEX IF NOT EXISTS idx_sensor_created_at ON sensor_data(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_device_id ON sensor_data(device_id);

-- =====================================================================
-- 2. SETTINGS TABLE - Konfigurasi sistem
-- =====================================================================
CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY DEFAULT 1,
    
    -- Informasi Tanaman
    plant_phase VARCHAR(20) DEFAULT 'vegetatif', -- vegetatif atau generatif
    crop_mode VARCHAR(20) DEFAULT 'vegetatif',
    location VARCHAR(50) DEFAULT '33.74.07.1010',
    
    -- Temperature Thresholds
    temp_threshold_low NUMERIC(6, 2) DEFAULT 22,
    temp_threshold_high NUMERIC(6, 2) DEFAULT 34,
    
    -- Soil Moisture Thresholds
    soil_threshold_low NUMERIC(6, 2) DEFAULT 45,
    soil_threshold_high NUMERIC(6, 2) DEFAULT 75,
    soil_threshold_critical NUMERIC(6, 2) DEFAULT 35,
    soil_moisture_threshold NUMERIC(6, 2),
    
    -- Humidity Thresholds
    humidity_threshold_low NUMERIC(6, 2) DEFAULT 60,
    humidity_threshold_high NUMERIC(6, 2) DEFAULT 85,
    air_humidity_low NUMERIC(6, 2),
    air_humidity_high NUMERIC(6, 2),
    
    -- pH Levels
    ph_min NUMERIC(4, 2) DEFAULT 5.5,
    ph_max NUMERIC(4, 2) DEFAULT 8.0,
    
    -- Reporting
    auto_report BOOLEAN DEFAULT TRUE,
    report_time VARCHAR(10) DEFAULT '08:00',
    
    -- Watering Schedule
    watering_time VARCHAR(10) DEFAULT '06:00',
    watering_duration INT DEFAULT 10, -- dalam detik
    watering_enabled BOOLEAN DEFAULT TRUE,
    schedule_enabled BOOLEAN DEFAULT TRUE,
    
    -- User Info
    user_name VARCHAR(100) DEFAULT 'Petani Cerdas',
    user_email VARCHAR(100) DEFAULT 'petani@sprout.id',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- 3. ALERTS TABLE - Notifikasi dan alert
-- =====================================================================
CREATE TABLE IF NOT EXISTS alerts (
    id BIGSERIAL PRIMARY KEY,
    
    -- Alert Info
    type VARCHAR(100) NOT NULL, -- temperature, humidity, soil_moisture, dll
    severity VARCHAR(20) NOT NULL, -- info, warning, danger
    message TEXT NOT NULL,
    
    -- Status
    read BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk optimasi
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_read ON alerts(read);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);

-- =====================================================================
-- 4. CHAT_MESSAGES TABLE - Riwayat chat dengan AI assistant
-- =====================================================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    
    -- Chat Content
    role VARCHAR(20) NOT NULL, -- 'user' atau 'assistant'
    content TEXT NOT NULL,
    
    -- Snapshots (JSON untuk flexibility)
    sensor_snapshot JSONB, -- Snapshot sensor data saat message dibuat
    settings_snapshot JSONB, -- Snapshot settings saat message dibuat
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk query efisien
CREATE INDEX IF NOT EXISTS idx_chat_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_role ON chat_messages(role);

-- =====================================================================
-- 5. ACTIVITY_LOGS TABLE - Log semua aktivitas sistem
-- =====================================================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGSERIAL PRIMARY KEY,
    
    -- Log Content
    action VARCHAR(100) NOT NULL, -- export, control, update, dll
    description TEXT,
    
    -- Additional Data
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk query efisien
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);

-- =====================================================================
-- 6. CONTROL_LOGS TABLE - Log perintah kontrol
-- =====================================================================
CREATE TABLE IF NOT EXISTS control_logs (
    id BIGSERIAL PRIMARY KEY,
    
    -- Command Info
    command VARCHAR(100) NOT NULL, -- settings_sync, schedule_set, wifi_update, dll
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, acknowledged, failed
    
    -- Additional Data
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk query efisien
CREATE INDEX IF NOT EXISTS idx_control_logs_created_at ON control_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_control_logs_command ON control_logs(command);
CREATE INDEX IF NOT EXISTS idx_control_logs_status ON control_logs(status);

-- =====================================================================
-- 7. DEVICES TABLE (Opsional) - Informasi perangkat IoT
-- =====================================================================
CREATE TABLE IF NOT EXISTS devices (
    id BIGSERIAL PRIMARY KEY,
    
    -- Device Info
    node_id INT NOT NULL UNIQUE,
    device_id VARCHAR(50) UNIQUE,
    name VARCHAR(100), -- "ESP32 Gateway", "ESP8266 Node 1", dll
    device_type VARCHAR(50), -- ESP32, ESP8266, dll
    location VARCHAR(100),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_seen TIMESTAMP WITH TIME ZONE,
    
    -- Network Info
    ip_address VARCHAR(20),
    mac_address VARCHAR(20),
    signal_strength INT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_devices_node_id ON devices(node_id);
CREATE INDEX IF NOT EXISTS idx_devices_is_active ON devices(is_active);

-- =====================================================================
-- 8. ENABLE ROW LEVEL SECURITY (RLS) - Keamanan Dasar
-- =====================================================================

-- Disable RLS untuk development (nanti enable di production)
ALTER TABLE sensor_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE control_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE devices DISABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 9. INSERT DEFAULT SETTINGS DATA
-- =====================================================================

INSERT INTO settings (id, plant_phase, location, temp_threshold_low, temp_threshold_high, 
                      soil_threshold_low, soil_threshold_high, soil_threshold_critical, 
                      humidity_threshold_low, humidity_threshold_high, ph_min, ph_max, 
                      auto_report, report_time, watering_time, watering_duration, 
                      watering_enabled, user_name, user_email)
VALUES (
    1,
    'vegetatif',
    '33.74.07.1010',
    22.0,
    34.0,
    45.0,
    75.0,
    35.0,
    60.0,
    85.0,
    5.5,
    8.0,
    TRUE,
    '08:00',
    '06:00',
    10,
    TRUE,
    'Petani Cerdas',
    'petani@sprout.id'
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- 10. GRANT PERMISSIONS - Jika menggunakan service role
-- =====================================================================

-- Uncomment ini jika ingin memberikan akses ke service role
-- GRANT ALL ON sensor_data TO anon, authenticated;
-- GRANT ALL ON settings TO anon, authenticated;
-- GRANT ALL ON alerts TO anon, authenticated;
-- GRANT ALL ON chat_messages TO anon, authenticated;
-- GRANT ALL ON activity_logs TO anon, authenticated;
-- GRANT ALL ON control_logs TO anon, authenticated;
-- GRANT ALL ON devices TO anon, authenticated;

-- =====================================================================
-- SELESAI - Semua tables berhasil dibuat!
-- =====================================================================
-- Gunakan API endpoint ini untuk interact dengan tables:
-- - GET /api/sensor - Ambil data sensor
-- - GET /api/settings - Ambil settings
-- - GET /api/alerts - Ambil alerts
-- - POST /api/control - Kirim perintah kontrol
-- - POST /api/chat - Kirim pesan ke AI assistant
-- =====================================================================
