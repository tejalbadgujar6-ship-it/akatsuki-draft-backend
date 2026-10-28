import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { connectDB, disconnectDB } from '../config/db.js';
import logger from '../utils/logger.js';

dotenv.config();

/**
 * Seeds the initial admin account if one does not already exist
 */
export const seedInitialAdmin = async () => {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@akatsuki.dev').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@Akatsuki2026';
  const adminName = process.env.ADMIN_NAME || 'Akatsuki Leader';

  try {
    const existingAdmin = await User.findOne({
      $or: [{ role: 'admin' }, { email: adminEmail }]
    });

    if (existingAdmin) {
      logger.info(`Admin account already exists (${existingAdmin.email}, role: ${existingAdmin.role}).`);
      return existingAdmin;
    }

    const adminUser = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin'
    });

    logger.info(`Initial admin account created successfully!`);
    logger.info(`Email: ${adminEmail}`);
    logger.info(`Role: ${adminUser.role}`);
    return adminUser;
  } catch (error) {
    logger.error(`Error seeding admin user: ${error.message}`);
    throw error;
  }
};

// If run directly from CLI (e.g. `npm run seed:admin` or `node src/scripts/seedAdmin.js`)
const runDirectly = async () => {
  if (process.argv[1]?.includes('seedAdmin.js')) {
    try {
      await connectDB();
      await seedInitialAdmin();
      await disconnectDB();
      process.exit(0);
    } catch (error) {
      logger.error('Failed to seed admin', error);
      process.exit(1);
    }
  }
};

runDirectly();

export default seedInitialAdmin;
