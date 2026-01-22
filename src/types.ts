
export enum UserRole {
  CLIENT = 'CLIENT',
  PROFESSIONAL = 'PROFESSIONAL',
  SPACE = 'SPACE'
}

export type MoodType = 'SERENO' | 'VIBRANTE' | 'MELANCÓLICO' | 'ANSIOSO' | 'FOCADO' | 'EXAUSTO' | 'GRATO';

// REFACTORED: Plant definitions (Uppercase as per Phase 1)
export type PlantStage = 'SEED' | 'SPROUT' | 'SAPLING' | 'TREE' | 'BLOOM';
export type PlantState = 'THIRSTY' | 'HEALTHY' | 'WITHERING';

// NEW: User Progress
export interface UserProgress {
  xp: number;
  level: number; // Symbolic level
  streak: number;
  multiplier: number;
}

export enum ViewState {
  SPLASH = 'SPLASH',
  LANDING = 'LANDING',
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  REGISTER_CLIENT = 'REGISTER_CLIENT',
  REGISTER_PRO = 'REGISTER_PRO',
  REGISTER_SPACE = 'REGISTER_SPACE',
  
  CLIENT_HOME = 'CLIENT_HOME', 
  CLIENT_JOURNEY = 'CLIENT_JOURNEY',
  CLIENT_RITUAL = 'CLIENT_RITUAL',
  CLIENT_EXPLORE = 'CLIENT_EXPLORE',
  CLIENT_MARKETPLACE = 'CLIENT_MARKETPLACE',
  CLIENT_TRIBO = 'CLIENT_TRIBO', 
  CLIENT_MEDITATION = 'CLIENT_MEDITATION',
  CLIENT_ACHIEVEMENTS = 'CLIENT_ACHIEVEMENTS',
  CLIENT_SEARCH = 'CLIENT_SEARCH',
  CLIENT_SOUL_PHARMACY = 'CLIENT_SOUL_PHARMACY',
  CLIENT_NETWORK = 'CLIENT_NETWORK',
  
  CLIENT_PRO_DETAILS = 'CLIENT_PRO_DETAILS',
  CLIENT_PRODUCT_DETAILS = 'CLIENT_PRODUCT_DETAILS',
  CLIENT_CHECKOUT = 'CLIENT_CHECKOUT',
  CLIENT_CHECKOUT_SUCCESS = 'CLIENT_CHECKOUT_SUCCESS',
  CLIENT_VIDEO_SESSION = 'CLIENT_VIDEO_SESSION',
  CLIENT_ORDERS = 'CLIENT_ORDERS',

  NOT_FOUND = 'NOT_FOUND',

  PRO_HOME = 'PRO_HOME',
  PRO_AGENDA = 'PRO_AGENDA',
  PRO_PATIENTS = 'PRO_PATIENTS',
  PRO_PATIENT_DETAILS = 'PRO_PATIENT_DETAILS',
  PRO_NETWORK = 'PRO_NETWORK', 
  PRO_OPPORTUNITIES = 'PRO_OPPORTUNITIES', 
  PRO_FINANCE = 'PRO_FINANCE',

  SPACE_HOME = 'SPACE_HOME',
  SPACE_TEAM = 'SPACE_TEAM',
  SPACE_TEAM_DETAILS = 'SPACE_TEAM_DETAILS',
  SPACE_RECRUITMENT = 'SPACE_RECRUITMENT', 
  SPACE_VACANCY_DETAILS = 'SPACE_VACANCY_DETAILS',
  SPACE_DASHBOARD = 'SPACE_DASHBOARD',
  SPACE_FINANCE = 'SPACE_FINANCE',
  SPACE_ROOMS = 'SPACE_ROOMS',
  SPACE_CALENDAR = 'SPACE_CALENDAR',

  PRIVACY = 'PRIVACY',
  TERMS = 'TERMS',

  SETTINGS = 'SETTINGS',
  SETTINGS_PROFILE = 'SETTINGS_PROFILE',
  SETTINGS_SECURITY = 'SETTINGS_SECURITY',
  SETTINGS_NOTIFICATIONS = 'SETTINGS_NOTIFICATIONS',
  SETTINGS_WALLET = 'SETTINGS_WALLET',
}

export interface Badge {
  id: string;
  label: string;
  icon: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface DailyQuest {
  id: string;
  label: string;
  reward: number;
  isCompleted: boolean;
  type: 'ritual' | 'water' | 'breathe' | 'other';
}

export interface DailyRitualSnap {
  id: string;
  imageUrl: string;
  date: string;
}

// REFACTORED: Tribe / Constellation definitions
export interface TribeConnection {
  id: string; // Connection ID
  userId: string; // The other user's ID
  name: string;
  avatar: string;
  lastInteraction?: string; // Date ISO string
  needsWatering?: boolean; // If true, their plant is thirsty
}

// Alias ConstellationMember to TribeConnection for backward compatibility if needed, 
// or replace it. For now, let's keep TribeConnection as the main one.
export type ConstellationMember = TribeConnection;

export interface ConstellationPact {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string;
  missionLabel: string;
  myProgress: number;
  partnerProgress: number;
  target: number;
  rewardKarma: number;
  endDate: string;
  status: 'active' | 'completed';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  
  // Progress & Gamification (Refactored)
  progress?: UserProgress; // New explicit structure
  karma: number; // Redundant with progress, but keeping for legacy
  streak: number; // Redundant with progress, but keeping for legacy
  multiplier: number; // Redundant with progress, but keeping for legacy
  
  // Plant
  plantStage?: PlantStage;
  plantState?: PlantState; // New field
  plantXp?: number; 
  
  lastCheckIn?: string;
  bio?: string;
  intention?: string;
  corporateBalance: number;
  personalBalance: number;
  lastMood?: MoodType;
  badges?: Badge[];
  radianceScore?: number;
  activePact?: ConstellationPact;
  constellation?: TribeConnection[]; // Updated type
  isVerified?: boolean;
  inventory?: { incense: number; crystals: number };
  dailyQuests?: DailyQuest[];
  snaps?: DailyRitualSnap[];
  constellationInvites?: any[];
  prestigeLevel?: number;
}

export interface Professional extends User {
  specialty: string[];
  rating: number;
  pricePerSession: number;
  totalHealingHours: number;
  bio: string;
  reviewCount?: number;
  location?: string;
  swapCredits?: number;
  offers?: string[];
  hubId?: string;
  licenseNumber?: string;
  isAvailableForSwap?: boolean;
  needs?: string[];
  userId?: string;
}

// REFACTORED: Product definitions for V2 (4 Pillars)
export interface Product { 
  id: string; 
  name: string; 
  price: number; 
  image: string; 
  category: string; 
  type: 'physical' | 'digital' | 'service' | 'event'; // V2 Update
  description?: string;
  // V2: Specific fields
  eventDate?: string;
  duration?: number;
  downloadUrl?: string;
}

export interface CartItem extends Product {
  quantity: number;
  appointmentDetails?: {
    date: string;
    time: string;
    professionalId: string;
    professionalName: string;
  };
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  professionalId: string;
  professionalName: string;
  time: string;
  date: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  serviceName: string;
  price: number;
  duration?: number;
  type: 'paid' | 'swap' | 'voucher'; // V2 Update
}

// REFACTORED: Notification categories V2
export type NotificationType = 'SYSTEM' | 'SOCIAL' | 'REMINDER' | 'BOOKING' | 'VACANCY' | 'SWAP' | 'EVENT';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface SpaceRoom {
  id: string;
  name: string;
  status: 'available' | 'occupied' | 'maintenance';
  currentOccupant?: string;
  capacity: number;
  resources: string[];
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending';
}

export interface Review {
  id: string;
  authorName: string;
  authorAvatar: string;
  rating: number;
  comment: string;
  date: string;
  tags: string[];
}

// V2: Vacancy System
export interface Vacancy {
  id: string;
  hubId: string;
  title: string;
  specialties: string[];
  description: string;
  applicantsCount: number;
  createdAt: string;
  status: 'open' | 'closed';
  // V2 additions
  type: 'fixed' | 'temporary' | 'event';
  schedule: string; // e.g., "Mon-Wed 09-12"
  modality: 'presencial' | 'online';
  split: string; // e.g., "70/30" or "R$ 50/h"
  isInviteOnly?: boolean;
}

// V2: Swap System
export interface SwapOffer {
  id: string;
  professionalId: string;
  offer: string; // "1 Sessão de Reiki"
  seek: string; // "1 Sessão de Yoga"
  status: 'active' | 'matched' | 'completed';
  createdAt: string;
}

// --- MOCK DATA (Initial Phase 1) ---
export const MOCK_INITIAL_PLANT: { stage: PlantStage, state: PlantState, xp: number } = {
  stage: 'SPROUT',
  state: 'THIRSTY',
  xp: 15
};

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n-001',
    userId: 'user-1',
    type: 'SYSTEM',
    title: 'Bem-vindo ao Viva360',
    message: 'Seu jardim da alma está pronto para ser cultivado.',
    timestamp: new Date().toISOString(),
    read: false
  },
  {
    id: 'n-002',
    userId: 'user-1',
    type: 'SOCIAL',
    title: 'Nova Conexão',
    message: 'Lucas Paz enviou luz para o seu jardim.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: true
  },
  {
    id: 'n-003',
    userId: 'user-1',
    type: 'REMINDER',
    title: 'Hora do Ritual',
    message: 'A lua está propícia para a sua meditação.',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    read: false
  },
  {
    id: 'n-004',
    userId: 'user-1',
    type: 'BOOKING',
    title: 'Sessão Confirmada',
    message: 'Sua sessão com Dra. Ana começa amanhã às 14h.',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    read: true,
    actionUrl: '/agenda'
  },
  {
    id: 'n-005',
    userId: 'user-1',
    type: 'SYSTEM',
    title: 'Nível Alcançado!',
    message: 'Você atingiu o nível Semente de Luz.',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    read: true
  }
];
