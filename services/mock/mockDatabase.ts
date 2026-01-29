
import { User, Professional, Appointment, Product, Transaction, Vacancy, Notification } from '../../types';

const STORAGE_KEYS = {
    USERS: 'viva360.db.users',
    APPOINTMENTS: 'viva360.db.appointments',
    PRODUCTS: 'viva360.db.products',
    TRANSACTIONS: 'viva360.db.transactions',
    RECORDS: 'viva360.db.records', // New for Evolutionary Records
    VACANCIES: 'viva360.db.vacancies',
    EVOLUTION_PLAN: 'viva360.db.plans' // New for Therapeutic Plans
};

// Initial Data Seeds
const SEED_USERS = [
    { id: 'user_1', name: 'Ana Silva', email: 'ana@client.com', role: 'CLIENT', karma: 150, mood: 'Vibrante', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=A' },
    { id: 'pro_1', name: 'Mestre Sol', email: 'sol@pro.com', role: 'PROFESSIONAL', karma: 500, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=S', personalBalance: 1250 }
];

const SEED_PRODUCTS: Product[] = [
    { id: 'p1', name: 'Cristal de Cura', price: 50, ownerId: 'pro_1', image: 'https://images.unsplash.com/photo-1515023115689-589c33041d3c?q=80&w=400', category: 'Cristais', type: 'physical' }
];

const SEED_APPOINTMENTS: Appointment[] = [
    { id: 'a1', date: new Date().toISOString(), time: '14:00', clientId: 'user_1', clientName: 'Ana Silva', professionalId: 'pro_1', professionalName: 'Mestre Sol', serviceName: 'Reiki', status: 'confirmed', price: 150 }
];

export const MockDB = {
    // Helpers
    _get: <T>(key: string, seed: T): T => {
        const stored = localStorage.getItem(key);
        if (!stored) {
            localStorage.setItem(key, JSON.stringify(seed));
            return seed;
        }
        return JSON.parse(stored);
    },
    _set: (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data)),

    // Users
    getUsers: () => MockDB._get<any[]>(STORAGE_KEYS.USERS, SEED_USERS),
    updateUser: (user: any) => {
        const users = MockDB.getUsers();
        const idx = users.findIndex(u => u.id === user.id);
        if (idx >= 0) users[idx] = { ...users[idx], ...user };
        else users.push(user);
        MockDB._set(STORAGE_KEYS.USERS, users);
        return user;
    },

    // Appointments
    getAppointments: () => MockDB._get<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, SEED_APPOINTMENTS),
    addAppointment: (apt: Appointment) => {
        const list = MockDB.getAppointments();
        list.push(apt);
        MockDB._set(STORAGE_KEYS.APPOINTMENTS, list);
        return apt;
    },

    // Products (Bazar)
    getProducts: () => MockDB._get<Product[]>(STORAGE_KEYS.PRODUCTS, SEED_PRODUCTS),
    addProduct: (prod: Product) => {
        const list = MockDB.getProducts();
        list.push(prod);
        MockDB._set(STORAGE_KEYS.PRODUCTS, list);
        return prod;
    },
    deleteProduct: (id: string) => {
        const list = MockDB.getProducts().filter(p => p.id !== id);
        MockDB._set(STORAGE_KEYS.PRODUCTS, list);
    },

    // Evolutionary Records (New)
    getRecords: (patientId: string) => {
        const all = MockDB._get<any[]>(STORAGE_KEYS.RECORDS, []);
        return all.filter(r => r.patientId === patientId);
    },
    addRecord: (record: any) => {
        const all = MockDB._get<any[]>(STORAGE_KEYS.RECORDS, []);
        all.push(record);
        MockDB._set(STORAGE_KEYS.RECORDS, all);
        return record;
    },

    // Finance
    getTransactions: (userId: string) => {
        return MockDB._get<any[]>(STORAGE_KEYS.TRANSACTIONS, [])
            .filter(t => t.userId === userId || (t as any).ownerId === userId) as Transaction[];
    },
    addTransaction: (tx: any) => {
        const all = MockDB.getTransactions(''); // get all raw
        all.push(tx);
        MockDB._set(STORAGE_KEYS.TRANSACTIONS, all);
        return tx;
    }
};
