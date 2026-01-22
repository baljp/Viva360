import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { searchProfessionals, searchProducts, getSearchFilters } from '../controllers/search.controller';

const router = Router();

// Public search routes (for SEO and better UX)
// GET /api/search/professionals - Search professionals with filters
router.get('/professionals', searchProfessionals);

// GET /api/search/products - Search products with filters
router.get('/products', searchProducts);

// Protected route - Get available filter options (requires auth)
router.get('/filters', authenticateToken, getSearchFilters);

export default router;
