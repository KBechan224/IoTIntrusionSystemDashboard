CREATE TABLE blocked_attempts (
    id SERIAL PRIMARY KEY,
    source_ip INET NOT NULL,
    target_device_id INTEGER REFERENCES devices(id),
    attempt_type VARCHAR(100) NOT NULL, -- 'brute_force', 'port_scan', 'malware', etc.
    blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attempt_count INTEGER DEFAULT 1,
    user_agent TEXT,
    request_details JSONB
);