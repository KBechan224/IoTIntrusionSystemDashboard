/**
 * Database Connection Test Script
 * Tests database connection and creates database if needed
 */

const { Pool } = require('pg');
const config = require('../../config/env');
const { createComponentLogger } = require('../logger');

const testLogger = createComponentLogger('DB_TEST');

// Test basic connection to PostgreSQL server
async function testPostgreSQLConnection() {
  testLogger.info('Testing PostgreSQL server connection');
  
  const pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: 'postgres', // Connect to default postgres database first
    ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000
  });

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT version()');
    testLogger.info('PostgreSQL server connection successful');
    testLogger.info('Version', { version: result.rows[0].version });
    client.release();
    return pool;
  } catch (error) {
    testLogger.error('PostgreSQL server connection failed', {
      error: error.message
    });
    throw error;
  }
}

// Create database if it doesn't exist
async function createDatabaseIfNotExists(pool) {
  testLogger.info('Checking if database exists', {
    database: config.database.database
  });
  
  try {
    const result = await pool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [config.database.database]
    );
    
    if (result.rows.length > 0) {
      testLogger.info('Database already exists', {
        database: config.database.database
      });
      return true;
    }
    
    testLogger.info('Creating database', {
      database: config.database.database
    });
    await pool.query(`CREATE DATABASE "${config.database.database}"`);
    testLogger.info('Database created successfully', {
      database: config.database.database
    });
    return true;
    
  } catch (error) {
    if (error.code === '42P04') {
      testLogger.info('Database already exists', {
        database: config.database.database
      });
      return true;
    }
    testLogger.error('Failed to create database', {
      database: config.database.database,
      error: error.message
    });
    throw error;
  }
}

// Test connection to target database
async function testTargetDatabaseConnection() {
  testLogger.info('Testing connection to database', {
    database: config.database.database
  });
  
  const pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.database,
    user: config.database.user,
    password: config.database.password,
    ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000
  });

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    testLogger.info('Target database connection successful');
    testLogger.info('Current time', { time: result.rows[0].current_time });
    client.release();
    await pool.end();
    return true;
  } catch (error) {
    testLogger.error('Target database connection failed', {
      error: error.message
    });
    await pool.end();
    throw error;
  }
}

// Main test function
async function runDatabaseTest() {
  console.log('🔍 Database Connection Diagnostic Test');
  console.log('=====================================');
  console.log('Configuration:');
  console.log(`  Host: ${config.database.host}`);
  console.log(`  Port: ${config.database.port}`);
  console.log(`  Database: ${config.database.database}`);
  console.log(`  User: ${config.database.user}`);
  console.log(`  SSL: ${config.database.ssl}`);
  console.log('');

  try {
    // Step 1: Test PostgreSQL server connection
    const serverPool = await testPostgreSQLConnection();
    
    // Step 2: Create database if needed
    await createDatabaseIfNotExists(serverPool);
    await serverPool.end();
    
    // Step 3: Test target database connection
    await testTargetDatabaseConnection();
    
    console.log('');
    console.log('🎉 All database connection tests passed!');
    console.log('You can now run migrations to set up your database schema.');
    console.log('Run: node utils/migrateDatabase.js run');
    
  } catch (error) {
    console.log('');
    console.error('💥 Database connection test failed!');
    console.error('Error details:', error.message);
    
    if (error.code) {
      console.error('Error code:', error.code);
    }
    
    console.log('');
    console.log('🔧 Troubleshooting suggestions:');
    console.log('1. Verify PostgreSQL is running: services.msc → PostgreSQL');
    console.log('2. Check your .env file credentials');
    console.log('3. Ensure PostgreSQL accepts local connections');
    console.log('4. Try connecting with psql manually');
    
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  runDatabaseTest();
}

module.exports = { runDatabaseTest };