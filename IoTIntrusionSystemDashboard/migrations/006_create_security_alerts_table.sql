CREATE TABLE security_alerts (
    id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES devices(id),
    alert_type VARCHAR(100) NOT NULL, -- 'Suspicious Activity', 'Unauthorized Access', etc.
    severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    description TEXT,
    source_ip INET,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'investigating', 'resolved', 'false_positive'
    resolved_by INTEGER REFERENCES users(id),
    metadata JSONB -- For storing additional alert data
);