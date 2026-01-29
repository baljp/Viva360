export enum UserRole {
  CLIENT = 'CLIENT',
  PROFESSIONAL = 'PROFESSIONAL',
  SPACE = 'SPACE',
  ADMIN = 'ADMIN'
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
  CLIENT_ORACLE = 'CLIENT_ORACLE',
  CLIENT_RITUAL_BUILDER = 'CLIENT_RITUAL_BUILDER',
  CLIENT_METAMORPHOSIS = 'CLIENT_METAMORPHOSIS',
  CLIENT_TIMELAPSE = 'CLIENT_TIMELAPSE',

  // Space additions
  SPACE_CALENDAR = 'SPACE_CALENDAR',
  
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
  PRO_MARKETPLACE = 'PRO_MARKETPLACE',

  SPACE_HOME = 'SPACE_HOME',
  SPACE_TEAM = 'SPACE_TEAM',
  SPACE_TEAM_DETAILS = 'SPACE_TEAM_DETAILS',
  SPACE_RECRUITMENT = 'SPACE_RECRUITMENT', 
  SPACE_VACANCY_DETAILS = 'SPACE_VACANCY_DETAILS',
  SPACE_DASHBOARD = 'SPACE_DASHBOARD',
  SPACE_FINANCE = 'SPACE_FINANCE',
  SPACE_ROOMS = 'SPACE_ROOMS',
  SPACE_MARKETPLACE = 'SPACE_MARKETPLACE',

  SETTINGS = 'SETTINGS',
  SETTINGS_PROFILE = 'SETTINGS_PROFILE',
  SETTINGS_SECURITY = 'SETTINGS_SECURITY',
  SETTINGS_NOTIFICATIONS = 'SETTINGS_NOTIFICATIONS',
  SETTINGS_WALLET = 'SETTINGS_WALLET',

  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  ADMIN_USERS = 'ADMIN_USERS',
  ADMIN_METRICS = 'ADMIN_METRICS',
  ADMIN_FINANCE = 'ADMIN_FINANCE',
  ADMIN_LGPD = 'ADMIN_LGPD',
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
  image: string; // Renamed from imageUrl to match frontend usage
  imageUrl?: string; // Keeping for backward compat if needed
  date: string;
  mood?: MoodType;
  note?: string;
  timeSlot?: 'morning' | 'afternoon' | 'night';
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

// Add RecordAccess interface for Shared Medical Records (LGPD)
export interface RecordAccess {
  id: string;
  patientId: string;
  ownerProId: string;
  grantedToProId: string;
  grantedToProName: string;
  grantedToProAvatar: string;
  permissions: 'read' | 'write';
  status: 'active' | 'revoked';
  grantedAt: string;
  consentHash: string; // Mock hash for LGPD consent logging
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
  lastWateredAt?: string; // ISO date for garden logic
  plantHealth?: number; // 0-100
  wateredBy?: string[]; // IDs of friends who helped today
  lastBlessingAt?: string; // ISO date of last Guardian blessing
  bio?: string;
  intention?: string;
  plantStage?: PlantStage;
  plantXp?: number; 
  plantType?: string; // Variety (oak, lotus, etc.)
  journeyType?: string; // Archetype (emocional, mental, etc.)
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
  location?: string;
  favorites?: string[];
  rating?: number; // Added for unified rating access
  reviewCount?: number; // Added for unified rating access
  ritualsCompleted?: number;
  tribeInteractions?: number;
  curationSessions?: number;
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
  reviews?: Review[];
}

export interface Product { 
  id: string; 
  name: string; 
  price: number; 
  image: string; 
  category: string; 
  type: 'physical' | 'service' | 'digital_content' | 'event' | 'workshop';
  description?: string;
  ownerId?: string;
  // Novos campos para Eventos/Workshops e Farmácia da Alma
  eventDate?: string;
  hostName?: string;
  symptoms?: string[]; // Ex: ['Ansiedade', 'Insônia']
  karmaReward?: number;
  spotsLeft?: number;
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
}

export interface Notification {
  id: string;
  userId: string;
  type: 'alert' | 'message' | 'ritual' | 'finance';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority?: 'high' | 'normal' | 'low';
  actionUrl?: string; // Deep link
  metadata?: any;
}

export interface SpaceRoom {
  id: string;
  name: string;
  status: 'available' | 'occupied';
  currentOccupant?: string;
  nextSession?: string;
  generatedRevenue?: number;
  image?: string; // Added for mock visuals
}

// Add Transaction interface
export interface Transaction {
  id: string;
  userId: string;
  providerId?: string; // Who receives funds (after split)
  type: 'income' | 'expense' | 'deposit' | 'withdrawal';
  amount: number;
  currency: string;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod?: 'credit_card' | 'pix' | 'wallet';
  split?: {
    platform: number;
    provider: number;
  };
}

// Add Review interface
export interface Review {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  targetId: string; // ID do Profissional ou Espaço
  rating: number; // Inteiro 1-5
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

// Chat System Types
export interface ChatParticipant {
  id: string;
  name: string;
  avatar: string;
  role: 'CLIENT' | 'PRO' | 'COMMUNITY' | 'SYSTEM';
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  read: boolean;
  type?: 'text' | 'image' | 'audio' | 'system';
}

export interface ChatRoom {
  id: string;
  participants: ChatParticipant[];
  lastMessage?: Message;
  unreadCount: number;
  type: 'private' | 'group' | 'channel';
  isPact?: boolean;
  pactLabel?: string;
  typing?: string[]; // IDs of users typing
}

// Community / Tribe Types
export interface TribePost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  timestamp: string;
  isLiked?: boolean;
  type: 'insight' | 'question' | 'celebration';
}

// Santuário Types
export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: number; // minutes
  facilitatorId: string;
  facilitatorName: string;
  price: number;
  capacity: number;
  enrolled: number;
  location: string; // Room ID or 'Online'
  image: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  tags: string[];
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  proposerId: string;
  proposerName: string;
  type: 'financial' | 'rule' | 'expansion';
  status: 'active' | 'approved' | 'rejected';
  votesFor: number;
  votesAgainst: number;
  deadline: string;
  myVote?: 'for' | 'against';
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'maintenance';
  uptime: number; // seconds
  activeUsers: number;
  serverLoad: number; // percentage
  dbLatency: number; // ms
}

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'received';
}
