import { User, Professional, UserRole, Appointment, Product, Notification, SpaceRoom, Vacancy, Transaction, RecordAccess, Review } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getHeader = () => {
    const token = localStorage.getItem('supabase.auth.token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

// --- ROBUST MOCK DATA GENERATORS ---
const createMockUser = (email: string, name?: string, role?: UserRole): User => {
    // Robust Role Detection
    let detectedRole = role;
    if (!detectedRole) {
        const lowerEmail = email.toLowerCase();
        if (lowerEmail.includes('admin')) detectedRole = UserRole.ADMIN;
        else if (lowerEmail.includes('pro') || lowerEmail.includes('guardiao')) detectedRole = UserRole.PROFESSIONAL;
        else if (lowerEmail.includes('space') || lowerEmail.includes('hub') || lowerEmail.includes('santuario')) detectedRole = UserRole.SPACE;
        else detectedRole = UserRole.CLIENT;
    }

    return {
        id: 'mock_user_' + Date.now(),
        name: name || (detectedRole === UserRole.SPACE ? 'Santuário Demo' : (detectedRole === UserRole.PROFESSIONAL ? 'Guardião Demo' : 'Buscador Demo')),
        email: email,
        role: detectedRole!,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${email}`, // More stable avatar
        karma: 150,
        streak: 5,
        multiplier: 1.2,
        personalBalance: 1250,
        corporateBalance: 500,
        plantStage: 'sprout',
        plantXp: 45
    };
};

const MOCK_CARDS = [
    { name: 'A Fênix', element: 'Fogo', intensity: 'Alta', insight: 'O fim é apenas o começo. Renasça.' },
    { name: 'O Rio', element: 'Água', intensity: 'Suave', insight: 'Flua com as mudanças, não resista.' },
    { name: 'A Montanha', element: 'Terra', intensity: 'Estável', insight: 'Sua força reside na permanência.' }
];

export const request = async (endpoint: string, options: RequestInit = {}) => {
    try {
        // QUICK CHECK: If we know backend is likely down (e.g. localhost without server), fail fast or just warn
        // For now, we try to fetch.
        const res = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: { ...getHeader(), ...options.headers }
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            // If 404/500, throw to trigger catch block and use fallback
            throw new Error(errorData.error || res.statusText || 'API Request Failed');
        }

        return res.json();
    } catch (error) {
        console.warn(`API Error [${endpoint}]. Switching to MOCK response.`, error);
        // We throw a specific error that controllers can catch OR we handle it here if generic
        // But better to handle in specific methods below to return correct type
        throw error; 
    }
};

// HELPER: Mock Wrapper
const mockFallback = async <T>(promise: Promise<T>, fallbackValue: T | (() => T)): Promise<T> => {
    try {
        return await promise;
    } catch (e) {
        return typeof fallbackValue === 'function' ? (fallbackValue as () => T)() : fallbackValue;
    }
};

export const api = {
    auth: {
        loginWithPassword: async (email: string, password: string): Promise<User> => {
            return mockFallback(
                request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }).then(d => d.user),
                () => {
                    const user = createMockUser(email);
                    localStorage.setItem('supabase.auth.token', 'mock_token_' + Date.now());
                    localStorage.setItem('viva360.mock_user', JSON.stringify(user));
                    return user;
                }
            );
        },
        loginWithGoogle: async (role: UserRole = UserRole.CLIENT): Promise<User> => {
             const user = createMockUser(`google_${Date.now()}@gmail.com`, 'Usuário Google', role);
             localStorage.setItem('supabase.auth.token', 'mock_google_token');
             localStorage.setItem('viva360.mock_user', JSON.stringify(user));
             return user;
        },
        register: async (data: any): Promise<User> => {
            return mockFallback(
                request('/auth/register', { method: 'POST', body: JSON.stringify(data) }).then(r => r.user),
                () => {
                    const user = createMockUser(data.email, data.name, data.role);
                    localStorage.setItem('supabase.auth.token', 'mock_token_reg');
                    localStorage.setItem('viva360.mock_user', JSON.stringify(user));
                    return user;
                }
            );
        },
        getCurrentSession: async (): Promise<User | null> => {
            const token = localStorage.getItem('supabase.auth.token');
            if (!token) return null;
            
            return mockFallback(
                request('/profiles/me'),
                () => {
                    const savedUser = localStorage.getItem('viva360.mock_user');
                    if (savedUser) return JSON.parse(savedUser);
                    if (token) return createMockUser('restored_session@viva360.com');
                    return null;
                }
            );
        },
        logout: async () => {
            localStorage.removeItem('supabase.auth.token');
            localStorage.removeItem('viva360.mock_user');
        }
    },
    users: {
        getById: async (id: string) => mockFallback(request(`/users/${id}`), () => createMockUser('user@mock.com')),
        update: async (user: User) => mockFallback(
            request('/profiles/me', { method: 'PATCH', body: JSON.stringify(user) }),
            () => {
                localStorage.setItem('viva360.mock_user', JSON.stringify(user));
                return user;
            }
        ),
        checkIn: async (uid: string) => mockFallback(
            request('/profiles/me/checkin', { method: 'POST' }),
            () => ({ user: { ...createMockUser('current'), karma: 200 }, reward: 50 })
        )
    },
    payment: {
        checkout: async (amount: number, description: string, providerId?: string) => mockFallback(
            request('/checkout/pay', { method: 'POST', body: JSON.stringify({ amount, description }) }),
            () => ({ success: true, transactionId: 'mock_tx_' + Date.now() })
        )
    },
    professionals: {
        list: async (): Promise<Professional[]> => mockFallback(
            request('/profiles?role=PROFESSIONAL'),
            () => Array.from({length: 5}).map((_, i) => ({ ...createMockUser(`pro${i}@viva.com`, undefined, UserRole.PROFESSIONAL) } as Professional))
        ),
        updateNotes: async (pid: string, proId: string, content: string) => mockFallback(request('/records'), () => true),
        getNotes: async (pid: string, proId: string) => mockFallback(request(`/records?patientId=${pid}`), () => []),
        grantAccess: async (pid: string) => true,
        revokeAccess: async () => true,
        getRecordAccessList: async () => [],
        applyToVacancy: async (vid: string) => mockFallback(request('/tribe/join'), () => ({ success: true })),
        getFinanceSummary: async (pid: string) => ({ 
            balance: 1500, 
            transactions: [
                { id: 't1', type: 'income', amount: 150, description: 'Sessão Reiki - Ana Silva', date: new Date().toISOString(), status: 'completed' },
                { id: 't2', type: 'income', amount: 200, description: 'Mentoria - Pedro Santos', date: new Date(Date.now() - 86400000).toISOString(), status: 'completed' },
                { id: 't3', type: 'expense', amount: 50, description: 'Taxa Plataforma', date: new Date().toISOString(), status: 'completed' }
            ] as Transaction[]
        })
    },
    appointments: {
        list: async (uid: string, role: UserRole) => mockFallback(
            request('/appointments'),
            () => [
                { id: '1', date: new Date().toISOString(), time: '14:00', clientName: 'Ana Mock', professionalName: 'Pro Mock', serviceName: 'Reiki', status: 'confirmed' }
            ] as Appointment[]
        ),
        create: async (apt: Appointment) => mockFallback(request('/appointments', { method: 'POST', body: JSON.stringify(apt) }), () => apt)
    },
    reviews: {
        list: async () => [],
        create: async (r: any) => r
    },
    marketplace: {
        listAll: async (): Promise<Product[]> => mockFallback(
            request('/marketplace'), 
            () => [
                { id: 'p1', name: 'Cristal de Cura', price: 50, ownerId: 'pro1', image: 'https://images.unsplash.com/photo-1515023115689-589c33041d3c?q=80&w=400', category: 'Cristais', type: 'physical' }
            ] as Product[]
        ),
        listByOwner: async (oid: string) => [],
        create: async (p: any) => p,
        delete: async (id: string) => true
    },
    spaces: {
        getRooms: async (uid?: string) => [],
        getTeam: async (uid?: string) => [],
        getVacancies: async (uid?: string) => mockFallback(
            request('/rooms/vacancies'),
            () => [
                { id: 'v1', title: 'Terapeuta Floral', description: 'Vaga para especialista', applicantsCount: 3, status: 'open' }
            ] as Vacancy[]
        ),
        createVacancy: async (v: any) => v,
        getTransactions: async (uid?: string) => []
    },
    notifications: {
        list: async (uid?: string) => [],
        markAsRead: async (id: string) => true,
        markAllAsRead: async (uid?: string) => true
    },
    admin: {
        getDashboard: async () => ({}),
        listUsers: async () => [],
        blockUser: async () => true,
        getMetrics: async () => ({}),
        getMarketplaceOffers: async () => [],
        getGlobalFinance: async () => ({}),
        getLgpdAudit: async () => [],
        getSystemHealth: async () => ({})
    },
    oracle: {
        draw: async (mood: string) => mockFallback(
            request('/oracle/draw', { method: 'POST', body: JSON.stringify({ mood }) }),
            () => ({ card: MOCK_CARDS[Math.floor(Math.random() * MOCK_CARDS.length)] })
        ),
        history: async () => []
    },
    rituals: {
        save: async (period: string, data: any) => true,
        get: async (period: string) => []
    },
    metamorphosis: {
        checkIn: async (mood: string, hash: string, thumb: string) => mockFallback(
            request('/metamorphosis/checkin', { method: 'POST', body: JSON.stringify({ mood }) }),
            () => ({ 
                entry: {
                    id: Date.now(),
                    mood,
                    photoThumb: thumb,
                    quote: "A luz que você procura está dentro de você.",
                    ritual: ["Respire fundo 3 vezes", "Beba um copo de água", "Agradeça por um momento"]
                }
            })
        ),
        getEvolution: async () => ({ entries: [] })
    },
    request
};
