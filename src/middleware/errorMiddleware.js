import ApiError from '../utils/apiError.js';
import logger from '../utils/logger.js';

/**
 * 404 Route Not Found Middleware
 */
export const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

/**
 * Global Centralized Error Handling Middleware
 */
export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Log error details internally
  if (!(err instanceof ApiError) || err.statusCode >= 500) {
    logger.error(`Unhandled Error [${req.method} ${req.originalUrl}]: ${err.message}`, err.stack);
  } else {
    logger.warn(`Operational Warning [${req.method} ${req.originalUrl}]: ${err.message}`);
  }

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid ${err.path}: '${err.value}'`;
    error = ApiError.badRequest(message);
  }

  // Handle Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate value entered for ${duplicateField}. An account with that ${duplicateField} already exists.`;
    error = ApiError.conflict(message);
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errorMessages = Object.values(err.errors).map((val) => val.message);
    error = ApiError.badRequest('Database validation failed', errorMessages);
  }

  // Handle JWT Malformed / Invalid Signature
  if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid authentication token signature.');
  }

  // Handle JWT Expired
  if (err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Authentication token has expired.');
  }

  // Handle JSON parse error in request body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = ApiError.badRequest('Malformed JSON in request body.');
  }

  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    statusCode,
    message: error.message || 'Internal Server Error',
    ...(error.errors && error.errors.length > 0 && { errors: error.errors }),
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  };

  return res.status(statusCode).json(response);
};

export default {
  notFoundHandler,
  errorHandler
};
