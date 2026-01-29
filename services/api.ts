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
        likePost: async (id: string) => true // Mock action
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
        draw: async (mood: string) => ({ card: MOCK_CARDS[Math.floor(Math.random() * MOCK_CARDS.length)] }),
        history: async () => []
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
            const defaults = period === 'morning' ? [
                { id: 'm1', title: 'Água com Limão', duration: 2, icon: 'Droplet', completed: false },
                { id: 'm2', title: 'Meditação Solar', duration: 10, icon: 'Sun', completed: false },
                { id: 'm3', title: 'Yoga Flow', duration: 15, icon: 'Activity', completed: false },
                { id: 'm4', title: 'Leitura Inspiradora', duration: 10, icon: 'BookOpen', completed: false }
            ] : [
                { id: 'n1', title: 'Desconexão Digital', duration: 5, icon: 'WifiOff', completed: false },
                { id: 'n2', title: 'Chá Calmante', duration: 10, icon: 'Coffee', completed: false },
                { id: 'n3', title: 'Gratidão do Dia', duration: 5, icon: 'Heart', completed: false },
                { id: 'n4', title: 'Leitura Leve', duration: 20, icon: 'Moon', completed: false }
            ];
            
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
                 // Existing mock logic kept for Metamorphosis checkin
                const entry = { 
                    id: Date.now(),
                    mood,
                    photoThumb: thumb,
                    quote: "A luz que você procura está dentro de você.",
                    ritual: ["Respire fundo 3 vezes"],
                    timestamp: new Date().toISOString()
                };
                const historyStr = localStorage.getItem('viva360.evolution_history') || '[]';
                const history = JSON.parse(historyStr);
                history.unshift(entry);
                localStorage.setItem('viva360.evolution_history', JSON.stringify(history.slice(0, 50)));
                return { entry };
        },
        getEvolution: async () => {
             const historyStr = localStorage.getItem('viva360.evolution_history');
             if (historyStr) return { entries: JSON.parse(historyStr) };
             return { entries: [] };
        }
    }
};
