
export enum UserRole {
  CLIENT = 'CLIENT',
  PROFESSIONAL = 'PROFESSIONAL',
  SPACE = 'SPACE'
}

export type MoodType = 'SERENO' | 'VIBRANTE' | 'MELANCÓLICO' | 'ANSIOSO' | 'FOCADO' | 'EXAUSTO' | 'GRATO';
export type PlantStage = 'seed' | 'sprout' | 'bud' | 'flower' | 'tree' | 'withered';

export enum ViewState {
  SPLASH = 'SPLASH',
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

  SETTINGS = 'SETTINGS',
  SETTINGS_PROFILE = 'SETTINGS_PROFILE',
  SETTINGS_SECURITY = 'SETTINGS_SECURITY',
  SETTINGS_NOTIFICATIONS = 'SETTINGS_NOTIFICATIONS',
  SETTINGS_WALLET = 'SETTINGS_WALLET',
}

// Add Badge interface
export interface Badge {
  id: string;
  label: string;
  icon: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// Add DailyQuest interface
export interface DailyQuest {
  id: string;
  label: string;
  reward: number;
  isCompleted: boolean;
  type: 'ritual' | 'water' | 'breathe' | 'other';
}

// Add DailyRitualSnap interface
export interface DailyRitualSnap {
  id: string;
  imageUrl: string;
  date: string;
}

// Add ConstellationMember interface
export interface ConstellationMember {
  id: string;
  name: string;
  avatar: string;
  needsWatering?: boolean;
}

// Add ConstellationPact interface
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
  karma: number; 
  streak: number; 
  multiplier: number;
  lastCheckIn?: string;
  bio?: string;
  intention?: string;
  plantStage?: PlantStage;
  plantXp?: number; 
  corporateBalance: number;
  personalBalance: number;
  lastMood?: MoodType;
  badges?: Badge[];
  radianceScore?: number;
  activePact?: ConstellationPact;
  constellation?: ConstellationMember[];
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
}

export interface Product { 
  id: string; 
  name: string; 
  price: number; 
  image: string; 
  category: string; 
  type: 'physical' | 'service' | 'digital_content';
  description?: string;
}

// Add CartItem interface
export interface CartItem extends Product {
  quantity: number;
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
}

export interface Notification {
  id: string;
  userId: string;
  type: 'alert' | 'message' | 'ritual' | 'finance';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface SpaceRoom {
  id: string;
  name: string;
  status: 'available' | 'occupied';
  currentOccupant?: string;
}

// Add Transaction interface
export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending';
}

// Add Review interface
export interface Review {
  id: string;
  authorName: string;
  authorAvatar: string;
  rating: number;
  comment: string;
  date: string;
  tags: string[];
}

// Add Vacancy interface
export interface Vacancy {
  id: string;
  hubId: string;
  title: string;
  specialties: string[];
  description: string;
  applicantsCount: number;
  createdAt: string;
  status: 'open' | 'closed';
}
