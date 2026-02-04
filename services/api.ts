import { User, Professional, UserRole, Appointment, Product, Notification, SpaceRoom, Vacancy, Transaction, RecordAccess, Review, DailyJournalEntry } from '../types';
import { supabase, isMockMode as isSupabaseMock } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || '/api';

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
             if (!isSupabaseMock) {
                 const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                 if (error) throw error;
                 if (data.session) {
                     // Check if profile exists, if not maybe create? 
                     // For now, assume trigger handles profile or we fetch it.
                     const user = await api.auth.getCurrentSession();
                     if (!user) throw new Error('Session created but user not found.');
                     return user;
                 }
                 throw new Error('Login failed');
             }

             const user = createMockUser(email); 
             MockDB.updateUser(user);
             localStorage.setItem('viva360.mock_user', JSON.stringify(user));
             return user;
        },
        // ...
        loginWithGoogle: async (role: UserRole = UserRole.CLIENT): Promise<User> => {
             if (!isSupabaseMock) {
                 const { error } = await supabase.auth.signInWithOAuth({
                     provider: 'google',
                     options: {
                         redirectTo: window.location.origin,
                         queryParams: {
                             access_type: 'offline',
                             prompt: 'consent',
                         },
                         data: {
                             role: role // Pass the requested role to metadata
                         }
                     }
                 });
                 if (error) throw error;
                 // Will redirect, throw special error to handle UI state if needed
                 throw new Error('REDIRECTING_TO_GOOGLE');
             }

             const user = createMockUser(`google_${Date.now()}@gmail.com`, 'Usuário Google', role);
             MockDB.updateUser(user);
             localStorage.setItem('viva360.mock_user', JSON.stringify(user));
             return user;
        },
        register: async (data: any): Promise<User> => {
             if (!isSupabaseMock) {
                 const { data: authData, error } = await supabase.auth.signUp({
                     email: data.email,
                     password: data.password,
                     options: {
                         data: {
                             full_name: data.name,
                             role: data.role
                         }
                     }
                 });
                 
                 if (error) throw error;
                 
                 // If auto-confirm is on, we might be logged in. 
                 // If email confirm is required, this might return session null.
                 if (authData.user && !authData.session) {
                     // Email confirmation required logic could go here or just notify user
                     // For now, we return a temp user object or throw info
                 }
                 
                 const user = await api.auth.getCurrentSession();
                 if (!user) {
                     // Fallback for immediate UI update if session isn't immediate (e.g. email confirm)
                     return {
                         id: authData.user?.id || 'temp',
                         email: data.email,
                         name: data.name,
                         role: data.role,
                         avatar: '',
                         karma: 0,
                         streak: 0,
                         multiplier: 1,
                         personalBalance: 0,
                         corporateBalance: 0,
                         plantStage: 'seed',
                         plantXp: 0,
                         snaps: []
                     };
                 }
                 return user;
             }

             const user = createMockUser(data.email, data.name, data.role);
             MockDB.updateUser(user); // Persist new user
             return user;
        },
        getCurrentSession: async (): Promise<User | null> => {
            if (!isSupabaseMock) {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return null;
                
                // Return mapped user
                return {
                    id: session.user.id,
                    email: session.user.email || '',
                    name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Viajante',
                    role: (session.user.user_metadata.role as UserRole) || UserRole.CLIENT,
                    avatar: session.user.user_metadata.avatar_url || '',
                    karma: 0,
                    streak: 0,
                    multiplier: 1,
                    personalBalance: 0,
                    corporateBalance: 0,
                    plantStage: 'seed',
                    plantXp: 0,
                    snaps: []
                };
            }

            // Mock Session Logic
            const savedUser = localStorage.getItem('viva360.mock_user');
            if (savedUser) return JSON.parse(savedUser);
            return null;
        },
        logout: async () => {
            if (!isSupabaseMock) {
                await supabase.auth.signOut();
            }
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
            try {
                const all = await request('/appointments');
                if (role === UserRole.PROFESSIONAL) return all.filter((a: Appointment) => a.professionalId === uid);
                return all.filter((a: Appointment) => a.clientId === uid);
            } catch {
                return []; // Empty state instead of mock
            }
        },
        create: async (apt: Appointment) => {
            try {
                return await request('/appointments', {
                    method: 'POST',
                    body: JSON.stringify(apt)
                });
            } catch {
                return apt; // Return the input as fallback
            }
        }
    },
    reviews: {
        list: async () => [],
        create: async (r: any) => r
    },
    marketplace: {
        listAll: async (): Promise<Product[]> => {
            try {
                return await request('/marketplace/products');
            } catch {
                return []; // Empty marketplace
            }
        },
        listByOwner: async (oid: string) => {
            try {
                return await request(`/marketplace/products?owner=${oid}`);
            } catch {
                return [];
            }
        },
        create: async (p: any) => {
            try {
                return await request('/marketplace/products', {
                    method: 'POST',
                    body: JSON.stringify(p)
                });
            } catch {
                return { ...p, id: `prod_${Date.now()}` };
            }
        },
        delete: async (id: string) => {
            try {
                await request(`/marketplace/products/${id}`, { method: 'DELETE' });
                return true;
            } catch {
                return false;
            }
        }
    },

    notifications: {
        list: async (uid?: string) => {
            try {
                return await request('/notifications');
            } catch {
                return []; // Empty notifications
            }
        },
        markAsRead: async (id: string) => {
            try {
                await request(`/notifications/${id}/read`, { method: 'POST' });
                return true;
            } catch {
                return false;
            }
        },
        markAllAsRead: async (uid?: string) => {
            try {
                await request('/notifications/read-all', { method: 'POST' });
                return true;
            } catch {
                return false;
            }
        }
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
    links: {
        create: async (targetId: string, type: 'tribo' | 'paciente' | 'escambo' | 'equipe' | 'bazar') => {
            try {
                return await request('/links', {
                    method: 'POST',
                    body: JSON.stringify({ targetId, type })
                });
            } catch (e: any) {
                throw new Error(e.message || 'Failed to create link');
            }
        },
        accept: async (linkId: string) => {
            try {
                return await request(`/links/${linkId}/accept`, { method: 'POST' });
            } catch (e: any) {
                throw new Error(e.message || 'Failed to accept link');
            }
        },
        getMyLinks: async () => {
            try {
                return await request('/links/me');
            } catch {
                return [];
            }
        },
        getPendingRequests: async () => {
            try {
                return await request('/links/pending');
            } catch {
                return [];
            }
        },
        checkLink: async (targetId: string, type?: string) => {
            try {
                const params = type ? `?type=${type}` : '';
                const result = await request(`/links/check/${targetId}${params}`);
                return result.hasLink || false;
            } catch {
                return false;
            }
        },
        remove: async (linkId: string) => {
            try {
                await request(`/links/${linkId}`, { method: 'DELETE' });
                return true;
            } catch {
                return false;
            }
        }
    },
    chat: {
        listRooms: async () => {
            try {
                return await request('/chat/rooms');
            } catch {
                // Fallback to empty array
                return [];
            }
        },
        getMessages: async (roomId: string) => {
            try {
                return await request(`/chat/${roomId}/messages`);
            } catch {
                return [];
            }
        },
        sendMessage: async (roomId: string, content: string) => {
            try {
                return await request(`/chat/${roomId}/messages`, {
                    method: 'POST',
                    body: JSON.stringify({ content })
                });
            } catch {
                return false;
            }
        },
        getOrCreate: async (targetProfileId: string, type: 'private' | 'escambo' | 'agendamento' | 'bazar' = 'private') => {
            try {
                return await request('/chat/rooms', {
                    method: 'POST',
                    body: JSON.stringify({ targetProfileId, type })
                });
            } catch {
                return null;
            }
        },
        markAsRead: async (chatId: string) => {
            try {
                await request(`/chat/${chatId}/read`, { method: 'POST' });
                return true;
            } catch {
                return false;
            }
        },
        getUnreadCount: async () => {
            try {
                const result = await request('/chat/unread-count');
                return result.count || 0;
            } catch {
                return 0;
            }
        }
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
            try {
                return await request('/presence/online', { method: 'POST' });
            } catch {
                // Local fallback
                const user = await api.auth.getCurrentSession();
                if (!user || user.role !== 'PROFESSIONAL') return;
                const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
                return { status: 'ONLINE', lastActivity: new Date().toISOString(), expiresAt };
            }
        },
        goOffline: async () => {
            try {
                return await request('/presence/offline', { method: 'POST' });
            } catch {
                return { status: 'OFFLINE' };
            }
        },
        ping: async () => {
            try {
                return await request('/presence/ping', { method: 'POST' });
            } catch {
                return api.presence.goOnline();
            }
        },
        listActive: async () => {
            try {
                const result = await request('/presence');
                return result.online || [];
            } catch {
                return [];
            }
        },
        getStatus: async (guardianId: string) => {
            try {
                const result = await request(`/presence/${guardianId}`);
                return result.status || 'OFFLINE';
            } catch {
                return 'OFFLINE';
            }
        },
        getBatch: async (guardianIds: string[]) => {
            try {
                return await request('/presence/batch', {
                    method: 'POST',
                    body: JSON.stringify({ guardianIds })
                });
            } catch {
                const result: Record<string, string> = {};
                guardianIds.forEach(id => { result[id] = 'OFFLINE'; });
                return result;
            }
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
