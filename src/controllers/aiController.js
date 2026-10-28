import Post from '../models/Post.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { improveContentWithGemini } from '../config/gemini.js';

/**
 * @desc    Improve post content using Google Gemini AI and save as a new draft
 * @route   POST /ai/improve/:postId
 * @access  Private (Author only)
 */
export const improvePostContent = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  // 1. Find the specified post
  const originalPost = await Post.findById(postId);
  if (!originalPost) {
    throw ApiError.notFound(`Post with ID '${postId}' was not found.`);
  }

  // 2. Verify that the post belongs to the authenticated user
  if (originalPost.createdBy.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You are not authorized to improve this post. You can only improve your own posts.');
  }

  // 3. Obtain and validate the original post's content
  if (!originalPost.content || !originalPost.content.trim()) {
    throw ApiError.badRequest('Original post content is empty. Cannot perform AI improvement.');
  }

  // 4. Send the content to Gemini AI with clear instructions to improve writing quality
  //    while preserving the author's original meaning, facts, and intent.
  const improvedContent = await improveContentWithGemini(originalPost.content);

  // 5. CRITICAL REQUIREMENT:
  //    Never overwrite, delete, or modify the original post during AI improvement.
  //    The original draft must remain unchanged, and the improved content must be stored
  //    as a separate Post document with a NEW MongoDB ID under the same user, with status: "draft".
  const newDraftPost = await Post.create({
    title: `${originalPost.title} (AI Improved)`,
    description: originalPost.description,
    content: improvedContent,
    category: originalPost.category,
    image: originalPost.image,
    createdBy: req.user._id,
    status: 'draft',
    createdAt: new Date()
  });

  const populatedDraft = await Post.findById(newDraftPost._id).populate('createdBy', 'name email');

  return ApiResponse.created(
    res,
    'Content successfully improved using Gemini AI and saved as a new draft. The original post remains intact.',
    {
      originalPostId: originalPost._id,
      originalPostStatus: originalPost.status,
      newDraft: populatedDraft
    }
  );
});

export default {
  improvePostContent
};
