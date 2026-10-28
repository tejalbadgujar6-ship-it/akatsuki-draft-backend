import Post from '../models/Post.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Validates and normalizes user-provided image path/URL
 */
const resolveImagePath = (req) => {
  if (req.file) {
    return `/uploads/${req.file.filename}`;
  }
  if (req.body.image && typeof req.body.image === 'string') {
    const trimmed = req.body.image.trim();
    // Allow relative /uploads/ path or valid web URL
    if (trimmed.startsWith('/uploads/') || /^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    // Reject arbitrary local filesystem paths
    throw ApiError.badRequest('Invalid image path. Must be a relative /uploads/ path or a valid http/https URL.');
  }
  return null;
};

/**
 * @desc    Create a new post or save as draft
 * @route   POST /posts
 * @access  Private (Authenticated users)
 */
export const createPost = asyncHandler(async (req, res) => {
  const { title, description, content, category, status, isDraft } = req.body;

  // Determine post status:
  // If requested as draft -> 'draft'
  // If intended for publication -> 'pending' (requires admin review)
  // Users CANNOT set status to 'approved' directly
  let postStatus = 'pending';
  if (status === 'draft' || isDraft === true || isDraft === 'true') {
    postStatus = 'draft';
  }

  const imagePath = resolveImagePath(req);

  const post = await Post.create({
    title: title.trim(),
    description: description.trim(),
    content: content.trim(),
    category: category ? category.trim() : 'General',
    image: imagePath,
    status: postStatus,
    createdBy: req.user._id,
    createdAt: new Date()
  });

  const populatedPost = await Post.findById(post._id).populate('createdBy', 'name email');

  return ApiResponse.created(
    res,
    postStatus === 'draft'
      ? 'Draft saved successfully'
      : 'Post submitted successfully and is awaiting admin approval',
    populatedPost
  );
});

/**
 * @desc    Get all approved public posts
 * @route   GET /posts
 * @access  Public
 */
export const getPublicPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, category, search, sort = '-createdAt' } = req.query;

  // STRICT REQUIREMENT: Only approved posts are publicly viewable
  const query = { status: 'approved' };

  if (category) {
    query.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
  }

  if (search) {
    query.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { description: { $regex: search.trim(), $options: 'i' } }
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const [posts, totalPosts] = await Promise.all([
    Post.find(query)
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limitNum),
    Post.countDocuments(query)
  ]);

  return ApiResponse.success(res, 'Public approved posts retrieved successfully', {
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
 * @desc    Get an individual approved post by ID
 * @route   GET /posts/:id
 * @access  Public
 */
export const getPostById = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id).populate('createdBy', 'name email');

  if (!post) {
    throw ApiError.notFound(`Post with ID '${req.params.id}' was not found.`);
  }

  // STRICT REQUIREMENT: Only approved posts are publicly viewable
  if (post.status !== 'approved') {
    throw ApiError.notFound(
      `Post with ID '${req.params.id}' is not approved for public viewing.`
    );
  }

  return ApiResponse.success(res, 'Post retrieved successfully', post);
});

/**
 * @desc    Get authenticated user's own posts and drafts
 * @route   GET /posts/my-posts
 * @access  Private (Authenticated users)
 */
export const getMyPosts = asyncHandler(async (req, res) => {
  const { status, category, page = 1, limit = 20 } = req.query;

  const query = { createdBy: req.user._id };

  if (status) {
    query.status = status.toLowerCase().trim();
  }

  if (category) {
    query.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [posts, totalPosts] = await Promise.all([
    Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Post.countDocuments(query)
  ]);

  return ApiResponse.success(res, 'Your posts retrieved successfully', {
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
 * @desc    Update authenticated user's own post
 * @route   PATCH /posts/:id
 * @access  Private (Author only)
 */
export const updatePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    throw ApiError.notFound(`Post with ID '${req.params.id}' was not found.`);
  }

  // Authorization check: User can only update their own post
  if (post.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw ApiError.forbidden('You are not authorized to update this post.');
  }

  const { title, description, content, category, status } = req.body;

  // Track if content has changed
  let contentChanged = false;

  if (title !== undefined && title.trim() !== post.title) {
    post.title = title.trim();
    contentChanged = true;
  }

  if (description !== undefined && description.trim() !== post.description) {
    post.description = description.trim();
    contentChanged = true;
  }

  if (content !== undefined && content.trim() !== post.content) {
    post.content = content.trim();
    contentChanged = true;
  }

  if (category !== undefined && category.trim() !== post.category) {
    post.category = category.trim();
    contentChanged = true;
  }

  // Check for new uploaded image
  if (req.file) {
    post.image = `/uploads/${req.file.filename}`;
    contentChanged = true;
  } else if (req.body.image !== undefined) {
    const newImage = resolveImagePath(req);
    if (newImage !== post.image) {
      post.image = newImage;
      contentChanged = true;
    }
  }

  // Status transitions & security rules:
  // 1. Normal users CANNOT set status to 'approved'.
  // 2. If a previously approved or rejected post is edited, modified content CANNOT bypass admin review.
  //    It MUST revert to 'pending' (or 'draft' if user explicitly saved as draft).
  if (status === 'draft') {
    post.status = 'draft';
  } else if (status === 'pending' || contentChanged) {
    // If content changed or user submitted for review, send to pending
    post.status = 'pending';
  }

  await post.save();

  const updatedPost = await Post.findById(post._id).populate('createdBy', 'name email');

  return ApiResponse.success(res, 'Post updated successfully', updatedPost);
});

/**
 * @desc    Delete authenticated user's own post
 * @route   DELETE /posts/:id
 * @access  Private (Author or Admin)
 */
export const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    throw ApiError.notFound(`Post with ID '${req.params.id}' was not found.`);
  }

  // Authorization check: User can delete their own post, or an admin can delete any post
  if (post.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw ApiError.forbidden('You are not authorized to delete this post.');
  }

  await Post.findByIdAndDelete(req.params.id);

  return ApiResponse.success(res, 'Post deleted successfully', {
    deletedPostId: req.params.id
  });
});

export default {
  createPost,
  getPublicPosts,
  getPostById,
  getMyPosts,
  updatePost,
  deletePost
};
