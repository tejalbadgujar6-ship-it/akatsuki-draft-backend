import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import ApiError from '../utils/apiError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
];

// 5MB maximum file size
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate safe, sanitized unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      ApiError.badRequest(
        `Invalid file type '${file.mimetype}'. Only JPEG, PNG, WEBP, and GIF images are allowed.`
      ),
      false
    );
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  }
});

/**
 * Middleware wrapper for single 'image' upload with custom error handling
 */
export const uploadImage = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(ApiError.badRequest('File size exceeds the 5MB limit.'));
      }
      return next(ApiError.badRequest(`File upload error: ${err.message}`));
    } else if (err) {
      return next(err);
    }
    next();
  });
};

export default uploadImage;
