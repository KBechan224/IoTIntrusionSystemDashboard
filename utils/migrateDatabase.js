/**
 * Database Migration System
 * Handles running and tracking database migrations from ./migrations directory
 */

const fs = require('fs').promises;
const path = require('path');
const db = require('../config/database');
const { migrationLogger } = require('./logger');

class DatabaseMigrator {
  constructor() {
    this.migrationsDir = path.join(__dirname, '..', 'migrations');
    this.migrationsTable = 'migrations';
  }

  /**
   * Initialize the migrations tracking table
   * @returns {Promise<void>}
   */
  async initializeMigrationsTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        checksum VARCHAR(64),
        execution_time_ms INTEGER,
        status VARCHAR(20) DEFAULT 'completed' -- 'completed', 'failed', 'rolled_back'
      );
    `;

    try {
      await db.query(createTableSQL);
      migrationLogger.info('Migrations tracking table initialized');
    } catch (error) {
      migrationLogger.error('Failed to initialize migrations table', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get list of migration files from the migrations directory
   * @returns {Promise<Array<string>>} Sorted list of migration files
   */
  async getMigrationFiles() {
    try {
      const files = await fs.readdir(this.migrationsDir);
      return files
        .filter(file => file.endsWith('.sql'))
        .sort(); // Alphabetical sorting - ensure proper naming convention
    } catch (error) {
      migrationLogger.error('Failed to read migrations directory', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get list of executed migrations from database
   * @returns {Promise<Array<string>>} List of executed migration filenames
   */
  async getExecutedMigrations() {
    try {
      const result = await db.query(
        `SELECT filename FROM ${this.migrationsTable} WHERE status = 'completed' ORDER BY executed_at`
      );
      return result.rows.map(row => row.filename);
    } catch (error) {
      // If table doesn't exist yet, return empty array
      if (error.code === '42P01') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Calculate checksum for migration file content
   * @param {string} content - File content
   * @returns {string} MD5 checksum
   */
  calculateChecksum(content) {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Read and parse migration file
   * @param {string} filename - Migration filename
   * @returns {Promise<Object>} Migration object with content and metadata
   */
  async readMigrationFile(filename) {
    const filepath = path.join(this.migrationsDir, filename);
    try {
      const content = await fs.readFile(filepath, 'utf-8');
      return {
        filename,
        content: content.trim(),
        checksum: this.calculateChecksum(content)
      };
    } catch (error) {
      migrationLogger.error('Failed to read migration file', {
        filename,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Execute a single migration
   * @param {Object} migration - Migration object
   * @returns {Promise<void>}
   */
  async executeMigration(migration) {
    const startTime = Date.now();
    const client = await db.getClient();

    try {
      await client.query('BEGIN');
      
      migrationLogger.info('Executing migration', {
        filename: migration.filename
      });
      
      // Execute the migration SQL
      await client.query(migration.content);
      
      // Record the migration in the tracking table
      const executionTime = Date.now() - startTime;
      await client.query(
        `INSERT INTO ${this.migrationsTable} (filename, checksum, execution_time_ms, status) VALUES ($1, $2, $3, $4)`,
        [migration.filename, migration.checksum, executionTime, 'completed']
      );
      
      await client.query('COMMIT');
      migrationLogger.info('Migration completed', {
        filename: migration.filename,
        executionTime: `${executionTime}ms`
      });
    } catch (error) {
      await client.query('ROLLBACK');
      
      // Record failed migration
      try {
        const executionTime = Date.now() - startTime;
        await client.query(
          `INSERT INTO ${this.migrationsTable} (filename, checksum, execution_time_ms, status) VALUES ($1, $2, $3, $4)`,
          [migration.filename, migration.checksum, executionTime, 'failed']
        );
      } catch (recordError) {
        migrationLogger.error('Failed to record migration failure', {
          error: recordError.message
        });
      }
      
      migrationLogger.error('Migration failed', {
        filename: migration.filename,
        error: error.message
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Run all pending migrations
   * @returns {Promise<Object>} Migration results
   */
  async runMigrations() {
    migrationLogger.info('Starting database migrations');
    
    try {
      // Initialize migrations table
      await this.initializeMigrationsTable();
      
      // Get all migration files and executed migrations
      const [migrationFiles, executedMigrations] = await Promise.all([
        this.getMigrationFiles(),
        this.getExecutedMigrations()
      ]);
      
      // Find pending migrations
      const pendingMigrations = migrationFiles.filter(
        filename => !executedMigrations.includes(filename)
      );
      
      if (pendingMigrations.length === 0) {
        migrationLogger.info('No pending migrations found. Database is up to date');
        return {
          success: true,
          executed: 0,
          skipped: migrationFiles.length,
          message: 'Database is up to date'
        };
      }
      
      migrationLogger.info('Found pending migrations', {
        count: pendingMigrations.length,
        migrations: pendingMigrations
      });
      
      // Execute pending migrations
      let executedCount = 0;
      for (const filename of pendingMigrations) {
        const migration = await this.readMigrationFile(filename);
        await this.executeMigration(migration);
        executedCount++;
      }
      
      migrationLogger.info('Successfully executed migrations', {
        executedCount
      });
      
      return {
        success: true,
        executed: executedCount,
        skipped: migrationFiles.length - pendingMigrations.length,
        message: `Successfully executed ${executedCount} migrations`
      };
      
    } catch (error) {
      migrationLogger.error('Migration process failed', {
        error: error.message
      });
      return {
        success: false,
        executed: 0,
        error: error.message,
        message: 'Migration process failed'
      };
    }
  }

  /**
   * Get migration status and history
   * @returns {Promise<Object>} Migration status information
   */
  async getMigrationStatus() {
    try {
      const [migrationFiles, executedResult] = await Promise.all([
        this.getMigrationFiles(),
        db.query(
          `SELECT filename, executed_at, execution_time_ms, status, checksum 
           FROM ${this.migrationsTable} 
           ORDER BY executed_at DESC`
        )
      ]);
      
      const executedMigrations = executedResult.rows;
      const executedFilenames = executedMigrations
        .filter(row => row.status === 'completed')
        .map(row => row.filename);
      
      const pendingMigrations = migrationFiles.filter(
        filename => !executedFilenames.includes(filename)
      );
      
      return {
        total: migrationFiles.length,
        executed: executedFilenames.length,
        pending: pendingMigrations.length,
        failed: executedMigrations.filter(row => row.status === 'failed').length,
        pendingFiles: pendingMigrations,
        executionHistory: executedMigrations
      };
    } catch (error) {
      if (error.code === '42P01') {
        // Migrations table doesn't exist yet
        const migrationFiles = await this.getMigrationFiles();
        return {
          total: migrationFiles.length,
          executed: 0,
          pending: migrationFiles.length,
          failed: 0,
          pendingFiles: migrationFiles,
          executionHistory: []
        };
      }
      throw error;
    }
  }

  /**
   * Create a new migration file
   * @param {string} name - Migration name
   * @param {string} content - SQL content
   * @returns {Promise<string>} Created filename
   */
  async createMigration(name, content = '') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const filename = `${timestamp}_${name.replace(/\s+/g, '_').toLowerCase()}.sql`;
    const filepath = path.join(this.migrationsDir, filename);
    
    const template = content || `-- Migration: ${name}
-- Created: ${new Date().toISOString()}

-- Add your SQL here
`;
    
    try {
      await fs.writeFile(filepath, template, 'utf-8');
      migrationLogger.info('Created migration file', {
        filename
      });
      return filename;
    } catch (error) {
      migrationLogger.error('Failed to create migration file', {
        error: error.message
      });
      throw error;
    }
  }
}

// Create singleton instance
const migrator = new DatabaseMigrator();

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  
  async function runCLI() {
    try {
      switch (command) {
        case 'run':
        case 'migrate': {
          const result = await migrator.runMigrations();
          process.exit(result.success ? 0 : 1);
          break;
        }
          
        case 'status': {
          const status = await migrator.getMigrationStatus();
          migrationLogger.info('Migration Status', {
            total: status.total,
            executed: status.executed,
            pending: status.pending,
            failed: status.failed
          });
          
          if (status.pending > 0) {
            migrationLogger.info('Pending migrations', {
              pendingFiles: status.pendingFiles
            });
          }
          
          if (status.executionHistory.length > 0) {
            migrationLogger.info('Recent executions', {
              recentExecutions: status.executionHistory.slice(0, 5).map(row => ({
                status: row.status,
                filename: row.filename,
                executedAt: new Date(row.executed_at).toLocaleString(),
                executionTime: `${row.execution_time_ms}ms`
              }))
            });
          }
          break;
        }
          
        case 'create': {
          const name = process.argv[3];
          if (!name) {
            migrationLogger.error('Please provide a migration name: node migrateDatabase.js create "migration_name"');
            process.exit(1);
          }
          await migrator.createMigration(name);
          break;
        }
          
        default:
          migrationLogger.info('Database Migration Tool Usage', {
            commands: {
              'run': 'Run all pending migrations',
              'status': 'Show migration status',
              'create "name"': 'Create new migration file'
            }
          });
          break;
      }
    } catch (error) {
      migrationLogger.error('CLI Error', {
        error: error.message
      });
      process.exit(1);
    } finally {
      await db.close();
    }
  }
  
  runCLI();
}

module.exports = migrator;