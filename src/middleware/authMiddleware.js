import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Authentication Middleware
 * Validates the JWT Bearer token and attaches the user document to req.user
 */
export const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    throw ApiError.unauthorized('Authentication token is missing. Please log in.');
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw ApiError.internal('JWT_SECRET is not configured on the server.');
  }

  try {
    const decoded = jwt.verify(token, secret);

    // Fetch user to ensure user still exists and role hasn't changed
    const user = await User.findById(decoded.id);
    if (!user) {
      throw ApiError.unauthorized('User associated with this token no longer exists.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Your session has expired. Please log in again.');
    }
    if (error.name === 'JsonWebTokenError') {
      throw ApiError.unauthorized('Invalid authentication token.');
    }
    throw ApiError.unauthorized('Authentication failed.');
  }
});

/**
 * Role-based Authorization Middleware
 * @param {...string} allowedRoles - List of allowed roles (e.g. 'admin')
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required before checking authorization.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. Role '${req.user.role}' is not authorized to access this resource. Requires: [${allowedRoles.join(', ')}]`
        )
      );
    }

    next();
  };
};

export default {
  authenticate,
  authorize
};
