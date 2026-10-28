import { Router } from 'express';
import {
  getPendingPosts,
  approvePost,
  rejectPost
} from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { validateObjectId } from '../middleware/validateMiddleware.js';

const router = Router();

// All routes under /admin require authentication and the 'admin' role
router.use(authenticate, authorize('admin'));

/**
 * @route   GET /admin/posts/pending
 * @desc    View all posts awaiting admin review
 * @access  Private (Admin only)
 */
router.get('/posts/pending', getPendingPosts);

/**
 * @route   PATCH /admin/posts/approve/:id
 * @desc    Approve a pending post to make it publicly visible
 * @access  Private (Admin only)
 */
router.patch('/posts/approve/:id', validateObjectId('id'), approvePost);

/**
 * @route   PATCH /admin/posts/reject/:id
 * @desc    Reject a pending post to keep it hidden
 * @access  Private (Admin only)
 */
router.patch('/posts/reject/:id', validateObjectId('id'), rejectPost);

export default router;
