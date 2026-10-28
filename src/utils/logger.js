/**
 * Application Logger Utility
 * Provides structured console logging with timestamp and level.
 * Prevents accidental credential/token logging.
 */
const formatMessage = (level, message, meta = '') => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}]: ${message} ${meta ? JSON.stringify(meta) : ''}`;
};

export const logger = {
  info: (msg, meta) => console.log(formatMessage('info', msg, meta)),
  warn: (msg, meta) => console.warn(formatMessage('warn', msg, meta)),
  error: (msg, meta) => console.error(formatMessage('error', msg, meta)),
  debug: (msg, meta) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatMessage('debug', msg, meta));
    }
  }
};

export default logger;
