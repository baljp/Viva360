import type { UserRole } from '../../../types';
import type { DomainRequest } from './common';

type CommunityDomainDeps = {
  request: DomainRequest;
};

export const createCommunityDomain = ({ request }: CommunityDomainDeps) => ({
  invites: {
    create: async (payload: { kind: 'tribo' | 'guardian' | 'space'; targetRole?: 'CLIENT' | 'PROFESSIONAL' | 'SPACE'; contextRef?: string }) => {
      return await request('/invites/create', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    resolve: async (token: string) => {
      return await request(`/invites/resolve/${encodeURIComponent(token)}`);
    },
    accept: async (token: string) => {
      return await request('/invites/accept', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
    },
  },

  notifications: {
    list: async (opts?: { strict?: boolean }) => {
      try {
        return await request('/notifications');
      } catch (err) {
        console.error('[community.list]', err);
        if (opts?.strict) throw err;
        return [];
      }
    },
    markAsRead: async (id: string) => {
      await request(`/notifications/${id}/read`, { method: 'POST' });
      return true;
    },
    markAllAsRead: async () => {
      await request('/notifications/read-all', { method: 'POST' });
      return true;
    },
  },

  tribe: {
    listPosts: async () => {
      try {
        return await request('/tribe/posts');
      } catch (err) {
        console.error('[community.listPosts]', err);
        return [];
      }
    },
    createPost: async (content: string, type: 'insight' | 'question' | 'celebration') => {
      return await request('/tribe/posts', {
        method: 'POST',
        body: JSON.stringify({ content, type }),
      });
    },
    likePost: async (id: string) => {
      await request(`/tribe/posts/${id}/like`, { method: 'POST' });
      return true;
    },
    syncVibration: async (_userId: string, reward: number = 10) => {
      try {
        return await request('/tribe/sync', {
          method: 'POST',
          body: JSON.stringify({ reward }),
        });
      } catch (err) {
        console.error('[community.syncVibration]', err);
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
      } catch (err) {
        console.error('[community.getMyLinks]', err);
        return [];
      }
    },
    getPendingRequests: async () => {
      try {
        return await request('/links/pending');
      } catch (err) {
        console.error('[community.getPendingRequests]', err);
        return [];
      }
    },
    checkLink: async (targetId: string, type?: string) => {
      try {
        const params = type ? `?type=${type}` : '';
        const result = await request(`/links/check/${targetId}${params}`);
        return result.hasLink || false;
      } catch (err) {
        console.error('[community.checkLink]', err);
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
      } catch (err) {
        console.error('[community.goOnline]', err);
        return { status: 'ONLINE' };
      }
    },
    goOffline: async () => {
      try {
        return await request('/presence/offline', { method: 'POST' });
      } catch (err) {
        console.error('[community.goOffline]', err);
        return { status: 'OFFLINE' };
      }
    },
    ping: async () => {
      try {
        return await request('/presence/ping', { method: 'POST' });
      } catch (err) {
        console.error('[community.ping]', err);
        return { status: 'ONLINE' };
      }
    },
    listActive: async () => {
      try {
        const result = await request('/presence');
        return result.online || [];
      } catch (err) {
        console.error('[community.listActive]', err);
        return [];
      }
    },
    getStatus: async (guardianId: string) => {
      try {
        const result = await request(`/presence/${guardianId}`);
        return result.status || 'OFFLINE';
      } catch (err) {
        console.error('[community.getStatus]', err);
        return 'OFFLINE';
      }
    },
    getBatch: async (guardianIds: string[]) => {
      try {
        return await request('/presence/batch', {
          method: 'POST',
          body: JSON.stringify({ guardianIds }),
        });
      } catch (err) {
        console.error('[community.getBatch]', err);
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
    listRooms: async (filters?: { contextType?: string; contextId?: string }, opts?: { strict?: boolean }) => {
      try {
        const query = new URLSearchParams();
        if (filters?.contextType) query.set('contextType', filters.contextType);
        if (filters?.contextId) query.set('contextId', filters.contextId);
        const suffix = query.toString() ? `?${query.toString()}` : '';
        return await request(`/chat/rooms${suffix}`);
      } catch (err) {
        console.error('[community.listRooms]', err);
        if (opts?.strict) throw err;
        return [];
      }
    },
    getMessages: async (roomId: string) => {
      try {
        return await request(`/chat/rooms/${roomId}/messages`);
      } catch (err) {
        console.error('[community.getMessages]', err);
        return [];
      }
    },
    sendMessage: async (roomId: string, content: string) => {
      await request(`/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      return true;
    },
  },
});
