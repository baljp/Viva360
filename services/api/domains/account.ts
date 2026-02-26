import type { Appointment, Professional, User, UserRole } from '../../../types';
import type { DomainRequest } from './common';
import { captureFrontendError } from '../../../lib/frontendLogger';

type AccountDomainDeps = {
  request: DomainRequest;
  normalizeProfilePayload: (input: unknown) => User;
};

type CheckInResponse = {
  ok?: boolean;
  alreadyDone?: boolean;
  status?: string;
  code?: string;
  reward?: number;
  lastCheckIn?: string | null;
  user?: unknown;
};

type RequestErrorLike = {
  status?: number;
  code?: string;
  details?: Record<string, unknown> & { code?: string; user?: unknown };
  message?: string;
};

export const createAccountDomain = ({ request, normalizeProfilePayload }: AccountDomainDeps) => ({
  users: {
    getById: async (id: string): Promise<User | null> => {
      try {
        const payload = await request<unknown>(`/users/${id}`);
        return normalizeProfilePayload(payload);
      } catch (err) {
        captureFrontendError(err, { domain: 'account', op: 'users.getById' });
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
      let payload: CheckInResponse;
      try {
        payload = await request<CheckInResponse>('/metamorphosis/checkin', {
          method: 'POST',
          purpose: 'daily-checkin',
          timeoutMs: 7000,
          retries: 0,
          body: JSON.stringify({ reward }),
        });
      } catch (error) {
        const reqError = error as RequestErrorLike;
        captureFrontendError(error, { domain: 'account', op: 'users.checkIn' });
        const status = Number(reqError?.status || 0);
        const code = String(reqError?.code || reqError?.details?.code || '').toUpperCase();
        if (status === 409 || code === 'CHECKIN_ALREADY_DONE') {
          const details = reqError?.details || {};
          return {
            ...details,
            code: 'CHECKIN_ALREADY_DONE',
            status: 'ALREADY_DONE',
            ok: true,
            alreadyDone: true,
            user: details.user ? normalizeProfilePayload(details.user) : undefined,
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
    exportData: async (id: string) => {
      // Support for LGPD Art. 18 data export
      return await request(`/users/me/export`, {
        purpose: 'lgpd-export',
      });
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
      } catch (err) {
        captureFrontendError(err, { domain: 'account', op: 'profiles.lookupByEmail' });
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
      } catch (err) {
        captureFrontendError(err, { domain: 'account', op: 'professionals.list' });
        return [];
      }
    },
    // TODO(backend): /professionals/:proId/notes e /professionals/access/:pid
    // nao existem no backend. Dead code — nenhuma view ativa chama estas funcoes.
    // Quando implementar: usar /records ou /links conforme o dominio correto.
    updateNotes: async (pid: string, proId: string, content: string) => {
      return await request(`/professionals/${proId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ patientId: pid, content }),
      });
    },
    getNotes: async (pid: string, proId: string) => {
      try {
        return await request(`/professionals/${proId}/notes/${pid}`);
      } catch (err) {
        captureFrontendError(err, { domain: 'account', op: 'professionals.getNotes' });
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
      } catch (err) {
        captureFrontendError(err, { domain: 'account', op: 'professionals.getFinanceSummary' });
        return { balance: 0, transactions: [] };
      }
    },
  },

  records: {
    list: async (patientId: string) => {
      try {
        return await request(`/records/${patientId}`);
      } catch (err) {
        captureFrontendError(err, { domain: 'account', op: 'records.list' });
        return [];
      }
    },
    create: async (record: Record<string, unknown>) => {
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
        const normalized = (Array.isArray(all) ? all : []).map((entry) => {
          const row = (entry && typeof entry === 'object') ? (entry as Record<string, unknown>) : {};
          return {
            id: String(row.id || ''),
            clientId: String(row.clientId || row.client_id || ''),
            clientName: String(row.clientName || row.client_name || ''),
            professionalId: String(row.professionalId || row.professional_id || ''),
            professionalName: String(row.professionalName || row.professional_name || ''),
            time: String(row.time || '00:00'),
            date: String(row.date || new Date().toISOString()),
            status: String(row.status || 'pending').toLowerCase(),
            serviceName: String(row.serviceName || row.service_name || 'Atendimento'),
            price: Number(row.price || 0),
          };
        }) as Appointment[];
        if (role === 'PROFESSIONAL') return normalized.filter((a: Appointment) => a.professionalId === uid);
        return normalized.filter((a: Appointment) => a.clientId === uid);
      } catch (err) {
        captureFrontendError(err, { domain: 'account', op: 'appointments.list' });
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

  series: {
    /** Preview upcoming occurrences + conflicts (no DB write). */
    preview: async (params: {
      guardianId: string;
      clientId: string;
      startAt: string;
      durationMin: number;
      timezone: string;
      freq: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
      byDay: string[];
      count?: number;
      until?: string;
    }) => {
      return await request('/appointments/series/preview', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },

    /** Create a series + all occurrences. */
    create: async (params: {
      guardianId: string;
      clientId: string;
      spaceId?: string;
      startAt: string;
      durationMin: number;
      timezone: string;
      freq: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
      byDay: string[];
      count?: number;
      until?: string;
      serviceName: string;
      price?: number;
      conflictStrategy?: 'skip' | 'fail';
    }) => {
      return await request('/appointments/series', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },

    /** Get series with all appointments. */
    get: async (seriesId: string) => {
      return await request(`/appointments/series/${seriesId}`);
    },

    /** Soft-cancel all future appointments in the series. */
    cancel: async (seriesId: string) => {
      return await request(`/appointments/series/${seriesId}`, {
        method: 'DELETE',
      });
    },
  },

  reviews: {
    list: async () => {
      try {
        return await request('/reviews');
      } catch (err) {
        captureFrontendError(err, { domain: 'account', op: 'reviews.list' });
        return [];
      }
    },
    create: async (review: Record<string, unknown>) => {
      // FLOW-05: Let errors propagate so UI can show feedback
      return await request('/reviews', {
        method: 'POST',
        body: JSON.stringify(review),
      });
    },
  },
});
