import { User, UserRole, Professional, Service, Product, Appointment, Transaction, ContentItem, DailyTask, MoodHistoryItem, ChatMessage, Notification, ServicePackage, Vacancy, TherapyType, MoodOption, GardenPhase, DataSharingRequest, HealthAccessGrant } from './types';
import { Cloud, Wind, Sun, Zap, Droplets } from 'lucide-react';

// --- MICROCOPY LIBRARY ---
export const WELCOME_MESSAGES = {
    neutral: "O espaço está aberto para você.",
    return_after_absence: "O tempo é seu. Bem-vindo de volta.",
    anxiety_detected: "Vamos apenas respirar por um minuto? Nada mais é urgente agora.",
    success: "Sua prática de hoje está completa.",
    morning: "Que sua jornada hoje seja leve.",
    evening: "Hora de desacelerar e integrar."
};

// --- GLOBAL IMPACT ---
export const IMPACT_GOAL = 50000; // Minutes
export const CURRENT_IMPACT = 34210; // Minutes

// --- MOOD CONFIGURATION ---
// No numeric sliders. Abstract icons.
export const MOOD_OPTIONS: MoodOption[] = [
    { id: 'tired', label: 'Cansado', icon: Cloud, color: 'text-gray-500 bg-gray-50', suggestionContext: 'low_effort' },
    { id: 'anxious', label: 'Ansioso', icon: Wind, color: 'text-blue-500 bg-blue-50', suggestionContext: 'grounding' },
    { id: 'sad', label: 'Triste', icon: Droplets, color: 'text-indigo-500 bg-indigo-50', suggestionContext: 'comfort' },
    { id: 'good', label: 'Bem', icon: Sun, color: 'text-amber-500 bg-amber-50', suggestionContext: 'expansion' },
    { id: 'focused', label: 'Focado', icon: Zap, color: 'text-primary-600 bg-primary-50', suggestionContext: 'flow' },
];

// --- THE VIVA360 ONTOLOGY ---
export const MASTER_THERAPIES: TherapyType[] = [
    // A: ENERGÉTICAS & VIBRACIONAIS
    { id: 't1', name: 'Reiki', category: 'ENERGETICA', tags: ['ansiedade', 'equilibrio', 'sono', 'paz'], description: 'Canalização de energia vital universal.' },
    { id: 't2', name: 'Barras de Access', category: 'ENERGETICA', tags: ['mente', 'bloqueios', 'clareza'], description: 'Toques suaves na cabeça para liberar crenças.' },
    { id: 't3', name: 'ThetaHealing', category: 'ENERGETICA', tags: ['cura', 'crenças', 'subconsciente'], description: 'Meditação que cria cura física, psicológica e espiritual.' },
    { id: 't4', name: 'Cura Prânica', category: 'ENERGETICA', tags: ['limpeza', 'vitalidade', 'aura'], description: 'Limpeza e energização sem toque físico.' },
    { id: 't5', name: 'Radiestesia', category: 'ENERGETICA', tags: ['diagnóstico', 'pendulo', 'harmonização'], description: 'Medição e correção de campos energéticos.' },
    
    // B: CORPORAIS & MANIPULATIVAS
    { id: 't6', name: 'Massoterapia', category: 'CORPORAL', tags: ['dor', 'relaxamento', 'tensão', 'muscular'], description: 'Manipulação dos tecidos moles do corpo.' },
    { id: 't7', name: 'Reflexologia', category: 'CORPORAL', tags: ['pes', 'orgaos', 'circulação'], description: 'Pressão em pontos dos pés que correspondem a órgãos.' },
    { id: 't8', name: 'Quiropraxia', category: 'CORPORAL', tags: ['coluna', 'postura', 'dor nas costas'], description: 'Ajuste do sistema neuromusculoesquelético.' },
    { id: 't9', name: 'Shiatsu', category: 'CORPORAL', tags: ['meridianos', 'pressão', 'energia'], description: 'Terapia manual japonesa baseada em pressão.' },
    { id: 't10', name: 'Watsu', category: 'CORPORAL', tags: ['agua', 'fluidez', 'renascimento'], description: 'Shiatsu na água aquecida.' },

    // C: MENTE & EMOÇÃO
    { id: 't11', name: 'Constelação Familiar', category: 'MENTE', tags: ['familia', 'antepassados', 'padroes'], description: 'Resolução de conflitos geracionais.' },
    { id: 't12', name: 'Hipnoterapia', category: 'MENTE', tags: ['trauma', 'fobias', 'habitos'], description: 'Acesso ao subconsciente para ressignificação.' },
    { id: 't13', name: 'Meditação Guiada', category: 'MENTE', tags: ['foco', 'calma', 'mindfulness'], description: 'Condução verbal para estados alterados de consciência.' },
    { id: 't14', name: 'Psicologia Transpessoal', category: 'MENTE', tags: ['espiritualidade', 'ego', 'transcendencia'], description: 'Integração dos aspectos espirituais da experiência humana.' },

    // D: NATURAIS & ANCESTRAIS
    { id: 't15', name: 'Aromaterapia', category: 'NATURAL', tags: ['cheiro', 'emoções', 'oleos'], description: 'Uso terapêutico de óleos essenciais.' },
    { id: 't16', name: 'Florais', category: 'NATURAL', tags: ['emoções', 'suave', 'gotas'], description: 'Essências florais para equilíbrio emocional.' },
    { id: 't17', name: 'Ayurveda', category: 'NATURAL', tags: ['nutrição', 'doshas', 'indiana'], description: 'Sistema médico tradicional da Índia.' },
    { id: 't18', name: 'Acupuntura', category: 'NATURAL', tags: ['agulhas', 'qi', 'meridianos', 'dor'], description: 'Inserção de agulhas em pontos específicos.' },
    { id: 't19', name: 'Xamanismo', category: 'NATURAL', tags: ['natureza', 'animais', 'tambor'], description: 'Práticas ancestrais de conexão com a natureza.' },

    // E: SONORAS & FREQUENCIAIS
    { id: 't20', name: 'Sound Healing', category: 'SONORA', tags: ['som', 'vibração', 'tigelas'], description: 'Cura através de frequências sonoras.' },
    { id: 't21', name: 'Cromoterapia', category: 'SONORA', tags: ['cores', 'luz', 'chakras'], description: 'Uso das cores para estabelecer o equilíbrio.' },
];

export const SYMPTOM_TAGS = {
    PHYSICAL: ['Dor nas Costas', 'Enxaqueca', 'Insônia', 'Tensão Muscular', 'Digestão', 'Cansaço Físico'],
    EMOTIONAL: ['Ansiedade', 'Estresse', 'Luto', 'Falta de Foco', 'Tristeza', 'Medo']
};

export const MOCK_USERS: Record<string, User> = {
  'client1': {
    id: 'client1',
    name: 'Ana Silva',
    email: 'ana@email.com',
    role: UserRole.CLIENT,
    avatar: 'https://picsum.photos/100/100',
    streak: 3,
    lastLogin: new Date().toISOString(),
    level: 2,
    mood: 0,
    points: 340,
    favorites: ['pro2'],
    intents: ['Ansiedade', 'Foco'],
    gardenState: {
        phase: GardenPhase.PLANT,
        health: 85,
        elements: ['sun', 'water'],
        lastWatered: new Date().toISOString()
    },
    // Aura Data (Simulated)
    consumptionStats: {
        physical: 30, // Terracotta
        mental: 50,   // Blue
        energy: 20    // Violet
    },
    giftsAvailable: 3
  }
};

export const MOCK_PROS: Professional[] = [
  {
    id: 'pro1',
    name: 'Sofia Luz',
    email: 'sofia@viva360.com',
    role: UserRole.PROFESSIONAL,
    specialty: ['Reiki', 'Yoga'],
    bio: 'Especialista em alinhamento de chakras e Hatha Yoga. Minha missão é trazer equilíbrio energético para o seu dia a dia através de técnicas milenares adaptadas para a vida moderna.',
    rating: 4.9,
    location: 'Espaço Terapêutico Zen, SP',
    priceRange: '$$',
    avatar: 'https://picsum.photos/101/101'
  },
  {
    id: 'pro2',
    name: 'Pedro Alquimista',
    email: 'pedro@viva360.com',
    role: UserRole.PROFESSIONAL,
    specialty: ['Aromaterapia', 'Massagem'],
    bio: 'Terapia através dos óleos essenciais e toque terapêutico. Trabalho com sinergias personalizadas para cada momento da sua vida.',
    rating: 4.8,
    location: 'Vila Madalena, SP',
    priceRange: '$$$',
    avatar: 'https://picsum.photos/102/102'
  },
  {
    id: 'pro3',
    name: 'Clara Mente',
    email: 'clara@viva360.com',
    role: UserRole.PROFESSIONAL,
    specialty: ['Meditação', 'Mindfulness'],
    bio: 'Guiando você para o agora. Instrutora certificada de MBSR com foco em redução de estresse e ansiedade.',
    rating: 5.0,
    location: 'Online',
    priceRange: '$',
    avatar: 'https://picsum.photos/103/103'
  }
];

export const MOCK_SERVICES: Service[] = [
  { id: 's1', professionalId: 'pro1', name: 'Sessão de Reiki', duration: 60, price: 150, description: 'Reequilíbrio energético completo.', therapyType: 't1' },
  { id: 's2', professionalId: 'pro1', name: 'Aula de Yoga Particular', duration: 90, price: 200, description: 'Hatha Yoga focado em mobilidade.' },
  { id: 's3', professionalId: 'pro2', name: 'Massagem Relaxante', duration: 60, price: 180, description: 'Com óleos essenciais de lavanda.', therapyType: 't6' },
];

export const MOCK_PACKAGES: ServicePackage[] = [
    {
        id: 'pk1',
        spaceId: 'space1',
        name: 'Jornada Zen 5 Sessões',
        servicesIncluded: ['s2'],
        totalSessions: 5,
        price: 850, // 5 * 200 = 1000 - 15%
        discountPercentage: 15,
        description: 'Pacote promocional para prática contínua de Yoga.',
        active: true
    },
    {
        id: 'pk2',
        spaceId: 'space1',
        name: 'Detox Energético',
        servicesIncluded: ['s1', 's3'],
        totalSessions: 2,
        price: 300,
        discountPercentage: 10,
        description: 'Combo Reiki + Massagem para renovação total.',
        active: true
    }
];

export const MOCK_VACANCIES: Vacancy[] = [
    {
        id: 'v1',
        spaceId: 'space1',
        spaceName: 'Espaço Terapêutico Zen',
        role: 'Terapeuta Ayurveda',
        description: 'Buscamos profissional com experiência em massagem Abhyanga e Shirodhara para atuar às terças e quintas.',
        requirements: ['Certificação em Ayurveda', 'Experiência 2+ anos', 'MEI ativo'],
        type: 'Parceria/Split',
        postedAt: '2023-10-25'
    },
    {
        id: 'v2',
        spaceId: 'space2',
        spaceName: 'Casa Hamsá',
        role: 'Instrutor de Pilates',
        description: 'Vaga para instrutor de Pilates Solo e Aparelhos. Sala equipada disponível.',
        requirements: ['Fisioterapia ou Ed. Física', 'Cursos de especialização'],
        type: 'Parceria/Split',
        postedAt: '2023-10-24'
    }
];

export const MOCK_PRODUCTS: Product[] = [
  { 
      id: 'p1', 
      name: 'Kit Óleos Essenciais', 
      price: 89.90, 
      category: 'oil', 
      sellerId: 'pro2', 
      image: 'https://picsum.photos/200/200',
      description: 'Um kit completo com Lavanda, Hortelã-Pimenta e Limão Siciliano para o dia a dia.',
      holisticTip: 'Pingue 1 gota de Lavanda no travesseiro para um sono reparador.',
      canGift: true
  },
  { 
      id: 'p2', 
      name: 'Tapete de Yoga Eco', 
      price: 120.00, 
      category: 'mat', 
      sellerId: 'pro1', 
      image: 'https://picsum.photos/201/201',
      description: 'Tapete de borracha natural, aderente e biodegradável.',
      holisticTip: 'Limpe sempre com água e vinagre para purificar a energia da prática.'
  },
  { id: 'p3', name: 'Cristal de Quartzo', price: 45.00, category: 'crystal', sellerId: 'pro3', image: 'https://picsum.photos/202/202' },
  { id: 'p4', name: 'Workshop: Cura Interior', price: 250.00, category: 'workshop', sellerId: 'space1', image: 'https://picsum.photos/203/203' },
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt1',
    clientId: 'client1',
    professionalId: 'pro1',
    professionalName: 'Sofia Luz',
    serviceId: 's1',
    serviceName: 'Sessão de Reiki',
    date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    status: 'confirmed'
  },
  {
    id: 'apt2',
    clientId: 'client1',
    professionalId: 'pro2',
    professionalName: 'Pedro Alquimista',
    serviceId: 's3',
    serviceName: 'Massagem Relaxante',
    date: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
    status: 'completed'
  }
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', amount: 150.00, date: '2023-10-01', type: 'income', description: 'Sessão de Reiki - Ana Silva' },
  { id: 't2', amount: 200.00, date: '2023-10-02', type: 'income', description: 'Aula de Yoga - Carlos' },
  { id: 't3', amount: 180.00, date: '2023-10-03', type: 'income', description: 'Massagem - Ana Silva' },
];

export const MOCK_MESSAGES: ChatMessage[] = [
    { id: 'm1', senderId: 'pro1', text: 'Olá Ana, como você se sentiu após a última sessão?', timestamp: '10:30', isRead: true },
    { id: 'm2', senderId: 'client1', text: 'Me senti muito mais leve! Agradeço o cuidado.', timestamp: '10:35', isRead: true },
    { id: 'm3', senderId: 'pro1', text: 'Que ótimo! Lembre-se de beber bastante água hoje.', timestamp: '10:36', isRead: false },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
    { id: 'n1', title: 'Hora de respirar', message: 'Que tal uma pausa de 5min para sua prática?', type: 'reminder', timestamp: 'Agora', isRead: false },
    { id: 'n2', title: 'Pedido Enviado', message: 'Seu Kit de Óleos está a caminho.', type: 'system', timestamp: '2h atrás', isRead: true },
];

// --- CONTENT SUGGESTIONS & RIVER ---
export const MOCK_CONTENT: ContentItem[] = [
  { id: 'c1', type: 'meditation', title: 'Respiração para Ansiedade', description: 'Técnica 4-7-8 para acalmar o sistema nervoso.', duration: '5 min', moodTags: [1, 2], imageUrl: 'https://picsum.photos/id/10/300/200', isRiver: true, isGiftable: true },
  { id: 'c2', type: 'frequency', title: 'Frequência 432Hz', description: 'Sons binaurais para cura profunda e relaxamento.', duration: '15 min', moodTags: [1, 2, 3], imageUrl: 'https://picsum.photos/id/11/300/200', isRiver: true, isGiftable: true },
  { id: 'c3', type: 'article', title: 'O Poder da Gratidão', description: 'Como elevar sua vibração agradecendo as pequenas coisas.', duration: '3 min de leitura', moodTags: [3, 4, 5], imageUrl: 'https://picsum.photos/id/12/300/200', isRiver: true },
  { id: 'c4', type: 'sound', title: 'Sons da Floresta', description: 'Imersão na natureza para foco e paz.', duration: '30 min', moodTags: [3, 4], imageUrl: 'https://picsum.photos/id/16/300/200', isRiver: false },
  { id: 'c5', type: 'meditation', title: 'Expansão de Consciência', description: 'Visualize seus objetivos e irradie luz.', duration: '10 min', moodTags: [5], imageUrl: 'https://picsum.photos/id/28/300/200', isRiver: true, isGiftable: true },
  { id: 'c6', type: 'article', title: 'Cristais para Iniciantes', description: 'Entenda como a Ametista pode transmutar energias.', duration: '2 min de leitura', moodTags: [1, 2, 3, 4, 5], imageUrl: 'https://picsum.photos/id/32/300/200', isRiver: true },
  { id: 'c7', type: 'sound', title: 'Chuva Suave', description: 'Ruído branco natural para dormir melhor.', duration: '60 min', moodTags: [1, 2], imageUrl: 'https://picsum.photos/id/45/300/200', isRiver: true, isGiftable: true },
];

export const DAILY_TASKS: DailyTask[] = [
    { id: 'dt1', title: 'Fazer Check-in Emocional', isCompleted: false, type: 'checkin', points: 10 },
    { id: 'dt2', title: 'Beber 2L de água', isCompleted: false, type: 'habit', points: 5 },
    { id: 'dt3', title: 'Momento de Silêncio (5min)', isCompleted: false, type: 'content', points: 15 },
];

export const MOOD_HISTORY: MoodHistoryItem[] = [
    { date: 'Seg', value: 2 },
    { date: 'Ter', value: 3 },
    { date: 'Qua', value: 2 },
    { date: 'Qui', value: 4 },
    { date: 'Sex', value: 5 },
    { date: 'Sáb', value: 4 },
    { date: 'Dom', value: 5 },
];

export const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// --- PRIVACY MOCKS ---
export const MOCK_GRANTS: HealthAccessGrant[] = [
    { 
        professionalId: 'pro1', 
        professionalName: 'Sofia Luz', 
        avatar: MOCK_PROS[0].avatar || '', 
        role: 'Terapeuta Holística',
        grantedAt: '2023-09-10',
        permissions: {
            readHistory: true,
            insertOnly: false,
            emergency: false
        }
    },
    { 
        professionalId: 'pro2', 
        professionalName: 'Pedro Alquimista', 
        avatar: MOCK_PROS[1].avatar || '', 
        role: 'Aromaterapeuta',
        grantedAt: '2023-10-01',
        permissions: {
            readHistory: false,
            insertOnly: true,
            emergency: false
        }
    }
];

export const MOCK_SHARING_REQUESTS: DataSharingRequest[] = [
    {
        id: 'req1',
        fromProId: 'pro1',
        fromProName: 'Sofia Luz',
        toProId: 'pro3',
        toProName: 'Clara Mente',
        toProAvatar: MOCK_PROS[2].avatar || '',
        reason: 'Encaminhamento para Mindfulness complementar.',
        status: 'pending',
        requestedAt: '2023-10-26T10:00:00Z'
    }
];