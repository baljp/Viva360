
import React, { useEffect } from 'react';
import { useFlowSync } from '../src/hooks/useFlowSync';
import { ViewState, Product, User } from '../types';
import { ScreenConnector } from '../src/navigation/ScreenConnector';
import { useBuscadorFlow } from '../src/flow/BuscadorFlowContext';
import { BuscadorState } from '../src/flow/types';
import { ZenToast } from '../components/Common';

const clientStateRoutes: Partial<Record<BuscadorState, string>> = {
    START: '/client/home',
    DASHBOARD: '/client/home',
    SETTINGS: '/settings',
    MARKETPLACE: '/client/marketplace',
    PAYMENT_HISTORY: '/client/orders',
    KARMA_WALLET: '/client/home',
    CLIENT_JOURNAL: '/client/journal',
    ORACLE_PORTAL: '/client/oracle',
    ORACLE_SHUFFLE: '/client/oracle',
    ORACLE_REVEAL: '/client/oracle',
    ORACLE_HISTORY: '/client/oracle',
    EVOLUTION: '/client/journey',
    EVOLUTION_ANALYTICS: '/client/journey',
    EVOLUTION_ACHIEVEMENTS: '/client/journey',
    EVOLUTION_HISTORY: '/client/journey',
    EVOLUTION_TIMELAPSE: '/client/journey',
    TIME_LAPSE_EXPERIENCE: '/client/journey',
    GARDEN_VIEW: '/client/journey',
    METAMORPHOSIS_CHECKIN: '/client/metamorphosis',
    METAMORPHOSIS_CAMERA: '/client/metamorphosis',
    METAMORPHOSIS_MESSAGE: '/client/metamorphosis',
    METAMORPHOSIS_RITUAL: '/client/metamorphosis',
    METAMORPHOSIS_FEEDBACK: '/client/metamorphosis',
    TRIBE_DASH: '/client/tribe',
    TRIBE_INVITE: '/client/tribe',
    TRIBE_INTERACTION: '/client/tribe',

    HEALING_CIRCLE: '/client/tribe',
    CHAT_LIST: '/client/tribe',
    CHAT_ROOM: '/client/tribe',
    SOUL_PACT: '/client/tribe',
    BOOKING_SEARCH: '/client/explore',
    BOOKING_SELECT: '/client/explore',
    BOOKING_CONFIRM: '/client/explore',
};

export const ClientViews: React.FC<{
    user: User,
    view: ViewState,
    setView: (v: ViewState) => void,
    updateUser: (u: User) => void,
    onAddToCart: (p: Product) => void,
    onLogout: () => void
}> = ({ user, view, setView, updateUser, onAddToCart, onLogout }) => {
    const { state: flowState, go, jump, back, reset, refreshData } = useBuscadorFlow();

    useEffect(() => {
        const isExploreView = view === ViewState.CLIENT_EXPLORE || view === ViewState.CLIENT_PRO_DETAILS;
        const inExploreSubflow = flowState.currentState === 'BOOKING_SELECT' || flowState.currentState === 'BOOKING_CONFIRM';
        if (isExploreView && inExploreSubflow && !flowState.selectedProfessionalId) {
            jump('BOOKING_SEARCH');
        }
    }, [view, flowState.currentState, flowState.selectedProfessionalId, jump]);

    // Sync Router View -> Flow State (Deep Linking Support)
    const clusters: Record<string, BuscadorState[]> = {
        [ViewState.CLIENT_HOME]: ['DASHBOARD', 'SETTINGS', 'MARKETPLACE', 'PAYMENT_HISTORY', 'KARMA_WALLET'],
        [ViewState.CLIENT_JOURNAL]: ['CLIENT_JOURNAL'],
        [ViewState.CLIENT_ORACLE]: ['ORACLE_PORTAL', 'ORACLE_SHUFFLE', 'ORACLE_REVEAL', 'ORACLE_HISTORY'],
        [ViewState.CLIENT_JOURNEY]: ['EVOLUTION', 'EVOLUTION_ANALYTICS', 'EVOLUTION_ACHIEVEMENTS', 'EVOLUTION_HISTORY', 'EVOLUTION_TIMELAPSE', 'TIME_LAPSE_EXPERIENCE', 'GARDEN_VIEW'],
        [ViewState.CLIENT_METAMORPHOSIS]: ['METAMORPHOSIS_CHECKIN', 'METAMORPHOSIS_CAMERA', 'METAMORPHOSIS_MESSAGE', 'METAMORPHOSIS_RITUAL', 'METAMORPHOSIS_FEEDBACK'],
        [ViewState.CLIENT_TRIBO]: ['TRIBE_DASH', 'TRIBE_INVITE', 'TRIBE_INTERACTION', 'HEALING_CIRCLE', 'CHAT_LIST', 'CHAT_ROOM', 'SOUL_PACT'],
        [ViewState.CLIENT_EXPLORE]: ['BOOKING_SEARCH', 'BOOKING_SELECT', 'BOOKING_CONFIRM'],
        [ViewState.CLIENT_PRO_DETAILS]: ['BOOKING_SELECT'],
        [ViewState.CLIENT_MARKETPLACE]: ['MARKETPLACE'], // Specific cluster for marketplace
    };

    const defaultStates: Record<string, BuscadorState> = {
        [ViewState.CLIENT_HOME]: 'DASHBOARD',
        [ViewState.CLIENT_JOURNAL]: 'CLIENT_JOURNAL',
        [ViewState.CLIENT_ORACLE]: 'ORACLE_PORTAL',
        [ViewState.CLIENT_JOURNEY]: 'GARDEN_VIEW', // Deep link to garden
        [ViewState.CLIENT_METAMORPHOSIS]: 'METAMORPHOSIS_CHECKIN',
        [ViewState.CLIENT_TRIBO]: 'TRIBE_DASH',
        [ViewState.CLIENT_EXPLORE]: 'BOOKING_SEARCH',
        [ViewState.CLIENT_PRO_DETAILS]: 'BOOKING_SELECT',
        [ViewState.CLIENT_MARKETPLACE]: 'MARKETPLACE',
    };

    useFlowSync({ state: flowState, jump, go }, view, '/client', defaultStates, clusters, clientStateRoutes as Record<string, string>);

    const globalData = {
        pros: flowState.data.pros,
        products: flowState.data.products,
        isLoading: flowState.isLoading,
        onAddToCart,
        onLogout, // Pass down to settings
        refreshData
    };


    return (
        <div className="w-full h-full bg-[#f8faf9]">
            <span data-testid="client-flow-state" className="sr-only">{flowState.currentState}</span>
            {flowState.error && (
                <div className="fixed top-[15vh] left-1/2 -translate-x-1/2 z-[500] bg-rose-50 border border-rose-100 p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top duration-500">
                    <p className="text-rose-900 text-xs font-bold uppercase tracking-widest">{flowState.error}</p>
                    <button onClick={() => refreshData()} className="p-2 bg-rose-100 rounded-lg text-rose-600 hover:bg-rose-200 transition-colors uppercase text-[9px] font-bold">Tentar Novamente</button>
                </div>
            )}
            {flowState.toast && <ZenToast toast={flowState.toast} onClose={() => { }} />}
            <ScreenConnector
                profile="BUSCADOR"
                user={user}
                updateUser={updateUser}
                setView={setView}
                flow={{ state: flowState, go, jump, back, reset }}
                onClose={() => { reset(); setView(ViewState.CLIENT_HOME); }}
                {...globalData}
            />
        </div>
    );

};
