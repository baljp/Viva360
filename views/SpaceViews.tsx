import React, { useEffect } from 'react';
import { useFlowSync } from '../src/hooks/useFlowSync';
import { User, ViewState } from '../types';
import { ScreenConnector } from '../src/navigation/ScreenConnector';
import { useSantuarioFlow } from '../src/flow/SantuarioFlowContext';
import { SantuarioState } from '../src/flow/santuarioTypes';
import { ZenToast } from '../components/Common';

const spaceStateRoutes: Partial<Record<SantuarioState, string>> = {
    START: '/space/home',
    EXEC_DASHBOARD: '/space/home',
    PROS_LIST: '/space/team',
    PRO_PROFILE: '/space/team',
    PRO_PERFORMANCE: '/space/team',
    TEAM_SUMMON: '/space/team',
    TEAM_INVITE: '/space/team',
    PATIENTS_LIST: '/space/home',
    PATIENT_PROFILE: '/space/home',
    PATIENT_RECORDS: '/space/home',
    AGENDA_OVERVIEW: '/space/home',
    AGENDA_EDIT: '/space/home',
    ROOMS_STATUS: '/space/rooms',
    ROOM_DETAILS: '/space/rooms',
    ROOM_EDIT: '/space/rooms',
    ROOM_CREATE: '/space/rooms',
    ROOM_AGENDA: '/space/rooms',
    FINANCE_OVERVIEW: '/space/finance',
    FINANCE_REPASSES: '/space/finance',
    FINANCE_FORECAST: '/space/finance',
    MARKETPLACE_MANAGE: '/space/marketplace',
    MARKETPLACE_CREATE: '/space/marketplace',
    EVENTS_MANAGE: '/space/home',
    EVENT_CREATE: '/space/home',
    RETREATS_MANAGE: '/space/home',
    VAGAS_LIST: '/space/recruitment',
    VAGA_CREATE: '/space/recruitment',
    VAGA_CANDIDATES: '/space/recruitment',
    REPUTATION_OVERVIEW: '/space/home',
    ANALYTICS_DASH: '/space/home',
    GOVERNANCE: '/space/home',
    CHAT_LIST: '/space/home',
    CHAT_ROOM: '/space/home',
    PREDICTIVE_OCCUPANCY: '/space/home',
    AUDIT_LOG: '/space/home',
    RADIANCE_DRILLDOWN: '/space/home',
};

export const SpaceViews: React.FC<{ user: User, view: ViewState, setView: (v: ViewState) => void, onLogout?: () => void }> = ({ user, view, setView, onLogout }) => {
    const { state: flowState, go, jump, back, reset, refreshData } = useSantuarioFlow();

    // Sync Deep Linking
    const map: Record<string, SantuarioState> = {
        [ViewState.SPACE_HOME]: 'EXEC_DASHBOARD',
        [ViewState.SPACE_DASHBOARD]: 'EXEC_DASHBOARD',
        [ViewState.SPACE_CALENDAR]: 'AGENDA_OVERVIEW',
        [ViewState.SPACE_FINANCE]: 'FINANCE_OVERVIEW',
        [ViewState.SPACE_RECRUITMENT]: 'VAGAS_LIST',
        [ViewState.SPACE_MARKETPLACE]: 'MARKETPLACE_MANAGE',
        [ViewState.SPACE_ROOMS]: 'ROOMS_STATUS',
        [ViewState.SPACE_TEAM]: 'PROS_LIST',
    };

    // Preserve local sub-flows (many Santuário screens share /space/home).
    const clusters: Record<string, SantuarioState[]> = {
        [ViewState.SPACE_HOME]: [
            'START',
            'EXEC_DASHBOARD',
            'PATIENTS_LIST',
            'PATIENT_PROFILE',
            'PATIENT_RECORDS',
            'AGENDA_OVERVIEW',
            'AGENDA_EDIT',
            'EVENTS_MANAGE',
            'EVENT_CREATE',
            'RETREATS_MANAGE',
            'REPUTATION_OVERVIEW',
            'ANALYTICS_DASH',
            'GOVERNANCE',
            'CHAT_LIST',
            'CHAT_ROOM',
            'PREDICTIVE_OCCUPANCY',
            'AUDIT_LOG',
            'RADIANCE_DRILLDOWN',
        ],
        [ViewState.SPACE_TEAM]: ['PROS_LIST', 'PRO_PROFILE', 'PRO_PERFORMANCE', 'TEAM_SUMMON', 'TEAM_INVITE'],
        [ViewState.SPACE_RECRUITMENT]: ['VAGAS_LIST', 'VAGA_CREATE', 'VAGA_CANDIDATES'],
        [ViewState.SPACE_FINANCE]: ['FINANCE_OVERVIEW', 'FINANCE_REPASSES', 'FINANCE_FORECAST'],
        [ViewState.SPACE_MARKETPLACE]: ['MARKETPLACE_MANAGE', 'MARKETPLACE_CREATE'],
        [ViewState.SPACE_ROOMS]: ['ROOMS_STATUS', 'ROOM_DETAILS', 'ROOM_EDIT', 'ROOM_CREATE', 'ROOM_AGENDA'],
    };

    useFlowSync({ state: flowState, go, jump }, view, '/space', map, clusters, spaceStateRoutes as Record<string, string>);

    // Guard-rail: ensure the flow state matches the current router view.
    // This prevents rare cases where the URL changes (sidebar navigation) but the flow remains on a previous screen.
    useEffect(() => {
        const target = map[view];
        if (!target) return;
        const allowed = clusters[view];
        if (allowed?.includes(flowState.currentState)) return;
        if (flowState.currentState === target) return;
        jump(target);
    }, [view, flowState.currentState, jump]);

     // Initial Data Fetch
     useEffect(() => {
        if (user.id) {
            refreshData(user.id);
        }
    }, [user.id]);

    // Prepare Data for ScreenConnector
    const globalData = {
        rooms: flowState.data.rooms,
        team: flowState.data.team,
        vacancies: flowState.data.vacancies,
        transactions: flowState.data.transactions,
        myProducts: flowState.data.myProducts,
        refreshData: () => refreshData(user.id)
    };

    return (
        <div className="w-full h-full bg-[#fcfdfc]">
            {flowState.error && (
                <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[1000] bg-rose-50/95 backdrop-blur-md border border-rose-100 p-4 rounded-[2rem] shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom duration-500 w-[90%] max-w-sm">
                    <p className="text-rose-900 text-[10px] font-bold uppercase tracking-widest flex-1">{flowState.error}</p>
                    <button onClick={() => refreshData(user.id)} className="px-4 py-2 bg-rose-600 rounded-xl text-white hover:bg-rose-700 transition-colors uppercase text-[9px] font-black tracking-widest shadow-lg">Tentar</button>
                </div>
            )}
            {flowState.notification && <ZenToast toast={flowState.notification} onClose={() => {}} />} 
            <ScreenConnector 
                profile="SANTUARIO" 
                user={user} 
                setView={setView} 
                onLogout={onLogout}
                flow={{ state: flowState, go, back, reset }}
                onClose={reset}
                {...globalData}
            />
        </div>
    );
};
