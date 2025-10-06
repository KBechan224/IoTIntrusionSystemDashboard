var express = require('express');
var router = express.Router();
const db = require('../config/database');
const { routeLogger } = require('../utils/logger');
const { requireAuth } = require('../middleware/auth');

/* GET alerts view page */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { status, severity, device_id, page = 1, limit = 20 } = req.query;
    
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
    
    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    paramCount++;
    const limitParam = paramCount;
    params.push(parseInt(limit));
    
    paramCount++;
    const offsetParam = paramCount;
    params.push(offset);
    
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
    
    const alertsResult = await db.query(query, params);
    
    // Get total count for pagination
    let countWhereClause = whereClause.replace(/sa\./g, '');
    const countQuery = `
      SELECT COUNT(*) as total
      FROM security_alerts sa
      ${countWhereClause}
    `;
    const countResult = await db.query(countQuery, params.slice(0, -2)); // Remove limit and offset params
    const totalAlerts = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalAlerts / parseInt(limit));
    
    res.render('alerts/index', {
      title: 'Security Alerts - IoT Intrusion System',
      pageTitle: 'Security Alerts',
      alerts: alertsResult.rows.map(alert => {
        let severityBadge = 'secondary';
        let severityText = alert.severity;
        switch (alert.severity) {
          case 'low': severityBadge = 'info'; severityText = 'Low'; break;
          case 'medium': severityBadge = 'warning'; severityText = 'Medium'; break;
          case 'high': severityBadge = 'danger'; severityText = 'High'; break;
          case 'critical': severityBadge = 'danger'; severityText = 'Critical'; break;
        }
        
        let statusBadge = 'secondary';
        let statusText = alert.status;
        switch (alert.status) {
          case 'active': statusBadge = 'danger'; statusText = 'Active'; break;
          case 'resolved': statusBadge = 'success'; statusText = 'Resolved'; break;
          case 'dismissed': statusBadge = 'secondary'; statusText = 'Dismissed'; break;
        }
        
        return {
          id: alert.id,
          type: alert.alert_type,
          severity: alert.severity,
          severityBadge: severityBadge,
          severityText: severityText,
          description: alert.description,
          sourceIp: alert.source_ip,
          detectedAt: alert.detected_at,
          resolvedAt: alert.resolved_at,
          status: alert.status,
          statusBadge: statusBadge,
          statusText: statusText,
          deviceName: alert.device_name,
          deviceType: alert.device_type,
          resolvedByName: alert.resolved_by_name,
          metadata: alert.metadata
        };
      }),
      pagination: {
        currentPage: parseInt(page),
        totalPages: totalPages,
        totalAlerts: totalAlerts,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1,
        nextPage: parseInt(page) + 1,
        prevPage: parseInt(page) - 1
      },
      filters: {
        status: status,
        severity: severity,
        device_id: device_id
      }
    });
  } catch (error) {
    routeLogger.error('Get alerts view error', {
      error: error.message
    });
    res.status(500).render('error', {
      title: 'Alerts Error',
      message: 'An error occurred while loading security alerts.',
      error: { status: 500 }
    });
  }
});

module.exports = router;