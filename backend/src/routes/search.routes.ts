import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { searchProfessionals, searchProducts, getSearchFilters } from '../controllers/search.controller';

const router = Router();

// All search routes require authentication
router.use(authenticateToken);

// GET /api/search/professionals - Search professionals with filters
router.get('/professionals', searchProfessionals);

// GET /api/search/products - Search products with filters
router.get('/products', searchProducts);

// GET /api/search/filters - Get available filter options
router.get('/filters', getSearchFilters);

export default router;
