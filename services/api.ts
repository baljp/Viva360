
import { User, Professional, UserRole, Appointment, Product, Notification, SpaceRoom, Vacancy, Transaction, RecordAccess, Review, DailyRitualSnap } from '../types';
import { supabase, isMockMode } from '../lib/supabase';
import { Database } from '../utils/seedEngine';

class MemoryDB {
    users: User[];
    appointments: Appointment[];
    products: Product[];
    notifications: Notification[];
    transactions: Transaction[];
    vacancies: Vacancy[];
    rooms: SpaceRoom[];
    recordAccesses: RecordAccess[];
    patientNotes: Record<string, string>; 
    reviews: Review[];

    constructor() {
        this.users = [...Database.clients, ...Database.pros, ...Database.spaces] as User[];
        
        const today = new Date().toISOString().split('T')[0];
        this.appointments = [
            { id: 'a1', clientId: 'client_0', clientName: 'Ana Luz', professionalId: 'pro_0', professionalName: 'Mestre Sol', date: today, time: '14:00', status: 'confirmed', serviceName: 'Reiki Nível 1', price: 150 },
            { id: 'a2', clientId: 'client_1', clientName: 'João Paz', professionalId: 'pro_0', professionalName: 'Mestre Sol', date: today, time: '16:00', status: 'confirmed', serviceName: 'Mentoria Holística', price: 200 },
            { id: 'a3', clientId: 'client_2', clientName: 'Carla Zen', professionalId: 'pro_0', professionalName: 'Mestre Sol', date: '2024-05-20', time: '09:00', status: 'completed', serviceName: 'Yoga Particular', price: 120 }
        ];

        this.products = Database.getProducts('any');
        this.notifications = Database.getNotifications('client_0', UserRole.CLIENT);
        
        this.transactions = [
            { id: 'tx1', userId: 'pro_0', type: 'income', amount: 150, description: 'Venda Bazar: Cristal Ametista', date: new Date().toISOString(), status: 'completed' },
            { id: 'tx2', userId: 'pro_0', type: 'income', amount: 350, description: 'Venda Bazar: Workshop Respiração', date: new Date().toISOString(), status: 'completed' },
            { id: 'tx3', userId: 'hub_0', type: 'income', amount: 1200, description: 'Repasse Aluguel: Sala Cristal', date: new Date().toISOString(), status: 'completed' }
        ];

        this.vacancies = Database.getVacancies(1);
        this.reviews = [
            { id: 'rev1', targetId: 'pro_0', authorId: 'client_1', authorName: 'Maria Silva', authorAvatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=client_1', rating: 5, comment: 'Incrível! Me senti muito acolhida.', date: '2024-05-15', tags: ['Acolhedor', 'Profissional'] }
        ];

        this.rooms = [
            { id: 'r1', name: 'Altar do Sol', status: 'available', generatedRevenue: 450, nextSession: '15:00' }, 
            { id: 'r2', name: 'Sala de Cristal', status: 'occupied', currentOccupant: 'Mestre Klaus', generatedRevenue: 900, nextSession: '16:30' },
            { id: 'r3', name: 'Jardim Zen', status: 'available', generatedRevenue: 120, nextSession: '14:00' }
        ];

        this.recordAccesses = [];
        this.patientNotes = {
            'client_0_pro_0': 'Paciente apresenta bloqueio no chakra cardíaco. Recomendado foco em respiração e cristais verdes.'
        };
    }

    getUser(id: string) { return this.users.find(u => u.id === id); }
    updateUser(updatedUser: User) {
        const index = this.users.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) { 
            this.users[index] = { ...this.users[index], ...updatedUser }; 
            return { ...this.users[index] }; 
        }
        return { ...updatedUser };
    }
}

const mockDB = new MemoryDB();
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
    auth: {
        loginWithPassword: async (email: string, password: string): Promise<User> => {
            await delay(800);
            let user = mockDB.users.find(u => u.email === email);
            if (!user) {
                if (email.includes('pro')) user = mockDB.users.find(u => u.role === UserRole.PROFESSIONAL);
                else if (email.includes('hub')) user = mockDB.users.find(u => u.role === UserRole.SPACE);
                else user = mockDB.users.find(u => u.role === UserRole.CLIENT);
            }
            return { ...user } as User;
        },
        loginWithGoogle: async (role: UserRole = UserRole.CLIENT): Promise<User> => {
            await delay(1000);
            const user = mockDB.users.find(u => u.role === role);
            return { ...user, id: `google_${Date.now()}` } as User;
        },
        register: async (data: any): Promise<User> => {
            await delay(1000);
            const newUser = { id: `u_${Date.now()}`, ...data, karma: 100, personalBalance: 1000, plantXp: 0, plantStage: 'seed', snaps: [] } as User;
            mockDB.users.push(newUser);
            return { ...newUser };
        },
        getCurrentSession: async (): Promise<User | null> => null
    },
    users: {
        getById: async (id: string) => {
            const user = mockDB.getUser(id);
            return user ? { ...user } : null;
        },
        update: async (user: User) => mockDB.updateUser(user),
        checkIn: async (uid: string) => {
            await delay(400);
            const user = mockDB.getUser(uid);
            if (user) {
                const today = new Date().toISOString().split('T')[0];
                const reward = 50 * (user.multiplier || 1);
                user.karma = (user.karma || 0) + reward;
                user.lastCheckIn = today;
                return { user: { ...user }, reward };
            }
            return { user: null, reward: 0 };
        }
    },
    payment: {
        checkout: async (amount: number, description: string, providerId?: string) => {
            await delay(1000);
            return { success: true };
        }
    },
    professionals: {
        list: async (): Promise<Professional[]> => mockDB.users.filter(u => u.role === UserRole.PROFESSIONAL) as unknown as Professional[],
        updateNotes: async (patientId: string, proId: string, content: string) => { mockDB.patientNotes[`${patientId}_${proId}`] = content; return true; },
        getNotes: async (patientId: string, proId: string) => mockDB.patientNotes[`${patientId}_${proId}`] || "",
        grantAccess: async (patientId: string, ownerProId: string, targetProId: string, targetProName: string, targetProAvatar: string) => {
            const newAccess: RecordAccess = { id: `acc_${Date.now()}`, patientId, ownerProId, grantedToProId: targetProId, grantedToProName: targetProName, grantedToProAvatar: targetProAvatar, permissions: 'read', status: 'active', grantedAt: new Date().toISOString(), consentHash: 'mock' };
            mockDB.recordAccesses.push(newAccess);
            return newAccess;
        },
        revokeAccess: async (accessId: string) => { const acc = mockDB.recordAccesses.find(a => a.id === accessId); if (acc) acc.status = 'revoked'; return true; },
        getRecordAccessList: async (patientId: string, ownerProId: string) => mockDB.recordAccesses.filter(a => a.patientId === patientId && a.ownerProId === ownerProId && a.status === 'active'),
        applyToVacancy: async (vacancyId: string, proId: string) => true,
        getFinanceSummary: async (proId: string) => ({ transactions: mockDB.transactions.filter(t => t.userId === proId) })
    },
    appointments: {
        list: async (uid: string, role: UserRole) => role === UserRole.CLIENT ? mockDB.appointments.filter(a => a.clientId === uid) : mockDB.appointments.filter(a => a.professionalId === uid),
        create: async (apt: Appointment) => { const newApt = { ...apt, id: `a_${Date.now()}`, status: 'confirmed' as const }; mockDB.appointments.unshift(newApt); return newApt; }
    },
    reviews: {
        list: async (targetId: string): Promise<Review[]> => mockDB.reviews.filter(r => r.targetId === targetId),
        create: async (review: Omit<Review, 'id' | 'date'>) => { const nr = { ...review, id: `r_${Date.now()}`, date: new Date().toISOString() }; mockDB.reviews.unshift(nr); return nr; }
    },
    marketplace: {
        listAll: async (): Promise<Product[]> => mockDB.products,
        listByOwner: async (ownerId: string): Promise<Product[]> => mockDB.products.filter(p => p.ownerId === ownerId || !p.ownerId),
        create: async (product: Omit<Product, 'id'>) => { const np = { ...product, id: `p_${Date.now()}` }; mockDB.products.push(np as Product); return np; },
        delete: async (id: string) => { mockDB.products = mockDB.products.filter(p => p.id !== id); return true; }
    },
    spaces: {
        getRooms: async (sid: string): Promise<SpaceRoom[]> => mockDB.rooms,
        getTeam: async (sid: string) => mockDB.users.filter(u => u.role === UserRole.PROFESSIONAL).slice(0, 10) as unknown as Professional[],
        getVacancies: async () => mockDB.vacancies,
        createVacancy: async (vacancy: any) => { const nv = { ...vacancy, id: `v_${Date.now()}`, applicantsCount: 0, status: 'open' }; mockDB.vacancies.push(nv); return nv; },
        getTransactions: async (uid: string) => mockDB.transactions.filter(t => t.userId === uid)
    },
    notifications: {
        list: async (uid: string) => mockDB.notifications.filter(n => n.userId === uid),
        markAsRead: async (uid: string, nid: string) => true,
        markAllAsRead: async (uid: string) => true
    }
};
