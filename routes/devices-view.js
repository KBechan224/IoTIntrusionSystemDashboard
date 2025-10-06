var express = require('express');
var router = express.Router();
const db = require('../config/database');
const { routeLogger } = require('../utils/logger');
const { requireAuth } = require('../middleware/auth');

/* GET devices view page */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { status, device_type, page = 1, limit = 20, success } = req.query;
    
    let whereConditions = {};
    if (status) whereConditions.status = status;
    if (device_type) whereConditions.device_type = device_type;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Get devices with pagination
    const devices = await db.findWhere('devices', whereConditions, {
      limit: parseInt(limit),
      offset: offset,
      orderBy: 'created_at DESC'
    });
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM devices';
    let countParams = [];
    let countParamCount = 0;
    
    if (status) {
      countParamCount++;
      countQuery += ` WHERE status = $${countParamCount}`;
      countParams.push(status);
    }
    if (device_type) {
      countParamCount++;
      if (countParamCount === 1) {
        countQuery += ' WHERE';
      } else {
        countQuery += ' AND';
      }
      countQuery += ` device_type = $${countParamCount}`;
      countParams.push(device_type);
    }
    
    const countResult = await db.query(countQuery, countParams);
    const totalDevices = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalDevices / parseInt(limit));
    
    res.render('devices/index', {
      title: 'Devices - IoT Intrusion System',
      pageTitle: 'Device Management',
      devices: devices.map(device => {
        let statusBadge = 'secondary';
        let statusText = device.status;
        switch (device.status) {
          case 'online': statusBadge = 'success'; statusText = 'Online'; break;
          case 'offline': statusBadge = 'secondary'; statusText = 'Offline'; break;
          case 'maintenance': statusBadge = 'warning'; statusText = 'Maintenance'; break;
        }
        
        return {
          id: device.id,
          name: device.name,
          deviceType: device.device_type,
          macAddress: device.mac_address,
          ipAddress: device.ip_address,
          status: device.status,
          statusBadge: statusBadge,
          statusText: statusText,
          location: device.location,
          firmwareVersion: device.firmware_version,
          lastSeen: device.last_seen,
          createdAt: device.created_at,
          updatedAt: device.updated_at
        };
      }),
      pagination: {
        currentPage: parseInt(page),
        totalPages: totalPages,
        totalDevices: totalDevices,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1,
        nextPage: parseInt(page) + 1,
        prevPage: parseInt(page) - 1
      },
      filters: {
        status: status,
        device_type: device_type
      },
      success: success === 'device_added' ? 'Device added successfully!' : null
    });
  } catch (error) {
    routeLogger.error('Get devices view error', {
      error: error.message
    });
    res.status(500).render('error', {
      title: 'Devices Error',
      message: 'An error occurred while loading devices.',
      error: { status: 500 }
    });
  }
});

/* GET add device page */
router.get('/add', requireAuth, (req, res, next) => {
  res.render('devices/add', {
    title: 'Add Device - IoT Intrusion System',
    pageTitle: 'Add New Device'
  });
});

/* POST add device */
router.post('/add', requireAuth, async (req, res, next) => {
  try {
    const { name, device_type, mac_address, ip_address, location, firmware_version } = req.body;
    
    // Validation
    if (!name || !device_type) {
      return res.render('devices/add', {
        title: 'Add Device - IoT Intrusion System',
        pageTitle: 'Add New Device',
        error: 'Name and device type are required.',
        formData: req.body
      });
    }
    
    // Check if device with same MAC address already exists
    if (mac_address) {
      const existingDevice = await db.query(
        'SELECT id FROM devices WHERE mac_address = $1',
        [mac_address]
      );
      
      if (existingDevice.rows.length > 0) {
        return res.render('devices/add', {
          title: 'Add Device - IoT Intrusion System',
          pageTitle: 'Add New Device',
          error: 'A device with this MAC address already exists.',
          formData: req.body
        });
      }
    }
    
    // Create device
    const deviceData = {
      name,
      device_type,
      status: 'offline'
    };
    
    if (mac_address) deviceData.mac_address = mac_address;
    if (ip_address) deviceData.ip_address = ip_address;
    if (location) deviceData.location = location;
    if (firmware_version) deviceData.firmware_version = firmware_version;
    
    const newDevice = await db.insert('devices', deviceData);
    
    routeLogger.info('Device added successfully', {
      deviceId: newDevice.id,
      deviceName: newDevice.name,
      userId: req.session.user.id
    });
    
    res.redirect('/devices?success=device_added');
    
  } catch (error) {
    routeLogger.error('Add device error', {
      error: error.message,
      userId: req.session.user.id
    });
    res.render('devices/add', {
      title: 'Add Device - IoT Intrusion System',
      pageTitle: 'Add New Device',
      error: 'An error occurred while adding the device. Please try again.',
      formData: req.body
    });
  }
});

/* GET manage device page */
router.get('/manage/:id', requireAuth, async (req, res, next) => {
  try {
    const deviceId = parseInt(req.params.id);
    
    if (Number.isNaN(deviceId)) {
      return res.status(400).render('error', {
        title: 'Invalid Device ID',
        message: 'The device ID provided is not valid.',
        error: { status: 400 }
      });
    }
    
    const device = await db.findById('devices', deviceId);
    
    if (!device) {
      return res.status(404).render('error', {
        title: 'Device Not Found',
        message: 'The requested device could not be found.',
        error: { status: 404 }
      });
    }
    
    // Get recent alerts for this device
    const recentAlerts = await db.query(
      `SELECT id, alert_type, severity, description, detected_at, status
       FROM security_alerts
       WHERE device_id = $1
       ORDER BY detected_at DESC
       LIMIT 10`,
      [deviceId]
    );
    
    let statusBadge = 'secondary';
    let statusText = device.status;
    switch (device.status) {
      case 'online': statusBadge = 'success'; statusText = 'Online'; break;
      case 'offline': statusBadge = 'secondary'; statusText = 'Offline'; break;
      case 'maintenance': statusBadge = 'warning'; statusText = 'Maintenance'; break;
    }
    
    res.render('devices/manage', {
      title: `Manage ${device.name} - IoT Intrusion System`,
      pageTitle: `Manage Device: ${device.name}`,
      device: {
        id: device.id,
        name: device.name,
        deviceType: device.device_type,
        macAddress: device.mac_address,
        ipAddress: device.ip_address,
        status: device.status,
        statusBadge: statusBadge,
        statusText: statusText,
        location: device.location,
        firmwareVersion: device.firmware_version,
        lastSeen: device.last_seen,
        createdAt: device.created_at,
        updatedAt: device.updated_at
      },
      recentAlerts: recentAlerts.rows.map(alert => {
        let severityBadge = 'secondary';
        let severityText = alert.severity;
        switch (alert.severity) {
          case 'low': severityBadge = 'info'; severityText = 'Low'; break;
          case 'medium': severityBadge = 'warning'; severityText = 'Medium'; break;
          case 'high': severityBadge = 'danger'; severityText = 'High'; break;
          case 'critical': severityBadge = 'danger'; severityText = 'Critical'; break;
        }
        
        return {
          id: alert.id,
          type: alert.alert_type,
          severity: alert.severity,
          severityBadge: severityBadge,
          severityText: severityText,
          description: alert.description,
          detectedAt: alert.detected_at,
          status: alert.status
        };
      })
    });
  } catch (error) {
    routeLogger.error('Get manage device error', {
      deviceId: req.params.id,
      error: error.message
    });
    res.status(500).render('error', {
      title: 'Device Management Error',
      message: 'An error occurred while loading device management page.',
      error: { status: 500 }
    });
  }
});

module.exports = router;