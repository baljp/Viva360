import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/error';
import { stripeService } from '../services/stripe.service';

export const createPaymentIntent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { amount, currency } = req.body;

  if (!amount) {
    throw new AppError('Valor é obrigatório', 400);
  }

  const paymentIntent = await stripeService.createPaymentIntent(amount, currency);

  res.json(paymentIntent);
});
