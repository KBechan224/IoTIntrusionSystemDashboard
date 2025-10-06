/**
 * Environment Configuration Loader
 * Safely loads and validates environment variables
 */

require('dotenv').config();

// Validation helper function
function validateEnvVar(name, defaultValue = null, required = false) {
  const value = process.env[name];
  
  if (required && !value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  
  return value || defaultValue;
}

// Convert string to boolean
function toBool(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  return false;
}

// Convert string to number
function toNumber(value, defaultValue = 0) {
  const num = parseInt(value, 10);
  return Number.isNaN(num) ? defaultValue : num;
}

// Environment configuration object
const config = {
  // Server Configuration
  NODE_ENV: validateEnvVar('NODE_ENV', 'development'),
  PORT: toNumber(validateEnvVar('PORT', '3000')),
  
  // Database Configuration
  database: {
    host: validateEnvVar('DB_HOST', 'localhost'),
    port: toNumber(validateEnvVar('DB_PORT', '5432')),
    database: validateEnvVar('DB_NAME', 'iot_intrusion_db'),
    user: validateEnvVar('DB_USER', ''),
    password: validateEnvVar('DB_PASSWORD', ''),
    ssl: toBool(validateEnvVar('DB_SSL', 'false')),
    
    // Connection pool settings
    max: toNumber(validateEnvVar('DB_POOL_MAX', '10')),
    idleTimeoutMillis: toNumber(validateEnvVar('DB_IDLE_TIMEOUT', '30000')),
    connectionTimeoutMillis: toNumber(validateEnvVar('DB_CONNECTION_TIMEOUT', '10000')),
  },
  
  // Session Configuration
  session: {
    secret: validateEnvVar('SESSION_SECRET', 'your_super_secret_session_key_here'),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: validateEnvVar('NODE_ENV') === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  },
  
  // Security Configuration
  security: {
    jwtSecret: validateEnvVar('JWT_SECRET', 'your_jwt_secret_key_here'),
    bcryptRounds: toNumber(validateEnvVar('BCRYPT_ROUNDS', '12')),
  },
  
  // Email Configuration
  email: {
    host: validateEnvVar('SMTP_HOST', ''),
    port: toNumber(validateEnvVar('SMTP_PORT', '587')),
    user: validateEnvVar('SMTP_USER', ''),
    password: validateEnvVar('SMTP_PASS', ''),
  },
  
  // Application Configuration
  app: {
    name: validateEnvVar('APP_NAME', 'IoT Intrusion Detection System'),
    url: validateEnvVar('APP_URL', 'http://localhost:3000'),
  },
  
  // Logging Configuration
  logging: {
    level: validateEnvVar('LOG_LEVEL', 'info'),
    loggerFormat: validateEnvVar('LOGGER_FORMAT', 'json')
  },
  
  // Helper methods
  isDevelopment: function() {
    return this.NODE_ENV === 'development';
  },
  
  isProduction: function() {
    return this.NODE_ENV === 'production';
  },
  
  isTest: function() {
    return this.NODE_ENV === 'test';
  }
};

// Validate critical configuration on startup
function validateConfig() {
  const errors = [];
  
  // Check if we're in production and required vars are missing
  if (config.isProduction()) {
    if (!config.database.user) {
      errors.push('DB_USER is required in production');
    }
    if (!config.database.password) {
      errors.push('DB_PASSWORD is required in production');
    }
    if (config.session.secret === 'your_super_secret_session_key_here') {
      errors.push('SESSION_SECRET must be set to a secure value in production');
    }
    if (config.security.jwtSecret === 'your_jwt_secret_key_here') {
      errors.push('JWT_SECRET must be set to a secure value in production');
    }
  }
  
  if (errors.length > 0) {
    console.error('Environment configuration errors:');
    errors.forEach(error => {
      console.error(`Configuration error: ${error}`);
    });
    throw new Error('Invalid environment configuration');
  }
}

// Validate configuration on module load
validateConfig();

// Log configuration (without sensitive data)
console.log('Environment configuration loaded');

module.exports = config;