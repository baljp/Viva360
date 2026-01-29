import React, { useEffect } from 'react';
import { User, ViewState } from '../types';
import { ScreenConnector } from '../src/navigation/ScreenConnector';
import { useSantuarioFlow } from '../src/flow/SantuarioFlowContext';
import { SantuarioState } from '../src/flow/santuarioTypes';
import { ZenToast } from '../components/Common';

export const SpaceViews: React.FC<{ user: User, view: ViewState, setView: (v: ViewState) => void }> = ({ user, view, setView }) => {
    const { state: flowState, go, refreshData } = useSantuarioFlow();

    // Sync Deep Linking
    useEffect(() => {
        const map: Record<string, SantuarioState> = {
            [ViewState.SPACE_DASHBOARD]: 'EXEC_DASHBOARD',
            [ViewState.SPACE_CALENDAR]: 'AGENDA_OVERVIEW',
            [ViewState.SPACE_FINANCE]: 'FINANCE_OVERVIEW',
            [ViewState.SPACE_RECRUITMENT]: 'VAGAS_LIST',
            [ViewState.SPACE_MARKETPLACE]: 'MARKETPLACE_MANAGE',
            [ViewState.SPACE_ROOMS]: 'ROOMS_STATUS',
            [ViewState.SPACE_TEAM]: 'PROS_LIST',
        };
        const target = map[view];
        if (target && flowState.currentState !== target) {
             if (flowState.currentState === 'START' || flowState.currentState === 'EXEC_DASHBOARD') {
                go(target);
             }
        }
    }, [view]);

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
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[500] bg-rose-50 border border-rose-100 p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top duration-500">
                    <p className="text-rose-900 text-xs font-bold uppercase tracking-widest">{flowState.error}</p>
                    <button onClick={() => refreshData(user.id)} className="p-2 bg-rose-100 rounded-lg text-rose-600 hover:bg-rose-200 transition-colors uppercase text-[9px] font-bold">Tentar Novamente</button>
                </div>
            )}
            {flowState.notification && <ZenToast toast={flowState.notification} onClose={() => {}} />} 
            <ScreenConnector 
                profile="SANTUARIO" 
                user={user} 
                setView={setView} 
                flow={{ state: flowState, go }}
                {...globalData}
            />
        </div>
    );
};

