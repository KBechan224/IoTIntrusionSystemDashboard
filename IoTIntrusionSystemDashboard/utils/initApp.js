/**
 * Initialize the application with default data
 * Creates an admin user if none exists
 */

const bcrypt = require("bcrypt");
const db = require("../config/database");
const config = require("../config/env");
const { initLogger } = require("./logger");
const { createAllSampleData } = require("./createSampleData");

async function initializeApp() {
	initLogger.info("Initializing IoT Intrusion System Dashboard");

	try {
		// Test database connection
		initLogger.info("Testing database connection");
		const testResult = await db.query("SELECT NOW() as current_time");
		initLogger.info("Database connection successful");

		// Check if any users exist
		initLogger.info("Checking for existing users");

		const userCount = await db.query("SELECT COUNT(*) as count FROM users");
		const count = parseInt(userCount.rows[0].count);

		initLogger.info(`Found ${count} users`);
		if (count === 0) {
			initLogger.info("No users found. Creating default admin user");

			// Create default admin user
			const defaultPassword = "admin123";
			const hashedPassword = await bcrypt.hash(
				defaultPassword,
				config.security.bcryptRounds,
			);

			const adminUser = await db.insert("users", {
				name: "Administrator",
				email: "admin@iot-security.local",
				password_hash: hashedPassword,
				role: "admin",
				is_active: true,
			});

			const exampleUserPwdHash = await bcrypt.hash(
				"KBechan22484187",
				config.security.bcryptRounds,
			);
			const exampleUser = await db.insert("users", {
				name: "K Bechan",
				email: "22484187@dut4lifeac.onmicrosoft.com",
				password_hash: exampleUserPwdHash,
				role: "user",
				is_active: true,
			});

			initLogger.info("Default admin user created", {
				email: "admin@iot-security.local",
				password: defaultPassword,
				note: "Please change this password after first login!",
			});
		} else {
			initLogger.info("Found existing users", {
				count,
			});
		}

		// Add some sample devices if none exist
		initLogger.info("Checking for existing devices");
		const deviceCount = await db.query("SELECT COUNT(*) as count FROM devices");
		const deviceCountNum = parseInt(deviceCount.rows[0].count);

		if (deviceCountNum === 0) {
			console.log("No devices found. Creating sample devices...");

			const sampleDevices = [
				{
					name: "Security Camera #1",
					device_type: "camera",
					mac_address: "00:11:22:33:44:01",
					ip_address: "192.168.1.101",
					location: "Front Entrance",
					status: "online",
					last_seen: new Date(),
				},
				{
					name: "Motion Sensor #1",
					device_type: "sensor",
					mac_address: "00:11:22:33:44:02",
					ip_address: "192.168.1.102",
					location: "Living Room",
					status: "online",
					last_seen: new Date(),
				},
				{
					name: "Smart Door Lock",
					device_type: "lock",
					mac_address: "00:11:22:33:44:03",
					ip_address: "192.168.1.103",
					location: "Main Door",
					status: "offline",
					last_seen: new Date(Date.now() - 300000), // 5 minutes ago
				},
			];

			for (const device of sampleDevices) {
				await db.insert("devices", device);
				initLogger.info("Created device", {
					name: device.name,
				});
			}
		} else {
			initLogger.info("Found existing devices", {
				count: deviceCountNum,
			});
		}

		initLogger.info("Application initialization completed successfully");
		
		// Create sample data for dashboard demonstration
		initLogger.info("Creating sample security data for dashboard");
		await createAllSampleData();
		
		initLogger.info("You can now start the application with: npm start");
	} catch (error) {
		initLogger.error("Initialization failed", {
			message: error.message,
			code: error.code,
			detail: error.detail,
		});
		process.exit(1);
	} finally {
		await db.close();
	}
}

// Run initialization if called directly
if (require.main === module) {
	initializeApp();
}

module.exports = { initializeApp };
