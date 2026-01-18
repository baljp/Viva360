export enum UserRole {
  CLIENT = 'CLIENT',
  PROFESSIONAL = 'PROFESSIONAL',
  SPACE = 'SPACE'
}

export enum GardenPhase {
  SEED = 'SEED',       // Dia 0
  SPROUT = 'SPROUT',   // Dia 1-2
  PLANT = 'PLANT',     // Dia 3-6
  FLOWER = 'FLOWER',   // Dia 7+
  DORMANT = 'DORMANT'  // Ausência > 5 dias (Não morre, apenas dorme)
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'neutral';
  title: string;
  message?: string;
  duration?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  streak?: number; // Days in a row
  lastLogin?: string; // ISO Date for dormancy check
  level?: number; // 1-5 for Monk Journey
  mood?: number; // 1-5 (Current)
  points?: number; // Gamification points
  favorites?: string[];
  intents?: string[]; // Onboarding intent tags
  gardenState?: GardenState; // New: Gamification State
  isVerified?: boolean; // Trust & Safety
  // Extended Profile Data
  bio?: string;
  phone?: string;
  address?: string;
  // Social & Aura Data
  consumptionStats?: {
      physical: number; // 0-100
      mental: number;   // 0-100
      energy: number;   // 0-100
  };
  giftsAvailable?: number;
}

export interface GardenState {
  phase: GardenPhase; 
  health: number; // 0-100% (Based on consistency)
  elements: string[]; // ['sun', 'bird', 'water'] - unlocked by actions
  lastWatered: string; // ISO Date
}

export interface MoodOption {
    id: string;
    label: string; // "Cansado", "Ansioso"
    icon: any; // Lucide Icon Component
    color: string; // Tailwind class partial e.g. 'blue'
    suggestionContext: string; // "low_effort", "grounding"
}

export interface Professional extends User {
  specialty: string[];
  bio: string;
  rating: number;
  location: string;
  priceRange: string;
  services?: Service[];
  certificateStatus?: 'pending' | 'verified' | 'none';
}

// --- HOLISTIC ONTOLOGY TYPES ---
export type TherapyCategory = 
  | 'ENERGETICA' 
  | 'CORPORAL' 
  | 'MENTE' 
  | 'NATURAL' 
  | 'SONORA';

export interface TherapyType {
    id: string;
    name: string;
    category: TherapyCategory;
    tags: string[]; // Keywords for search
    description: string;
}

export interface Service {
  id: string;
  professionalId?: string; // Optional if Space owned
  spaceId?: string;
  name: string;
  duration: number; // minutes
  price: number;
  description: string;
  modality?: 'online' | 'presential' | 'both';
  therapyType?: string; // Links to TherapyType.id
  tags?: string[]; // Custom tags
}

export interface ServicePackage {
  id: string;
  spaceId: string;
  name: string;
  servicesIncluded: string[]; // Service IDs
  totalSessions: number;
  price: number;
  discountPercentage: number;
  description: string;
  active: boolean;
}

export interface Vacancy {
  id: string;
  spaceId: string;
  spaceName: string;
  role: string;
  description: string;
  requirements: string[];
  type: 'Full-time' | 'Part-time' | 'Parceria/Split';
  postedAt: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  professionalId: string;
  serviceId: string;
  serviceName: string;
  professionalName: string;
  date: string; // ISO string
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  notes?: string;
  type?: 'online' | 'presential'; // New
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: 'oil' | 'mat' | 'incense' | 'crystal' | 'workshop';
  sellerId: string;
  holisticTip?: string; // "Dica de Uso"
  description?: string;
  canGift?: boolean; // New: Gift of Calm eligible
}

// --- COMMERCE TYPES ---
export interface CartItem {
  id: string;
  type: 'product' | 'service';
  name: string;
  price: number;
  quantity: number;
  image?: string;
  // Service Specifics
  date?: string; 
  professionalName?: string;
  serviceId?: string;
  professionalId?: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  date: string;
  status: 'paid' | 'pending';
  method: 'credit_card' | 'pix';
}

export interface Transaction {
  id: string;
  amount: number;
  date: string;
  type: 'income' | 'payout' | 'refund';
  description: string;
  status?: 'pending' | 'paid';
  clientName?: string;
  clientAvatar?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'reminder' | 'promo' | 'system';
  timestamp: string;
  isRead: boolean;
}

export interface MedicalRecord {
    id: string;
    clientId: string;
    professionalId: string;
    date: string;
    notes: string;
    evolution: 'stable' | 'improving' | 'needs_attention';
    tags: string[];
}

// --- HEALTH & PRIVACY TYPES ---
export interface HealthAccessGrant {
    professionalId: string;
    professionalName: string;
    avatar: string;
    role: string;
    grantedAt: string;
    expiresAt?: string;
    permissions: {
        readHistory: boolean;
        insertOnly: boolean;
        emergency: boolean;
    };
}

export interface DataSharingRequest {
    id: string;
    fromProId: string;
    fromProName: string;
    toProId: string;
    toProName: string;
    toProAvatar: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: string;
}

export interface AnamnesisData {
    stressLevel: number; // 0-100
    sleepQuality: number; // 0-100
    digestion: number; // 0-100
    energy: number; // 0-100
    lastUpdate: string;
}

// --- NEW TYPES FOR EMOTIONAL INTELLIGENCE & JOURNEY ---

export interface ContentItem {
  id: string;
  type: 'meditation' | 'frequency' | 'article' | 'sound';
  title: string;
  description: string;
  duration?: string; // e.g. "5 min"
  moodTags: number[]; // 1-5, which moods this helps
  imageUrl?: string;
  isRiver?: boolean; // If true, appears in the "Rio de Conteúdo"
  isGiftable?: boolean; // New
}

export interface DailyTask {
  id: string;
  title: string;
  isCompleted: boolean;
  type: 'checkin' | 'content' | 'habit';
  points: number;
}

export interface MoodHistoryItem {
  date: string; // Short date string e.g. "Seg"
  value: number; // 1-5
}

// --- SPACE METRICS ---
export interface SpaceMetrics {
  totalRevenue: number;
  healingIndex: number; // 0-100 NPS equivalent
  occupancyRate: number; // %
  activePros: number;
}

// --- COMMISSION & SPLIT TYPES ---
export interface CommissionRule {
    id: string;
    targetName: string; // e.g. "Massoterapeutas" or "Dr. Andre"
    targetType: 'role' | 'individual';
    splitPercentage: number; // 0-100 (Percentage to Professional)
    fixedFee?: number; // Optional fixed fee per session
    isActive: boolean;
}

export enum ViewState {
  // Auth & Onboarding
  SPLASH = 'SPLASH',
  ONBOARDING_WALKTHROUGH = 'ONBOARDING_WALKTHROUGH',
  ROLE_SELECTION = 'ROLE_SELECTION',
  ONBOARDING_INTENT = 'ONBOARDING_INTENT',
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  
  // Client Main
  CLIENT_HOME = 'CLIENT_HOME',
  CLIENT_SEARCH = 'CLIENT_SEARCH',
  CLIENT_PRO_DETAILS = 'CLIENT_PRO_DETAILS',
  CLIENT_CALENDAR = 'CLIENT_CALENDAR',
  CLIENT_MARKET = 'CLIENT_MARKET',
  CLIENT_PRODUCT_DETAILS = 'CLIENT_PRODUCT_DETAILS',
  CLIENT_PROFILE = 'CLIENT_PROFILE',
  
  // Client Flows (Booking & Commerce)
  CLIENT_BOOKING_FLOW = 'CLIENT_BOOKING_FLOW',
  CLIENT_CART = 'CLIENT_CART', 
  CLIENT_CHECKOUT = 'CLIENT_CHECKOUT', 
  CLIENT_SUCCESS = 'CLIENT_SUCCESS', 
  CLIENT_ORDERS = 'CLIENT_ORDERS', 
  
  // Client Consumption
  CLIENT_VIDEO_ROOM = 'CLIENT_VIDEO_ROOM', 
  CLIENT_TICKET = 'CLIENT_TICKET', 
  
  // Client Features
  CLIENT_JOURNEY = 'CLIENT_JOURNEY',
  CLIENT_METRICS = 'CLIENT_METRICS',
  CLIENT_CHAT = 'CLIENT_CHAT',
  CLIENT_NOTIFICATIONS = 'CLIENT_NOTIFICATIONS',
  
  // Professional
  PRO_HOME = 'PRO_HOME',
  PRO_AGENDA = 'PRO_AGENDA',
  PRO_CLIENTS = 'PRO_CLIENTS',
  PRO_RECORDS = 'PRO_RECORDS',
  PRO_FINANCE = 'PRO_FINANCE',
  PRO_OPPORTUNITIES = 'PRO_OPPORTUNITIES', 
  
  // Space (Formerly Hub)
  SPACE_HOME = 'SPACE_HOME',
  SPACE_TEAM = 'SPACE_TEAM',
  SPACE_PATIENTS = 'SPACE_PATIENTS',
  SPACE_FINANCE = 'SPACE_FINANCE',
  SPACE_MANAGEMENT = 'SPACE_MANAGEMENT',

  // Shared / Support / Settings
  SETTINGS = 'SETTINGS', // Main Settings Hub
  VERIFICATION = 'VERIFICATION', 
  TERMS = 'TERMS', 
  INVITE_FRIEND = 'INVITE_FRIEND',
  SUPPORT = 'SUPPORT',
  
  // Detailed Settings Sub-Views
  SETTINGS_PROFILE_EDIT = 'SETTINGS_PROFILE_EDIT', // Identity
  SETTINGS_PRIVACY_HEALTH = 'SETTINGS_PRIVACY_HEALTH', // Client Anamnesis & LGPD
  SETTINGS_PRO_SERVICES = 'SETTINGS_PRO_SERVICES', // Pro Service Editor
  SETTINGS_PRO_AGENDA = 'SETTINGS_PRO_AGENDA', // Pro Agenda Config
  SETTINGS_COMMISSION = 'SETTINGS_COMMISSION', // Space Split Engine
  SETTINGS_ROOMS = 'SETTINGS_ROOMS' // Space Room Manager
}