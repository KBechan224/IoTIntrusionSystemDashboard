/**
 * Centralized Logging System
 * Replaces all console.log statements with structured logging
 */

const winston = require('winston');
const path = require('path');
const config = require('../config/env');

// Define custom log levels and colors
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue'
};

// Add colors to winston
winston.addColors(logColors);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, component, ...meta }) => {
    let logMessage = `${timestamp} [${level}]`;
    if (component) {
      logMessage += ` [${component}]`;
    }
    logMessage += `: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }
    
    return logMessage;
  })
);

// Create winston logger instance
const logger = winston.createLogger({
  levels: logLevels,
  level: (config.logging && config.logging.level) || 'info',
  format: consoleFormat,
  transports: [
    // Console output only - no disk logging
    new winston.transports.Console()
  ]
});

// Create component-specific loggers
function createComponentLogger(componentName) {
  return {
    error: (message, meta = {}) => {
      logger.error(message, { component: componentName, ...meta });
    },
    warn: (message, meta = {}) => {
      logger.warn(message, { component: componentName, ...meta });
    },
    info: (message, meta = {}) => {
      logger.info(message, { component: componentName, ...meta });
    },
    debug: (message, meta = {}) => {
      logger.debug(message, { component: componentName, ...meta });
    }
  };
}

// Database-specific logger methods
const dbLogger = createComponentLogger('DATABASE');

// Migration-specific logger methods  
const migrationLogger = createComponentLogger('MIGRATION');

// App initialization logger
const initLogger = createComponentLogger('INIT');

// Environment logger
const envLogger = createComponentLogger('ENV');

// Routes logger
const routeLogger = createComponentLogger('ROUTE');

// Application logger
const appLogger = createComponentLogger('APP');

// Generic logger for backward compatibility
const log = {
  error: (message, meta = {}) => logger.error(message, meta),
  warn: (message, meta = {}) => logger.warn(message, meta),
  info: (message, meta = {}) => logger.info(message, meta),
  debug: (message, meta = {}) => logger.debug(message, meta)
};

module.exports = {
  logger,
  createComponentLogger,
  dbLogger,
  migrationLogger, 
  initLogger,
  envLogger,
  routeLogger,
  appLogger,
  log
};