import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async.middleware';
import { marketplaceService } from '../services/marketplace.service';

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const ownerId = (req as any).user?.userId;
  const { name, price, category, type, image, description, eventDate, hostName, spotsLeft, karmaReward } = req.body;

  const product = await marketplaceService.createProduct({
      name,
      price: typeof price === 'string' ? parseFloat(price) : price,
      category,
      type,
      image,
      description,
      owner_id: ownerId,
      // Extra fields passed for mock compatibility or future schema updates
      eventDate, hostName, spotsLeft, karmaReward
  });

  return res.json(product);
});

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const { ownerId } = req.query;

  const products = await marketplaceService.listProducts(ownerId as string);
  return res.json(products);
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await marketplaceService.deleteProduct(id);
    return res.json(result);
});
