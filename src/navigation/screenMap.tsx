
import React, { lazy } from 'react';

// --- HELPER FOR NAMED EXPORTS ---
// Usage: const Component = lazyNamed(() => import('path'), 'ComponentName');
const lazyNamed = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ [key: string]: any }>, 
  componentName: string
) => {
  return lazy(() => 
    importFunc().then(module => ({ default: module[componentName] }))
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
const BookingConfirm = lazy(() => import('../../views/client/generated/BookingConfirm'));
const Checkout = lazy(() => import('../../views/client/generated/Checkout'));
const PaymentSuccess = lazy(() => import('../../views/client/generated/PaymentSuccess'));
const TribeInvite = lazy(() => import('../../views/client/generated/TribeInvite'));
const TribeInteraction = lazy(() => import('../../views/client/generated/TribeInteraction'));
const ChatListScreen = lazy(() => import('../../views/client/chat/ChatListScreen'));
const ChatRoomScreen = lazy(() => import('../../views/client/chat/ChatRoomScreen'));
const CheckoutScreen = lazy(() => import('../../views/client/financial/CheckoutScreen'));
const PaymentHistoryScreen = lazy(() => import('../../views/client/financial/PaymentHistoryScreen'));
const OrdersListView = lazyNamed(() => import('../../views/ServiceViews'), 'OrdersListView');
const CheckoutSuccessScreen = lazy(() => import('../../views/client/generated/BookingConfirm')); // Reused
const ClientMarketplace = lazyNamed(() => import('../../views/client/ClientMarketplace'), 'ClientMarketplace');
const EvolutionView = lazyNamed(() => import('../../views/client/garden/EvolutionView'), 'EvolutionView');
const EvolutionAnalytics = lazyNamed(() => import('../../views/client/garden/EvolutionAnalytics'), 'EvolutionAnalytics');
const KarmaWallet = lazy(() => import('../../views/client/garden/KarmaWallet')); // Default export
const AchievementsView = lazyNamed(() => import('../../views/client/garden/AchievementsView'), 'AchievementsView');
const EmotionalHistory = lazyNamed(() => import('../../views/client/garden/EmotionalHistory'), 'EmotionalHistory');
const TimeLapseExperience = lazyNamed(() => import('../../views/client/garden/TimeLapseExperience'), 'TimeLapseExperience');
const OracleGrimoire = lazyNamed(() => import('../../views/client/garden/OracleGrimoire'), 'OracleGrimoire');
const CollectionGrimoire = lazyNamed(() => import('../../views/client/garden/CollectionGrimoire'), 'CollectionGrimoire');
const SoulJournalView = lazyNamed(() => import('../../views/client/journal/SoulJournalView'), 'SoulJournalView');
const HealingCircleEntry = lazyNamed(() => import('../../views/client/tribe/HealingCircleEntry'), 'HealingCircleEntry');
const SoulPactInteraction = lazyNamed(() => import('../../views/client/tribe/SoulPactInteraction'), 'SoulPactInteraction');
const OfflineRetreat = lazyNamed(() => import('../../views/client/tribe/OfflineRetreat'), 'OfflineRetreat');

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
const AgendaView = lazy(() => import('../../views/pro/generated/AgendaView'));
const PatientsList = lazy(() => import('../../views/pro/generated/PatientsList'));
const PatientProfile = lazy(() => import('../../views/pro/generated/PatientProfile'));
const PatientEvolutionView = lazy(() => import('../../views/pro/generated/PatientEvolutionView'));
const VagasList = lazy(() => import('../../views/pro/generated/VagasList'));
const ProChatListScreen = lazy(() => import('../../views/pro/chat/ProChatListScreen'));
const ProChatRoomScreen = lazy(() => import('../../views/pro/chat/ProChatRoomScreen'));
const WalletViewScreen = lazy(() => import('../../views/pro/financial/WalletViewScreen'));

// --- SANTUARIO SCREENS ---
const SpaceDashboard = lazyNamed(() => import('../../views/space/SpaceDashboard'), 'SpaceDashboard');
const SpaceCalendar = lazyNamed(() => import('../../views/space/SpaceCalendar'), 'SpaceCalendar');
const SpaceFinance = lazyNamed(() => import('../../views/space/SpaceFinance'), 'SpaceFinance');
const SpaceMarketplace = lazyNamed(() => import('../../views/space/SpaceMarketplace'), 'SpaceMarketplace');
const SpaceRecruitment = lazyNamed(() => import('../../views/space/SpaceRecruitment'), 'SpaceRecruitment');
const SpaceRooms = lazyNamed(() => import('../../views/space/SpaceRooms'), 'SpaceRooms');
const SpaceTeam = lazyNamed(() => import('../../views/space/SpaceTeam'), 'SpaceTeam');

// --- SANTUARIO GENERATED ---
const SpacePatients = lazy(() => import('../../views/space/generated/SpacePatients'));
const SpaceGovernance = lazy(() => import('../../views/space/generated/SpaceGovernance'));
const SpaceRoomEdit = lazy(() => import('../../views/space/generated/SpaceRoomEdit'));
const SpaceRoomAgenda = lazy(() => import('../../views/space/generated/SpaceRoomAgenda'));
const SpaceRoomCreate = lazy(() => import('../../views/space/generated/SpaceRoomCreate'));
const SpaceProDetails = lazy(() => import('../../views/space/generated/SpaceProDetails'));
const SpaceSummon = lazy(() => import('../../views/space/generated/SpaceSummon'));
const SpaceInvite = lazy(() => import('../../views/space/generated/SpaceInvite'));
const SpaceEventCreate = lazy(() => import('../../views/space/generated/SpaceEventCreate'));
const SpaceRetreatsManager = lazy(() => import('../../views/space/generated/SpaceRetreatsManager'));
const SpaceReputation = lazy(() => import('../../views/space/generated/SpaceReputation'));
const ServiceEvaluation = lazy(() => import('../../views/space/generated/ServiceEvaluation'));
const SpaceChatListScreen = lazy(() => import('../../views/space/chat/SpaceChatListScreen'));
const SpaceChatRoomScreen = lazy(() => import('../../views/space/chat/SpaceChatRoomScreen'));
const PredictiveOccupancy = lazyNamed(() => import('../../views/space/PredictiveOccupancy'), 'PredictiveOccupancy');
const SpaceAuditLog = lazyNamed(() => import('../../views/space/SpaceAuditLog'), 'SpaceAuditLog');
const RadianceDrilldown = lazyNamed(() => import('../../views/space/RadianceDrilldown'), 'RadianceDrilldown');

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
        PAYMENT_SUCCESS: CheckoutSuccessScreen,
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
        SANTUARIO_LIST: ProDashboard,
        SANTUARIO_PROFILE: ProDashboard,
        SANTUARIO_CONTRACT: ProDashboard,
        SETTINGS: SettingsViews,
        CUSTOM_INTERVENTION: CustomInterventionWizard,
    },
    // SANTUARIO
    SANTUARIO: {
        START: SpaceDashboard,
        EXEC_DASHBOARD: SpaceDashboard,
        PROS_LIST: SpaceTeam,
        PRO_PROFILE: SpaceProDetails,
        PRO_PERFORMANCE: SpaceTeam,
        TEAM_SUMMON: SpaceSummon,
        TEAM_INVITE: SpaceInvite,
        PATIENTS_LIST: SpacePatients,
        PATIENT_PROFILE: SpacePatients,
        PATIENT_RECORDS: SpacePatients,
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
        EVENTS_MANAGE: SpaceDashboard, 
        EVENT_CREATE: SpaceEventCreate, 
        RETREATS_MANAGE: SpaceRetreatsManager,
        VAGAS_LIST: SpaceRecruitment,
        VAGA_CREATE: SpaceRecruitment,
        VAGA_CANDIDATES: SpaceRecruitment,
        REPUTATION_OVERVIEW: SpaceReputation,
        ANALYTICS_DASH: SpaceDashboard,
        GOVERNANCE: SpaceGovernance,
        CHAT_LIST: SpaceChatListScreen,
        CHAT_ROOM: SpaceChatRoomScreen,
        PREDICTIVE_OCCUPANCY: PredictiveOccupancy,
        AUDIT_LOG: SpaceAuditLog,
        RADIANCE_DRILLDOWN: RadianceDrilldown,
    }
}
