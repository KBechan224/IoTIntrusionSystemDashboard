CREATE TABLE devices (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    device_type VARCHAR(100) NOT NULL, -- 'camera', 'sensor', 'router', etc.
    mac_address VARCHAR(17) UNIQUE,
    ip_address INET,
    status VARCHAR(50) DEFAULT 'offline', -- 'online', 'offline', 'alert'
    location VARCHAR(255),
    firmware_version VARCHAR(50),
    last_seen TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);