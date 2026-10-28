import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer = null;

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_1234567890abcdef';
process.env.JWT_EXPIRES_IN = '1h';
process.env.USE_AI_MOCK = 'true';

export const connectTestDB = async () => {
  if (!mongoServer) {
    mongoServer = await MongoMemoryServer.create({
      instance: {
        startupTimeout: 60000
      }
    });
  }
  const uri = mongoServer.getUri();
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
};

export const disconnectTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
};

export const clearTestDB = async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
};

export const setupTestDB = () => {
  return {
    beforeAll: connectTestDB,
    afterAll: disconnectTestDB,
    beforeEach: clearTestDB
  };
};

export default setupTestDB;
