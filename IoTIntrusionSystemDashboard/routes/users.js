var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/database');
const config = require('../config/env');
const { routeLogger } = require('../utils/logger');
const { requireAuthAPI, requireAdminAPI } = require('../middleware/auth');

/* GET users listing */
router.get('/', requireAdminAPI, async (req, res, next) => {
  try {
    const users = await db.query(
      `SELECT id, name, email, role, is_active, created_at, last_login 
       FROM users 
       ORDER BY created_at DESC`
    );
    
    res.json({
      success: true,
      data: users.rows.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.is_active,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }))
    });
  } catch (error) {
    routeLogger.error('Get users error', {
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

const { requireAuth } = require('../middleware/auth');

/* GET user profile page */
router.get('/profile', requireAuth, async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    
    const result = await db.query(
      `SELECT id, name, email, role, is_active, created_at, last_login 
       FROM users 
       WHERE id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).render('error', {
        title: 'User Not Found',
        message: 'Your profile could not be found.',
        error: { status: 404 }
      });
    }
    
    const user = result.rows[0];
    
    res.render('users/profile', {
      title: 'User Profile - IoT Intrusion System',
      pageTitle: 'User Profile',
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.is_active,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }
    });
  } catch (error) {
    routeLogger.error('Get profile error', {
      userId: req.session.user.id,
      error: error.message
    });
    res.status(500).render('error', {
      title: 'Profile Error',
      message: 'An error occurred while loading your profile.',
      error: { status: 500 }
    });
  }
});

/* GET user settings page */
router.get('/settings', requireAuth, async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    
    const result = await db.query(
      `SELECT id, name, email, role, is_active, created_at, last_login 
       FROM users 
       WHERE id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).render('error', {
        title: 'User Not Found',
        message: 'Your profile could not be found.',
        error: { status: 404 }
      });
    }
    
    const user = result.rows[0];
    
    res.render('users/settings', {
      title: 'User Settings - IoT Intrusion System',
      pageTitle: 'User Settings',
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.is_active,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }
    });
  } catch (error) {
    routeLogger.error('Get settings error', {
      userId: req.session.user.id,
      error: error.message
    });
    res.status(500).render('error', {
      title: 'Settings Error',
      message: 'An error occurred while loading your settings.',
      error: { status: 500 }
    });
  }
});

/* POST update user settings */
router.post('/settings', requireAuth, async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const { name, email } = req.body;
    
    if (!name || !email) {
      return res.render('users/settings', {
        title: 'User Settings - IoT Intrusion System',
        pageTitle: 'User Settings',
        profile: req.body,
        error: 'Name and email are required.'
      });
    }
    
    // Check if email is already taken by another user
    const emailCheck = await db.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, userId]
    );
    
    if (emailCheck.rows.length > 0) {
      return res.render('users/settings', {
        title: 'User Settings - IoT Intrusion System',
        pageTitle: 'User Settings',
        profile: req.body,
        error: 'Email address is already in use.'
      });
    }
    
    // Update user
    await db.query(
      'UPDATE users SET name = $1, email = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [name, email, userId]
    );
    
    // Update session
    req.session.user.name = name;
    req.session.user.email = email;
    
    routeLogger.info('User settings updated', { userId: userId });
    
    res.render('users/settings', {
      title: 'User Settings - IoT Intrusion System',
      pageTitle: 'User Settings',
      profile: {
        id: userId,
        name: name,
        email: email
      },
      success: 'Your settings have been updated successfully.'
    });
  } catch (error) {
    routeLogger.error('Update settings error', {
      userId: req.session.user.id,
      error: error.message
    });
    res.status(500).render('error', {
      title: 'Settings Error',
      message: 'An error occurred while updating your settings.',
      error: { status: 500 }
    });
  }
});

/* GET user by ID */
router.get('/:id', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }
    
    const user = await db.findById('users', userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Remove password hash from response
    const { password_hash, ...userResponse } = user;
    
    res.json({
      success: true,
      data: {
        id: userResponse.id,
        name: userResponse.name,
        email: userResponse.email,
        role: userResponse.role,
        isActive: userResponse.is_active,
        createdAt: userResponse.created_at,
        updatedAt: userResponse.updated_at,
        lastLogin: userResponse.last_login
      }
    });
  } catch (error) {
    routeLogger.error('Get user error', {
      userId: req.params.id,
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
      message: error.message
    });
  }
});

/* POST create new user */
router.post('/', async (req, res, next) => {
  try {
    const { name, email, password, role = 'user' } = req.body;
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required'
      });
    }
    
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }
    
    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, config.security.bcryptRounds);
    
    // Create user
    const newUser = await db.insert('users', {
      name,
      email,
      password_hash: passwordHash,
      role,
      is_active: true
    });
    
    // Remove password hash from response
    const { password_hash, ...userResponse } = newUser;
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: userResponse.id,
        name: userResponse.name,
        email: userResponse.email,
        role: userResponse.role,
        isActive: userResponse.is_active,
        createdAt: userResponse.created_at
      }
    });
  } catch (error) {
    routeLogger.error('Create user error', {
      error: error.message,
      userData: req.body
    });
    res.status(500).json({
      success: false,
      error: 'Failed to create user',
      message: error.message
    });
  }
});

/* PUT update user */
router.put('/:id', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const { name, email, role, is_active } = req.body;
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }
    
    // Check if user exists
    const existingUser = await db.findById('users', userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (is_active !== undefined) updateData.is_active = is_active;
    updateData.updated_at = new Date();
    
    // Update user
    const updatedUsers = await db.update('users', updateData, { id: userId });
    
    if (updatedUsers.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found or no changes made'
      });
    }
    
    const updatedUser = updatedUsers[0];
    const { password_hash, ...userResponse } = updatedUser;
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: userResponse.id,
        name: userResponse.name,
        email: userResponse.email,
        role: userResponse.role,
        isActive: userResponse.is_active,
        createdAt: userResponse.created_at,
        updatedAt: userResponse.updated_at,
        lastLogin: userResponse.last_login
      }
    });
  } catch (error) {
    routeLogger.error('Update user error', {
      userId: req.params.id,
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
      message: error.message
    });
  }
});

/* DELETE user */
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }
    
    // Check if user exists
    const existingUser = await db.findById('users', userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Delete user (or soft delete by setting is_active to false)
    const deletedCount = await db.delete('users', { id: userId });
    
    if (deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    routeLogger.error('Delete user error', {
      userId: req.params.id,
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
      message: error.message
    });
  }
});

module.exports = router;
