/**
 * MockAdapter — ponto único de toda a lógica mock do backend.
 *
 * Regra arquitetural: controllers e serviços importam APENAS deste módulo
 * para tudo relacionado a mock — stores, factories, guards e o flag isMockMode.
 * Nenhum arquivo de produção deve importar de supabase.service diretamente
 * para checar o modo mock.
 *
 * Importar (um único import por controller):
 *   import { isMockMode, mockAdapter } from '../services/mockAdapter';
 *
 * Uso:
 *   if (isMockMode()) { const offer = mockAdapter.alchemy.offers.get(id); }
 */

// ─── Re-export: flag de modo mock (single source of truth para controllers) ──
// Fonte: lib/appMode — feature flag central do backend
export { isMockMode } from '../lib/appMode';

// ─── Unique ID factory ────────────────────────────────────────────────────────

export const mockId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// ─── TYPE DEFINITIONS ─────────────────────────────────────────────────────────

export type MockSwapOffer = {
  id: string;
  provider_id: string;
  requester_id: string;
  description: string;
  status: string;
  counter_offer?: string | null;
  accepted_at?: string | null;
  completed_at?: string | null;
};

export type MockConsentStatus = 'ACTIVE' | 'REVOKED';

export type MockRecord = {
  id: string;
  patient_id: string;
  professional_id: string;
  content: string;
  type: 'anamnesis' | 'session';
  created_at: string;
  updated_at: string;
};

export type MockApplication = {
  id: string;
  vacancy_id: string;
  candidate_id: string;
  space_id: string;
  notes: string | null;
  status: string;
  created_at: string;
  decided_at?: string | null;
  decided_by?: string | null;
};

export type MockInterview = {
  id: string;
  application_id: string;
  space_id: string;
  guardian_id: string;
  scheduled_for: string;
  status: string;
  response_note?: string | null;
  responded_at?: string | null;
};

// ─── STORE INITIALISATION ────────────────────────────────────────────────────
// Kept on globalThis so state survives hot-reloads in dev without resetting.

export type MockReview = {
  id: string;
  spaceId: string;
  targetId: string | null;
  targetType: string;
  targetName: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type MockMarketplaceProduct = {
  id: string;
  name: string;
  price: number;
  category: string;
  type: string;
  image: string | null;
  description: string;
  owner_id: string;
  created_at: string;
};

export type MockRoom = {
  id: string;
  name: string;
  type: string;
  capacity: number;
  hub_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  current_occupant: string | null;
};

export type MockMetamorphosisEntry = {
  id: string;
  userId: string;
  timestamp: string;
  mood: string;
  photoHash?: string | null;
  photoThumb?: string | null;
  quote?: string | null;
  reflection?: string | null;
};

export type MockClinicalIntervention = {
  id: string;
  stream_id: string;
  payload: Record<string, unknown>;
  created_at: string;
};

export type MockFinanceTransaction = {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  date: string;
};

export type MockProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  active_role: string;
  avatar: string;
  bio?: string | null;
  location?: string | null;
  specialty?: string[] | null;
  personal_balance: number;
  corporate_balance: number;
  karma: number;
  streak: number;
  multiplier: number;
  dailyQuests?: unknown[];
  achievements?: unknown[];
};

export type MockTribeInvite = {
  id: string;
  hub_id: string;
  email: string;
  status: string;
  created_at: string;
};

export type MockTribeMember = {
  id: string;
  hub_id: string;
  role: string;
  name: string;
};

type MockAdapterStores = {
  alchemy: {
    offers: Map<string, MockSwapOffer>;
  };
  records: {
    records: Map<string, MockRecord>;
    consents: Map<string, MockConsentStatus>;
  };
  recruitment: {
    applications: Map<string, MockApplication>;
    interviews: Map<string, MockInterview>;
  };
  reviews: {
    listBySpace: (spaceId: string, type: string) => MockReview[];
    items: Map<string, MockReview>;
  };
  marketplace: {
    products: Map<string, MockMarketplaceProduct>;
  };
  spaces: {
    rooms: Map<string, MockRoom>;
  };
  metamorphosis: {
    entries: Map<string, MockMetamorphosisEntry>;
  };
  clinical: {
    interventions: Map<string, MockClinicalIntervention>;
  };
  finance: {
    transactions: Map<string, MockFinanceTransaction>;
  };
  profiles: Map<string, MockProfile>;
  tribe: {
    invites: Map<string, MockTribeInvite>;
    members: Map<string, MockTribeMember>;
  };
};

declare const globalThis: typeof global & { __vivaMockAdapter?: MockAdapterStores };

if (!globalThis.__vivaMockAdapter) {
  globalThis.__vivaMockAdapter = {
    alchemy: {
      offers: new Map<string, MockSwapOffer>(),
    },
    records: {
      records: new Map<string, MockRecord>(),
      consents: new Map<string, MockConsentStatus>(),
    },
    recruitment: {
      applications: new Map<string, MockApplication>(),
      interviews: new Map<string, MockInterview>(),
    },
    reviews: {
      items: new Map<string, MockReview>(),
      listBySpace(spaceId: string, type: string): MockReview[] {
        return [...this.items.values()].filter(
          (r) => r.spaceId === spaceId && (type === 'all' || r.targetType === type)
        );
      },
    },
    marketplace: {
      products: new Map<string, MockMarketplaceProduct>(),
    },
    spaces: {
      rooms: new Map<string, MockRoom>(),
    },
    metamorphosis: {
      entries: new Map<string, MockMetamorphosisEntry>(),
    },
    clinical: {
      interventions: new Map<string, MockClinicalIntervention>(),
    },
    finance: {
      transactions: new Map<string, MockFinanceTransaction>(),
    },
    profiles: new Map<string, MockProfile>([
      ['11111111-1111-4111-8111-111111111111', {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Buscador Teste',
        email: 'client0@viva360.com',
        role: 'CLIENT',
        active_role: 'CLIENT',
        avatar: '',
        bio: '',
        location: '',
        specialty: [],
        personal_balance: 1200,
        corporate_balance: 0,
        karma: 100,
        streak: 3,
        multiplier: 1,
      }],
      ['22222222-2222-4222-8222-222222222222', {
        id: '22222222-2222-4222-8222-222222222222',
        name: 'Guardião Teste',
        email: 'pro0@viva360.com',
        role: 'PROFESSIONAL',
        active_role: 'PROFESSIONAL',
        avatar: '',
        bio: '',
        location: '',
        specialty: ['Reiki'],
        personal_balance: 1800,
        corporate_balance: 0,
        karma: 250,
        streak: 6,
        multiplier: 1,
      }],
      ['33333333-3333-4333-8333-333333333333', {
        id: '33333333-3333-4333-8333-333333333333',
        name: 'Santuário Teste',
        email: 'space0@viva360.com',
        role: 'SPACE',
        active_role: 'SPACE',
        avatar: '',
        bio: '',
        location: '',
        specialty: [],
        personal_balance: 0,
        corporate_balance: 3200,
        karma: 400,
        streak: 10,
        multiplier: 1,
      }],
    ]),
    tribe: {
      invites: new Map<string, MockTribeInvite>(),
      members: new Map<string, MockTribeMember>(),
    },
  };
}

export const mockAdapter: MockAdapterStores = globalThis.__vivaMockAdapter;

// ─── FACTORY HELPERS ──────────────────────────────────────────────────────────

export const makeMockSwapOffer = (
  params: Pick<MockSwapOffer, 'provider_id' | 'requester_id' | 'description'>,
): MockSwapOffer => ({
  id: mockId('mock-offer'),
  provider_id: params.provider_id,
  requester_id: params.requester_id,
  description: params.description,
  status: 'pending',
  counter_offer: null,
  accepted_at: null,
  completed_at: null,
});

export const makeMockApplication = (
  params: Pick<MockApplication, 'vacancy_id' | 'candidate_id' | 'space_id'> & { notes?: string | null },
): MockApplication => ({
  id: mockId('mock-app'),
  vacancy_id: params.vacancy_id,
  candidate_id: params.candidate_id,
  space_id: params.space_id,
  notes: params.notes ?? null,
  status: 'APPLIED',
  created_at: new Date().toISOString(),
});

export const makeMockInterview = (
  params: Pick<MockInterview, 'application_id' | 'space_id' | 'guardian_id' | 'scheduled_for'>,
): MockInterview => ({
  id: mockId('mock-int'),
  application_id: params.application_id,
  space_id: params.space_id,
  guardian_id: params.guardian_id,
  scheduled_for: params.scheduled_for,
  status: 'PENDING_RESPONSE',
  response_note: null,
  responded_at: null,
});

export const makeMockRecord = (
  params: Pick<MockRecord, 'patient_id' | 'professional_id' | 'content'> & { type?: 'anamnesis' | 'session' },
): MockRecord => ({
  id: mockId('mock-rec'),
  patient_id: params.patient_id,
  professional_id: params.professional_id,
  content: params.content,
  type: params.type ?? 'session',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

// ─── INLINE MOCK RESPONSE HELPERS ─────────────────────────────────────────────
// Para controllers simples (clinical, journal) que apenas retornam um objeto
// sem precisar de store persistido entre requests.

export const mockEventResponse = (
  prefix: string,
  userId: string | undefined,
  payload: Record<string, unknown>,
) => ({
  id: mockId(prefix),
  createdAt: new Date().toISOString(),
  userId,
  ...payload,
});

export const mockProductResponse = (
  params: {
    name?: string;
    price?: number | string;
    category?: string;
    type?: string;
    image?: string | null;
    description?: string;
    ownerId?: string;
    eventDate?: string | null;
    hostName?: string | null;
    spotsLeft?: number | null;
    karmaReward?: number | null;
  },
) => ({
  id: mockId('mock-product'),
  name: String(params.name || 'Produto Mock'),
  price: Number(typeof params.price === 'string' ? parseFloat(params.price) : params.price || 0),
  category: String(params.category || 'Healing'),
  type: String(params.type || 'service'),
  image: params.image ?? null,
  description: params.description || '',
  owner_id: String(params.ownerId || 'mock-owner'),
  eventDate: params.eventDate ?? null,
  hostName: params.hostName ?? null,
  spotsLeft: typeof params.spotsLeft === 'number' ? params.spotsLeft : null,
  karmaReward: typeof params.karmaReward === 'number' ? params.karmaReward : null,
  created_at: new Date().toISOString(),
});

export type CheckoutItem = { id: string; price?: number; type?: string };

export const mockCheckoutResult = (params: {
  userId?: string;
  amount: number;
  description?: string;
  items?: CheckoutItem[];
}) => ({
  id: mockId('mock-tx'),
  user_id: params.userId || 'mock-sender',
  type: 'expense' as const,
  amount: params.amount,
  description: params.description || `Checkout (${params.items?.length ?? 1} items)`,
  items: params.items ?? [],
  status: 'completed' as const,
  fulfillment: (params.items ?? []).map((i) => ({ itemId: i.id, status: 'fulfilled', type: i.type })),
  created_at: new Date().toISOString(),
});

export const mockReviewResponse = (params: {
  spaceId: string;
  targetId?: string | null;
  targetType?: string;
  targetName?: string;
  authorName?: string;
  rating: number;
  comment?: string;
}) => ({
  id: mockId('mock-review'),
  spaceId: params.spaceId,
  targetId: params.targetId ?? null,
  targetType: params.targetType ?? 'guardian',
  targetName: params.targetName ?? '',
  authorName: params.authorName ?? 'Anônimo',
  rating: params.rating,
  comment: params.comment ?? '',
  createdAt: new Date().toISOString(),
});

export const saveMockMarketplaceProduct = (product: MockMarketplaceProduct) => {
  mockAdapter.marketplace.products.set(product.id, product);
  return product;
};

export const listMockMarketplaceProducts = (ownerId?: string, category?: string) => {
  const normalizedOwnerId = ownerId ? String(ownerId) : '';
  const normalizedCategory = category ? String(category).toLowerCase() : '';
  return [...mockAdapter.marketplace.products.values()].filter((product) => {
    if (normalizedOwnerId && String(product.owner_id) !== normalizedOwnerId) return false;
    if (normalizedCategory && String(product.category || '').toLowerCase() !== normalizedCategory) return false;
    return true;
  });
};

export const saveMockRoom = (room: MockRoom) => {
  mockAdapter.spaces.rooms.set(room.id, room);
  return room;
};

export const listMockRoomsByHub = (hubId: string) =>
  [...mockAdapter.spaces.rooms.values()].filter((room) => String(room.hub_id) === String(hubId));

export const saveMockMetamorphosisEntry = (entry: MockMetamorphosisEntry) => {
  mockAdapter.metamorphosis.entries.set(entry.id, entry);
  return entry;
};

export const listMockMetamorphosisEntries = (userId: string) =>
  [...mockAdapter.metamorphosis.entries.values()]
    .filter((entry) => String(entry.userId) === String(userId))
    .sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1));

export const saveMockClinicalIntervention = (entry: MockClinicalIntervention) => {
  mockAdapter.clinical.interventions.set(entry.id, entry);
  return entry;
};

export const listMockClinicalInterventions = (streamId: string) =>
  [...mockAdapter.clinical.interventions.values()]
    .filter((entry) => String(entry.stream_id) === String(streamId))
    .sort((a, b) => (a.created_at > b.created_at ? -1 : 1));

export const saveMockFinanceTransaction = (tx: MockFinanceTransaction) => {
  mockAdapter.finance.transactions.set(tx.id, tx);
  return tx;
};

export const listMockFinanceTransactions = (userId: string) =>
  [...mockAdapter.finance.transactions.values()]
    .filter((tx) => String(tx.user_id) === String(userId))
    .sort((a, b) => (a.date > b.date ? -1 : 1));

export const getMockProfile = (userId: string) =>
  mockAdapter.profiles.get(String(userId)) || null;

export const saveMockProfile = (profile: MockProfile) => {
  mockAdapter.profiles.set(String(profile.id), profile);
  return profile;
};
