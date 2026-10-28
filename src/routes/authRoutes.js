import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateRegister, validateLogin } from '../middleware/validateMiddleware.js';

const router = Router();

/**
 * @route   POST /auth/register
 * @desc    Register a new user account
 * @access  Public
 */
router.post('/register', validateRegister, register);

/**
 * @route   POST /auth/login
 * @desc    Authenticate user & return JWT token
 * @access  Public
 */
router.post('/login', validateLogin, login);

/**
 * @route   GET /auth/me
 * @desc    Get current authenticated user profile
 * @access  Private
 */
router.get('/me', authenticate, getMe);

export default router;
