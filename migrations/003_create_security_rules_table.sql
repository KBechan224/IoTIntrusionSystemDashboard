CREATE TABLE security_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(100) NOT NULL, -- 'firewall', 'intrusion_detection', 'access_control'
    conditions JSONB NOT NULL, -- Rule conditions as JSON
    actions JSONB NOT NULL, -- Actions to take as JSON
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 100,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);