
import React from 'react';
import { lazyWithRetry } from '../utils/lazyWithRetry';

// --- HELPER FOR NAMED EXPORTS ---
// Usage: const Component = lazyNamed(() => import('path'), 'ComponentName');
const lazyNamed = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ [key: string]: any }>, 
  componentName: string
) => {
  return lazyWithRetry(
    () => importFunc().then(module => ({ default: module[componentName] })),
    `screen-${componentName}`
  );
};

// --- BUSCADOR SCREENS ---
const ClientDashboard = lazyNamed(() => import('../../views/client/ClientDashboard'), 'ClientDashboard');
const SettingsViews = lazyNamed(() => import('../../views/SettingsViews'), 'SettingsViews');
const OracleView = lazyNamed(() => import('../../views/client/OracleView'), 'OracleView');
const MetamorphosisWizard = lazyNamed(() => import('../../views/metamorphosis/MetamorphosisWizard'), 'MetamorphosisWizard');
const TimeLapseView = lazyNamed(() => import('../../views/metamorphosis/TimeLapseView'), 'TimeLapseView');
const InternalGarden = lazyNamed(() => import('../../views/client/InternalGarden'), 'InternalGarden');
const TribeView = lazyNamed(() => import('../../views/client/TribeView'), 'TribeView');
const MapaDaCuraView = lazyNamed(() => import('../../views/client/MapaDaCuraView'), 'MapaDaCuraView');
const BookingSelect = lazyNamed(() => import('../../views/client/BookingSelect'), 'BookingSelect');
const RitualsView = lazyNamed(() => import('../../views/client/RitualsView'), 'RitualsView');

// --- BUSCADOR GENERATED (Default Exports usually) ---
const BookingConfirm = lazyWithRetry(() => import('../../views/client/generated/BookingConfirm'), 'BookingConfirm');
const PaymentSuccess = lazyWithRetry(() => import('../../views/client/generated/PaymentSuccess'), 'PaymentSuccess');
const TribeInvite = lazyWithRetry(() => import('../../views/client/generated/TribeInvite'), 'TribeInvite');
const TribeInteraction = lazyWithRetry(() => import('../../views/client/generated/TribeInteraction'), 'TribeInteraction');
const ChatListScreen = lazyWithRetry(() => import('../../views/client/chat/ChatListScreen'), 'ChatListScreen');
const ChatRoomScreen = lazyWithRetry(() => import('../../views/client/chat/ChatRoomScreen'), 'ChatRoomScreen');
const CheckoutScreen = lazyWithRetry(() => import('../../views/client/financial/CheckoutScreen'), 'CheckoutScreen');
const PaymentHistoryScreen = lazyWithRetry(() => import('../../views/client/financial/PaymentHistoryScreen'), 'PaymentHistoryScreen');
const OrdersListView = lazyNamed(() => import('../../views/ServiceViews'), 'OrdersListView');
const ClientMarketplace = lazyNamed(() => import('../../views/client/ClientMarketplace'), 'ClientMarketplace');
const EvolutionView = lazyNamed(() => import('../../views/client/garden/EvolutionView'), 'EvolutionView');
const EvolutionAnalytics = lazyNamed(() => import('../../views/client/garden/EvolutionAnalytics'), 'EvolutionAnalytics');
const KarmaWallet = lazyWithRetry(() => import('../../views/client/garden/KarmaWallet'), 'KarmaWallet'); // Default export
const AchievementsView = lazyNamed(() => import('../../views/client/garden/AchievementsView'), 'AchievementsView');
const EmotionalHistory = lazyNamed(() => import('../../views/client/garden/EmotionalHistory'), 'EmotionalHistory');
const TimeLapseExperience = lazyNamed(() => import('../../views/client/garden/TimeLapseExperience'), 'TimeLapseExperience');
const OracleGrimoire = lazyNamed(() => import('../../views/client/garden/OracleGrimoire'), 'OracleGrimoire');
const CollectionGrimoire = lazyNamed(() => import('../../views/client/garden/CollectionGrimoire'), 'CollectionGrimoire');
const SoulJournalView = lazyNamed(() => import('../../views/client/journal/SoulJournalView'), 'SoulJournalView');
const HealingCircleEntry = lazyNamed(() => import('../../views/client/tribe/HealingCircleEntry'), 'HealingCircleEntry');
const SoulPactInteraction = lazyNamed(() => import('../../views/client/tribe/SoulPactInteraction'), 'SoulPactInteraction');
const OfflineRetreat = lazyNamed(() => import('../../views/client/tribe/OfflineRetreat'), 'OfflineRetreat');
const ClientQuestsView = lazyNamed(() => import('../../views/client/garden/ClientQuestsView'), 'ClientQuestsView');

// --- GUARDIAO SCREENS ---
const ProDashboard = lazyNamed(() => import('../../views/pro/ProDashboard'), 'ProDashboard');
const ProFinance = lazyNamed(() => import('../../views/pro/ProFinance'), 'ProFinance');
const ProTribe = lazyNamed(() => import('../../views/pro/ProTribe'), 'ProTribe');
const ProMarketplace = lazyNamed(() => import('../../views/pro/ProMarketplace'), 'ProMarketplace');
const AlquimiaCreateOffer = lazyNamed(() => import('../../views/pro/AlquimiaCreateOffer'), 'AlquimiaCreateOffer');
const AlquimiaProposeTrade = lazyNamed(() => import('../../views/pro/AlquimiaProposeTrade'), 'AlquimiaProposeTrade');
const VideoSessionView = lazyNamed(() => import('../../views/ServiceViews'), 'VideoSessionView');
const VideoPrepScreen = lazyNamed(() => import('../../views/pro/VideoPrepScreen'), 'VideoPrepScreen');
const CustomInterventionWizard = lazyNamed(() => import('../../views/pro/CustomInterventionWizard'), 'CustomInterventionWizard');

// --- GUARDIAO GENERATED ---
const AgendaView = lazyWithRetry(() => import('../../views/pro/generated/AgendaView'), 'AgendaView');
const PatientsList = lazyWithRetry(() => import('../../views/pro/generated/PatientsList'), 'PatientsList');
const PatientProfile = lazyWithRetry(() => import('../../views/pro/generated/PatientProfile'), 'PatientProfile');
const PatientEvolutionView = lazyWithRetry(() => import('../../views/pro/generated/PatientEvolutionView'), 'PatientEvolutionView');
const VagasList = lazyWithRetry(() => import('../../views/pro/generated/VagasList'), 'VagasList');
const ProChatListScreen = lazyWithRetry(() => import('../../views/pro/chat/ProChatListScreen'), 'ProChatListScreen');
const ProChatRoomScreen = lazyWithRetry(() => import('../../views/pro/chat/ProChatRoomScreen'), 'ProChatRoomScreen');
const WalletViewScreen = lazyWithRetry(() => import('../../views/pro/financial/WalletViewScreen'), 'WalletViewScreen');
const SantuarioListView = lazyNamed(() => import('../../views/pro/SantuarioListView'), 'SantuarioListView');
const SantuarioProfileView = lazyNamed(() => import('../../views/pro/SantuarioProfileView'), 'SantuarioProfileView');
const SantuarioContractView = lazyNamed(() => import('../../views/pro/SantuarioContractView'), 'SantuarioContractView');

// --- SANTUARIO SCREENS ---
const SpaceDashboard = lazyNamed(() => import('../../views/space/SpaceDashboard'), 'SpaceDashboard');
const SpaceCalendar = lazyNamed(() => import('../../views/space/SpaceCalendar'), 'SpaceCalendar');
const SpaceFinance = lazyNamed(() => import('../../views/space/SpaceFinance'), 'SpaceFinance');
const SpaceMarketplace = lazyNamed(() => import('../../views/space/SpaceMarketplace'), 'SpaceMarketplace');
const SpaceRecruitment = lazyNamed(() => import('../../views/space/SpaceRecruitment'), 'SpaceRecruitment');
const SpaceRooms = lazyNamed(() => import('../../views/space/SpaceRooms'), 'SpaceRooms');
const SpaceTeam = lazyNamed(() => import('../../views/space/SpaceTeam'), 'SpaceTeam');
const SpacePatientProfile = lazyNamed(() => import('../../views/space/SpacePatientProfile'), 'SpacePatientProfile');
const SpacePatientRecords = lazyNamed(() => import('../../views/space/SpacePatientRecords'), 'SpacePatientRecords');

// --- SANTUARIO GENERATED ---
const SpacePatients = lazyWithRetry(() => import('../../views/space/generated/SpacePatients'), 'SpacePatients');
const SpaceGovernance = lazyWithRetry(() => import('../../views/space/generated/SpaceGovernance'), 'SpaceGovernance');
const SpaceRoomEdit = lazyWithRetry(() => import('../../views/space/generated/SpaceRoomEdit'), 'SpaceRoomEdit');
const SpaceRoomAgenda = lazyWithRetry(() => import('../../views/space/generated/SpaceRoomAgenda'), 'SpaceRoomAgenda');
const SpaceRoomCreate = lazyNamed(() => import('../../views/space/SpaceRoomCreate'), 'SpaceRoomCreate');
const SpaceProDetails = lazyWithRetry(() => import('../../views/space/generated/SpaceProDetails'), 'SpaceProDetails');
const SpaceSummon = lazyWithRetry(() => import('../../views/space/generated/SpaceSummon'), 'SpaceSummon');
const SpaceInvite = lazyWithRetry(() => import('../../views/space/generated/SpaceInvite'), 'SpaceInvite');
const SpaceEventCreate = lazyWithRetry(() => import('../../views/space/generated/SpaceEventCreate'), 'SpaceEventCreate');
const SpaceRetreatsManager = lazyWithRetry(() => import('../../views/space/generated/SpaceRetreatsManager'), 'SpaceRetreatsManager');
const SpaceReputation = lazyWithRetry(() => import('../../views/space/generated/SpaceReputation'), 'SpaceReputation');
const ServiceEvaluation = lazyWithRetry(() => import('../../views/space/generated/ServiceEvaluation'), 'ServiceEvaluation');
const SpaceChatListScreen = lazyWithRetry(() => import('../../views/space/chat/SpaceChatListScreen'), 'SpaceChatListScreen');
const SpaceChatRoomScreen = lazyWithRetry(() => import('../../views/space/chat/SpaceChatRoomScreen'), 'SpaceChatRoomScreen');
const PredictiveOccupancy = lazyNamed(() => import('../../views/space/PredictiveOccupancy'), 'PredictiveOccupancy');
const SpaceAuditLog = lazyNamed(() => import('../../views/space/SpaceAuditLog'), 'SpaceAuditLog');
const RadianceDrilldown = lazyNamed(() => import('../../views/space/RadianceDrilldown'), 'RadianceDrilldown');
const SpaceEventsManager = lazyNamed(() => import('../../views/space/SpaceEventsManager'), 'SpaceEventsManager');
const SpaceAnalyticsDash = lazyNamed(() => import('../../views/space/SpaceAnalyticsDash'), 'SpaceAnalyticsDash');

export const screenMap: any = {
    // BUSCADOR
    BUSCADOR: {
        START: ClientDashboard,
        DASHBOARD: ClientDashboard,
        ORACLE: OracleView,
        ORACLE_PORTAL: OracleView,
        ORACLE_SHUFFLE: OracleView,
        ORACLE_REVEAL: OracleView,
        METAMORPHOSIS_CHECKIN: MetamorphosisWizard,
        METAMORPHOSIS_CAMERA: MetamorphosisWizard,
        METAMORPHOSIS_MESSAGE: MetamorphosisWizard,
        METAMORPHOSIS_FEEDBACK: MetamorphosisWizard,
        HISTORY: EvolutionView,
        TRIBE_DASH: TribeView,
        TRIBE_VIEW: TribeView,
        TRIBE_DETAILS: TribeInteraction,
        TRIBE_INVITE: TribeInvite,
        TRIBE_INTERACTION: TribeInteraction,
        HEALING_CIRCLE: HealingCircleEntry,
        CHAT_LIST: ChatListScreen,
        CHAT_ROOM: ChatRoomScreen,
        CHAT_SETTINGS: ChatRoomScreen,
        CHAT_NEW: ChatListScreen,
        BOOKING_SEARCH: MapaDaCuraView,
        BOOKING_SELECT: BookingSelect,
        BOOKING_CONFIRM: BookingConfirm,
        CHECKOUT: CheckoutScreen,
        PAYMENT_SUCCESS: PaymentSuccess,
        PAYMENT_HISTORY: PaymentHistoryScreen,
        CLIENT_EXPLORE: MapaDaCuraView,
        CLIENT_MARKETPLACE: ClientMarketplace, 
        CLIENT_RITUAL: RitualsView,
        CLIENT_TIMELAPSE: TimeLapseView,
        METAMORPHOSIS_RITUAL: RitualsView, 
        GARDEN_VIEW: InternalGarden,
        EVOLUTION: EvolutionView,
        EVOLUTION_ANALYTICS: EvolutionAnalytics,
        EVOLUTION_ACHIEVEMENTS: AchievementsView,
        EVOLUTION_HISTORY: EmotionalHistory,
        EVOLUTION_TIMELAPSE: TimeLapseView,
        TIME_LAPSE_EXPERIENCE: TimeLapseExperience,
        SETTINGS: SettingsViews,
        MARKETPLACE: ClientMarketplace, 
        KARMA_WALLET: KarmaWallet,
        ORACLE_HISTORY: OracleGrimoire,
        EVO_GRIMOIRE: CollectionGrimoire,
        CLIENT_JOURNAL: SoulJournalView,
        SOUL_PACT: SoulPactInteraction,
        OFFLINE_RETREAT: OfflineRetreat,
        CLIENT_QUESTS: ClientQuestsView,
        END: ClientDashboard,
    },
    // GUARDIAO
    GUARDIAO: {
        START: ProDashboard,
        DASHBOARD: ProDashboard,
        FINANCE_OVERVIEW: ProFinance,
        AGENDA_VIEW: AgendaView,
        AGENDA_EDIT: AgendaView,
        AGENDA_CONFIRM: AgendaView,
        PATIENTS_LIST: PatientsList,
        PATIENT_PROFILE: PatientProfile,
        VIDEO_PREP: VideoPrepScreen,
        VIDEO_SESSION: VideoSessionView,
        PATIENT_RECORDS: PatientEvolutionView, 
        PATIENT_PLAN: PatientEvolutionView,
        VAGAS_LIST: VagasList,
        VAGA_DETAILS: VagasList,
        VAGA_APPLY: VagasList,
        TRIBE_PRO: ProTribe,
        TRIBE_CHAT: ProChatListScreen,
        CHAT_LIST: ProChatListScreen,
        CHAT_ROOM: ProChatRoomScreen,
        ESCAMBO_MARKET: ProMarketplace,
        ESCAMBO_PROPOSE: AlquimiaCreateOffer,
        ESCAMBO_TRADE: AlquimiaProposeTrade,
        ESCAMBO_CONFIRM: ProMarketplace,
        FINANCE_DETAILS: ProFinance,
        FINANCIAL_DASHBOARD: WalletViewScreen,
        SANTUARIO_LIST: SantuarioListView,
        SANTUARIO_PROFILE: SantuarioProfileView,
        SANTUARIO_CONTRACT: SantuarioContractView,
        SETTINGS: SettingsViews,
        CUSTOM_INTERVENTION: CustomInterventionWizard,
        ALQUIMIA_CREATE: AlquimiaCreateOffer,
        PRO_HOME: ProDashboard,
    },
    // SANTUARIO
    SANTUARIO: {
        START: SpaceDashboard,
        EXEC_DASHBOARD: SpaceDashboard,
        SPACE_HOME: SpaceDashboard,
        PROS_LIST: SpaceTeam,
        PRO_PROFILE: SpaceProDetails,
        PRO_PERFORMANCE: SpaceTeam,
        TEAM_SUMMON: SpaceSummon,
        TEAM_INVITE: SpaceInvite,
        PATIENTS_LIST: SpacePatients,
        PATIENT_PROFILE: SpacePatientProfile,
        PATIENT_RECORDS: SpacePatientRecords,
        AGENDA_OVERVIEW: SpaceCalendar,
        AGENDA_EDIT: SpaceCalendar,
        ROOMS_STATUS: SpaceRooms,
        ROOM_DETAILS: SpaceRooms,
        ROOM_EDIT: SpaceRoomEdit,
        ROOM_CREATE: SpaceRoomCreate,
        ROOM_AGENDA: SpaceRoomAgenda,
        FINANCE_OVERVIEW: SpaceFinance,
        FINANCE_REPASSES: SpaceFinance,
        FINANCE_FORECAST: SpaceFinance,
        MARKETPLACE_MANAGE: SpaceMarketplace,
        MARKETPLACE_CREATE: SpaceMarketplace,
        EVENTS_MANAGE: SpaceEventsManager, 
        EVENT_CREATE: SpaceEventCreate,
        RETREATS_MANAGE: SpaceRetreatsManager,
        VAGAS_LIST: SpaceRecruitment,
        VAGA_CREATE: SpaceRecruitment,
        VAGA_CANDIDATES: SpaceRecruitment,
        REPUTATION_OVERVIEW: SpaceReputation,
        ANALYTICS_DASH: SpaceAnalyticsDash,
        GOVERNANCE: SpaceGovernance,
        CHAT_LIST: SpaceChatListScreen,
        CHAT_ROOM: SpaceChatRoomScreen,
        PREDICTIVE_OCCUPANCY: PredictiveOccupancy,
        AUDIT_LOG: SpaceAuditLog,
        RADIANCE_DRILLDOWN: RadianceDrilldown,
        SERVICE_EVALUATION: ServiceEvaluation,
    }
}
