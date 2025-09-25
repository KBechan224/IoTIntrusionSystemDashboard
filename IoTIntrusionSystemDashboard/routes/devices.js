var express = require('express');
var router = express.Router();
const db = require('../config/database');
const { routeLogger } = require('../utils/logger');
const { requireAuthAPI } = require('../middleware/auth');

/* GET devices listing */
router.get('/', requireAuthAPI, async (req, res, next) => {
  try {
    const { status, device_type, limit = 50, offset = 0 } = req.query;
    
    let whereConditions = {};
    if (status) whereConditions.status = status;
    if (device_type) whereConditions.device_type = device_type;
    
    const devices = await db.findWhere('devices', whereConditions, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      orderBy: 'created_at DESC'
    });
    
    res.json({
      success: true,
      data: devices.map(device => ({
        id: device.id,
        name: device.name,
        deviceType: device.device_type,
        macAddress: device.mac_address,
        ipAddress: device.ip_address,
        status: device.status,
        location: device.location,
        firmwareVersion: device.firmware_version,
        lastSeen: device.last_seen,
        createdAt: device.created_at,
        updatedAt: device.updated_at
      }))
    });
  } catch (error) {
    routeLogger.error('Get devices error', {
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch devices',
      message: error.message
    });
  }
});

/* GET device by ID */
router.get('/:id', async (req, res, next) => {
  try {
    const deviceId = parseInt(req.params.id);
    
    if (isNaN(deviceId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid device ID'
      });
    }
    
    const device = await db.findById('devices', deviceId);
    
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: device.id,
        name: device.name,
        deviceType: device.device_type,
        macAddress: device.mac_address,
        ipAddress: device.ip_address,
        status: device.status,
        location: device.location,
        firmwareVersion: device.firmware_version,
        lastSeen: device.last_seen,
        createdAt: device.created_at,
        updatedAt: device.updated_at
      }
    });
  } catch (error) {
    routeLogger.error('Get device error', {
      deviceId: req.params.id,
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch device',
      message: error.message
    });
  }
});

/* POST create new device */
router.post('/', async (req, res, next) => {
  try {
    const { name, device_type, mac_address, ip_address, location, firmware_version } = req.body;
    
    if (!name || !device_type) {
      return res.status(400).json({
        success: false,
        error: 'Name and device type are required'
      });
    }
    
    // Check if device with same MAC address already exists
    if (mac_address) {
      const existingDevice = await db.query(
        'SELECT id FROM devices WHERE mac_address = $1',
        [mac_address]
      );
      
      if (existingDevice.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Device with this MAC address already exists'
        });
      }
    }
    
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
    
    res.status(201).json({
      success: true,
      message: 'Device created successfully',
      data: {
        id: newDevice.id,
        name: newDevice.name,
        deviceType: newDevice.device_type,
        macAddress: newDevice.mac_address,
        ipAddress: newDevice.ip_address,
        status: newDevice.status,
        location: newDevice.location,
        firmwareVersion: newDevice.firmware_version,
        createdAt: newDevice.created_at
      }
    });
  } catch (error) {
    routeLogger.error('Create device error', {
      error: error.message,
      deviceData: req.body
    });
    res.status(500).json({
      success: false,
      error: 'Failed to create device',
      message: error.message
    });
  }
});

/* PUT update device */
router.put('/:id', async (req, res, next) => {
  try {
    const deviceId = parseInt(req.params.id);
    const { name, device_type, mac_address, ip_address, status, location, firmware_version } = req.body;
    
    if (isNaN(deviceId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid device ID'
      });
    }
    
    // Check if device exists
    const existingDevice = await db.findById('devices', deviceId);
    if (!existingDevice) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }
    
    // Prepare update data
    const updateData = { updated_at: new Date() };
    if (name !== undefined) updateData.name = name;
    if (device_type !== undefined) updateData.device_type = device_type;
    if (mac_address !== undefined) updateData.mac_address = mac_address;
    if (ip_address !== undefined) updateData.ip_address = ip_address;
    if (status !== undefined) updateData.status = status;
    if (location !== undefined) updateData.location = location;
    if (firmware_version !== undefined) updateData.firmware_version = firmware_version;
    
    // Update last_seen if status is being set to online
    if (status === 'online') {
      updateData.last_seen = new Date();
    }
    
    const updatedDevices = await db.update('devices', updateData, { id: deviceId });
    
    if (updatedDevices.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Device not found or no changes made'
      });
    }
    
    const updatedDevice = updatedDevices[0];
    
    res.json({
      success: true,
      message: 'Device updated successfully',
      data: {
        id: updatedDevice.id,
        name: updatedDevice.name,
        deviceType: updatedDevice.device_type,
        macAddress: updatedDevice.mac_address,
        ipAddress: updatedDevice.ip_address,
        status: updatedDevice.status,
        location: updatedDevice.location,
        firmwareVersion: updatedDevice.firmware_version,
        lastSeen: updatedDevice.last_seen,
        createdAt: updatedDevice.created_at,
        updatedAt: updatedDevice.updated_at
      }
    });
  } catch (error) {
    routeLogger.error('Update device error', {
      deviceId: req.params.id,
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to update device',
      message: error.message
    });
  }
});

/* DELETE device */
router.delete('/:id', async (req, res, next) => {
  try {
    const deviceId = parseInt(req.params.id);
    
    if (isNaN(deviceId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid device ID'
      });
    }
    
    // Check if device exists
    const existingDevice = await db.findById('devices', deviceId);
    if (!existingDevice) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }
    
    const deletedCount = await db.delete('devices', { id: deviceId });
    
    if (deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Device deleted successfully'
    });
  } catch (error) {
    routeLogger.error('Delete device error', {
      deviceId: req.params.id,
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to delete device',
      message: error.message
    });
  }
});

/* POST update device heartbeat/last_seen */
router.post('/:id/heartbeat', async (req, res, next) => {
  try {
    const deviceId = parseInt(req.params.id);
    
    if (isNaN(deviceId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid device ID'
      });
    }
    
    const updatedDevices = await db.update('devices', {
      last_seen: new Date(),
      status: 'online',
      updated_at: new Date()
    }, { id: deviceId });
    
    if (updatedDevices.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Device heartbeat recorded',
      data: {
        lastSeen: updatedDevices[0].last_seen,
        status: updatedDevices[0].status
      }
    });
  } catch (error) {
    routeLogger.error('Device heartbeat error', {
      deviceId: req.params.id,
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to record device heartbeat',
      message: error.message
    });
  }
});

module.exports = router;