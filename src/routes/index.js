import { Router } from 'express';
import authRoutes from './authRoutes.js';
import postRoutes from './postRoutes.js';
import adminRoutes from './adminRoutes.js';
import aiRoutes from './aiRoutes.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: "Akatsuki's Draft API",
    version: '1.0.0'
  });
});

// Mount modular sub-routers
router.use('/auth', authRoutes);
router.use('/posts', postRoutes);
router.use('/admin', adminRoutes);
router.use('/ai', aiRoutes);

export default router;
