import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/error';
import prisma from '../config/database';

// Get user's order history
export const getOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError('Usuário não autenticado', 401);
  }

  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      orderItems: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(orders);
});

// Get single order details
export const getOrderById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw new AppError('Usuário não autenticado', 401);
  }

  const order = await prisma.order.findFirst({
    where: { 
      id: id as string,
      userId,
    },
    include: {
      orderItems: true,
    },
  });

  if (!order) {
    throw new AppError('Pedido não encontrado', 404);
  }

  res.json(order);
});

// Create new order (called after successful payment)
export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { items, total, paymentId, shippingAddress, type = 'PRODUCT' } = req.body;

  if (!userId) {
    throw new AppError('Usuário não autenticado', 401);
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError('Itens do pedido são obrigatórios', 400);
  }

  // Calculate subtotal
  const subtotal = items.reduce((acc: number, item: any) => acc + (item.unitPrice * item.quantity), 0);

  // Create order with items
  const order = await prisma.order.create({
    data: {
      userId,
      type,
      subtotal,
      total: total || subtotal,
      status: 'PENDING',
      paymentId,
      shippingAddress,
      orderItems: {
        create: items.map((item: any) => ({
          productId: item.productId,
          productName: item.productName || 'Produto',
          productType: item.productType || 'PRODUCT',
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          totalPrice: (item.unitPrice || 0) * (item.quantity || 1),
        })),
      },
    },
    include: {
      orderItems: true,
    },
  });

  // Create transaction record
  await prisma.transaction.create({
    data: {
      userId,
      type: 'EXPENSE',
      amount: total || subtotal,
      description: `Pedido #${order.id.slice(-6).toUpperCase()}`,
      status: 'COMPLETED',
    },
  });

  res.status(201).json(order);
});

// Update order status
export const updateOrderStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    throw new AppError('Status inválido', 400);
  }

  const order = await prisma.order.update({
    where: { id: id as string },
    data: { status },
  });

  res.json(order);
});
