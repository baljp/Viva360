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

import { MockDB } from './mock/mockDatabase';

// ... existing helper code ...

export const api = {
    // ... auth ...
    auth: {
        loginWithPassword: async (email: string, password: string): Promise<User> => {
             // Basic mock login leveraging MockDB could be added here, keeping existing simple mock for now
             const user = createMockUser(email); 
             return user;
        },
        // ...
        loginWithGoogle: async (role: UserRole = UserRole.CLIENT): Promise<User> => {
             const user = createMockUser(`google_${Date.now()}@gmail.com`, 'Usuário Google', role);
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
        checkIn: async (uid: string) => {
             // ... existing checkIn logic
             const user = MockDB.getUsers().find(u => u.id === uid);
             if (user) {
                 const updated = { ...user, karma: (user.karma || 0) + 50, lastCheckIn: new Date().toISOString() };
                 MockDB.updateUser(updated);
                 return { user: updated, reward: 50 };
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
            () => MockDB.getUsers().filter(u => u.role === UserRole.PROFESSIONAL) as Professional[]
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
    spaces: {
        getRooms: async (uid?: string) => [],
        getTeam: async (uid?: string) => [],
        getVacancies: async (uid?: string) => [], 
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
        draw: async (mood: string) => ({ card: MOCK_CARDS[Math.floor(Math.random() * MOCK_CARDS.length)] }),
        history: async () => []
    },
    rituals: {
        save: async (period: string, data: any) => true,
        get: async (period: string) => []
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
