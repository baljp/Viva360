
import { User, Professional, UserRole, Appointment, Product, Notification, SpaceRoom, Vacancy, Transaction } from '../types';
import { Database as Seed } from '../utils/seedEngine';

const DELAY = 600;

// Helper para simular latência
const wait = (ms: number = DELAY) => new Promise(resolve => setTimeout(resolve, ms));

// Inicialização de Banco de Dados Local (Persistência entre sessões)
const getStoredDB = () => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('viva360_mock_db');
    if (stored) return JSON.parse(stored);
    
    const initialDB = {
        users: {} as Record<string, User | Professional>,
        appointments: [] as Appointment[],
        notifications: [] as Notification[],
        vacancies: [] as Vacancy[],
        transactions: [] as Transaction[],
        patientNotes: {} as Record<string, string> // notas por patientId_proId
    };

    Seed.clients.forEach(c => initialDB.users[c.id] = { ...c });
    Seed.pros.forEach(p => initialDB.users[p.id] = { ...p });
    Seed.spaces.forEach(s => initialDB.users[s.id] = { ...s });
    
    return initialDB;
};

let DB = getStoredDB() || { users: {}, appointments: [], notifications: [], vacancies: [], transactions: [], patientNotes: {} };

const syncDB = () => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('viva360_mock_db', JSON.stringify(DB));
    }
};

export const api = {
    auth: {
        loginByEmail: async (email: string): Promise<User> => {
            await wait();
            const user = Object.values(DB.users).find((u: any) => u.email.toLowerCase() === email.toLowerCase());
            if (!user) throw new Error("Usuário não encontrado.");
            return user as User;
        },
        loginWithGoogle: async (role: UserRole = UserRole.CLIENT): Promise<User> => {
            await wait(1000);
            const mockUser = role === UserRole.CLIENT ? Seed.clients[0] : role === UserRole.PROFESSIONAL ? Seed.pros[0] : Seed.spaces[0];
            return { ...mockUser } as User;
        },
        register: async (data: any): Promise<User> => {
            await wait(1000);
            const newUser = { 
                ...data, 
                id: `u_${Date.now()}`, 
                karma: 100, 
                plantXp: 0, 
                streak: 1, 
                corporateBalance: 0, 
                personalBalance: 500,
                avatar: `https://api.dicebear.com/7.x/${data.role === UserRole.SPACE ? 'identicon' : 'notionists'}/svg?seed=${data.name}`
            };
            DB.users[newUser.id] = newUser;
            syncDB();
            return newUser;
        }
    },
    users: {
        getById: async (id: string) => { await wait(200); return DB.users[id]; },
        update: async (user: User) => { 
            await wait(800);
            DB.users[user.id] = user; 
            syncDB();
            return user; 
        },
        checkIn: async (uid: string) => {
            await wait();
            const user = DB.users[uid] as User;
            if (user) {
                user.karma += 50;
                user.lastCheckIn = new Date().toISOString().split('T')[0];
                user.streak += 1;
                syncDB();
            }
            return { user, reward: 50 };
        }
    },
    professionals: {
        list: async (): Promise<Professional[]> => {
            await wait(400);
            return Object.values(DB.users).filter((u: any) => u.role === UserRole.PROFESSIONAL) as Professional[];
        },
        updateNotes: async (patientId: string, proId: string, content: string) => {
            await wait(1200);
            const key = `${patientId}_${proId}`;
            DB.patientNotes[key] = content;
            syncDB();
            return true;
        },
        getNotes: async (patientId: string, proId: string) => {
            await wait(300);
            return DB.patientNotes[`${patientId}_${proId}`] || "";
        },
        getFinanceSummary: async (uid: string) => {
            await wait(500);
            return {
                totalBalance: 14500.80,
                transactions: Seed.getTransactions(uid)
            };
        }
    },
    appointments: {
        list: async (uid: string, role: UserRole) => {
            await wait(400);
            const filtered = DB.appointments.filter((a: any) => 
                role === UserRole.CLIENT ? a.clientId === uid : a.professionalId === uid
            );
            return filtered.length > 0 ? filtered : Seed.getAppointments(uid, role);
        },
        create: async (apt: Appointment) => {
            await wait(1500);
            DB.appointments.push(apt);
            syncDB();
            return apt;
        }
    },
    marketplace: {
        listAll: async (): Promise<Product[]> => {
            await wait(300);
            return Seed.getProducts('all');
        }
    },
    spaces: {
        getRooms: async (sid: string): Promise<SpaceRoom[]> => {
            await wait(200);
            return [
                { id: 'r1', name: 'Altar do Sol', status: Math.random() > 0.5 ? 'available' : 'occupied' },
                { id: 'r2', name: 'Sala de Cristal', status: Math.random() > 0.3 ? 'occupied' : 'available', currentOccupant: 'Dr. Klaus' },
                { id: 'r3', name: 'Templo de Gaia', status: 'available' },
                { id: 'r4', name: 'Ninho das Águias', status: 'occupied', currentOccupant: 'Sara Yoga' }
            ];
        },
        getTeam: async (sid: string) => {
            await wait(300);
            return Object.values(DB.users).filter((u: any) => u.hubId === sid) as Professional[];
        },
        getVacancies: async () => {
            await wait(400);
            return Seed.getVacancies(1);
        },
        getTransactions: async (uid: string) => {
            await wait(400);
            return Seed.getTransactions(uid);
        }
    },
    notifications: {
        list: async (uid: string) => {
            await wait(300);
            const user = DB.users[uid];
            if (!user) return [];
            return Seed.getNotifications(uid, user.role);
        },
        markAsRead: async (uid: string, nid: string) => {
            await wait(100);
            return true;
        },
        markAllAsRead: async (uid: string) => {
            await wait(100);
            return true;
        }
    }
};
