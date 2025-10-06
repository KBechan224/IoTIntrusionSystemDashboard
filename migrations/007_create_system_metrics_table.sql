CREATE TABLE system_metrics (
    id SERIAL PRIMARY KEY,
    metric_type VARCHAR(50) NOT NULL, -- 'cpu', 'memory', 'network', 'storage'
    metric_value DECIMAL(5,2) NOT NULL, -- percentage or value
    unit VARCHAR(20) DEFAULT 'percent',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    device_id INTEGER REFERENCES devices(id) -- null for system-wide metrics
);