import { Router } from 'express';
import multer from 'multer';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { uploadImage } from '../controllers/uploadController.js';
import { config } from '../config/index.js';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.upload.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedFormats.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only JPEG and PNG are allowed.'));
    }
  },
});

// POST /api/upload - Upload single or multiple images
router.post('/', requireAuth, upload.array('images', 10), uploadImage);

export default router;

