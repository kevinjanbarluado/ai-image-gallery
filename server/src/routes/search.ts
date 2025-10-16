import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { searchImages, findSimilarImages } from '../controllers/searchController.js';

const router = Router();

// GET /api/search?query=...&color=...&page=1&limit=20
router.get('/', requireAuth, searchImages);

// GET /api/search/similar/:imageId
router.get('/similar/:imageId', requireAuth, findSimilarImages);

export default router;

