var express = require('express');
var router = express.Router();
const db = require('../config/database');
const { routeLogger } = require('../utils/logger');
const { requireAuth, requireAuthAPI } = require('../middleware/auth');

/* GET dashboard page. */
router.get('/', requireAuth, async (req, res, next) => {
  
  try {
    // Get dashboard statistics from database
    const [devicesCount, activeAlertsCount, blockedAttemptsCount, recentAlerts, devices] = await Promise.all([
      // Total devices count
      db.query('SELECT COUNT(*) as count FROM devices'),
      
      // Active threats count
      db.query("SELECT COUNT(*) as count FROM security_alerts WHERE status = 'active'"),
      
      // Blocked attempts count (last 24 hours)
      db.query(
        "SELECT COUNT(*) as count FROM blocked_attempts WHERE blocked_at >= NOW() - INTERVAL '24 hours'"
      ),
      
      // Recent alerts (last 10)
      db.query(`
        SELECT sa.id, sa.alert_type as type, d.name as device, 
               sa.detected_at as timestamp, sa.severity
        FROM security_alerts sa
        LEFT JOIN devices d ON sa.device_id = d.id
        WHERE sa.status = 'active'
        ORDER BY sa.detected_at DESC
        LIMIT 10
      `),
      
      // Device status (last 10)
      db.query(`
        SELECT name, status, 
               CASE 
                 WHEN last_seen IS NULL THEN 'never'
                 WHEN last_seen >= NOW() - INTERVAL '5 minutes' THEN 'now'
                 WHEN last_seen >= NOW() - INTERVAL '1 hour' THEN EXTRACT(EPOCH FROM (NOW() - last_seen))/60 || ' min ago'
                 ELSE EXTRACT(EPOCH FROM (NOW() - last_seen))/3600 || ' hours ago'
               END as lastSeen
        FROM devices
        ORDER BY last_seen DESC NULLS LAST
        LIMIT 10
      `)
    ]);
    
    // Format the data for the view
    const dashboardData = {
      title: 'Dashboard - IoT Intrusion System',
      pageTitle: 'Security Dashboard',
      stats: {
        totalDevices: parseInt(devicesCount.rows[0].count) || 0,
        activeThreats: parseInt(activeAlertsCount.rows[0].count) || 0,
        blockedAttempts: parseInt(blockedAttemptsCount.rows[0].count) || 0,
        systemStatus: 'Active'
      },
      recentAlerts: recentAlerts.rows.map(alert => ({
        id: alert.id,
        type: alert.type,
        device: alert.device || 'Unknown Device',
        timestamp: new Date(alert.timestamp).toLocaleString(),
        severity: alert.severity
      })),
      devices: devices.rows.map(device => ({
        name: device.name,
        status: device.status,
        lastSeen: device.lastseen
      }))
    };
    
    res.render('dashboard', dashboardData);
  } catch (error) {
    routeLogger.error('Dashboard data error', {
      error: error.message
    });
    res.status(500).render('error', {
      message: 'Failed to load dashboard data',
      error: { status: 500 }
    });
  }
});

/* GET dashboard API data */
router.get('/api/stats', requireAuthAPI, async (req, res, next) => {
  try {
    const [devicesCount, activeAlertsCount, blockedAttemptsCount] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM devices'),
      db.query("SELECT COUNT(*) as count FROM security_alerts WHERE status = 'active'"),
      db.query(
        "SELECT COUNT(*) as count FROM blocked_attempts WHERE blocked_at >= NOW() - INTERVAL '24 hours'"
      )
    ]);
    
    res.json({
      totalDevices: parseInt(devicesCount.rows[0].count) || 0,
      activeThreats: parseInt(activeAlertsCount.rows[0].count) || 0,
      blockedAttempts: parseInt(blockedAttemptsCount.rows[0].count) || 0,
      systemStatus: 'Active',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    routeLogger.error('API stats error', {
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics'
    });
  }
});

module.exports = router;