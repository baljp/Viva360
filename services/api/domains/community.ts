import type { UserRole } from '../../../types';
import type { DomainRequest } from './common';

type CommunityDomainDeps = {
  request: DomainRequest;
};

export const createCommunityDomain = ({ request }: CommunityDomainDeps) => ({
  notifications: {
    list: async () => {
      try {
        return await request('/notifications');
      } catch {
        return [];
      }
    },
    markAsRead: async (id: string) => {
      try {
        await request(`/notifications/${id}/read`, { method: 'POST' });
        return true;
      } catch {
        return true;
      }
    },
    markAllAsRead: async () => {
      try {
        await request('/notifications/read-all', { method: 'POST' });
        return true;
      } catch {
        return true;
      }
    },
  },

  tribe: {
    listPosts: async () => {
      try {
        return await request('/tribe/posts');
      } catch {
        return [];
      }
    },
    createPost: async (content: string, type: 'insight' | 'question' | 'celebration') => {
      try {
        return await request('/tribe/posts', {
          method: 'POST',
          body: JSON.stringify({ content, type }),
        });
      } catch {
        return { id: `pt_${Date.now()}`, content, type };
      }
    },
    likePost: async (id: string) => {
      try {
        await request(`/tribe/posts/${id}/like`, { method: 'POST' });
        return true;
      } catch {
        return true;
      }
    },
    syncVibration: async (_userId: string, reward: number = 10) => {
      try {
        return await request('/tribe/sync', {
          method: 'POST',
          body: JSON.stringify({ reward }),
        });
      } catch {
        return { success: false };
      }
    },
    invite: async (payload: { email: string; inviteType?: 'TEAM' | 'COMMUNITY' | 'JOB'; targetRole?: UserRole; contextRef?: string; expiresInHours?: number }) => {
      return await request('/tribe/invite', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    respondInvite: async (inviteId: string, decision: 'ACCEPT' | 'REJECT') => {
      return await request(`/tribe/invites/${inviteId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ decision }),
      });
    },
  },

  links: {
    create: async (targetId: string, type: 'tribo' | 'paciente' | 'escambo' | 'equipe' | 'bazar') => {
      return await request('/links', {
        method: 'POST',
        body: JSON.stringify({ targetId, type }),
      });
    },
    accept: async (linkId: string) => {
      return await request(`/links/${linkId}/accept`, { method: 'POST' });
    },
    getMyLinks: async () => {
      try {
        return await request('/links/me');
      } catch {
        return [];
      }
    },
    getPendingRequests: async () => {
      try {
        return await request('/links/pending');
      } catch {
        return [];
      }
    },
    checkLink: async (targetId: string, type?: string) => {
      try {
        const params = type ? `?type=${type}` : '';
        const result = await request(`/links/check/${targetId}${params}`);
        return result.hasLink || false;
      } catch {
        return false;
      }
    },
    reject: async (linkId: string) => {
      return await request(`/links/${linkId}/reject`, { method: 'POST' });
    },
  },

  presence: {
    goOnline: async () => {
      try {
        return await request('/presence/online', { method: 'POST' });
      } catch {
        return { status: 'ONLINE' };
      }
    },
    goOffline: async () => {
      try {
        return await request('/presence/offline', { method: 'POST' });
      } catch {
        return { status: 'OFFLINE' };
      }
    },
    ping: async () => {
      try {
        return await request('/presence/ping', { method: 'POST' });
      } catch {
        return { status: 'ONLINE' };
      }
    },
    listActive: async () => {
      try {
        const result = await request('/presence');
        return result.online || [];
      } catch {
        return [];
      }
    },
    getStatus: async (guardianId: string) => {
      try {
        const result = await request(`/presence/${guardianId}`);
        return result.status || 'OFFLINE';
      } catch {
        return 'OFFLINE';
      }
    },
    getBatch: async (guardianIds: string[]) => {
      try {
        return await request('/presence/batch', {
          method: 'POST',
          body: JSON.stringify({ guardianIds }),
        });
      } catch {
        const result: Record<string, string> = {};
        guardianIds.forEach((id) => {
          result[id] = 'OFFLINE';
        });
        return result;
      }
    },
  },

  chat: {
    joinRoom: async (payload: { type: 'support_room' | 'healing_circle'; contextId?: string }) => {
      return await request('/chat/rooms/join', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    listRooms: async (filters?: { contextType?: string; contextId?: string }) => {
      try {
        const query = new URLSearchParams();
        if (filters?.contextType) query.set('contextType', filters.contextType);
        if (filters?.contextId) query.set('contextId', filters.contextId);
        const suffix = query.toString() ? `?${query.toString()}` : '';
        return await request(`/chat/rooms${suffix}`);
      } catch {
        return [];
      }
    },
    getMessages: async (roomId: string) => {
      try {
        return await request(`/chat/rooms/${roomId}/messages`);
      } catch {
        return [];
      }
    },
    sendMessage: async (roomId: string, content: string) => {
      try {
        await request(`/chat/rooms/${roomId}/messages`, {
          method: 'POST',
          body: JSON.stringify({ content }),
        });
        return true;
      } catch {
        return false;
      }
    },
  },
});
