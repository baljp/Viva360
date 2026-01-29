
import { User, Professional, Appointment, Product, Transaction, Vacancy, Notification, Event, Proposal, TribePost, SpaceRoom, Review, ChatMessage, ChatRoom, Badge } from '../../types';

const STORAGE_KEYS = {
    USERS: 'viva360.db.users',
    APPOINTMENTS: 'viva360.db.appointments',
    PRODUCTS: 'viva360.db.products',
    TRANSACTIONS: 'viva360.db.transactions',
    RECORDS: 'viva360.db.records',
    VACANCIES: 'viva360.db.vacancies',
    EVENTS: 'viva360.db.events',
    PROPOSALS: 'viva360.db.proposals',
    POSTS: 'viva360.db.posts',
    ROOMS: 'viva360.db.rooms',
    REVIEWS: 'viva360.db.reviews',
    CHAT_ROOMS: 'viva360.db.chat_rooms',
    EVOLUTION_HISTORY: 'viva360.evolution_history',
    RITUALS: 'viva360.db.rituals' // New
};

// --- SEEDS ---

const SEED_BADGES: Badge[] = [
    { id: 'b1', label: 'Primeiros Passos', icon: 'Seed', description: 'Completou o onboarding.', rarity: 'common' },
    { id: 'b2', label: 'Meditador', icon: 'Sun', description: 'Realizou 10 sessões de meditação.', rarity: 'rare' },
    { id: 'b3', label: 'Guardião da Luz', icon: 'Star', description: 'Atingiu Karma 1000.', rarity: 'epic' }
];

const SEED_USERS = [
    // CLIENTS
    { 
        id: 'user_1', name: 'Ana Silva', email: 'ana@client.com', role: 'CLIENT', 
        karma: 850, mood: 'Vibrante', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200', 
        personalBalance: 1250, plantStage: 'flower', plantXp: 75, streak: 12,
        badges: [SEED_BADGES[0], SEED_BADGES[1]]
    },
    { 
        id: 'user_2', name: 'Carlos Luz', email: 'carlos@client.com', role: 'CLIENT', 
        karma: 120, mood: 'Sereno', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200', 
        personalBalance: 450, plantStage: 'sprout', plantXp: 20,
        badges: [SEED_BADGES[0]]
    },
    
    // PROFESSIONALS
    { 
        id: 'pro_1', name: 'Mestre Sol', email: 'sol@pro.com', role: 'PROFESSIONAL', 
        karma: 2500, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200', 
        personalBalance: 5250, specialty: ['Reiki', 'Cristais'], rating: 4.9, reviewCount: 42,
        bio: 'Terapeuta holístico com 10 anos de experiência em cura energética.',
        isVerified: true, location: 'São Paulo, SP',
        badges: [SEED_BADGES[2]]
    },
    { 
        id: 'pro_2', name: 'Dra. Luna', email: 'luna@pro.com', role: 'PROFESSIONAL', 
        karma: 1800, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200', 
        personalBalance: 3200, specialty: ['Psicologia Transpessoal', 'Tarot'], rating: 5.0, reviewCount: 28,
        bio: 'Unindo ciência e espiritualidade para o despertar da consciência.',
        isVerified: true, location: 'Online'
    },

    // SPACES (Santuários)
    { 
        id: 'space_1', name: 'Templo Gaia', email: 'admin@gaia.com', role: 'SPACE', 
        karma: 10000, avatar: 'https://images.unsplash.com/photo-1445510861609-7551011da928?q=80&w=200', 
        corporateBalance: 15400, location: 'Alto Paraíso, GO',
        bio: 'Um refúgio de paz em meio à natureza.',
        rating: 4.9, reviewCount: 150
    },

    // ADMIN
    { id: 'admin_1', name: 'Admin Viva360', email: 'super@admin.com', role: 'ADMIN', karma: 99999, avatar: 'https://ui-avatars.com/api/?name=Admin', personalBalance: 0 }
];

const SEED_APPOINTMENTS: Appointment[] = [
    { id: 'a1', clientId: 'user_1', clientName: 'Ana Silva', professionalId: 'pro_1', professionalName: 'Mestre Sol', serviceName: 'Reiki à Distância', date: new Date().toISOString(), time: '09:00', status: 'confirmed', price: 150 },
    { id: 'a2', clientId: 'user_1', clientName: 'Ana Silva', professionalId: 'pro_2', professionalName: 'Dra. Luna', serviceName: 'Leitura de Tarot', date: new Date(Date.now() + 86400000).toISOString(), time: '14:00', status: 'pending', price: 200 },
    { id: 'a3', clientId: 'user_2', clientName: 'Carlos Luz', professionalId: 'pro_1', professionalName: 'Mestre Sol', serviceName: 'Alinhamento de Chakras', date: new Date(Date.now() - 86400000).toISOString(), time: '16:00', status: 'completed', price: 150 }
];

const SEED_PRODUCTS: Product[] = [
    { id: 'p1', name: 'Kit Cristais 7 Chakras', price: 89.90, ownerId: 'pro_1', image: 'https://images.unsplash.com/photo-1596489436424-656c1f1737f1?q=80&w=400', category: 'Cristais', type: 'physical' },
    { id: 'p2', name: 'E-book: Despertar', price: 29.90, ownerId: 'pro_2', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400', category: 'Educação', type: 'digital_content' },
    { id: 'p3', name: 'Incensário Buda', price: 45.00, ownerId: 'user_2', image: 'https://images.unsplash.com/photo-1602166699304-45ed3b8793b3?q=80&w=400', category: 'Decoração', type: 'physical' }
];

const SEED_EVENTS: Event[] = [
    { id: 'e1', title: 'Círculo de Mulheres', description: 'Um encontro sagrado para honrar o feminino.', date: new Date(Date.now() + 172800000).toISOString(), time: '19:00', duration: 120, facilitatorId: 'pro_2', facilitatorName: 'Dra. Luna', price: 50, capacity: 20, enrolled: 12, location: 'Sala Lua', image: 'https://images.unsplash.com/photo-1528644490543-950c4dfceb28?q=80&w=400', status: 'upcoming', tags: ['Feminino', 'Cura'] },
    { id: 'e2', title: 'Retiro Renascer', description: 'Imersão de final de semana na natureza.', date: new Date(Date.now() + 604800000).toISOString(), time: '08:00', duration: 2880, facilitatorId: 'space_1', facilitatorName: 'Templo Gaia', price: 1200, capacity: 15, enrolled: 8, location: 'Templo Gaia', image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=400', status: 'upcoming', tags: ['Retiro', 'Natureza'] }
];

const SEED_POSTS: TribePost[] = [
    { id: 'pt1', authorId: 'user_1', authorName: 'Ana Silva', authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200', content: 'Hoje completei 21 dias de meditação! ✨ Sentindo uma paz indescritível.', likes: 24, comments: 3, timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'celebration' },
    { id: 'pt2', authorId: 'pro_1', authorName: 'Mestre Sol', authorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200', content: 'Dica do dia: Seus pés na terra descarregam o excesso de energia. Conecte-se. 🌱', likes: 156, comments: 12, timestamp: new Date(Date.now() - 7200000).toISOString(), type: 'insight' }
];

const SEED_PROPOSALS: Proposal[] = [
    { id: 'prop1', title: 'Novo Espaço de Yoga', description: 'Investir na reforma da sala anexada para aulas de Yoga.', proposerId: 'pro_1', proposerName: 'Mestre Sol', type: 'expansion', status: 'active', votesFor: 8, votesAgainst: 1, deadline: new Date(Date.now() + 259200000).toISOString() },
    { id: 'prop2', title: 'Fundo Comunitário', description: 'Destinar 5% da receita para atendimentos sociais.', proposerId: 'pro_2', proposerName: 'Dra. Luna', type: 'financial', status: 'approved', votesFor: 15, votesAgainst: 0, deadline: new Date().toISOString() }
];

const SEED_ROOMS: SpaceRoom[] = [
    { id: 'r1', name: 'Sala Sol', status: 'available', nextSession: '14:00 - Reiki', generatedRevenue: 1500, image: 'https://images.unsplash.com/photo-1507652313519-d4e917a546fe?q=80&w=400' },
    { id: 'r2', name: 'Sala Lua', status: 'occupied', currentOccupant: 'Pro: Dra. Luna', generatedRevenue: 2300, image: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=400' },
    { id: 'r3', name: 'Jardim Zen', status: 'available', generatedRevenue: 800, image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=400' }
];

const SEED_TRANSACTIONS: Transaction[] = [
    { id: 't1', userId: 'user_1', amount: 150, type: 'expense', description: 'Sessão de Reiki', date: new Date(Date.now() - 86400000).toISOString(), status: 'completed', currency: 'BRL', paymentMethod: 'credit_card' },
    { id: 't2', userId: 'pro_1', amount: 135, type: 'income', description: 'Sessão de Reiki (Ana Silva)', date: new Date(Date.now() - 86400000).toISOString(), status: 'completed', currency: 'BRL', split: { provider: 135, platform: 15 } },
    { id: 't3', userId: 'space_1', amount: 1200, type: 'income', description: 'Retiro Renascer (Depósito)', date: new Date(Date.now() - 172800000).toISOString(), status: 'pending', currency: 'BRL' }
];

const SEED_EVOLUTION = [
    { 
        id: 'evo1', mood: 'sereno', photoThumb: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=400', 
        quote: 'A calma é a chave para a clareza.', ritual: ['Meditação 10min'], timestamp: new Date(Date.now() - 86400000 * 2).toISOString() 
    },
    { 
        id: 'evo2', mood: 'vibrante', photoThumb: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400', 
        quote: 'Hoje brilho como o sol.', ritual: ['Yoga Flow'], timestamp: new Date(Date.now() - 86400000 * 5).toISOString() 
    },
    { 
        id: 'evo3', mood: 'grato', photoThumb: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=400', 
        quote: 'Agradeço por cada respiração.', ritual: ['Diário da Gratidão'], timestamp: new Date(Date.now() - 86400000 * 10).toISOString() 
    }
];

const SEED_NOTIFICATIONS: Notification[] = [
    { id: 'n1', userId: 'user_1', type: 'alert', title: 'Sessão Iniciando', message: 'Sua sessão de Reiki começa em 15 min.', timestamp: new Date().toISOString(), read: false, priority: 'high' },
    { id: 'n2', userId: 'user_1', type: 'message', title: 'Dra. Luna', message: 'Olá! Enviei o material de apoio do Tarot.', timestamp: new Date(Date.now() - 3600000).toISOString(), read: true },
    { id: 'n3', userId: 'pro_1', type: 'finance', title: 'Pagamento Recebido', message: 'R$ 135,00 creditados em sua conta.', timestamp: new Date().toISOString(), read: false, priority: 'normal' }
];

// Seed Chat - between User 1 and Pro 1
const SEED_CHAT_ROOMS: ChatRoom[] = [
    {
        id: 'room1',
        participants: [
            { id: 'user_1', name: 'Ana Silva', avatar: SEED_USERS[0].avatar, role: 'CLIENT' },
            { id: 'pro_1', name: 'Mestre Sol', avatar: SEED_USERS[2].avatar, role: 'PRO' }
        ],
        unreadCount: 1,
        type: 'private',
        lastMessage: { id: 'm2', senderId: 'pro_1', content: 'Fico feliz que tenha gostado da sessão!', timestamp: new Date().toISOString(), read: false, type: 'text' }
    }
];
// Note: In a real mock, messages would be fetched by ROOM ID. For simplicity, we'll just store a map or array.

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

    // Products (Marketplace)
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

    // Events (Santuário)
    getEvents: () => MockDB._get<Event[]>(STORAGE_KEYS.EVENTS, SEED_EVENTS),
    addEvent: (evt: Event) => {
        const list = MockDB.getEvents();
        list.push(evt);
        MockDB._set(STORAGE_KEYS.EVENTS, list);
        return evt;
    },

    // Tribe Posts
    getPosts: () => MockDB._get<TribePost[]>(STORAGE_KEYS.POSTS, SEED_POSTS),
    addPost: (post: TribePost) => {
        const list = MockDB.getPosts();
        list.unshift(post);
        MockDB._set(STORAGE_KEYS.POSTS, list);
        return post;
    },

    // Governance Proposals
    getProposals: () => MockDB._get<Proposal[]>(STORAGE_KEYS.PROPOSALS, SEED_PROPOSALS),
    voteProposal: (propId: string, vote: 'for' | 'against') => {
        const props = MockDB.getProposals();
        const prop = props.find(p => p.id === propId);
        if (prop) {
            if (vote === 'for') prop.votesFor++; else prop.votesAgainst++;
            prop.myVote = vote;
            MockDB._set(STORAGE_KEYS.PROPOSALS, props);
        }
    },

    // Rooms
    getRooms: () => MockDB._get<SpaceRoom[]>(STORAGE_KEYS.ROOMS, SEED_ROOMS),

    // Records
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
        const all = MockDB._get<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, SEED_TRANSACTIONS);
        return userId ? all.filter(t => t.userId === userId || (t as any).providerId === userId) : all;
    },
    addTransaction: (tx: any) => {
        const all = MockDB._get<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, SEED_TRANSACTIONS);
        all.push(tx);
        MockDB._set(STORAGE_KEYS.TRANSACTIONS, all);
        return tx;
    },

    // Notifications (New)
    getNotifications: (userId: string) => {
        // Return seeded notifications filtered by user + random delay simulation? 
        // For mock, just return what matches and hasn't been "deleted" (not implemented yet)
        return SEED_NOTIFICATIONS.filter(n => n.userId === userId);
    },

    // Evolution History (Time-Lapse) - New
    getEvolutionHistory: () => MockDB._get<any[]>(STORAGE_KEYS.EVOLUTION_HISTORY, SEED_EVOLUTION),
    addEvolutionEntry: (entry: any) => {
        const history = MockDB.getEvolutionHistory();
        history.unshift(entry);
        MockDB._set(STORAGE_KEYS.EVOLUTION_HISTORY, history);
        return entry;
    },

    // Chat
    getChatRooms: (userId: string) => MockDB._get<ChatRoom[]>(STORAGE_KEYS.CHAT_ROOMS, SEED_CHAT_ROOMS).filter(r => r.participants.some(p => p.id === userId)),
    createChatRoom: (room: ChatRoom) => {
         const list = MockDB.getChatRooms('');
         list.push(room);
         MockDB._set(STORAGE_KEYS.CHAT_ROOMS, list);
         return room;
    },

    // Reset for Debugging
    reset: () => {
        Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
        window.location.reload();
    }
};
