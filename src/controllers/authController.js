import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Helper to generate a signed JWT token
 */
export const generateToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw ApiError.internal('JWT_SECRET is not configured on the server.');
  }
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    secret,
    { expiresIn }
  );
};

/**
 * @desc    Register a new user
 * @route   POST /auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if an account already exists with this email
  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    throw ApiError.conflict('An account with this email address already exists.');
  }

  // Security Rule: Public registration MUST NEVER assign the 'admin' role
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    role: 'user' // Strictly enforced
  });

  const token = generateToken(user);

  return ApiResponse.created(res, 'User registered successfully', {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    },
    token
  });
});

/**
 * @desc    Authenticate user and get JWT token
 * @route   POST /auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Retrieve user including the password field
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  // Verify password using bcrypt
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  const token = generateToken(user);

  return ApiResponse.success(res, 'Login successful', {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    },
    token
  });
});

/**
 * @desc    Get currently authenticated user details
 * @route   GET /auth/me
 * @access  Private (Authenticated users)
 */
export const getMe = asyncHandler(async (req, res) => {
  // req.user is populated by authenticate middleware
  return ApiResponse.success(res, 'User profile retrieved successfully', {
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt
    }
  });
});

export default {
  register,
  login,
  getMe,
  generateToken
};
