import { Request, Response } from 'express';
import { supabaseAdmin, isMockMode } from '../services/supabase.service';
import { dbManager } from '../lib/database_manager';
import { checkoutQueue } from '../lib/queue';
import { z } from 'zod';

const purchaseSchema = z.object({
  product_id: z.string(),
  amount: z.number().positive(),
  description: z.string(),
});

export const listProducts = async (req: Request, res: Response) => {
  try {
    if (isMockMode()) {
      return res.json([
        { id: 'prod-1', name: 'Cristal Curativo', price: 50.0, category: 'Cristais', image: 'https://placehold.co/400' },
        { id: 'prod-2', name: 'Tapete Yoga', price: 120.0, category: 'Acessórios', image: 'https://placehold.co/400' },
      ]);
    }

    // CQRS: Read from Replica
    const { data, error } = await dbManager.getReader().from('products').select('*');
    if (error) throw error;
    return res.json(data);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const processPurchase = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { product_id, amount, description } = purchaseSchema.parse(req.body);

    if (isMockMode()) {
      // Stimulate balance check
      if (amount > 5000) {
         return res.status(400).json({ error: 'Insufficient funds (Mock)' });
      }
      return res.json({
        success: true,
        transaction_id: 'mock-tx-123',
        new_balance: 950.0, // Mock deduction
        message: 'Purchase successful'
      });
    }

    // ASYNC ARCHITECTURE: Push to Redis Queue
    const job = await checkoutQueue.add('purchase', {
      amount,
      description,
      user_id: user.id,
      receiver_id: null 
    });

    return res.json({
      success: true,
      status: 'queued',
      jobId: job.id,
      message: 'Transaction queued for processing'
    });

  } catch (error: any) {
     if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(400).json({ error: error.message || 'Transaction failed' });
  }
};
