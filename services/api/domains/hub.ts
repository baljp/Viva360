import type { DomainRequest } from './common';
import { captureFrontendError } from '../../../lib/frontendLogger';

type HubDomainDeps = {
  request: DomainRequest;
};

export const createHubDomain = ({ request }: HubDomainDeps) => ({
  recruitment: {
    listApplications: async (scope: 'candidate' | 'space' = 'candidate') => {
      return await request(`/recruitment/applications?scope=${scope}`);
    },
    apply: async (vacancyId: string, notes?: string) => {
      return await request('/recruitment/applications', {
        method: 'POST',
        body: JSON.stringify({ vacancyId, notes }),
      });
    },
    scheduleInterview: async (applicationId: string, payload: { scheduledFor: string; guardianId?: string }) => {
      return await request(`/recruitment/applications/${applicationId}/interview`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    respondInterview: async (interviewId: string, decision: 'ACCEPT' | 'DECLINE', note?: string) => {
      return await request(`/recruitment/interviews/${interviewId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ decision, note }),
      });
    },
    decideApplication: async (applicationId: string, decision: 'HIRED' | 'REJECTED', note?: string) => {
      return await request(`/recruitment/applications/${applicationId}/decision`, {
        method: 'POST',
        body: JSON.stringify({ decision, note }),
      });
    },
  },

  alchemy: {
    createOffer: async (payload: { requesterId: string; description?: string }) => {
      return await request('/alchemy/offers', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    listOffers: async () => {
      return await request('/alchemy/offers');
    },
    acceptOffer: async (offerId: string) => {
      return await request(`/alchemy/offers/${offerId}/accept`, { method: 'POST' });
    },
    rejectOffer: async (offerId: string) => {
      return await request(`/alchemy/offers/${offerId}/reject`, { method: 'POST' });
    },
    counterOffer: async (offerId: string, counterOffer: string) => {
      return await request(`/alchemy/offers/${offerId}/counter`, {
        method: 'POST',
        body: JSON.stringify({ counterOffer }),
      });
    },
    completeOffer: async (offerId: string) => {
      return await request(`/alchemy/offers/${offerId}/complete`, { method: 'POST' });
    },
  },

  spaces: {
    list: async () => {
      return request('/spaces');
    },
    getRooms: async () => {
      try {
        return await request('/rooms/real-time', { purpose: 'space-rooms' });
      } catch (err) {
        captureFrontendError(err, { domain: 'hub', op: 'spaces.getRooms' });
        return [];
      }
    },
    getTeam: async () => {
      try {
        const result = await request('/spaces/team', { purpose: 'space-team' });
        if (Array.isArray((result as any)?.team)) {
          const raw = (result as { team?: unknown[] }).team as unknown[];
          return raw.map((g) => {
            const row = (g && typeof g === 'object') ? (g as Record<string, unknown>) : {};
            const specialtyRaw = row.specialty;
            const specialty = Array.isArray(specialtyRaw)
              ? specialtyRaw
              : (typeof specialtyRaw === 'string' && specialtyRaw.trim() ? [specialtyRaw.trim()] : []);
            return {
              ...row,
              specialty,
              reviewCount: Number(row.reviewCount || row.review_count || 0),
              rating: Number(row.rating || 0),
              isOccupied: Boolean(row.isOccupied || false),
              roleLabel: Number(row.karma || 0) > 800 ? 'Mestre' : 'Guardião',
            };
          });
        }
        return await request('/profiles?role=PROFESSIONAL', { purpose: 'space-team-legacy' });
      } catch (err) {
        captureFrontendError(err, { domain: 'hub', op: 'spaces.getTeam' });
        return [];
      }
    },
    getPatients: async () => {
      try {
        const result = await request('/spaces/patients', { purpose: 'space-patients' });
        if (Array.isArray((result as { patients?: unknown[] })?.patients)) return (result as { patients: unknown[] }).patients;
        return [];
      } catch (err) {
        captureFrontendError(err, { domain: 'hub', op: 'spaces.getPatients' });
        return [];
      }
    },
    getPatient: async (patientId: string) => {
      try {
        return await request(`/spaces/patients/${patientId}`, { purpose: 'space-patient-detail' });
      } catch (err) {
        captureFrontendError(err, { domain: 'hub', op: 'spaces.getPatient' });
        return null;
      }
    },
    getVacancies: async (opts?: { strict?: boolean }) => {
      try {
        return await request('/rooms/vacancies', {
          purpose: 'space-vacancies',
          timeoutMs: 6000,
          retries: 0,
        });
      } catch (err) {
        captureFrontendError(err, { domain: 'hub', op: 'spaces.getVacancies' });
        if (opts?.strict) throw err;
        return [];
      }
    },
    createVacancy: async (vacancy: Record<string, unknown>) => {
      return await request('/rooms/vacancies', {
        method: 'POST',
        purpose: 'space-vacancy-create',
        body: JSON.stringify(vacancy),
      });
    },
    getTransactions: async () => {
      try {
        return await request('/finance/transactions', { purpose: 'space-transactions' });
      } catch (err) {
        captureFrontendError(err, { domain: 'hub', op: 'spaces.getTransactions' });
        return [];
      }
    },
    getProposals: async () => {
      try {
        return await request('/spaces/proposals');
      } catch (err) {
        captureFrontendError(err, { domain: 'hub', op: 'spaces.getProposals' });
        return [];
      }
    },
    voteProposal: async (id: string, vote: 'for' | 'against') => {
      return await request(`/spaces/proposals/${id}/vote`, {
        method: 'POST',
        body: JSON.stringify({ vote }),
      });
    },
    getEvents: async () => {
      try {
        return await request('/calendar', {
          purpose: 'space-events',
          timeoutMs: 6000,
          retries: 1,
        });
      } catch (err) {
        captureFrontendError(err, { domain: 'hub', op: 'spaces.getEvents' });
        return [];
      }
    },
    getEvent: async (eventId: string) => {
      try {
        return await request(`/calendar/${eventId}`, { purpose: 'space-event-detail', timeoutMs: 6000, retries: 1 });
      } catch (err) {
        captureFrontendError(err, { domain: 'hub', op: 'spaces.getEvent' });
        return null;
      }
    },
    createEvent: async (event: Record<string, unknown>) => {
      return await request('/calendar', {
        method: 'POST',
        purpose: 'space-events-create',
        body: JSON.stringify(event),
      });
    },
    updateEvent: async (eventId: string, patch: Record<string, unknown>) => {
      return await request(`/calendar/${eventId}`, {
        method: 'PATCH',
        purpose: 'space-events-update',
        body: JSON.stringify(patch),
      });
    },
    deleteEvent: async (eventId: string) => {
      return await request(`/calendar/${eventId}`, { method: 'DELETE', purpose: 'space-events-delete' });
    },
    syncCalendar: async () => {
      return await request('/calendar/sync', {
        purpose: 'space-events-sync',
        timeoutMs: 8000,
        retries: 1,
      });
    },
    getAnalytics: async () => request('/spaces/analytics'),
    getReviews: async () => request('/spaces/reviews'),
    getContract: async () => request('/spaces/contract'),
    createRoom: async (data: { name: string; type: string; capacity: number }) => {
      return request('/spaces/rooms', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateRoom: async (roomId: string, data: { name?: string; capacity?: number; status?: string; description?: string; imageBase64?: string }) => {
      return request(`/rooms/${roomId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    createInvite: async (data: { role: string; uses: number }) => {
      return request('/spaces/invites', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },
});
