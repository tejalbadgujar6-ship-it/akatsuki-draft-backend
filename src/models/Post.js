import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Post title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters long'],
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Post description is required'],
      trim: true,
      minlength: [5, 'Description must be at least 5 characters long'],
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    content: {
      type: String,
      required: [true, 'Post content is required']
    },
    image: {
      type: String,
      default: null,
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Post category is required'],
      trim: true,
      default: 'General'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author user reference (createdBy) is required']
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'pending', 'approved', 'rejected'],
        message: '{VALUE} is not a valid status. Allowed values: draft, pending, approved, rejected'
      },
      default: 'draft'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Indexes for query performance
postSchema.index({ status: 1 });
postSchema.index({ createdBy: 1 });
postSchema.index({ category: 1 });
postSchema.index({ title: 'text', description: 'text' });

// Sanitize post output
postSchema.methods.toJSON = function () {
  const postObject = this.toObject();
  delete postObject.__v;
  return postObject;
};

export const Post = mongoose.model('Post', postSchema);
export default Post;
