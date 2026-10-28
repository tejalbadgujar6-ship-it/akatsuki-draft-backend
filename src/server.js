import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';
import { seedInitialAdmin } from './scripts/seedAdmin.js';
import logger from './utils/logger.js';

const PORT = process.env.PORT || 5000;

// Catch unhandled synchronous exceptions
process.on('uncaughtException', (err) => {
  logger.error('CRITICAL UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Optionally seed initial admin if credentials are provided in .env
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      await seedInitialAdmin();
    }

    // 3. Start Express server
    const server = app.listen(PORT, () => {
      logger.info(`=======================================================`);
      logger.info(` Akatsuki's Draft: AI-Enabled Content Sharing Platform `);
      logger.info(` Server listening at http://localhost:${PORT}          `);
      logger.info(` Environment: ${process.env.NODE_ENV || 'development'} `);
      logger.info(` Gemini Model: ${process.env.GEMINI_MODEL || 'gemini-1.5-flash'} `);
      logger.info(`=======================================================`);
    });

    // Graceful Shutdown Handler
    const shutdown = (signal) => {
      logger.info(`Received ${signal}. Shutting down server gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Catch unhandled Promise rejections
    process.on('unhandledRejection', (reason) => {
      logger.error('CRITICAL UNHANDLED REJECTION:', reason);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    logger.error('Failed to initialize server:', error);
    process.exit(1);
  }
};

startServer();
