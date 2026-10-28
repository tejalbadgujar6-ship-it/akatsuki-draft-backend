import { Router } from 'express';
import {
  createPost,
  getPublicPosts,
  getPostById,
  getMyPosts,
  updatePost,
  deletePost
} from '../controllers/postController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { uploadImage } from '../middleware/uploadMiddleware.js';
import {
  validateObjectId,
  validateCreatePost,
  validateUpdatePost
} from '../middleware/validateMiddleware.js';

const router = Router();

/**
 * @route   POST /posts
 * @desc    Create a new post or save as draft (with optional image upload)
 * @access  Private
 */
router.post('/', authenticate, uploadImage, validateCreatePost, createPost);

/**
 * @route   GET /posts
 * @desc    View all approved public posts (with pagination, search, category filter)
 * @access  Public
 */
router.get('/', getPublicPosts);

/**
 * @route   GET /posts/my-posts
 * @desc    View authenticated user's own posts and drafts
 * @access  Private
 */
router.get('/my-posts', authenticate, getMyPosts);

/**
 * @route   GET /posts/:id
 * @desc    View an individual approved post by ID
 * @access  Public
 */
router.get('/:id', validateObjectId('id'), getPostById);

/**
 * @route   PATCH /posts/:id
 * @desc    Update author's own post (resets approved posts to pending for review)
 * @access  Private (Author)
 */
router.patch(
  '/:id',
  authenticate,
  validateObjectId('id'),
  uploadImage,
  validateUpdatePost,
  updatePost
);

/**
 * @route   DELETE /posts/:id
 * @desc    Delete author's own post
 * @access  Private (Author or Admin)
 */
router.delete('/:id', authenticate, validateObjectId('id'), deletePost);

export default router;
