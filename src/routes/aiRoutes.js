import { Router } from 'express';
import { improvePostContent } from '../controllers/aiController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateObjectId } from '../middleware/validateMiddleware.js';

const router = Router();

/**
 * @route   POST /ai/improve/:postId
 * @desc    Improve post content with Google Gemini AI and save as a new draft
 * @access  Private (Author only)
 */
router.post('/improve/:postId', authenticate, validateObjectId('postId'), improvePostContent);

export default router;
