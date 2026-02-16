import type { DomainRequest } from './common';

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
      } catch {
        return [];
      }
    },
    getTeam: async () => {
      try {
        return await request('/profiles?role=PROFESSIONAL', { purpose: 'space-team' });
      } catch {
        return [];
      }
    },
    getVacancies: async () => {
      try {
        return await request('/rooms/vacancies', { purpose: 'space-vacancies' });
      } catch {
        return [];
      }
    },
    createVacancy: async (vacancy: any) => {
      try {
        return await request('/rooms/vacancies', {
          method: 'POST',
          purpose: 'space-vacancy-create',
          body: JSON.stringify(vacancy),
        });
      } catch {
        return vacancy;
      }
    },
    getTransactions: async () => {
      try {
        return await request('/finance/transactions', { purpose: 'space-transactions' });
      } catch {
        return [];
      }
    },
    getProposals: async () => {
      try {
        return await request('/spaces/proposals');
      } catch {
        return [];
      }
    },
    voteProposal: async (id: string, vote: 'for' | 'against') => {
      try {
        return await request(`/spaces/proposals/${id}/vote`, {
          method: 'POST',
          body: JSON.stringify({ vote }),
        });
      } catch {
        return { success: true };
      }
    },
    getEvents: async () => {
      try {
        return await request('/calendar', {
          purpose: 'space-events',
          timeoutMs: 6000,
          retries: 1,
        });
      } catch {
        return [];
      }
    },
    createEvent: async (event: any) => {
      try {
        return await request('/calendar', {
          method: 'POST',
          purpose: 'space-events-create',
          body: JSON.stringify(event),
        });
      } catch {
        return { ...event, id: `evt_${Date.now()}` };
      }
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
    createInvite: async (data: { role: string; uses: number }) => {
      return request('/spaces/invites', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },
});
