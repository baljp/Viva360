type MockConsentStatus = 'ACTIVE' | 'REVOKED';

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

export type MockRecruitmentApplication = {
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

export type MockRecruitmentInterview = {
  id: string;
  application_id: string;
  space_id: string;
  guardian_id: string;
  scheduled_for: string;
  status: string;
  response_note?: string | null;
  responded_at?: string | null;
};

export type MockRecord = {
  id: string;
  patient_id: string;
  professional_id: string;
  content: string;
  type: 'anamnesis' | 'session';
  created_at: string;
  updated_at: string;
};

export type MockMarketplaceProduct = {
  id: string;
  name: string;
  price: number;
  category: string;
  type: string;
  image: unknown;
  description: unknown;
  owner_id: string;
  eventDate?: unknown;
  hostName?: unknown;
  spotsLeft?: number | null;
  karmaReward?: number | null;
  created_at: string;
};

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

export type MockEventEntry = {
  id: string;
  createdAt: string;
  userId: string;
  payload: Record<string, unknown>;
};

type MockGlobalStores = {
  alchemy: {
    offers: Map<string, MockSwapOffer>;
  };
  recruitment: {
    applications: Map<string, MockRecruitmentApplication>;
    interviews: Map<string, MockRecruitmentInterview>;
  };
  records: {
    consents: Map<string, MockConsentStatus>;
    records: Map<string, MockRecord>;
  };
  marketplace: {
    products: Map<string, MockMarketplaceProduct>;
  };
  reviews: {
    reviews: Map<string, MockReview>;
  };
  journal: {
    entriesByUser: Map<string, MockEventEntry[]>;
  };
  clinical: {
    interventionsByUser: Map<string, MockEventEntry[]>;
  };
};

type GlobalWithVivaMock = typeof globalThis & {
  __vivaMockStores?: MockGlobalStores;
};

const getStores = (): MockGlobalStores => {
  const g = globalThis as GlobalWithVivaMock;
  if (!g.__vivaMockStores) {
    g.__vivaMockStores = {
      alchemy: { offers: new Map() },
      recruitment: { applications: new Map(), interviews: new Map() },
      records: { consents: new Map(), records: new Map() },
      marketplace: { products: new Map() },
      reviews: { reviews: new Map() },
      journal: { entriesByUser: new Map() },
      clinical: { interventionsByUser: new Map() },
    };
  }
  return g.__vivaMockStores;
};

const nowIso = () => new Date().toISOString();
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const getUserEventBucket = (scope: 'journal' | 'clinical', userId: string) => {
  const stores = getStores();
  const map = scope === 'journal' ? stores.journal.entriesByUser : stores.clinical.interventionsByUser;
  const key = String(userId || 'mock-user');
  if (!map.has(key)) map.set(key, []);
  return map.get(key)!;
};

export const mockAdapter = {
  ids: {
    create: makeId,
  },
  alchemy: {
    createOffer(input: {
      providerId: string;
      requesterId: string;
      description: string;
    }): MockSwapOffer {
      const offer: MockSwapOffer = {
        id: makeId('mock-offer'),
        provider_id: String(input.providerId || 'mock-provider'),
        requester_id: String(input.requesterId || 'mock-requester'),
        description: String(input.description || ''),
        status: 'pending',
        counter_offer: null,
        accepted_at: null,
        completed_at: null,
      };
      getStores().alchemy.offers.set(offer.id, offer);
      return offer;
    },
    getOffer(id: string) {
      return getStores().alchemy.offers.get(id) || null;
    },
    saveOffer(offer: MockSwapOffer) {
      getStores().alchemy.offers.set(offer.id, offer);
      return offer;
    },
    listOffers() {
      return Array.from(getStores().alchemy.offers.values());
    },
  },
  recruitment: {
    createApplication(input: {
      vacancyId: string;
      candidateId: string;
      spaceId?: string;
      notes?: string | null;
    }): MockRecruitmentApplication {
      const application: MockRecruitmentApplication = {
        id: makeId('mock-app'),
        vacancy_id: String(input.vacancyId),
        candidate_id: String(input.candidateId || 'mock-candidate'),
        space_id: String(input.spaceId || 'mock-space'),
        notes: input.notes || null,
        status: 'APPLIED',
        created_at: nowIso(),
      };
      getStores().recruitment.applications.set(application.id, application);
      return application;
    },
    getApplication(id: string) {
      return getStores().recruitment.applications.get(id) || null;
    },
    saveApplication(application: MockRecruitmentApplication) {
      getStores().recruitment.applications.set(application.id, application);
      return application;
    },
    listApplications() {
      return Array.from(getStores().recruitment.applications.values());
    },
    createInterview(input: {
      applicationId: string;
      spaceId: string;
      guardianId: string;
      scheduledFor: string;
    }): MockRecruitmentInterview {
      const interview: MockRecruitmentInterview = {
        id: makeId('mock-int'),
        application_id: input.applicationId,
        space_id: input.spaceId,
        guardian_id: input.guardianId,
        scheduled_for: new Date(input.scheduledFor).toISOString(),
        status: 'PENDING_RESPONSE',
        response_note: null,
        responded_at: null,
      };
      getStores().recruitment.interviews.set(interview.id, interview);
      return interview;
    },
    getInterview(id: string) {
      return getStores().recruitment.interviews.get(id) || null;
    },
    saveInterview(interview: MockRecruitmentInterview) {
      getStores().recruitment.interviews.set(interview.id, interview);
      return interview;
    },
    listInterviews() {
      return Array.from(getStores().recruitment.interviews.values());
    },
  },
  records: {
    consentKey(patientId: string, professionalId: string) {
      return `${patientId}::${professionalId}`;
    },
    getConsent(patientId: string, professionalId: string): MockConsentStatus | undefined {
      return getStores().records.consents.get(`${patientId}::${professionalId}`);
    },
    setConsent(patientId: string, professionalId: string, status: MockConsentStatus) {
      getStores().records.consents.set(`${patientId}::${professionalId}`, status);
      return status;
    },
    createRecord(input: {
      patientId: string;
      professionalId: string;
      content: string;
      type: 'anamnesis' | 'session';
    }): MockRecord {
      const now = nowIso();
      const record: MockRecord = {
        id: makeId('mock-record'),
        patient_id: input.patientId,
        professional_id: input.professionalId,
        content: input.content,
        type: input.type,
        created_at: now,
        updated_at: now,
      };
      getStores().records.records.set(record.id, record);
      return record;
    },
    listRecords() {
      return Array.from(getStores().records.records.values());
    },
    saveRecord(record: MockRecord) {
      getStores().records.records.set(record.id, record);
      return record;
    },
  },
  marketplace: {
    createProduct(input: {
      ownerId: string;
      name?: unknown;
      price?: unknown;
      category?: unknown;
      type?: unknown;
      image?: unknown;
      description?: unknown;
      eventDate?: unknown;
      hostName?: unknown;
      spotsLeft?: unknown;
      karmaReward?: unknown;
    }): MockMarketplaceProduct {
      const product: MockMarketplaceProduct = {
        id: makeId('mock-product'),
        name: String(input.name || 'Produto Mock'),
        price: Number(typeof input.price === 'string' ? parseFloat(input.price) : input.price || 0),
        category: String(input.category || 'Healing'),
        type: String(input.type || 'service'),
        image: input.image ?? null,
        description: input.description ?? '',
        owner_id: String(input.ownerId || 'mock-owner'),
        eventDate: input.eventDate ?? null,
        hostName: input.hostName ?? null,
        spotsLeft: typeof input.spotsLeft === 'number' ? input.spotsLeft : null,
        karmaReward: typeof input.karmaReward === 'number' ? input.karmaReward : null,
        created_at: nowIso(),
      };
      getStores().marketplace.products.set(product.id, product);
      return product;
    },
    listProducts(filters?: { ownerId?: string; category?: string }) {
      const ownerId = String(filters?.ownerId || '').trim();
      const category = String(filters?.category || '').trim().toLowerCase();
      return Array.from(getStores().marketplace.products.values()).filter((product) => {
        if (ownerId && product.owner_id !== ownerId) return false;
        if (category && String(product.category || '').toLowerCase() !== category) return false;
        return true;
      });
    },
  },
  reviews: {
    createReview(input: {
      spaceId: string;
      targetId?: string | null;
      targetType: string;
      targetName?: string;
      authorName: string;
      rating: number;
      comment?: string;
    }): MockReview {
      const review: MockReview = {
        id: makeId('mock-review'),
        spaceId: String(input.spaceId || 'mock-space'),
        targetId: input.targetId ? String(input.targetId) : null,
        targetType: String(input.targetType || 'guardian'),
        targetName: String(input.targetName || ''),
        authorName: String(input.authorName || 'Anônimo'),
        rating: Number(input.rating || 0),
        comment: String(input.comment || ''),
        createdAt: nowIso(),
      };
      getStores().reviews.reviews.set(review.id, review);
      return review;
    },
    listBySpace(spaceId: string, targetType: string | 'all') {
      const normalizedType = String(targetType || 'all').toLowerCase();
      return Array.from(getStores().reviews.reviews.values())
        .filter((review) => review.spaceId === spaceId)
        .filter((review) => normalizedType === 'all' || review.targetType === normalizedType)
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    },
  },
  events: {
    create(scope: 'journal' | 'clinical', userId: string, payload: Record<string, unknown>) {
      const entry: MockEventEntry = {
        id: makeId(scope === 'journal' ? 'journal' : 'intervention'),
        createdAt: nowIso(),
        userId: String(userId || 'mock-user'),
        payload: copy(payload),
      };
      const bucket = getUserEventBucket(scope, entry.userId);
      bucket.unshift(entry);
      return entry;
    },
    list(scope: 'journal' | 'clinical', userId: string) {
      return [...getUserEventBucket(scope, String(userId || 'mock-user'))];
    },
  },
  checkout: {
    mockCheckoutResult(input: {
      userId: string;
      amount: number;
      description?: string;
      items?: Array<{ id?: string | number; price?: number | string; type?: string }>;
    }) {
      const total = input.items
        ? input.items.reduce((acc, item) => acc + Number(item.price || 0), 0)
        : Number(input.amount || 0);
      return {
        id: 'mock-tx-cart-id',
        user_id: String(input.userId || 'mock-sender'),
        type: 'expense',
        amount: total,
        description: input.description || `Checkout (${input.items?.length || 1} items)`,
        items: input.items || [],
        status: 'completed',
        fulfillment: input.items?.map((item) => ({ itemId: item.id, status: 'fulfilled', type: item.type })) || [],
        created_at: nowIso(),
      };
    },
  },
};

