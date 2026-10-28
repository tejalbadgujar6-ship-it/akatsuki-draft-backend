import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import routes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// Enable CORS
app.use(cors());

// HTTP request logger (skip during automated tests)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static uploads
const uploadsPath = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// Root welcome route
app.get('/', (req, res) => {
  res.status(200).json({
    message: "Welcome to Akatsuki's Draft: AI-Enabled Content Sharing Platform API",
    version: '1.0.0',
    documentation: 'See README.md or import Postman collection',
    endpoints: {
      auth: ['/auth/register', '/auth/login', '/auth/me'],
      posts: ['/posts (GET, POST)', '/posts/:id (GET, PATCH, DELETE)', '/posts/my-posts (GET)'],
      admin: ['/admin/posts/pending (GET)', '/admin/posts/approve/:id (PATCH)', '/admin/posts/reject/:id (PATCH)'],
      ai: ['/ai/improve/:postId (POST)']
    }
  });
});

// Mount Routes (mounted at root per spec, and also aliased at /api)
app.use('/', routes);
app.use('/api', routes);

// 404 Route Not Found Handler
app.use(notFoundHandler);

// Global Centralized Error Handler
app.use(errorHandler);

export default app;
