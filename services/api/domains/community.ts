import type { UserRole } from '../../../types';
import type { DomainRequest } from './common';
import { captureFrontendError } from '../../../lib/frontendLogger';

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
        captureFrontendError(err, { domain: 'community', op: 'notifications.list' });
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
        captureFrontendError(err, { domain: 'community', op: 'tribe.listPosts' });
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
    getMembers: async (): Promise<Array<{ id: string; name: string; avatar: string; needsWatering?: boolean }>> => {
      try {
        const data = await request('/tribe/members');
        return Array.isArray(data) ? data.map((m: any) => ({
          id: String(m.id || ''),
          name: String(m.name || 'Membro'),
          avatar: m.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${m.id}`,
          needsWatering: Boolean(m.needsWatering ?? m.needs_watering ?? false),
        })) : [];
      } catch (err) {
        captureFrontendError(err, { domain: 'community', op: 'tribe.getMembers' });
        return [];
      }
    },
    getActivePacts: async (): Promise<Array<{
      id: string; partnerId: string; partnerName: string; partnerAvatar: string;
      missionLabel: string; myProgress: number; partnerProgress: number;
      target: number; rewardKarma: number; endDate: string; status: 'active' | 'completed';
    }>> => {
      try {
        const data = await request('/tribe/pacts/active');
        return Array.isArray(data) ? data : [];
      } catch (err) {
        captureFrontendError(err, { domain: 'community', op: 'tribe.getActivePacts' });
        return [];
      }
    },
    getPresence: async (): Promise<{ count: number }> => {
      try {
        const data = await request('/tribe/presence');
        return { count: Number((data as any)?.count ?? 0) };
      } catch (err) {
        captureFrontendError(err, { domain: 'community', op: 'tribe.getPresence' });
        return { count: 0 };
      }
    },
    syncVibration: async (_userId: string, reward: number = 10) => {
      try {
        return await request('/tribe/sync', {
          method: 'POST',
          body: JSON.stringify({ reward }),
        });
      } catch (err) {
        captureFrontendError(err, { domain: 'community', op: 'tribe.syncVibration' });
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
        captureFrontendError(err, { domain: 'community', op: 'links.getMyLinks' });
        return [];
      }
    },
    getPendingRequests: async () => {
      try {
        return await request('/links/pending');
      } catch (err) {
        captureFrontendError(err, { domain: 'community', op: 'links.getPendingRequests' });
        return [];
      }
    },
    checkLink: async (targetId: string, type?: string) => {
      try {
        const params = type ? `?type=${type}` : '';
        const result = await request(`/links/check/${targetId}${params}`);
        return result.hasLink || false;
      } catch (err) {
        captureFrontendError(err, { domain: 'community', op: 'links.checkLink' });
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
        captureFrontendError(err, { domain: 'community', op: 'presence.goOnline' });
        return { status: 'ONLINE' };
      }
    },
    goOffline: async () => {
      try {
        return await request('/presence/offline', { method: 'POST' });
      } catch (err) {
        captureFrontendError(err, { domain: 'community', op: 'presence.goOffline' });
        return { status: 'OFFLINE' };
      }
    },
    ping: async () => {
      try {
        return await request('/presence/ping', { method: 'POST' });
      } catch (err) {
        captureFrontendError(err, { domain: 'community', op: 'presence.ping' });
        return { status: 'ONLINE' };
      }
    },
    listActive: async () => {
      try {
        const result = await request('/presence');
        return result.online || [];
      } catch (err) {
        captureFrontendError(err, { domain: 'community', op: 'presence.listActive' });
        return [];
      }
    },
    getStatus: async (guardianId: string) => {
      try {
        const result = await request(`/presence/${guardianId}`);
        return result.status || 'OFFLINE';
      } catch (err) {
        captureFrontendError(err, { domain: 'community', op: 'presence.getStatus' });
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
        captureFrontendError(err, { domain: 'community', op: 'presence.getBatch' });
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
        const path = query.toString() ? `/chat/rooms?${query.toString()}` : '/chat/rooms';
        return await request(path);
      } catch (err) {
        captureFrontendError(err, { domain: 'community', op: 'chat.listRooms' });
        if (opts?.strict) throw err;
        return [];
      }
    },
    getMessages: async (roomId: string) => {
      try {
        return await request(`/chat/rooms/${roomId}/messages`);
      } catch (err) {
        captureFrontendError(err, { domain: 'community', op: 'chat.getMessages' });
        return [];
      }
    },
    sendMessage: async (roomId: string, content: string) => {
      return await request(`/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
    },
  },
});
