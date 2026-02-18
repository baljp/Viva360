import type { Appointment, Professional, User, UserRole } from '../../../types';
import type { DomainRequest } from './common';

type AccountDomainDeps = {
  request: DomainRequest;
  normalizeProfilePayload: (input: any) => User;
};

export const createAccountDomain = ({ request, normalizeProfilePayload }: AccountDomainDeps) => ({
  users: {
    getById: async (id: string) => {
      try {
        return await request(`/users/${id}`);
      } catch {
        return null;
      }
    },
    update: async (user: User) => {
      // TRIAGE: errors must propagate so UI shows feedback
      return await request(`/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify(user),
      });
    },
    checkIn: async (_uid: string, reward: number = 50) => {
      let payload: any;
      try {
        payload = await request('/users/checkin', {
          method: 'POST',
          purpose: 'daily-checkin',
          timeoutMs: 7000,
          retries: 0,
          body: JSON.stringify({ reward }),
        });
      } catch (error: any) {
        const status = Number(error?.status || 0);
        const code = String(error?.code || error?.details?.code || '').toUpperCase();
        if (status === 409 || code === 'CHECKIN_ALREADY_DONE') {
          const details = error?.details || {};
          return {
            ...details,
            code: 'CHECKIN_ALREADY_DONE',
            status: 'ALREADY_DONE',
            ok: true,
            alreadyDone: true,
            user: details?.user ? normalizeProfilePayload(details.user) : undefined,
          };
        }
        throw error;
      }

      if (payload?.user) {
        return {
          ...payload,
          ok: true,
          alreadyDone: String(payload?.status || payload?.code || '').toUpperCase().includes('ALREADY'),
          user: normalizeProfilePayload(payload.user),
        };
      }

      return { ...payload, ok: true };
    },
  },

  profiles: {
    lookupByEmail: async (email: string): Promise<{ id: string; name?: string; email?: string; role?: string; avatar?: string } | null> => {
      const normalized = String(email || '').trim().toLowerCase();
      if (!normalized) return null;
      try {
        return await request(`/profiles/lookup?email=${encodeURIComponent(normalized)}`, {
          purpose: 'profiles-lookup',
          timeoutMs: 7000,
          retries: 0,
        });
      } catch {
        return null;
      }
    },
  },

  professionals: {
    list: async (): Promise<Professional[]> => {
      try {
        return await request('/profiles?role=PROFESSIONAL', {
          purpose: 'professionals-list',
          timeoutMs: 6000,
          retries: 1,
        });
      } catch {
        return [];
      }
    },
    updateNotes: async (pid: string, proId: string, content: string) => {
      return await request(`/professionals/${proId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ patientId: pid, content }),
      });
    },
    getNotes: async (pid: string, proId: string) => {
      try {
        return await request(`/professionals/${proId}/notes/${pid}`);
      } catch {
        return [];
      }
    },
    grantAccess: async (pid: string) => {
      return await request(`/professionals/access/${pid}`, { method: 'POST' });
    },
    revokeAccess: async (professionalId: string) => {
      return await request('/records/revoke', {
        method: 'POST',
        body: JSON.stringify({ professionalId }),
      });
    },
    getRecordAccessList: async () => [],
    applyToVacancy: async (_vid: string) => ({ success: true }),
    getFinanceSummary: async (_pid: string) => {
      try {
        const [summary, transactions] = await Promise.all([
          request('/finance/summary', { purpose: 'finance-summary' }).catch(() => ({ balance: 0 })),
          request('/finance/transactions', { purpose: 'finance-transactions' }).catch(() => []),
        ]);
        return {
          ...(summary || {}),
          transactions: Array.isArray(transactions) ? transactions : [],
        };
      } catch {
        return { balance: 0, transactions: [] };
      }
    },
  },

  records: {
    list: async (patientId: string) => {
      try {
        return await request(`/records/${patientId}`);
      } catch {
        return [];
      }
    },
    create: async (record: any) => {
      return await request('/records', {
        method: 'POST',
        body: JSON.stringify(record),
      });
    },
    update: async (recordId: string, patch: { content?: string; type?: 'anamnesis' | 'session' }) => {
      return await request(`/records/${recordId}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
    },
  },

  appointments: {
    list: async (uid: string, role: UserRole) => {
      try {
        const all = await request('/appointments');
        const normalized = (Array.isArray(all) ? all : []).map((entry: any) => ({
          id: String(entry.id || ''),
          clientId: String(entry.clientId || entry.client_id || ''),
          clientName: String(entry.clientName || entry.client_name || ''),
          professionalId: String(entry.professionalId || entry.professional_id || ''),
          professionalName: String(entry.professionalName || entry.professional_name || ''),
          time: String(entry.time || '00:00'),
          date: String(entry.date || new Date().toISOString()),
          status: String(entry.status || 'pending').toLowerCase(),
          serviceName: String(entry.serviceName || entry.service_name || 'Atendimento'),
          price: Number(entry.price || 0),
        })) as Appointment[];
        if (role === 'PROFESSIONAL') return normalized.filter((a: Appointment) => a.professionalId === uid);
        return normalized.filter((a: Appointment) => a.clientId === uid);
      } catch {
        return [];
      }
    },
    create: async (apt: Appointment) => {
      return await request('/appointments', {
        method: 'POST',
        body: JSON.stringify(apt),
      });
    },
    reschedule: async (appointmentId: string, data: { date: string; time: string; service_name?: string }) => {
      return await request(`/appointments/${appointmentId}/reschedule`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    cancel: async (appointmentId: string, reason?: string) => {
      return await request(`/appointments/${appointmentId}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      });
    },
  },

  reviews: {
    list: async () => {
      try {
        return await request('/reviews');
      } catch {
        return [];
      }
    },
    create: async (review: any) => {
      // FLOW-05: Let errors propagate so UI can show feedback
      return await request('/reviews', {
        method: 'POST',
        body: JSON.stringify(review),
      });
    },
  },
});
