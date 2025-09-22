/**
 * Database Connection Module
 * Handles PostgreSQL connection with connection pooling
 */

const { Pool } = require('pg');
const config = require('./env');
const { dbLogger } = require('../utils/logger');

// Create connection pool
const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.database,
  user: config.database.user,
  password: config.database.password,
  ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
  max: config.database.max || 10,
  idleTimeoutMillis: config.database.idleTimeoutMillis || 30000,
  connectionTimeoutMillis: config.database.connectionTimeoutMillis || 2000, // Reduced from 10s to 2s
  acquireTimeoutMillis: 60000,
  createTimeoutMillis: 30000,
  destroyTimeoutMillis: 5000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 200,
  // Add connection retry settings
  allowExitOnIdle: true
});

// Handle pool events
pool.on('connect', (client) => {
  if (config.isDevelopment()) {
    dbLogger.debug('Database client connected', {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount
    });
  }
});

pool.on('acquire', (client) => {
  if (config.isDevelopment()) {
    dbLogger.debug('Database client acquired', {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount
    });
  }
});

pool.on('remove', (client) => {
  if (config.isDevelopment()) {
    dbLogger.debug('Database client removed', {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount
    });
  }
});

pool.on('error', (err, client) => {
  dbLogger.error('Unexpected error on idle database client', {
    message: err.message,
    code: err.code,
    severity: err.severity
  });
  // Don't exit process, let it continue with other connections
});

// Database helper functions

/**
 * Execute a query with optional parameters and retry logic
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @param {number} retries - Number of retries (default: 3)
 * @returns {Promise<Object>} Query result
 */
async function query(text, params = [], retries = 3) {
  const start = Date.now();
  let client;
  let attempt = 0;
  
  while (attempt <= retries) {
    try {
      client = await pool.connect();
      const res = await client.query(text, params);
      const duration = Date.now() - start;
      
      if (config.isDevelopment()) {
        dbLogger.debug('Executed query', {
          text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
          duration: `${duration}ms`,
          rows: res.rowCount,
          attempt: attempt + 1
        });
      }
      
      return res;
    } catch (error) {
      attempt++;
      
      dbLogger.error('Database query error', {
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        error: error.message,
        stack: error.stack
      });
      
      // Don't retry for certain types of errors
      if (error.code === '42P01' || // relation does not exist
          error.code === '42703' || // column does not exist
          error.code === '23505' || // unique violation
          error.code === '23503') { // foreign key violation
        throw error;
      }
      
      // If this was the last attempt, throw the error
      if (attempt > retries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      dbLogger.warn('Retrying query', {
        waitTime: `${waitTime}ms`,
        attempt: `${attempt + 1}/${retries + 1}`
      });
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
    } finally {
      if (client) {
        client.release();
        client = null;
      }
    }
  }
}

/**
 * Get a client from the pool for transactions
 * @returns {Promise<Object>} Database client
 */
async function getClient() {
  return await pool.connect();
}

/**
 * Execute multiple queries in a transaction
 * @param {Function} callback - Function that receives client and executes queries
 * @returns {Promise<any>} Transaction result
 */
async function transaction(callback) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Test database connection
 * @returns {Promise<boolean>} Connection status
 */
async function testConnection() {
  try {
    const result = await query('SELECT NOW() as current_time');
    if (config.isDevelopment()) {
      dbLogger.info('Database connection successful', {
        currentTime: result.rows[0].current_time
      });
    }
    return true;
  } catch (error) {
    dbLogger.error('Database connection failed', {
      error: error.message
    });
    return false;
  }
}

/**
 * Create database if it doesn't exist (deprecated - use migration system instead)
 * @returns {Promise<void>}
 * @throws {Error} If database creation fails
 */
async function createDatabase() {
  // This function is deprecated - database should be created manually or via migration system
  dbLogger.info('createDatabase() called but skipped - use migration system instead');
  return;
}

/**
 * Delete records
 * @param {string} table - Table name
 * @param {Object} conditions - Where conditions
 * @returns {Promise<number>} Number of deleted records
 */
async function deleteRecords(table, conditions) {
  const conditionKeys = Object.keys(conditions);
  const whereClause = conditionKeys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
  
  const queryText = `DELETE FROM ${table} WHERE ${whereClause}`;
  const result = await query(queryText, Object.values(conditions));
  return result.rowCount;
}

/**
 * Close all database connections
 * @returns {Promise<void>}
 */
async function close() {
  try {
    await pool.end();
    dbLogger.info('Database connection pool closed');
  } catch (error) {
    dbLogger.error('Error closing database connection pool', {
      error: error.message
    });
  }
}

/**
 * Get pool status information
 * @returns {Object} Pool status
 */
function getPoolStatus() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  };
}

// Common query helpers

/**
 * Find a single record by ID
 * @param {string} table - Table name
 * @param {number} id - Record ID
 * @returns {Promise<Object|null>} Record or null
 */
async function findById(table, id) {
  const result = await query(
    `SELECT * FROM ${table} WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Find records with conditions
 * @param {string} table - Table name
 * @param {Object} conditions - Where conditions
 * @param {Object} options - Query options (limit, offset, orderBy)
 * @returns {Promise<Array>} Records array
 */
async function findWhere(table, conditions = {}, options = {}) {
  const conditionKeys = Object.keys(conditions);
  const whereClause = conditionKeys.length > 0 
    ? `WHERE ${conditionKeys.map((key, index) => `${key} = $${index + 1}`).join(' AND ')}`
    : '';
  
  let queryText = `SELECT * FROM ${table} ${whereClause}`;
  
  if (options.orderBy) {
    queryText += ` ORDER BY ${options.orderBy}`;
  }
  
  if (options.limit) {
    queryText += ` LIMIT ${options.limit}`;
  }
  
  if (options.offset) {
    queryText += ` OFFSET ${options.offset}`;
  }
  
  const result = await query(queryText, Object.values(conditions));
  return result.rows;
}

/**
 * Insert a new record
 * @param {string} table - Table name
 * @param {Object} data - Data to insert
 * @returns {Promise<Object>} Inserted record
 */
async function insert(table, data) {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
  
  const queryText = `
    INSERT INTO ${table} (${keys.join(', ')})
    VALUES (${placeholders})
    RETURNING *
  `;
  
  const result = await query(queryText, values);
  return result.rows[0];
}

/**
 * Update records
 * @param {string} table - Table name
 * @param {Object} data - Data to update
 * @param {Object} conditions - Where conditions
 * @returns {Promise<Array>} Updated records
 */
async function update(table, data, conditions) {
  const dataKeys = Object.keys(data);
  const conditionKeys = Object.keys(conditions);
  
  const setClause = dataKeys.map((key, index) => `${key} = $${index + 1}`).join(', ');
  const whereClause = conditionKeys.map((key, index) => `${key} = $${dataKeys.length + index + 1}`).join(' AND ');
  
  const queryText = `
    UPDATE ${table}
    SET ${setClause}
    WHERE ${whereClause}
    RETURNING *
  `;
  
  const values = [...Object.values(data), ...Object.values(conditions)];
  const result = await query(queryText, values);
  return result.rows;
}

// Test connection on module load with better error handling
testConnection().then(() => {
  dbLogger.info('Database module initialized successfully');
}).catch((error) => {
  dbLogger.error('Initial database connection test failed', {
    error: error.message
  });
  dbLogger.error('Application may not function properly without database access');
});

// Remove automatic database creation that causes issues
// createDatabase(); // Commented out - use migration system instead

// Export database functions and the pool
module.exports = {
  query,
  getClient,
  transaction,
  testConnection,
  close,
  getPoolStatus,
  findById,
  findWhere,
  insert,
  update,
  delete: deleteRecords, // Renamed to avoid conflict with delete keyword
  pool
};