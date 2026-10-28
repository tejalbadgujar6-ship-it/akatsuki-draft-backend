import mongoose from 'mongoose';
import logger from '../utils/logger.js';

/**
 * Connect to MongoDB instance
 * @param {string} uri - MongoDB connection string (falls back to process.env.MONGODB_URI)
 */
export const connectDB = async (uri = process.env.MONGODB_URI) => {
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables.');
  }

  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: true
    });

    logger.info(`MongoDB connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    throw error;
  }
};

/**
 * Disconnect from MongoDB
 */
export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed.');
  } catch (error) {
    logger.error(`Error closing MongoDB connection: ${error.message}`);
  }
};

export default connectDB;
