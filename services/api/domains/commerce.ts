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
    listAll: async (): Promise<Product[]> => {
      try {
        return await request('/marketplace/products', {
          purpose: 'marketplace-list',
          timeoutMs: 6000,
          retries: 1,
        });
      } catch {
        return [];
      }
    },
    listByOwner: async (oid: string) => {
      try {
        return await request(`/marketplace/products?ownerId=${oid}`, { purpose: 'marketplace-owner-list' });
      } catch {
        return [];
      }
    },
    create: async (product: any) => {
      try {
        return await request('/marketplace/products', {
          method: 'POST',
          purpose: 'marketplace-create',
          body: JSON.stringify(product),
        });
      } catch {
        return { ...product, id: `prod_${Date.now()}` };
      }
    },
    delete: async (id: string) => {
      try {
        await request(`/marketplace/products/${id}`, { method: 'DELETE', purpose: 'marketplace-delete' });
        return true;
      } catch {
        return false;
      }
    },
  },

  admin: {
    getDashboard: async () => {
      try {
        return await request('/admin/dashboard');
      } catch {
        return { totalUsers: 0, activeUsers: 0, revenue: 0, systemHealth: { status: 'unknown' } };
      }
    },
    listUsers: async () => {
      try {
        return await request('/admin/users');
      } catch {
        return [];
      }
    },
    blockUser: async () => true,
    getMetrics: async () => {
      try {
        return await request('/admin/metrics');
      } catch {
        return {};
      }
    },
    getMarketplaceOffers: async () => {
      try {
        return await request('/admin/marketplace/offers');
      } catch {
        return [];
      }
    },
    getGlobalFinance: async () => {
      try {
        return await request('/admin/finance/global');
      } catch {
        return {};
      }
    },
    getLgpdAudit: async () => {
      try {
        return await request('/admin/lgpd/audit');
      } catch {
        return [];
      }
    },
    getSystemHealth: async () => {
      try {
        return await request('/admin/system/health');
      } catch {
        return {};
      }
    },
  },
});
