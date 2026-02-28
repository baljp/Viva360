
import { User, UserRole, Professional, Appointment, Product, DailyQuest, Notification, Transaction, Review, Badge, ConstellationPact, Vacancy } from '../types';

// --- CONFIGURAÇÃO DE ESTRESSE ---
const TOTAL_CLIENTS = 100;
const TOTAL_PROS = 30;
const TOTAL_SPACES = 10;

// --- DATA POOLS ---
const FIRST_NAMES = ['Ana', 'João', 'Maria', 'Pedro', 'Lucas', 'Julia', 'Mariana', 'Roberto', 'Carlos', 'Sofia', 'Larissa', 'Bruno', 'Gabriel', 'Amanda', 'Fernanda', 'Rafael', 'Paulo', 'Beatriz', 'Gustavo', 'Camila', 'Tiago', 'Vanessa', 'Ricardo', 'Eduarda'];
const LAST_NAMES = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa'];
const SPECIALTIES = ['Acupuntura', 'Reiki', 'Yoga', 'Meditação', 'Massoterapia', 'Psicologia', 'Nutrição', 'Osteopatia', 'Quiropraxia', 'Ayurveda', 'Thetahealing', 'Constelação', 'Tarot', 'Astrologia', 'Naturopatia', 'Tantra', 'Fitoterapia'];
const LOCATIONS = ['Tambaú', 'Manaíra', 'Cabo Branco', 'Altiplano', 'Bessa', 'Bancários', 'Jardim Oceania', 'Torre', 'Jaguaribe', 'Centro', 'Intermares', 'Poço', 'Aeroclube', 'Miramar'];

// Escambo Data
const SWAP_OFFERS = ['Supervisão Clínica', 'Mentoria de Carreira', 'Reiki à Distância', 'Atendimento Online', 'Workshop de Yoga', 'Leitura de Mapa Astral', 'Consultoria de Espaço', 'Aula de Pranayama'];
const SWAP_NEEDS = ['Design de Marca', 'Contabilidade', 'Gestão de Redes', 'Permuta de Sala', 'Terapia Pessoal', 'Desenvolvimento Web', 'Edição de Vídeo', 'Assessoria Jurídica'];

const REVIEW_COMMENTS = [
    "Simplesmente transformador. Senti uma paz imensa.",
    "Ambiente acolhedor e profissional muito atencioso.",
    "Me ajudou a desbloquear traumas antigos. Gratidão eterna.",
    "A energia deste lugar é surreal. Recomendo a todos.",
    "Saí flutuando. Mãos de fada!",
    "Técnica apurada e muita sensibilidade.",
    "Foi minha primeira vez e me senti muito segura.",
    "O melhor investimento que fiz em mim mesma este ano."
];

const BADGES_POOL: Badge[] = [
    { id: 'b1', label: 'Guardião Bronze', icon: '🥉', description: 'Realizou mais de 50 atendimentos.', rarity: 'common' },
    { id: 'b2', label: 'Mestre da Calma', icon: '🧘', description: 'Consistentemente avaliado como "Sereno".', rarity: 'rare' },
    { id: 'b3', label: 'Eco-Consciente', icon: '🌿', description: 'Utiliza apenas produtos orgânicos.', rarity: 'common' },
    { id: 'b4', label: 'Lenda Viva', icon: '🌟', description: 'Top 1% da plataforma.', rarity: 'legendary' },
    { id: 'b5', label: 'Verificado', icon: 'shield', description: 'Documentação validada pelo Viva360.', rarity: 'common' },
    { id: 'b6', label: 'Anfitrião de Luz', icon: '🏠', description: 'Espaço com nota máxima em ambiente.', rarity: 'epic' }
];

const pseudoRandom = (seed: number) => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
};

const pick = (arr: any[], seed: number) => arr[Math.floor(pseudoRandom(seed) * arr.length)];
const pickMultiple = (arr: any[], seed: number, count: number) => {
    const shuffled = [...arr].sort(() => 0.5 - pseudoRandom(seed));
    return shuffled.slice(0, count);
};

const generateDailyQuests = (seed: number): DailyQuest[] => {
    return [
        { id: `q1_${seed}`, label: 'Registrar Ritual Matinal', reward: 50, isCompleted: pseudoRandom(seed) > 0.7, type: 'ritual' },
        { id: `q2_${seed}`, label: 'Beber Água Consciente', reward: 20, isCompleted: pseudoRandom(seed + 1) > 0.5, type: 'water' },
        { id: `q3_${seed}`, label: 'Respiração de 1 min', reward: 30, isCompleted: pseudoRandom(seed + 2) > 0.3, type: 'breathe' }
    ];
};

const generateBadges = (seed: number, role: UserRole): Badge[] => {
    const count = Math.floor(pseudoRandom(seed) * 3) + 1;
    const shuffled = [...BADGES_POOL].sort(() => 0.5 - pseudoRandom(seed));
    return shuffled.slice(0, count);
};

const generateClients = (): User[] => {
    return Array.from({ length: TOTAL_CLIENTS }).map((_, i) => {
        const seed = i * 123;
        const plantXp = Math.floor(pseudoRandom(seed + 9) * 1000);
        return {
            id: `client_${i}`,
            role: UserRole.CLIENT,
            name: `${pick(FIRST_NAMES, seed)} ${pick(LAST_NAMES, seed + 1)}`,
            email: `client${i}@viva360.com`,
            avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=client_${i}`,
            corporateBalance: Math.floor(pseudoRandom(seed + 2) * 500),
            personalBalance: Math.floor(pseudoRandom(seed + 3) * 2000),
            karma: Math.floor(pseudoRandom(seed + 4) * 5000),
            isVerified: pseudoRandom(seed + 5) > 0.8,
            streak: Math.floor(pseudoRandom(seed + 6) * 30),
            multiplier: 1.0,
            inventory: { incense: 3, crystals: 10 },
            plantStage: 'flower',
            plantXp: plantXp % 100,
            dailyQuests: generateDailyQuests(seed),
            badges: generateBadges(seed, UserRole.CLIENT),
            constellation: [
                { id: 'c99', name: 'Lucas Paz', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=c99', needsWatering: true },
                { id: 'c98', name: 'Ana Luz', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=c98', needsWatering: false }
            ],
            snaps: Array.from({ length: 4 }).map((_, j) => ({ id: `s_${j}`, imageUrl: `https://picsum.photos/seed/snap${i}${j}/300/400`, date: '2024-05-20' })),
            activePact: {
                id: 'pact_demo',
                partnerId: 'client_99',
                partnerName: 'Lucas Paz',
                partnerAvatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=client_99',
                missionLabel: 'Completar 5 Rituais',
                myProgress: 3,
                partnerProgress: 2,
                target: 5,
                rewardKarma: 300,
                endDate: new Date(Date.now() + 86400000 * 2).toISOString(),
                status: 'active'
            }
        } as User;
    });
};

const generatePros = (): Professional[] => {
    return Array.from({ length: TOTAL_PROS }).map((_, i) => {
        const seed = i * 456;
        const specialty1 = pick(SPECIALTIES, seed + 2);
        return {
            id: `pro_${i}`,
            role: UserRole.PROFESSIONAL,
            name: `${pick(FIRST_NAMES, seed + 5)} ${pick(LAST_NAMES, seed + 6)}`,
            email: `pro${i}@viva360.com`,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=pro_${i}`,
            karma: 5000,
            corporateBalance: 1000,
            personalBalance: 500,
            prestigeLevel: 3,
            specialty: [specialty1, 'Meditação'],
            rating: 4.8,
            pricePerSession: 150,
            bio: `Especialista em ${specialty1} com foco em equilíbrio integral.`,
            location: pick(LOCATIONS, seed + 9),
            badges: generateBadges(seed, UserRole.PROFESSIONAL),
            isAvailableForSwap: pseudoRandom(seed + 7) > 0.3,
            offers: pickMultiple(SWAP_OFFERS, seed + 8, 2),
            needs: pickMultiple(SWAP_NEEDS, seed + 9, 2),
            snaps: [], constellation: []
        } as unknown as Professional;
    });
};

const generateSpaces = (): User[] => {
    return Array.from({ length: TOTAL_SPACES }).map((_, i) => {
        const seed = i * 789;
        return {
            id: `hub_${i}`,
            role: UserRole.SPACE,
            name: `Santuário ${pick(LOCATIONS, seed + 1)}`,
            email: `contato.hub${i}@viva360.com`,
            avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=hub_${i}`,
            karma: 20000,
            corporateBalance: 50000,
            personalBalance: 0,
            radianceScore: 890,
            badges: generateBadges(seed, UserRole.SPACE),
            snaps: [], constellation: []
        } as User;
    });
};

const generateAdmins = (): User[] => {
    return [{
        id: 'admin_0',
        role: UserRole.ADMIN,
        name: 'Curador Mestre',
        email: 'admin@viva360.com',
        avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=admin',
        karma: 99999,
        corporateBalance: 0,
        personalBalance: 0,
        snaps: [], constellation: []
    } as User];
};

const CACHED_CLIENTS = generateClients();
const CACHED_PROS = generatePros();
const CACHED_SPACES = generateSpaces();
const CACHED_ADMINS = generateAdmins();


export const Database = {
    clients: CACHED_CLIENTS,
    pros: CACHED_PROS,
    spaces: CACHED_SPACES,
    admins: CACHED_ADMINS,

    getNotifications: (uid: string, role: UserRole) => [
        { id: 'n1', userId: uid, type: 'ritual', title: 'Sessão Confirmada', message: 'Seu ritual de Reiki começa em 1h.', timestamp: new Date().toISOString(), read: false },
        { id: 'n2', userId: uid, type: 'alert', title: 'Jardim Sedento', message: 'Sua planta precisa de atenção.', timestamp: new Date().toISOString(), read: false }
    ] as Notification[],
    getTransactions: (uid: string) => [
        { id: 't1', userId: uid, type: 'income', amount: 150, description: 'Sessão de Yoga', date: new Date().toISOString(), status: 'completed' },
        { id: 't2', userId: uid, type: 'expense', amount: 45, description: 'Óleo Essencial', date: new Date().toISOString(), status: 'completed' }
    ] as Transaction[],
    getVacancies: (seed: number) => [
        { id: 'v1', hubId: 'hub_0', title: 'Mestre em Ayurveda', specialties: ['Ayurveda'], description: 'Buscamos guardiões experientes.', applicantsCount: 12, createdAt: new Date().toISOString(), status: 'open' }
    ] as Vacancy[],
    getAppointments: (userId: string, role: UserRole) => [
        { id: 'a1', clientId: 'client_0', clientName: 'Ana Luz', professionalId: 'pro_0', professionalName: 'Mestre Sol', date: new Date().toISOString(), time: '14:00', status: 'confirmed', serviceName: 'Reiki Nível 1', price: 150 },
        { id: 'a2', clientId: 'client_0', clientName: 'Ana Luz', professionalId: 'pro_1', professionalName: 'Sara Yoga', date: new Date().toISOString(), time: '16:30', status: 'confirmed', serviceName: 'Hatha Yoga', price: 120 }
    ] as Appointment[],
    getProducts: (proId: string) => [
        // Físicos
        { id: 'p1', name: 'Kit Cristais do Alinhamento', price: 120, image: 'https://images.unsplash.com/photo-1515023115689-589c33041d3c?q=80&w=400', category: 'Cristais', type: 'physical', description: 'Pedras brutas selecionadas para equilibrar os 7 chakras.', symptoms: ['Ansiedade', 'Fadiga'], karmaReward: 50 },
        { id: 'p2', name: 'Incenso de Palo Santo', price: 35, image: 'https://images.unsplash.com/photo-1602928321679-560bb453f190?q=80&w=400', category: 'Aromaterapia', type: 'physical', description: 'Limpeza energética profunda com madeira sagrada.', symptoms: ['Estresse', 'Energia Baixa'], karmaReward: 20 },

        // Digitais
        { id: 'p3', name: 'Audiofrequência 432Hz', price: 15, image: 'https://images.unsplash.com/photo-1514525253344-f81bad1b7fc7?q=80&w=400', category: 'Som', type: 'digital_content', description: 'Reparo de DNA e relaxamento profundo em alta fidelidade.', symptoms: ['Insônia', 'Ansiedade'], karmaReward: 30 },

        // Workshops e Eventos
        { id: 'w1', name: 'Imersão: Respiro Consciente', price: 80, image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=400', category: 'Workshop', type: 'workshop', description: 'Aprenda técnicas de pranayama para controle imediato da ansiedade.', eventDate: new Date(Date.now() + 86400000 * 3).toISOString(), hostName: 'Mestre Ravi', symptoms: ['Ansiedade', 'Pânico'], karmaReward: 100, spotsLeft: 5 },
        { id: 'e1', name: 'Círculo de Lua Cheia', price: 45, image: 'https://images.unsplash.com/photo-1532187643603-ba119c7f1033?q=80&w=400', category: 'Ritual', type: 'event', description: 'Encontro online para manifestação e limpeza emocional sob a lua cheia.', eventDate: new Date(Date.now() + 86400000 * 7).toISOString(), hostName: 'Tenda da Lua', symptoms: ['Tristeza', 'Bloqueio'], karmaReward: 80, spotsLeft: 20 },
        { id: 'w2', name: 'Jornada do Perdão', price: 200, image: 'https://images.unsplash.com/photo-1499209974431-276138735990?q=80&w=400', category: 'Curso', type: 'workshop', description: '4 encontros para liberar mágoas passadas e abrir caminhos.', eventDate: new Date(Date.now() + 86400000 * 10).toISOString(), hostName: 'Terapeuta Sofia', symptoms: ['Rancor', 'Peso Emocional'], karmaReward: 250, spotsLeft: 8 }
    ] as Product[]
};

export const MOCK_FAQS = [{ q: "Como ganhar Karma?", a: "Fazendo rituais diários e regando seu jardim." }];
