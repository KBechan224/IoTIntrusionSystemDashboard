var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/database');
const { routeLogger } = require('../utils/logger');
const config = require('../config/env');
const { redirectIfAuth } = require('../middleware/auth');

/* GET login page. */
router.get('/login', redirectIfAuth, (req, res, next) => {
  // Handle query parameters for messages
  let message = null;
  let error = null;
  
  if (req.query.message === 'logged_out') {
    message = 'You have been successfully logged out.';
  }
  
  if (req.query.message === 'password_reset') {
    message = 'Your password has been successfully reset. Please log in with your new password.';
  }
  
  if (req.query.error === 'logout_failed') {
    error = 'Logout failed. Please try again.';
  }
  
  res.render('auth/login', { 
    title: 'Login - IoT Intrusion System',
    pageTitle: 'Login',
    success: message,
    error: error
  });
});

/* POST login */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      routeLogger.warn('Login attempt with missing credentials', {
        email: email || 'missing',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.redirect('/access-denied?from=login');
    }
    
    // Find user by email
    const result = await db.query(
      'SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      routeLogger.warn('Login attempt with invalid email', {
        email: email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.redirect('/access-denied?from=login');
    }
    
    const user = result.rows[0];
    
    // Check if user is active
    if (!user.is_active) {
      routeLogger.warn('Login attempt with deactivated account', {
        email: email,
        userId: user.id,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.redirect('/access-denied?from=login');
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      routeLogger.warn('Login attempt with invalid password', {
        email: email,
        userId: user.id,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.redirect('/access-denied?from=login');
    }
    
    // Update last login timestamp
    await db.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );
    
    // Store user in session (implement proper session management later)
    req.session = req.session || {};
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    
    // Redirect to the originally requested page or dashboard
    let redirectTo = req.session.returnTo;
    if (!redirectTo) {
      if (user.role === 'admin') {
        redirectTo = '/dashboard';
      } else {
        redirectTo = '/device-access';
      }
    }
    delete req.session.returnTo; // Clear the returnTo session
    
    res.redirect(redirectTo);
  } catch (error) {
    routeLogger.error('Login error', {
      error: error.message
    });
    
    let errorMessage = 'An error occurred during login. Please try again.';
    
    // Handle specific database errors
    if (error.message.includes('timeout') || error.message.includes('connect')) {
      errorMessage = 'Database connection failed. Please try again in a moment.';
    }
    
    res.render('auth/login', {
      title: 'Login - IoT Intrusion System',
      pageTitle: 'Login',
      error: errorMessage
    });
  }
});

/* GET register page. */
router.get('/register', redirectIfAuth, (req, res, next) => {
  res.render('auth/register', { 
    title: 'Register - IoT Intrusion System',
    pageTitle: 'Register'
  });
});

/* POST register */
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    
    // Validation
    if (!name || !email || !password || !confirmPassword) {
      return res.render('auth/register', {
        title: 'Register - IoT Intrusion System',
        pageTitle: 'Register',
        error: 'All fields are required'
      });
    }
    
    if (password !== confirmPassword) {
      return res.render('auth/register', {
        title: 'Register - IoT Intrusion System',
        pageTitle: 'Register',
        error: 'Passwords do not match'
      });
    }
    
    if (password.length < 8) {
      return res.render('auth/register', {
        title: 'Register - IoT Intrusion System',
        pageTitle: 'Register',
        error: 'Password must be at least 8 characters long'
      });
    }
    
    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.render('auth/register', {
        title: 'Register - IoT Intrusion System',
        pageTitle: 'Register',
        error: 'An account with this email already exists',
        formData: { name, email } // Preserve form data
      });
    }
    
    // Hash password
    const saltRounds = config.security.bcryptRounds;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const newUser = await db.insert('users', {
      name,
      email,
      password_hash: passwordHash,
      role: 'user',
      is_active: true
    });
    
    routeLogger.info('New user registered', {
      email: newUser.email,
      userId: newUser.id
    });
    
    res.render('auth/login', {
      title: 'Login - IoT Intrusion System',
      pageTitle: 'Login',
      success: 'Registration successful! Please log in with your credentials.'
    });
  } catch (error) {
    routeLogger.error('Registration error', {
      email: req.body.email,
      error: error.message
    });
    
    let errorMessage = 'An error occurred during registration. Please try again.';
    
    // Handle specific database errors
    if (error.message.includes('timeout') || error.message.includes('connect')) {
      errorMessage = 'Database connection failed. Please try again in a moment.';
    } else if (error.code === '23505') { // Unique violation
      errorMessage = 'An account with this email already exists.';
    }
    
    res.render('auth/register', {
      title: 'Register - IoT Intrusion System',
      pageTitle: 'Register',
      error: errorMessage,
      formData: req.body // Preserve form data
    });
  }
});

/* GET forgot password page */
router.get('/forgot-password', redirectIfAuth, (req, res, next) => {
  res.render('auth/forgot-password', {
    title: 'Forgot Password - IoT Intrusion System',
    pageTitle: 'Forgot Password'
  });
});

/* POST forgot password */
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { name, email } = req.body;
    
    if (!name || !email) {
      return res.render('auth/forgot-password', {
        title: 'Forgot Password - IoT Intrusion System',
        pageTitle: 'Forgot Password',
        error: 'Please provide both full name and email address.'
      });
    }
    
    // Find user by name and email
    const result = await db.query(
      'SELECT id, name, email FROM users WHERE name = $1 AND email = $2 AND is_active = true',
      [name, email]
    );
    
    if (result.rows.length === 0) {
      routeLogger.warn('Forgot password attempt with invalid credentials', {
        name: name,
        email: email,
        ip: req.ip
      });
      return res.render('auth/forgot-password', {
        title: 'Forgot Password - IoT Intrusion System',
        pageTitle: 'Forgot Password',
        error: 'No account found with the provided name and email address.'
      });
    }
    
    const user = result.rows[0];
    
    // For now, redirect to reset password page with user id (in production, use secure token)
    res.redirect(`/auth/reset-password?user=${user.id}`);
    
  } catch (error) {
    routeLogger.error('Forgot password error', {
      error: error.message
    });
    res.render('auth/forgot-password', {
      title: 'Forgot Password - IoT Intrusion System',
      pageTitle: 'Forgot Password',
      error: 'An error occurred. Please try again.'
    });
  }
});

/* GET reset password page */
router.get('/reset-password', (req, res, next) => {
  const userId = req.query.user;
  if (!userId) {
    return res.redirect('/auth/forgot-password');
  }
  
  res.render('auth/reset-password', {
    title: 'Reset Password - IoT Intrusion System',
    pageTitle: 'Reset Password',
    userId: userId
  });
});

/* POST reset password */
router.post('/reset-password', async (req, res, next) => {
  try {
    const { userId, password, confirmPassword } = req.body;
    
    if (!userId || !password || !confirmPassword) {
      return res.render('auth/reset-password', {
        title: 'Reset Password - IoT Intrusion System',
        pageTitle: 'Reset Password',
        userId: userId,
        error: 'All fields are required.'
      });
    }
    
    if (password !== confirmPassword) {
      return res.render('auth/reset-password', {
        title: 'Reset Password - IoT Intrusion System',
        pageTitle: 'Reset Password',
        userId: userId,
        error: 'Passwords do not match.'
      });
    }
    
    if (password.length < 8) {
      return res.render('auth/reset-password', {
        title: 'Reset Password - IoT Intrusion System',
        pageTitle: 'Reset Password',
        userId: userId,
        error: 'Password must be at least 8 characters long.'
      });
    }
    
    // Verify user exists
    const userResult = await db.query('SELECT id FROM users WHERE id = $1 AND is_active = true', [userId]);
    if (userResult.rows.length === 0) {
      return res.redirect('/auth/forgot-password');
    }
    
    // Hash new password
    const saltRounds = config.security.bcryptRounds;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Update password
    await db.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', 
      [passwordHash, userId]);
    
    routeLogger.info('Password reset successful', { userId: userId });
    
    res.redirect('/auth/login?message=password_reset');
    
  } catch (error) {
    routeLogger.error('Reset password error', {
      error: error.message
    });
    res.render('auth/reset-password', {
      title: 'Reset Password - IoT Intrusion System',
      pageTitle: 'Reset Password',
      userId: userId,
      error: 'An error occurred. Please try again.'
    });
  }
});

/* GET logout */
router.get('/logout', (req, res, next) => {
  // Log the logout attempt
  routeLogger.info('User logout attempt', {
    userId: req.session?.user?.id || 'unknown',
    email: req.session?.user?.email || 'unknown'
  });
  
  // Clear session
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        routeLogger.error('Session destruction error', {
          error: err.message,
          userId: req.session?.user?.id || 'unknown'
        });
        // Even if session destruction fails, clear the cookie
        res.clearCookie('connect.sid');
        return res.redirect('/auth/login?error=logout_failed');
      }
      
      // Clear the session cookie
      res.clearCookie('connect.sid');
      routeLogger.info('User successfully logged out');
      
      // Redirect to login page with success message
      res.redirect('/auth/login?message=logged_out');
    });
  } else {
    // No session found, still redirect to login
    res.redirect('/auth/login');
  }
});

module.exports = router;