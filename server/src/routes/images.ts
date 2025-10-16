import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getAllImages,
  getImageById,
  deleteImage,
} from '../controllers/imagesController.js';

const router = Router();

// GET /api/images - Get all user images with pagination
router.get('/', requireAuth, getAllImages);

// GET /api/images/:id - Get single image details
router.get('/:id', requireAuth, getImageById);

// DELETE /api/images/:id - Delete an image
router.delete('/:id', requireAuth, deleteImage);

export default router;

