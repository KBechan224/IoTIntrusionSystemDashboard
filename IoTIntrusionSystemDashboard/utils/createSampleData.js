/**
 * Sample Data Creator for IoT Intrusion System Dashboard
 * Creates sample devices, security alerts, and blocked attempts for testing
 */

const db = require('../config/database');
const { appLogger } = require('./logger');

async function createSampleDevices() {
  try {
    // Check if devices already exist
    const existingDevices = await db.query('SELECT COUNT(*) as count FROM devices');
    if (parseInt(existingDevices.rows[0].count) > 0) {
      appLogger.info('Sample devices already exist, skipping creation');
      return;
    }

    const sampleDevices = [
      {
        name: 'IoT Camera - Lobby',
        device_type: 'camera',
        mac_address: '00:1B:44:11:3A:B7',
        ip_address: '192.168.1.101',
        location: 'Building Lobby',
        firmware_version: '2.1.4', // Has security
        status: 'online',
        last_seen: new Date()
      },
      {
        name: 'Smart Thermostat',
        device_type: 'thermostat',
        mac_address: '00:1B:44:11:3A:B8',
        ip_address: '192.168.1.102',
        location: 'Main Office',
        firmware_version: '', // No security (empty firmware)
        status: 'online',
        last_seen: new Date(Date.now() - 300000) // 5 minutes ago
      },
      {
        name: 'Access Point - Floor 2',
        device_type: 'access_point',
        mac_address: '00:1B:44:11:3A:B9',
        ip_address: '192.168.1.103',
        location: 'Second Floor',
        firmware_version: '3.2.1', // Has security
        status: 'offline',
        last_seen: new Date(Date.now() - 3600000) // 1 hour ago
      },
      {
        name: 'Door Sensor - Main Entry',
        device_type: 'sensor',
        mac_address: '00:1B:44:11:3A:BA',
        ip_address: '192.168.1.104',
        location: 'Main Entrance',
        firmware_version: null, // No security (null firmware)
        status: 'online',
        last_seen: new Date()
      },
      {
        name: 'Motion Detector - Parking',
        device_type: 'sensor',
        mac_address: '00:1B:44:11:3A:BB',
        ip_address: '192.168.1.105',
        location: 'Parking Lot',
        firmware_version: '2.0.3', // Has security
        status: 'online',
        last_seen: new Date(Date.now() - 60000) // 1 minute ago
      }
    ];

    for (const device of sampleDevices) {
      await db.insert('devices', device);
    }

    appLogger.info('Sample devices created successfully');
  } catch (error) {
    appLogger.error('Error creating sample devices', { error: error.message });
    throw error;
  }
}

async function createSampleSecurityAlerts() {
  try {
    // Check if alerts already exist
    const existingAlerts = await db.query('SELECT COUNT(*) as count FROM security_alerts');
    if (parseInt(existingAlerts.rows[0].count) > 0) {
      appLogger.info('Sample security alerts already exist, skipping creation');
      return;
    }

    // Get device IDs for reference
    const devices = await db.query('SELECT id FROM devices LIMIT 5');
    const deviceIds = devices.rows.map(row => row.id);

    const sampleAlerts = [
      {
        device_id: deviceIds[0] || null,
        alert_type: 'Unauthorized Access Attempt',
        severity: 'high',
        description: 'Multiple failed login attempts detected from suspicious IP',
        source_ip: '203.0.113.45',
        detected_at: new Date(Date.now() - 7200000), // 2 hours ago
        status: 'active',
        metadata: JSON.stringify({
          failed_attempts: 15,
          attack_pattern: 'brute_force',
          geographic_location: 'Unknown'
        })
      },
      {
        device_id: deviceIds[1] || null,
        alert_type: 'Suspicious Network Activity',
        severity: 'medium',
        description: 'Unusual data transfer patterns detected',
        source_ip: '198.51.100.23',
        detected_at: new Date(Date.now() - 3600000), // 1 hour ago
        status: 'active',
        metadata: JSON.stringify({
          data_volume: '2.3GB',
          transfer_time: '15 minutes',
          destination: 'unknown_server'
        })
      },
      {
        device_id: deviceIds[2] || null,
        alert_type: 'Port Scanning Activity',
        severity: 'medium',
        description: 'Systematic port scanning detected from external source',
        source_ip: '192.0.2.100',
        detected_at: new Date(Date.now() - 1800000), // 30 minutes ago
        status: 'active',
        metadata: JSON.stringify({
          scanned_ports: [22, 23, 80, 443, 8080],
          scan_duration: '5 minutes'
        })
      },
      {
        device_id: deviceIds[3] || null,
        alert_type: 'Malware Detection',
        severity: 'critical',
        description: 'Potential malware signature detected in network traffic',
        source_ip: '10.0.0.15',
        detected_at: new Date(Date.now() - 900000), // 15 minutes ago
        status: 'active',
        metadata: JSON.stringify({
          malware_type: 'trojan',
          signature: 'TR.Mirai.Variant',
          action_taken: 'quarantined'
        })
      },
      {
        device_id: deviceIds[4] || null,
        alert_type: 'Firmware Vulnerability',
        severity: 'high',
        description: 'Outdated firmware with known vulnerabilities detected',
        detected_at: new Date(Date.now() - 300000), // 5 minutes ago
        status: 'active',
        metadata: JSON.stringify({
          current_version: '1.2.0',
          vulnerable_cve: 'CVE-2023-12345',
          recommended_action: 'update_firmware'
        })
      }
    ];

    for (const alert of sampleAlerts) {
      await db.insert('security_alerts', alert);
    }

    appLogger.info('Sample security alerts created successfully');
  } catch (error) {
    appLogger.error('Error creating sample security alerts', { error: error.message });
    throw error;
  }
}

async function createSampleBlockedAttempts() {
  try {
    // Check if blocked attempts already exist
    const existingAttempts = await db.query('SELECT COUNT(*) as count FROM blocked_attempts');
    if (parseInt(existingAttempts.rows[0].count) > 0) {
      appLogger.info('Sample blocked attempts already exist, skipping creation');
      return;
    }

    // Get device IDs for reference
    const devices = await db.query('SELECT id FROM devices LIMIT 5');
    const deviceIds = devices.rows.map(row => row.id);

    const sampleBlockedAttempts = [
      {
        source_ip: '203.0.113.45',
        target_device_id: deviceIds[0] || null,
        attempt_type: 'brute_force',
        blocked_at: new Date(Date.now() - 7200000), // 2 hours ago
        attempt_count: 15,
        user_agent: 'curl/7.68.0',
        request_details: JSON.stringify({
          target_port: 22,
          protocol: 'SSH',
          attempted_usernames: ['admin', 'root', 'user']
        })
      },
      {
        source_ip: '198.51.100.23',
        target_device_id: deviceIds[1] || null,
        attempt_type: 'port_scan',
        blocked_at: new Date(Date.now() - 5400000), // 1.5 hours ago
        attempt_count: 50,
        request_details: JSON.stringify({
          scanned_ports: '1-1000',
          scan_type: 'TCP_SYN'
        })
      },
      {
        source_ip: '192.0.2.100',
        target_device_id: deviceIds[2] || null,
        attempt_type: 'unauthorized_access',
        blocked_at: new Date(Date.now() - 3600000), // 1 hour ago
        attempt_count: 8,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        request_details: JSON.stringify({
          attempted_path: '/admin/login',
          authentication_failures: 8
        })
      },
      {
        source_ip: '10.0.0.25',
        target_device_id: deviceIds[3] || null,
        attempt_type: 'malware',
        blocked_at: new Date(Date.now() - 1800000), // 30 minutes ago
        attempt_count: 1,
        request_details: JSON.stringify({
          malware_signature: 'Mirai.Bot.Variant',
          blocked_payload_size: '2048 bytes'
        })
      },
      {
        source_ip: '172.16.0.50',
        target_device_id: deviceIds[4] || null,
        attempt_type: 'ddos',
        blocked_at: new Date(Date.now() - 900000), // 15 minutes ago
        attempt_count: 1000,
        request_details: JSON.stringify({
          attack_type: 'UDP_FLOOD',
          packets_per_second: 10000,
          total_volume: '100MB'
        })
      },
      // Add some recent attempts to show current activity
      {
        source_ip: '203.0.113.67',
        target_device_id: deviceIds[0] || null,
        attempt_type: 'brute_force',
        blocked_at: new Date(Date.now() - 300000), // 5 minutes ago
        attempt_count: 3,
        user_agent: 'python-requests/2.28.1',
        request_details: JSON.stringify({
          target_service: 'HTTP_AUTH',
          attempted_credentials: 3
        })
      },
      {
        source_ip: '198.51.100.89',
        target_device_id: deviceIds[1] || null,
        attempt_type: 'exploitation',
        blocked_at: new Date(Date.now() - 120000), // 2 minutes ago
        attempt_count: 1,
        request_details: JSON.stringify({
          exploit_type: 'buffer_overflow',
          target_vulnerability: 'CVE-2023-54321'
        })
      }
    ];

    for (const attempt of sampleBlockedAttempts) {
      await db.insert('blocked_attempts', attempt);
    }

    appLogger.info('Sample blocked attempts created successfully');
  } catch (error) {
    appLogger.error('Error creating sample blocked attempts', { error: error.message });
    throw error;
  }
}

async function createAllSampleData() {
  try {
    appLogger.info('Starting sample data creation...');
    
    await createSampleDevices();
    await createSampleSecurityAlerts();
    await createSampleBlockedAttempts();
    
    appLogger.info('All sample data created successfully');
  } catch (error) {
    appLogger.error('Error creating sample data', { error: error.message });
    throw error;
  }
}

module.exports = {
  createSampleDevices,
  createSampleSecurityAlerts,
  createSampleBlockedAttempts,
  createAllSampleData
};