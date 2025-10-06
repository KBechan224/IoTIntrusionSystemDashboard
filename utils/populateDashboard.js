#!/usr/bin/env node

/**
 * Populate Dashboard with Sample Data
 * Run this script to add sample security alerts and blocked attempts
 * to make the dashboard show realistic data
 */

const { createAllSampleData } = require('./createSampleData');
const { appLogger } = require('./logger');

async function populateDashboard() {
  try {
    appLogger.info('Starting dashboard data population...');
    
    await createAllSampleData();
    
    appLogger.info('Dashboard populated successfully!');
    appLogger.info('The dashboard should now show:');
    appLogger.info('- Sample IoT devices');
    appLogger.info('- Active security threats');
    appLogger.info('- Recent blocked attempts');
    appLogger.info('- Security alerts and statistics');
    
    process.exit(0);
  } catch (error) {
    appLogger.error('Failed to populate dashboard', { error: error.message });
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  populateDashboard();
}

module.exports = { populateDashboard };