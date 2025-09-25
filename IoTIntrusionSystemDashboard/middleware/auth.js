/**
 * Authentication Middleware
 * Provides authentication and authorization functionality
 */

const { routeLogger } = require('../utils/logger');

/**
 * Middleware to check if user is authenticated
 * Redirects to login page if not authenticated
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  } else {
    routeLogger.warn('Unauthorized access attempt', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      originalUrl: req.originalUrl
    });
    
    // Store the original URL to redirect after login
    req.session.returnTo = req.originalUrl;
    
    return res.redirect('/auth/login');
  }
}

/**
 * Middleware to check if user is authenticated
 * Redirects to access denied page if not authenticated (for unregistered users)
 */
function requireAuthOrDeny(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  } else {
    routeLogger.warn('Unauthorized access attempt - redirecting to access denied', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      originalUrl: req.originalUrl
    });
    
    return res.redirect('/access-denied');
  }
}

/**
 * Middleware to check if user is authenticated for API endpoints
 * Returns JSON error if not authenticated
 */
function requireAuthAPI(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  } else {
    routeLogger.warn('Unauthorized API access attempt', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      originalUrl: req.originalUrl
    });
    
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'You must be logged in to access this resource'
    });
  }
}

/**
 * Middleware to check if user has admin role
 * Requires authentication first
 */
function requireAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  } else {
    routeLogger.warn('Admin access attempt by non-admin user', {
      userId: req.session?.user?.id || 'anonymous',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      originalUrl: req.originalUrl
    });
    
    return res.status(403).render('error', {
      title: 'Access Denied',
      message: 'You do not have permission to access this resource',
      error: { status: 403 }
    });
  }
}

/**
 * Middleware to check if user has admin role for API endpoints
 * Returns JSON error if not admin
 */
function requireAdminAPI(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  } else {
    routeLogger.warn('Admin API access attempt by non-admin user', {
      userId: req.session?.user?.id || 'anonymous',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      originalUrl: req.originalUrl
    });
    
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
      message: 'You must have admin privileges to access this resource'
    });
  }
}

/**
 * Middleware to redirect authenticated users away from login/register pages
 */
function redirectIfAuth(req, res, next) {
  if (req.session && req.session.user) {
    // If user is already logged in, redirect to dashboard
    return res.redirect('/dashboard');
  } else {
    return next();
  }
}

/**
 * Middleware to make user session available to all templates
 */
function attachUser(req, res, next) {
  res.locals.user = req.session?.user || null;
  res.locals.isAuthenticated = !!(req.session && req.session.user);
  res.locals.isAdmin = !!(req.session && req.session.user && req.session.user.role === 'admin');
  next();
}

module.exports = {
  requireAuth,
  requireAuthOrDeny,
  requireAuthAPI,
  requireAdmin,
  requireAdminAPI,
  redirectIfAuth,
  attachUser
};