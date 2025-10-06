var express = require('express');
var router = express.Router();
const db = require('../config/database');
const { routeLogger } = require('../utils/logger');
const { requireAuthAPI } = require('../middleware/auth');

/* GET alerts listing */
router.get('/', requireAuthAPI, async (req, res, next) => {
  try {
    const { status, severity, device_id, limit = 50, offset = 0 } = req.query;
    
    let whereClause = '';
    let params = [];
    let paramCount = 0;
    
    const conditions = [];
    if (status) {
      paramCount++;
      conditions.push(`sa.status = $${paramCount}`);
      params.push(status);
    }
    if (severity) {
      paramCount++;
      conditions.push(`sa.severity = $${paramCount}`);
      params.push(severity);
    }
    if (device_id) {
      paramCount++;
      conditions.push(`sa.device_id = $${paramCount}`);
      params.push(parseInt(device_id));
    }
    
    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }
    
    // Add limit and offset
    paramCount++;
    const limitParam = paramCount;
    params.push(parseInt(limit));
    
    paramCount++;
    const offsetParam = paramCount;
    params.push(parseInt(offset));
    
    const query = `
      SELECT sa.id, sa.alert_type, sa.severity, sa.description, sa.source_ip,
             sa.detected_at, sa.resolved_at, sa.status, sa.metadata,
             d.name as device_name, d.device_type,
             u.name as resolved_by_name
      FROM security_alerts sa
      LEFT JOIN devices d ON sa.device_id = d.id
      LEFT JOIN users u ON sa.resolved_by = u.id
      ${whereClause}
      ORDER BY sa.detected_at DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      data: result.rows.map(alert => ({
        id: alert.id,
        alertType: alert.alert_type,
        severity: alert.severity,
        description: alert.description,
        sourceIp: alert.source_ip,
        detectedAt: alert.detected_at,
        resolvedAt: alert.resolved_at,
        status: alert.status,
        metadata: alert.metadata,
        device: {
          name: alert.device_name,
          type: alert.device_type
        },
        resolvedBy: alert.resolved_by_name
      }))
    });
  } catch (error) {
    routeLogger.error('Get alerts error', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts',
      message: error.message
    });
  }
});

/* GET alert by ID */
router.get('/:id', async (req, res, next) => {
  try {
    const alertId = parseInt(req.params.id);
    
    if (isNaN(alertId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid alert ID'
      });
    }
    
    const result = await db.query(`
      SELECT sa.*, d.name as device_name, d.device_type,
             u.name as resolved_by_name
      FROM security_alerts sa
      LEFT JOIN devices d ON sa.device_id = d.id
      LEFT JOIN users u ON sa.resolved_by = u.id
      WHERE sa.id = $1
    `, [alertId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }
    
    const alert = result.rows[0];
    
    res.json({
      success: true,
      data: {
        id: alert.id,
        alertType: alert.alert_type,
        severity: alert.severity,
        description: alert.description,
        sourceIp: alert.source_ip,
        detectedAt: alert.detected_at,
        resolvedAt: alert.resolved_at,
        status: alert.status,
        metadata: alert.metadata,
        device: {
          id: alert.device_id,
          name: alert.device_name,
          type: alert.device_type
        },
        resolvedBy: {
          id: alert.resolved_by,
          name: alert.resolved_by_name
        }
      }
    });
  } catch (error) {
    routeLogger.error('Get alert error', {
      alertId: req.params.id,
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alert',
      message: error.message
    });
  }
});

/* POST create new alert */
router.post('/', async (req, res, next) => {
  try {
    const { device_id, alert_type, severity, description, source_ip, metadata } = req.body;
    
    if (!alert_type || !severity) {
      return res.status(400).json({
        success: false,
        error: 'Alert type and severity are required'
      });
    }
    
    // Validate severity
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(severity)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid severity level. Must be one of: low, medium, high, critical'
      });
    }
    
    // Validate device exists if device_id is provided
    if (device_id) {
      const device = await db.findById('devices', device_id);
      if (!device) {
        return res.status(400).json({
          success: false,
          error: 'Device not found'
        });
      }
    }
    
    const alertData = {
      alert_type,
      severity,
      status: 'active'
    };
    
    if (device_id) alertData.device_id = device_id;
    if (description) alertData.description = description;
    if (source_ip) alertData.source_ip = source_ip;
    if (metadata) alertData.metadata = JSON.stringify(metadata);
    
    const newAlert = await db.insert('security_alerts', alertData);
    
    res.status(201).json({
      success: true,
      message: 'Alert created successfully',
      data: {
        id: newAlert.id,
        alertType: newAlert.alert_type,
        severity: newAlert.severity,
        description: newAlert.description,
        sourceIp: newAlert.source_ip,
        detectedAt: newAlert.detected_at,
        status: newAlert.status,
        metadata: newAlert.metadata
      }
    });
  } catch (error) {
    routeLogger.error('Create alert error', {
      error: error.message,
      alertData: req.body
    });
    res.status(500).json({
      success: false,
      error: 'Failed to create alert',
      message: error.message
    });
  }
});

/* PUT resolve alert */
router.put('/:id/resolve', async (req, res, next) => {
  try {
    const alertId = parseInt(req.params.id);
    const { resolved_by, resolution_note } = req.body;
    
    if (isNaN(alertId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid alert ID'
      });
    }
    
    // Check if alert exists and is active
    const alert = await db.findById('security_alerts', alertId);
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }
    
    if (alert.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Alert is already resolved or not active'
      });
    }
    
    // Validate user exists if resolved_by is provided
    if (resolved_by) {
      const user = await db.findById('users', resolved_by);
      if (!user) {
        return res.status(400).json({
          success: false,
          error: 'User not found'
        });
      }
    }
    
    const updateData = {
      status: 'resolved',
      resolved_at: new Date()
    };
    
    if (resolved_by) updateData.resolved_by = resolved_by;
    
    // Add resolution note to metadata if provided
    if (resolution_note) {
      const currentMetadata = alert.metadata ? JSON.parse(alert.metadata) : {};
      currentMetadata.resolution_note = resolution_note;
      updateData.metadata = JSON.stringify(currentMetadata);
    }
    
    const updatedAlerts = await db.update('security_alerts', updateData, { id: alertId });
    
    if (updatedAlerts.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Alert resolved successfully',
      data: {
        id: updatedAlerts[0].id,
        status: updatedAlerts[0].status,
        resolvedAt: updatedAlerts[0].resolved_at,
        resolvedBy: updatedAlerts[0].resolved_by
      }
    });
  } catch (error) {
    routeLogger.error('Resolve alert error', {
      alertId: req.params.id,
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to resolve alert',
      message: error.message
    });
  }
});

/* DELETE alert */
router.delete('/:id', async (req, res, next) => {
  try {
    const alertId = parseInt(req.params.id);
    
    if (isNaN(alertId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid alert ID'
      });
    }
    
    const deletedCount = await db.delete('security_alerts', { id: alertId });
    
    if (deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    routeLogger.error('Delete alert error', {
      alertId: req.params.id,
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to delete alert',
      message: error.message
    });
  }
});

/* GET alert statistics */
router.get('/stats/summary', async (req, res, next) => {
  try {
    const [totalCount, activeCount, severityStats, recentCount] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM security_alerts'),
      db.query("SELECT COUNT(*) as count FROM security_alerts WHERE status = 'active'"),
      db.query(`
        SELECT severity, COUNT(*) as count 
        FROM security_alerts 
        WHERE status = 'active' 
        GROUP BY severity
      `),
      db.query(
        "SELECT COUNT(*) as count FROM security_alerts WHERE detected_at >= NOW() - INTERVAL '24 hours'"
      )
    ]);
    
    const severityBreakdown = {};
    severityStats.rows.forEach(row => {
      severityBreakdown[row.severity] = parseInt(row.count);
    });
    
    res.json({
      success: true,
      data: {
        total: parseInt(totalCount.rows[0].count),
        active: parseInt(activeCount.rows[0].count),
        recent24h: parseInt(recentCount.rows[0].count),
        severityBreakdown
      }
    });
  } catch (error) {
    routeLogger.error('Get alert stats error', {
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alert statistics',
      message: error.message
    });
  }
});

module.exports = router;