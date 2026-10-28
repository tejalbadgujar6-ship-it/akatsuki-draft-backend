import mongoose from 'mongoose';
import ApiError from '../utils/apiError.js';

/**
 * Validates whether a route param is a valid MongoDB ObjectId
 * @param {string} paramName - Name of the param in req.params (e.g. 'id' or 'postId')
 */
export const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return next(
        ApiError.badRequest(
          `Invalid ${paramName}: '${id}' is not a valid 24-character hexadecimal MongoDB ObjectId.`
        )
      );
    }
    next();
  };
};

/**
 * Validates registration input
 */
export const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name is required and must be at least 2 characters long.');
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password is required and must be at least 6 characters long.');
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Validation failed for registration', errors));
  }

  next();
};

/**
 * Validates login input
 */
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push('Email is required.');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required.');
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Validation failed for login', errors));
  }

  next();
};

/**
 * Validates post creation input
 */
export const validateCreatePost = (req, res, next) => {
  const { title, description, content } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    errors.push('Post title is required and must be at least 3 characters long.');
  }

  if (!description || typeof description !== 'string' || description.trim().length < 5) {
    errors.push('Post description is required and must be at least 5 characters long.');
  }

  if (!content || typeof content !== 'string' || !content.trim()) {
    errors.push('Post content is required and cannot be empty.');
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Validation failed for post creation', errors));
  }

  next();
};

/**
 * Validates post update input
 */
export const validateUpdatePost = (req, res, next) => {
  const { title, description, content, createdBy, _id, id } = req.body;
  const errors = [];

  // Protect against changing system fields
  if (createdBy || _id || id) {
    return next(
      ApiError.badRequest('Attempted to modify protected system fields (createdBy, _id).')
    );
  }

  if (title !== undefined && (typeof title !== 'string' || title.trim().length < 3)) {
    errors.push('Post title must be at least 3 characters long.');
  }

  if (description !== undefined && (typeof description !== 'string' || description.trim().length < 5)) {
    errors.push('Post description must be at least 5 characters long.');
  }

  if (content !== undefined && (typeof content !== 'string' || !content.trim())) {
    errors.push('Post content cannot be empty.');
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Validation failed for post update', errors));
  }

  next();
};

export default {
  validateObjectId,
  validateRegister,
  validateLogin,
  validateCreatePost,
  validateUpdatePost
};
