-- Indexes for better query performance
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_devices_last_seen ON devices(last_seen);
CREATE INDEX idx_security_alerts_device_id ON security_alerts(device_id);
CREATE INDEX idx_security_alerts_detected_at ON security_alerts(detected_at);
CREATE INDEX idx_security_alerts_status ON security_alerts(status);
CREATE INDEX idx_blocked_attempts_source_ip ON blocked_attempts(source_ip);
CREATE INDEX idx_blocked_attempts_blocked_at ON blocked_attempts(blocked_at);
CREATE INDEX idx_system_metrics_recorded_at ON system_metrics(recorded_at);
CREATE INDEX idx_device_logs_device_id ON device_logs(device_id);
CREATE INDEX idx_device_logs_created_at ON device_logs(created_at);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_token ON user_sessions(session_token);