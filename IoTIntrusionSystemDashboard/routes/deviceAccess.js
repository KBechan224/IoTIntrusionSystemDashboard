var express = require('express');
var router = express.Router();
const db = require('../config/database');
const { routeLogger } = require('../utils/logger');
const { requireAuthOrDeny } = require('../middleware/auth');

// Helper function to check if user has explicit permission to access device
async function hasDevicePermission(userId, deviceId) {
  try {
    // Check if there's a device_permissions table or if user has admin role
    const userResult = await db.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length > 0 && userResult.rows[0].role === 'admin') {
      return true;
    }
    
    // For non-admin users, check specific device permissions (could be implemented later)
    // For now, assume no explicit permissions for regular users
    return false;
  } catch (error) {
    routeLogger.error('Error checking device permissions', { userId, deviceId, error: error.message });
    return false;
  }
}

// Helper function to log blocked attempts
async function logBlockedAttempt(userId, deviceId, sourceIp, attemptType, userAgent, details = {}) {
  try {
    await db.insert('blocked_attempts', {
      source_ip: sourceIp,
      target_device_id: deviceId,
      attempt_type: attemptType,
      blocked_at: new Date(),
      attempt_count: 1,
      user_agent: userAgent,
      request_details: JSON.stringify({
        user_id: userId,
        blocked_reason: details.reason || 'unauthorized_access',
        ...details
      })
    });
    
    routeLogger.warn('Blocked device access attempt logged', {
      userId,
      deviceId,
      sourceIp,
      attemptType,
      reason: details.reason
    });
  } catch (error) {
    routeLogger.error('Error logging blocked attempt', { error: error.message });
  }
}

// Helper function to create security alert
async function createSecurityAlert(deviceId, alertType, severity, description, sourceIp, metadata = {}) {
  try {
    await db.insert('security_alerts', {
      device_id: deviceId,
      alert_type: alertType,
      severity: severity,
      description: description,
      source_ip: sourceIp,
      detected_at: new Date(),
      status: 'active',
      metadata: JSON.stringify(metadata)
    });
    
    routeLogger.warn('Security alert created', {
      deviceId,
      alertType,
      severity,
      description
    });
  } catch (error) {
    routeLogger.error('Error creating security alert', { error: error.message });
  }
}

// Helper function to get user's recent activity
async function getUserRecentActivity(userId, limit = 5) {
  try {
    const activities = [];
    
    // Get recent blocked attempts
    const blockedAttempts = await db.query(`
      SELECT ba.blocked_at, ba.attempt_type, d.name as device_name
      FROM blocked_attempts ba
      LEFT JOIN devices d ON ba.target_device_id = d.id
      WHERE ba.request_details::jsonb->>'user_id' = $1
      ORDER BY ba.blocked_at DESC
      LIMIT $2
    `, [userId.toString(), Math.floor(limit / 2)]);
    
    blockedAttempts.rows.forEach(attempt => {
      activities.push({
        message: `Access blocked to ${attempt.device_name || 'Unknown Device'} (${attempt.attempt_type})`,
        timestamp: new Date(attempt.blocked_at).toLocaleString(),
        icon: 'bi-shield-x',
        iconClass: 'text-danger'
      });
    });
    
    // Get recent successful connections (would need a connections table in production)
    // For now, we'll simulate some activity
    
    return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
  } catch (error) {
    routeLogger.error('Error getting user activity', { userId, error: error.message });
    return [];
  }
}

/* GET device access page */
router.get('/', requireAuthOrDeny, async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    
    // Get all devices with their security status
    const devicesResult = await db.query(`
      SELECT id, name, device_type, mac_address, ip_address, location, 
             firmware_version, status, last_seen,
             CASE 
               WHEN firmware_version IS NOT NULL AND firmware_version != '' THEN true
               ELSE false
             END as has_security_enabled
      FROM devices
      ORDER BY name ASC
    `);
    
    const devices = devicesResult.rows.map(device => ({
      id: device.id,
      name: device.name,
      deviceType: device.device_type,
      macAddress: device.mac_address,
      ipAddress: device.ip_address,
      location: device.location || 'Unknown',
      firmwareVersion: device.firmware_version,
      status: device.status,
      lastSeen: device.last_seen ? new Date(device.last_seen).toLocaleString() : 'Never',
      hasSecurityEnabled: device.has_security_enabled
    }));
    
    // Check if user is currently connected to any device
    const connectedDevice = req.session.connectedDevice || null;
    
    // Get user's recent activity
    const recentActivity = await getUserRecentActivity(userId);
    
    res.render('device-access', {
      title: 'Device Access - IoT Intrusion System',
      pageTitle: 'Device Access',
      devices: devices,
      connectedDevice: connectedDevice,
      recentActivity: recentActivity,
      error: req.query.error,
      warning: req.query.warning
    });
  } catch (error) {
    routeLogger.error('Device access page error', {
      userId: req.session.user.id,
      error: error.message
    });
    res.status(500).render('error', {
      message: 'Failed to load device access page',
      error: { status: 500 }
    });
  }
});

/* POST connect to device */
router.post('/connect/:deviceId', requireAuthOrDeny, async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const deviceId = parseInt(req.params.deviceId);
    const sourceIp = req.ip;
    const userAgent = req.get('User-Agent');
    
    if (isNaN(deviceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid device ID'
      });
    }
    
    // Check if device exists and is online
    const deviceResult = await db.query(`
      SELECT id, name, device_type, mac_address, ip_address, location, 
             firmware_version, status,
             CASE 
               WHEN firmware_version IS NOT NULL AND firmware_version != '' THEN true
               ELSE false
             END as has_security_enabled
      FROM devices WHERE id = $1
    `, [deviceId]);
    
    if (deviceResult.rows.length === 0) {
      await logBlockedAttempt(userId, deviceId, sourceIp, 'invalid_device', userAgent, {
        reason: 'device_not_found'
      });
      
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }
    
    const device = deviceResult.rows[0];
    
    if (device.status !== 'online') {
      await logBlockedAttempt(userId, deviceId, sourceIp, 'offline_device', userAgent, {
        reason: 'device_offline',
        device_status: device.status
      });
      
      return res.status(400).json({
        success: false,
        message: 'Device is currently offline'
      });
    }
    
    // Check if user has explicit permission
    const hasPermission = await hasDevicePermission(userId, deviceId);
    
    if (!hasPermission) {
      // User doesn't have explicit permission
      if (device.has_security_enabled) {
        // Device has security - block the attempt
        await logBlockedAttempt(userId, deviceId, sourceIp, 'unauthorized_access', userAgent, {
          reason: 'no_permission_secured_device',
          device_name: device.name,
          security_enabled: true
        });
        
        return res.status(403).json({
          success: false,
          message: 'Access denied. This device requires explicit permission and has security enabled.'
        });
      } else {
        // Device doesn't have security - allow access but create security alert
        await createSecurityAlert(
          deviceId,
          'Unauthorized Device Access',
          'medium',
          `User accessed unsecured device without explicit permission: ${device.name}`,
          sourceIp,
          {
            user_id: userId,
            device_name: device.name,
            access_granted: true,
            security_enabled: false,
            reason: 'unsecured_device_access'
          }
        );
        
        routeLogger.warn('Unsecured device accessed without permission', {
          userId,
          deviceId,
          deviceName: device.name,
          sourceIp
        });
      }
    }
    
    // Successful connection
    const connectionTime = new Date();
    const connectedDevice = {
      id: device.id,
      name: device.name,
      deviceType: device.device_type,
      macAddress: device.mac_address,
      ipAddress: device.ip_address,
      location: device.location,
      firmwareVersion: device.firmware_version,
      status: device.status,
      connectedAt: connectionTime.toLocaleString(),
      sessionDuration: '0m 0s'
    };
    
    // Store connection in session
    req.session.connectedDevice = connectedDevice;
    
    // Log successful connection
    routeLogger.info('Device connection established', {
      userId,
      deviceId,
      deviceName: device.name,
      sourceIp,
      hasPermission,
      securityEnabled: device.has_security_enabled
    });
    
    res.json({
      success: true,
      message: `Successfully connected to ${device.name}`,
      device: connectedDevice
    });
    
  } catch (error) {
    routeLogger.error('Device connection error', {
      deviceId: req.params.deviceId,
      userId: req.session.user.id,
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      message: 'An error occurred while connecting to the device'
    });
  }
});

/* POST disconnect from device */
router.post('/disconnect/:deviceId', requireAuthOrDeny, async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const deviceId = parseInt(req.params.deviceId);
    
    if (isNaN(deviceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid device ID'
      });
    }
    
    // Check if user is connected to this device
    if (!req.session.connectedDevice || req.session.connectedDevice.id !== deviceId) {
      return res.status(400).json({
        success: false,
        message: 'You are not connected to this device'
      });
    }
    
    const deviceName = req.session.connectedDevice.name;
    
    // Clear the connection
    delete req.session.connectedDevice;
    
    // Log disconnection
    routeLogger.info('Device disconnection', {
      userId,
      deviceId,
      deviceName
    });
    
    res.json({
      success: true,
      message: `Successfully disconnected from ${deviceName}`
    });
    
  } catch (error) {
    routeLogger.error('Device disconnection error', {
      deviceId: req.params.deviceId,
      userId: req.session.user.id,
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      message: 'An error occurred while disconnecting from the device'
    });
  }
});

module.exports = router;