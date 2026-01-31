import { User, Professional, UserRole, Appointment, Product, Notification, SpaceRoom, Vacancy, Transaction, RecordAccess, Review, DailyJournalEntry } from '../types';

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
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${email}`, 
        karma: 0, // Reset to 0
        streak: 0, // Reset to 0
        multiplier: 1.0, // Reset
        personalBalance: 0, // Reset
        corporateBalance: 0, // Reset
        plantStage: 'seed', // Start as seed
        plantXp: 0,
        snaps: [], // Empty history
        // friends: [], // Removed to fix lint error
        // notifications: [], // Removed to fix lint error
    };
};

const MOCK_CARDS = [
    { name: 'A Fênix', element: 'Fogo', intensity: 'Alta', insight: 'O fim é apenas o começo. Renasça das cinzas com glória.' },
    { name: 'O Rio', element: 'Água', intensity: 'Suave', insight: 'Flua com as mudanças, não resista à correnteza da vida.' },
    { name: 'A Montanha', element: 'Terra', intensity: 'Estável', insight: 'Sua força reside na permanência e na paciência inabalável.' },
    { name: 'O Vento', element: 'Ar', intensity: 'Rápida', insight: 'Novas ideias sopram em sua direção. Ouça o sussurro.' },
    { name: 'A Estrela', element: 'Éter', intensity: 'Divina', insight: 'Sua luz guia outros. Confie no seu brilho interior.' },
    { name: 'A Raiz', element: 'Terra', intensity: 'Profunda', insight: 'Fortaleça sua base antes de tentar alcançar o céu.' }
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

import { MockDB } from './mock/mockDatabase';

// ... existing helper code ...

export const api = {
    // ... auth ...
    auth: {
        loginWithPassword: async (email: string, password: string): Promise<User> => {
             const user = createMockUser(email); 
             MockDB.updateUser(user);
             localStorage.setItem('viva360.mock_user', JSON.stringify(user));
             return user;
        },
        // ...
        loginWithGoogle: async (role: UserRole = UserRole.CLIENT): Promise<User> => {
             const user = createMockUser(`google_${Date.now()}@gmail.com`, 'Usuário Google', role);
             MockDB.updateUser(user);
             localStorage.setItem('viva360.mock_user', JSON.stringify(user));
             return user;
        },
        register: async (data: any): Promise<User> => {
             const user = createMockUser(data.email, data.name, data.role);
             MockDB.updateUser(user); // Persist new user
             return user;
        },
        getCurrentSession: async (): Promise<User | null> => {
            // ... existing login logic (can store ID in localStorage and fetch from MockDB)
            const savedUser = localStorage.getItem('viva360.mock_user');
            if (savedUser) return JSON.parse(savedUser);
            return null;
        },
        logout: async () => {
            localStorage.removeItem('supabase.auth.token');
            localStorage.removeItem('viva360.mock_user');
        }
    },
    users: {
        getById: async (id: string) => mockFallback(request(`/users/${id}`), () => MockDB.getUsers().find(u => u.id === id) || createMockUser('user@mock.com')),
        update: async (user: User) => {
            MockDB.updateUser(user);
            localStorage.setItem('viva360.mock_user', JSON.stringify(user));
            return user;
        },
        checkIn: async (uid: string, reward: number = 50) => {
             // ... existing checkIn logic
             const user = MockDB.getUsers().find(u => u.id === uid);
             if (user) {
                 const updated = { ...user, karma: (user.karma || 0) + reward, lastCheckIn: new Date().toISOString() };
                 MockDB.updateUser(updated);
                 localStorage.setItem('viva360.mock_user', JSON.stringify(updated));
                 return { user: updated, reward };
             }
             return { user: null, reward: 0 };
        }
    },
    payment: {
        checkout: async (amount: number, description: string, providerId?: string) => {
             // Record transaction for Pro
             if (providerId) {
                 MockDB.addTransaction({
                     id: `tx_${Date.now()}`,
                     userId: providerId, // Owner
                     amount,
                     type: 'income',
                     description,
                     date: new Date().toISOString(),
                     status: 'completed'
                 });
             }
             return { success: true };
        }
    },
    professionals: {
        list: async (): Promise<Professional[]> => mockFallback(
            request('/profiles?role=PROFESSIONAL'),
            () => {
                const pros = MockDB.getUsers().filter(u => u.role === UserRole.PROFESSIONAL) as Professional[];
                // Enrich with mock reviews if empty
                return pros.map(p => ({
                    ...p,
                    specialty: p.specialty || ['Holística Integrativa', 'Reiki'],
                    rating: p.rating || 4.9,
                    reviewCount: p.reviewCount || 12,
                    reviews: [
                        { id: 'r1', authorName: 'Maria S.', authorAvatar: '', rating: 5, comment: 'Transformador! Recomendo muito.', date: '2023-10-15', tags: ['Gratidão'], authorId: 'm1', targetId: p.id },
                        { id: 'r2', authorName: 'João P.', authorAvatar: '', rating: 4.8, comment: 'Muita luz e sabedoria.', date: '2023-09-20', tags: ['Paz'], authorId: 'j1', targetId: p.id }
                    ]
                }));
            }
        ),
        updateNotes: async (pid: string, proId: string, content: string) => true,
        getNotes: async (pid: string, proId: string) => [], 
        grantAccess: async (pid: string) => true,
        revokeAccess: async () => true,
        getRecordAccessList: async () => [],
        applyToVacancy: async (vid: string) => ({ success: true }),
        getFinanceSummary: async (pid: string) => ({ 
            balance: MockDB.getUsers().find(u => u.id === pid)?.personalBalance || 1500,
            transactions: MockDB.getTransactions(pid)
        })
    },
    records: {
        list: async (patientId: string) => MockDB.getRecords(patientId),
        create: async (record: any) => MockDB.addRecord(record)
    },
    appointments: {
        list: async (uid: string, role: UserRole) => {
            const all = MockDB.getAppointments();
            if (role === UserRole.PROFESSIONAL) return all.filter(a => a.professionalId === uid);
            return all.filter(a => a.clientId === uid);
        },
        create: async (apt: Appointment) => MockDB.addAppointment(apt)
    },
    reviews: {
        list: async () => [],
        create: async (r: any) => r
    },
    marketplace: {
        listAll: async (): Promise<Product[]> => MockDB.getProducts(),
        listByOwner: async (oid: string) => MockDB.getProducts().filter(p => p.ownerId === oid),
        create: async (p: any) => MockDB.addProduct({ ...p, id: `prod_${Date.now()}` }),
        delete: async (id: string) => { MockDB.deleteProduct(id); return true; }
    },

    notifications: {
        list: async (uid?: string) => {
             // Mock notifications based on role
             const baseNotes: Notification[] = [
                 { id: 'n1', userId: uid || '', type: 'alert', title: 'Sessão Iniciando', message: 'Sua sessão de Reiki começa em 15 min.', timestamp: new Date().toISOString(), read: false, priority: 'high' }
             ];
             return baseNotes;
        },
        markAsRead: async (id: string) => true,
        markAllAsRead: async (uid?: string) => true
    },
    tribe: {
        listPosts: async () => MockDB.getPosts(),
        createPost: async (content: string, type: 'insight' | 'question' | 'celebration') => {
            const user = await api.auth.getCurrentSession();
            if (!user) throw new Error('Unauthorized');
            return MockDB.addPost({
                id: `pt_${Date.now()}`,
                authorId: user.id,
                authorName: user.name,
                authorAvatar: user.avatar,
                content,
                likes: 0,
                comments: 0,
                timestamp: new Date().toISOString(),
                type
            });
        },
        likePost: async (id: string) => true, // Mock action
        syncVibration: async (userId: string) => {
            const user = MockDB.getUsers().find(u => u.id === userId);
            if (user) {
                const reward = 10;
                const updated = { ...user, karma: (user.karma || 0) + reward };
                MockDB.updateUser(updated);
                localStorage.setItem('viva360.mock_user', JSON.stringify(updated));
                return { success: true, reward, globalVibration: 0.85 };
            }
            return { success: false };
        }
    },
    spaces: {
        getRooms: async (uid?: string) => MockDB.getRooms(),
        getTeam: async (uid?: string) => MockDB.getUsers().filter(u => u.role === UserRole.PROFESSIONAL).slice(0, 3) as any, // Mock basic team
        getVacancies: async (uid?: string) => [], 
        createVacancy: async (v: any) => v,
        getTransactions: async (uid?: string) => MockDB.getTransactions(uid || ''),
        
        // Governance
        getProposals: async () => MockDB.getProposals(),
        voteProposal: async (id: string, vote: 'for'|'against') => MockDB.voteProposal(id, vote),

        // Events
        getEvents: async () => MockDB.getEvents(),
        createEvent: async (evt: any) => MockDB.addEvent({ ...evt, id: `evt_${Date.now()}`, enrolled: 0, status: 'upcoming' })
    },
    admin: {
        getDashboard: async () => ({
            totalUsers: MockDB.getUsers().length,
            activeUsers: Math.floor(MockDB.getUsers().length * 0.8),
            revenue: MockDB.getTransactions('').reduce((acc, t) => acc + t.amount, 0),
            systemHealth: { status: 'healthy', uptime: 36000 } as any
        }),
        listUsers: async () => MockDB.getUsers(),
        blockUser: async () => true,
        getMetrics: async () => ({}),
        getMarketplaceOffers: async () => MockDB.getProducts(),
        getGlobalFinance: async () => ({}),
        getLgpdAudit: async () => [],
        getSystemHealth: async () => ({})
    },
    oracle: {
        draw: async (mood: string) => {
            const user = await api.auth.getCurrentSession();
            if (!user) throw new Error('Unauthorized');

            // Strategy: Check if already drawn today in MockDB
            const existing = MockDB.getDailyOracle(user.id);
            if (existing) return { card: existing };

            // Draw new
            const card = MOCK_CARDS[Math.floor(Math.random() * MOCK_CARDS.length)];
            MockDB.saveOracleDraw(user.id, card);
            return { card };
        },
        getToday: async () => {
             const user = await api.auth.getCurrentSession();
             if (!user) return null;
             const card = MockDB.getDailyOracle(user.id);
             return card ? { card } : null;
        },
        history: async () => {
             const user = await api.auth.getCurrentSession();
             if (!user) return [];
             return MockDB.getOracleHistory(user.id);
        }
    },
    chat: {
        listRooms: async () => {
             const user = await api.auth.getCurrentSession();
             if (!user) return [];
             return MockDB.getChatRooms(user.id);
        },
        getMessages: async (roomId: string) => [], // Mock messages for now, could expand to SEED_MESSAGES
        sendMessage: async (roomId: string, content: string) => true
    },
    rituals: {
        save: async (period: string, data: any) => true,
        get: async (period: string) => {
            // Updated to fallback to a Seeded default but essentially just check localStorage/DB
            // For now, simpler to leave the default list OR move it to DB. 
            // Let's keep the existing logic but recognize it's "MockDB compatible" 
            const defaults: any[] = [];
            
            const key = `viva360.rituals.${period}`;
            const saved = localStorage.getItem(key);
            if (saved) return JSON.parse(saved);
            return defaults;
        },
        toggle: async (period: string, id: string) => {
             const key = `viva360.rituals.${period}`;
             const currentStr = localStorage.getItem(key);
             let items = [];
             
             if (currentStr) {
                 items = JSON.parse(currentStr);
             } else {
                 items = await api.rituals.get(period);
             }
             
             const updated = items.map((i: any) => i.id === id ? { ...i, completed: !i.completed } : i);
             localStorage.setItem(key, JSON.stringify(updated));
             return updated;
        }
    },
    metamorphosis: {
        checkIn: async (mood: string, hash: string, thumb: string) => {
                 const user = await api.auth.getCurrentSession();
                 const entry = { 
                    id: Date.now(),
                    mood,
                    photoThumb: thumb,
                    image: thumb,
                    quote: "A luz que você procura está dentro de você.",
                    ritual: ["Respire fundo 3 vezes"],
                    timestamp: new Date().toISOString(),
                    date: new Date().toISOString(),
                    userId: user?.id
                };
                
                // Sync with user snaps for garden logic
                if (user) {
                    const snap = {
                        id: entry.id.toString(),
                        image: thumb,
                        date: entry.timestamp,
                        mood: mood as any,
                        note: entry.quote
                    };
                    const updatedUser = { ...user, snaps: [snap, ...(user.snaps || [])] };
                    MockDB.updateUser(updatedUser);
                    localStorage.setItem('viva360.mock_user', JSON.stringify(updatedUser));
                }

                return MockDB.addEvolutionEntry(entry);
        },
        getEvolution: async () => {
             const user = await api.auth.getCurrentSession();
             const history = MockDB.getEvolutionHistory();
             
             // If we have user-specific snaps, merge or prioritize them?
             // For simplicity, we just return the full history, but we could filter by user.id
             return { entries: history };
        }
    },
    journal: {
        create: async (entry: Omit<DailyJournalEntry, 'id' | 'createdAt' | 'userId'>) => {
            const user = await api.auth.getCurrentSession();
            if (!user) throw new Error('Unauthorized');
            
            const newEntry: DailyJournalEntry = {
                id: `jnl_${Date.now()}`,
                userId: user.id,
                createdAt: new Date().toISOString(),
                ...entry
            };

            // Persist to LocalStorage (Mock)
            const key = `viva360.journal.${user.id}`;
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            const updated = [newEntry, ...existing];
            localStorage.setItem(key, JSON.stringify(updated));

            return newEntry;
        },
        list: async () => {
             const user = await api.auth.getCurrentSession();
             if (!user) return [];
             const key = `viva360.journal.${user.id}`;
             return JSON.parse(localStorage.getItem(key) || '[]') as DailyJournalEntry[];
        },
        getStats: async () => {
             const user = await api.auth.getCurrentSession();
             if (!user) return null;
             const key = `viva360.journal.${user.id}`;
             const entries = JSON.parse(localStorage.getItem(key) || '[]') as DailyJournalEntry[];
             
             // Simple Stats
             return {
                 totalEntries: entries.length,
                 streak: 0, // Todo: calc streak
                 commonWords: [] // Todo: NLP
             };
        }
    },
    presence: {
        goOnline: async () => {
             const user = await api.auth.getCurrentSession();
             if (!user || user.role !== 'PROFESSIONAL') return;
             
             const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
             const list = JSON.parse(localStorage.getItem('viva360.presence') || '{}');
             list[user.id] = { status: 'ONLINE', lastActivity: new Date().toISOString(), expiresAt };
             
             localStorage.setItem('viva360.presence', JSON.stringify(list));
             
             // Update User Object in Session too
             const updatedUser = { ...user, presence: { status: 'ONLINE', lastActivity: new Date().toISOString(), expiresAt } };
             localStorage.setItem('viva360.mock_user', JSON.stringify(updatedUser)); // Sync
             return list[user.id];
        },
        goOffline: async () => {
             const user = await api.auth.getCurrentSession();
             if (!user) return;
             
             const list = JSON.parse(localStorage.getItem('viva360.presence') || '{}');
             if (list[user.id]) {
                 list[user.id].status = 'OFFLINE';
                 localStorage.setItem('viva360.presence', JSON.stringify(list));
                 
                 const updatedUser = { ...user, presence: { status: 'OFFLINE', lastActivity: new Date().toISOString(), expiresAt: new Date().toISOString() } };
                 localStorage.setItem('viva360.mock_user', JSON.stringify(updatedUser));
             }
        },
        ping: async () => {
             // Extending session
             return api.presence.goOnline();
        },
        listActive: async () => {
             const list = JSON.parse(localStorage.getItem('viva360.presence') || '{}');
             const now = new Date().getTime();
             const active: Record<string, any> = {};
             
             Object.entries(list).forEach(([id, data]: [string, any]) => {
                 if (data.status === 'ONLINE' && new Date(data.expiresAt).getTime() > now) {
                     active[id] = data;
                 }
             });
             return active;
        }
    },
    clinical: {
        saveIntervention: async (data: any) => {
            const key = 'viva360.interventions';
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            const updated = [{ ...data, id: Date.now() }, ...existing];
            localStorage.setItem(key, JSON.stringify(updated));
            return updated[0];
        },
        listInterventions: async () => {
            const key = 'viva360.interventions';
            return JSON.parse(localStorage.getItem(key) || '[]');
        }
    },
    audit: {
        listLogs: async () => {
             // Mock logs for space
             return [
                { id: 1, action: 'Edição de Contrato', user: 'Admin Santuário', target: 'Mestre Carlos', date: 'Hoje, 10:24', type: 'contract', severity: 'medium' },
                { id: 2, action: 'Criação de Altar', user: 'Gestor Espaço', target: 'Sala Gaia', date: 'Hoje, 09:15', type: 'room', severity: 'low' },
                { id: 3, action: 'Alteração de Repasse', user: 'Financeiro', target: 'Taxa de Manutenção', date: 'Ontem, 16:45', type: 'finance', severity: 'high' }
             ];
        }
    }
};
