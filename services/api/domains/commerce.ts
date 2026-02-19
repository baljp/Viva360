import type { Product } from '../../../types';
import type { DomainRequest } from './common';

type CommerceDomainDeps = {
  request: DomainRequest;
};

export const createCommerceDomain = ({ request }: CommerceDomainDeps) => ({
  payment: {
    checkout: async (
      amount: number,
      description: string,
      providerId?: string,
      opts?: { contextType?: 'BAZAR' | 'TRIBO' | 'RECRUTAMENTO' | 'ESCAMBO' | 'AGENDA' | 'GERAL'; contextRef?: string; items?: Array<{ id: string; price?: number; type?: string }> },
    ) => {
      return await request('/checkout/pay', {
        method: 'POST',
        purpose: 'checkout-payment',
        body: JSON.stringify({
          amount,
          description,
          receiverId: providerId,
          contextType: opts?.contextType || 'GERAL',
          contextRef: opts?.contextRef,
          items: opts?.items || [],
        }),
      });
    },
  },

  marketplace: {
    list: async (opts?: { ownerId?: string; category?: string }): Promise<Product[]> => {
      const params = new URLSearchParams();
      if (opts?.ownerId) params.set('ownerId', String(opts.ownerId));
      if (opts?.category) params.set('category', String(opts.category));
      const qs = params.toString();
      try {
        return await request(`/marketplace/products${qs ? `?${qs}` : ''}`, {
          purpose: 'marketplace-list',
          timeoutMs: 6000,
          retries: 1,
        });
      } catch (err) {
        console.error('[commerce.list]', err);
        return [];
      }
    },
    listAll: async (): Promise<Product[]> => {
      return await request('/marketplace/products', {
        purpose: 'marketplace-list',
        timeoutMs: 6000,
        retries: 1,
      }).catch(() => []);
    },
    listByOwner: async (oid: string) => {
      try {
        return await request(`/marketplace/products?ownerId=${encodeURIComponent(String(oid))}`, { purpose: 'marketplace-owner-list' });
      } catch (err) {
        console.error('[commerce.listByOwner]', err);
        return [];
      }
    },
    create: async (product: any) => {
      return await request('/marketplace/products', {
        method: 'POST',
        purpose: 'marketplace-create',
        body: JSON.stringify(product),
      });
    },
    delete: async (id: string) => {
      try {
        await request(`/marketplace/products/${id}`, { method: 'DELETE', purpose: 'marketplace-delete' });
        return true;
      } catch (err) {
        console.error('[commerce.delete]', err);
        return false;
      }
    },
    // MOD-02: Real purchase via POST /marketplace/purchase
    purchase: async (productId: string, amount: number, description?: string) => {
      return await request('/marketplace/purchase', {
        method: 'POST',
        purpose: 'marketplace-purchase',
        body: JSON.stringify({ product_id: productId, amount, description }),
      });
    },
  },

  admin: {
    getDashboard: async () => {
      try {
        return await request('/admin/dashboard');
      } catch (err) {
        console.error('[commerce.getDashboard]', err);
        return { totalUsers: 0, activeUsers: 0, revenue: 0, systemHealth: { status: 'unknown' } };
      }
    },
    listUsers: async () => {
      try {
        return await request('/admin/users');
      } catch (err) {
        console.error('[commerce.listUsers]', err);
        return [];
      }
    },
    blockUser: async () => true,
    getMetrics: async () => {
      try {
        return await request('/admin/metrics');
      } catch (err) {
        console.error('[commerce.getMetrics]', err);
        return {};
      }
    },
    getMarketplaceOffers: async () => {
      try {
        return await request('/admin/marketplace/offers');
      } catch (err) {
        console.error('[commerce.getMarketplaceOffers]', err);
        return [];
      }
    },
    getGlobalFinance: async () => {
      try {
        return await request('/admin/finance/global');
      } catch (err) {
        console.error('[commerce.getGlobalFinance]', err);
        return {};
      }
    },
    getLgpdAudit: async () => {
      try {
        return await request('/admin/lgpd/audit');
      } catch (err) {
        console.error('[commerce.getLgpdAudit]', err);
        return [];
      }
    },
    getSystemHealth: async () => {
      try {
        return await request('/admin/system/health');
      } catch (err) {
        console.error('[commerce.getSystemHealth]', err);
        return {};
      }
    },
  },
});
