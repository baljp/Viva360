import prisma from '../config/database';
import { AppError } from '../middleware/error';

// Types
interface CartItem {
  productId?: string;
  professionalId?: string;
  serviceName: string;
  price: number;
  quantity: number;
  type: 'product' | 'service';
  date?: string;
  time?: string;
}

interface CheckoutRequest {
  userId: string;
  items: CartItem[];
  paymentMethod?: string;
}

interface CheckoutResult {
  orderId: string;
  appointments: { id: string; serviceName: string }[];
  products: { id: string; name: string }[];
  total: number;
  karma: number;
}

/**
 * Checkout Service - Handles all checkout operations atomically
 * Performance: 1 transaction instead of N sequential calls
 * Robustness: All-or-nothing with automatic rollback
 */
export class CheckoutService {
  
  /**
   * Process entire cart in a single atomic transaction
   * This replaces N sequential API calls with 1 batch operation
   */
  async processCart(request: CheckoutRequest): Promise<CheckoutResult> {
    const { userId, items } = request;

    // Pre-validate all items before transaction
    await this.validateCart(userId, items);

    // Calculate totals
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const karmaEarned = Math.floor(total * 2);
    const xpEarned = Math.floor(total / 10);

    // Execute atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get user and verify balance
      const user = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: { id: true, name: true, personalBalance: true, karma: true, plantXp: true }
      });

      if (user.personalBalance < total) {
        throw new AppError('Saldo insuficiente', 400);
      }

      // 2. Create order record
      const order = await tx.order.create({
        data: {
          user: { connect: { id: userId } },
          total,
          subtotal: total,
          status: 'COMPLETED',
          paymentMethod: request.paymentMethod || 'BALANCE',
          type: 'PRODUCT',
        }
      });

      // 3. Process service items (appointments)
      const serviceItems = items.filter(i => i.type === 'service');
      const appointments = await Promise.all(
        serviceItems.map(item => 
          tx.appointment.create({
            data: {
              clientId: userId,
              professionalId: item.professionalId!,
              serviceName: item.serviceName,
              price: item.price,
              date: new Date(item.date || Date.now()),
              time: item.time || '10:00',
              duration: 60,
              status: 'PENDING',
              type: 'PAID',
            },
            select: { id: true, serviceName: true }
          })
        )
      );

      // 4. Process product items (order items)
      const productItems = items.filter(i => i.type === 'product');
      const products = await Promise.all(
        productItems.map(item =>
          tx.orderItem.create({
            data: {
              orderId: order.id,
              productId: item.productId!,
              productName: item.serviceName, // Reusing serviceName as name
              productType: 'PRODUCT',
              quantity: item.quantity,
              unitPrice: item.price,
              totalPrice: item.price * item.quantity,
            },
            select: { id: true, productName: true }
          })
        )
      );

      // 5. Create expense transaction
      await tx.transaction.create({
        data: {
          userId,
          type: 'EXPENSE',
          amount: total,
          description: `Pedido #${order.id.slice(-8)}`,
          reference: order.id,
          status: 'COMPLETED',
        }
      });

      // 6. Update user balance and gamification
      await tx.user.update({
        where: { id: userId },
        data: {
          personalBalance: { decrement: total },
          karma: { increment: karmaEarned },
          plantXp: { increment: xpEarned },
          streak: { increment: 1 },
        }
      });

      // 7. Create notifications for professionals
      await Promise.all(
        serviceItems.map(item =>
          tx.notification.create({
            data: {
              userId: item.professionalId!,
              type: 'APPOINTMENT',
              title: 'Novo Agendamento',
              message: `${user.name} agendou ${item.serviceName}`,
              actionUrl: `/appointments`,
            }
          })
        )
      );

      return {
        orderId: order.id,
        appointments: appointments.map(a => ({ id: a.id, serviceName: a.serviceName })),
        products: products.map(p => ({ id: p.id, name: p.productName })),
        total,
        karma: karmaEarned,
      };
    }, {
      maxWait: 10000, // Max time to acquire lock
      timeout: 30000, // Max transaction duration
    });

    return result;
  }

  /**
   * Validate cart items before processing
   */
  private async validateCart(userId: string, items: CartItem[]): Promise<void> {
    if (!items || items.length === 0) {
      throw new AppError('Carrinho vazio', 400);
    }

    // Validate user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    // Validate all professionals exist for service items
    const serviceItems = items.filter(i => i.type === 'service');
    if (serviceItems.length > 0) {
      const proIds = [...new Set(serviceItems.map(i => i.professionalId).filter(Boolean))];
      const pros = await prisma.user.findMany({
        where: { id: { in: proIds as string[] }, role: 'PROFESSIONAL' },
        select: { id: true }
      });
      
      if (pros.length !== proIds.length) {
        throw new AppError('Profissional não encontrado', 404);
      }
    }

    // Validate all products exist for product items
    const productItems = items.filter(i => i.type === 'product');
    if (productItems.length > 0) {
      const productIds = [...new Set(productItems.map(i => i.productId).filter(Boolean))];
      const products = await prisma.product.findMany({
        where: { id: { in: productIds as string[] } },
        select: { id: true }
      });
      
      if (products.length !== productIds.length) {
        throw new AppError('Produto não encontrado', 404);
      }
    }
  }
}

// Singleton instance
export const checkoutService = new CheckoutService();
