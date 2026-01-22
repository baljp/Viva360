import { Router } from 'express';
import { Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { checkoutService } from '../services/checkout.service';

const router = Router();

/**
 * POST /api/checkout/batch
 * Process entire cart in single atomic transaction
 * 
 * Performance: Replaces N sequential calls with 1 batched operation
 * Robustness: All-or-nothing with automatic rollback on failure
 */
router.post('/batch', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  
  if (!userId) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  const { items, paymentMethod } = req.body;

  const result = await checkoutService.processCart({
    userId,
    items,
    paymentMethod,
  });

  res.status(201).json({
    success: true,
    ...result,
    message: `Checkout concluído! +${result.karma} karma`,
  });
}));

/**
 * POST /api/checkout/validate
 * Pre-validate cart without processing (for UI feedback)
 */
router.post('/validate', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { items } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  // Calculate totals
  const total = items?.reduce((sum: number, item: any) => 
    sum + (item.price * (item.quantity || 1)), 0) || 0;

  // Check user balance
  const user = await (await import('../config/database')).default.user.findUnique({
    where: { id: userId },
    select: { personalBalance: true }
  });

  const sufficient = (user?.personalBalance || 0) >= total;

  res.json({
    valid: sufficient && items?.length > 0,
    total,
    balance: user?.personalBalance || 0,
    sufficient,
    itemCount: items?.length || 0,
  });
}));

export default router;
