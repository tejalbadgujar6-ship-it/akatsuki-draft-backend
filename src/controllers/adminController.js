import Post from '../models/Post.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Get all posts awaiting admin approval
 * @route   GET /admin/posts/pending
 * @access  Private (Admin only)
 */
export const getPendingPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, sort = 'createdAt' } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const query = { status: 'pending' };

  const [posts, totalPosts] = await Promise.all([
    Post.find(query)
      .populate('createdBy', 'name email role')
      .sort(sort)
      .skip(skip)
      .limit(limitNum),
    Post.countDocuments(query)
  ]);

  return ApiResponse.success(res, 'Pending posts retrieved successfully', {
    posts,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(totalPosts / limitNum),
      totalPosts,
      limit: limitNum
    }
  });
});

/**
 * @desc    Approve a pending post
 * @route   PATCH /admin/posts/approve/:id
 * @access  Private (Admin only)
 */
export const approvePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    throw ApiError.notFound(`Post with ID '${req.params.id}' was not found.`);
  }

  if (post.status === 'approved') {
    return ApiResponse.success(res, 'Post is already approved', post);
  }

  post.status = 'approved';
  await post.save();

  const populatedPost = await Post.findById(post._id).populate('createdBy', 'name email');

  return ApiResponse.success(res, 'Post approved successfully. It is now publicly visible.', populatedPost);
});

/**
 * @desc    Reject a pending post
 * @route   PATCH /admin/posts/reject/:id
 * @access  Private (Admin only)
 */
export const rejectPost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    throw ApiError.notFound(`Post with ID '${req.params.id}' was not found.`);
  }

  post.status = 'rejected';
  await post.save();

  const populatedPost = await Post.findById(post._id).populate('createdBy', 'name email');

  return ApiResponse.success(res, 'Post rejected successfully. It is hidden from public view.', populatedPost);
});

export default {
  getPendingPosts,
  approvePost,
  rejectPost
};
