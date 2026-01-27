
import React from 'react';
// Buscador Screens
import { ClientDashboard } from '../../views/client/ClientDashboard';
import { OracleView } from '../../views/gamification/OracleView'; 
import { MetamorphosisWizard } from '../../views/metamorphosis/MetamorphosisWizard'; 
import { TimeLapseView } from '../../views/metamorphosis/TimeLapseView';
import { TribeView } from '../../views/client/TribeView';
import { BookingSearch } from '../../views/client/BookingSearch';
import { BookingSelect } from '../../views/client/BookingSelect';
// Buscador Generated
import BookingConfirm from '../../views/client/generated/BookingConfirm';
import Checkout from '../../views/client/generated/Checkout';
import PaymentSuccess from '../../views/client/generated/PaymentSuccess';
import TribeInvite from '../../views/client/generated/TribeInvite';
import TribeInteraction from '../../views/client/generated/TribeInteraction';
import ChatListScreen from '../../views/client/chat/ChatListScreen';
import ChatRoomScreen from '../../views/client/chat/ChatRoomScreen';
import CheckoutScreen from '../../views/client/financial/CheckoutScreen';
import PaymentHistoryScreen from '../../views/client/financial/PaymentHistoryScreen';
import CheckoutSuccessScreen from '../../views/client/generated/BookingConfirm'; // Reusing BookingConfirm as Success/Pseudo-success for now

// Guardião Screens
import { ProDashboard } from '../../views/pro/ProDashboard';
import { ProFinance } from '../../views/pro/ProFinance';
import { ProTribe } from '../../views/pro/ProTribe';
import { ProMarketplace } from '../../views/pro/ProMarketplace'; 
// Guardião Generated
import AgendaView from '../../views/pro/generated/AgendaView';
import PatientsList from '../../views/pro/generated/PatientsList';
import PatientProfile from '../../views/pro/generated/PatientProfile';
import VagasList from '../../views/pro/generated/VagasList';
import ProChatListScreen from '../../views/pro/chat/ProChatListScreen';
import ProChatRoomScreen from '../../views/pro/chat/ProChatRoomScreen';
import WalletViewScreen from '../../views/pro/financial/WalletViewScreen';

// Space Screens
import { SpaceDashboard } from '../../views/space/SpaceDashboard';
import { SpaceCalendar } from '../../views/space/SpaceCalendar';
import { SpaceFinance } from '../../views/space/SpaceFinance';
import { SpaceMarketplace } from '../../views/space/SpaceMarketplace';
import { SpaceRecruitment } from '../../views/space/SpaceRecruitment';
import { SpaceRooms } from '../../views/space/SpaceRooms';
import { SpaceTeam } from '../../views/space/SpaceTeam';
// Space Generated
import SpacePatients from '../../views/space/generated/SpacePatients';
import SpaceGovernance from '../../views/space/generated/SpaceGovernance';

export const screenMap: any = {
    // BUSCADOR
    BUSCADOR: {
        START: ClientDashboard,
        DASHBOARD: ClientDashboard,
        ORACLE_PORTAL: OracleView,
        ORACLE_SHUFFLE: OracleView,
        ORACLE_REVEAL: OracleView,
        METAMORPHOSIS_CHECKIN: MetamorphosisWizard,
        METAMORPHOSIS_CAMERA: MetamorphosisWizard,
        METAMORPHOSIS_MESSAGE: MetamorphosisWizard,
        METAMORPHOSIS_RITUAL: MetamorphosisWizard,
        METAMORPHOSIS_FEEDBACK: MetamorphosisWizard,
        HISTORY: TimeLapseView,
        TRIBE_DASH: TribeView,
        TRIBE_INVITE: TribeInvite,
        TRIBE_INTERACTION: TribeInteraction,
        CHAT_LIST: ChatListScreen,
        CHAT_ROOM: ChatRoomScreen,
        CHAT_SETTINGS: ChatRoomScreen, // Placeholder
        CHAT_NEW: ChatListScreen, // Placeholder
        BOOKING_SEARCH: BookingSearch,
        BOOKING_SELECT: BookingSelect,
        BOOKING_CONFIRM: BookingConfirm,
        CHECKOUT: CheckoutScreen,
        PAYMENT_SUCCESS: CheckoutSuccessScreen,
        PAYMENT_HISTORY: PaymentHistoryScreen,
    },
    // GUARDIAO
    GUARDIAO: {
        START: ProDashboard,
        DASHBOARD: ProDashboard,
        FINANCE_OVERVIEW: ProFinance,
        AGENDA_VIEW: AgendaView,
        AGENDA_EDIT: AgendaView,
        AGENDA_CONFIRM: AgendaView, // Reused
        PATIENTS_LIST: PatientsList,
        PATIENT_PROFILE: PatientProfile,
        PATIENT_RECORDS: PatientProfile, // Reused
        VAGAS_LIST: VagasList,
        VAGA_DETAILS: VagasList,
        VAGA_APPLY: VagasList, // Reused
        TRIBE_PRO: ProTribe,
        TRIBE_CHAT: ProChatListScreen, // Entry point
        CHAT_LIST: ProChatListScreen,
        CHAT_ROOM: ProChatRoomScreen,
        ESCAMBO_MARKET: ProMarketplace,
        ESCAMBO_PROPOSE: ProMarketplace,
        ESCAMBO_CONFIRM: ProMarketplace,
        FINANCE_DETAILS: ProFinance, // Reused
        FINANCIAL_DASHBOARD: WalletViewScreen,
        SANTUARIO_LIST: ProDashboard, // Placeholder
        SANTUARIO_PROFILE: ProDashboard, // Placeholder
        SANTUARIO_CONTRACT: ProDashboard, // Placeholder
    },
    // SANTUARIO
    SANTUARIO: {
        START: SpaceDashboard,
        EXEC_DASHBOARD: SpaceDashboard,
        PROS_LIST: SpaceTeam,
        PRO_PROFILE: SpaceTeam,
        PRO_PERFORMANCE: SpaceTeam,
        PATIENTS_LIST: SpacePatients,
        PATIENT_PROFILE: SpacePatients,
        PATIENT_RECORDS: SpacePatients, // Added for coverage
        AGENDA_OVERVIEW: SpaceCalendar,
        AGENDA_EDIT: SpaceCalendar,
        ROOMS_STATUS: SpaceRooms,
        ROOM_DETAILS: SpaceRooms,
        FINANCE_OVERVIEW: SpaceFinance,
        FINANCE_REPASSES: SpaceFinance,
        FINANCE_FORECAST: SpaceFinance,
        MARKETPLACE_MANAGE: SpaceMarketplace,
        MARKETPLACE_CREATE: SpaceMarketplace,
        EVENTS_MANAGE: SpaceDashboard, 
        EVENT_CREATE: SpaceDashboard, 
        VAGAS_LIST: SpaceRecruitment,
        VAGA_CREATE: SpaceRecruitment,
        VAGA_CANDIDATES: SpaceRecruitment,
        REPUTATION_OVERVIEW: SpaceDashboard,
        ANALYTICS_DASH: SpaceDashboard,
        GOVERNANCE: SpaceGovernance,
    }
}
