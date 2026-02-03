import React, { useEffect } from 'react';
import { useFlowSync } from '../src/hooks/useFlowSync';
import { User, ViewState } from '../types';
import { ScreenConnector } from '../src/navigation/ScreenConnector';
import { useSantuarioFlow } from '../src/flow/SantuarioFlowContext';
import { SantuarioState } from '../src/flow/santuarioTypes';
import { ZenToast } from '../components/Common';

export const SpaceViews: React.FC<{ user: User, view: ViewState, setView: (v: ViewState) => void }> = ({ user, view, setView }) => {
    const { state: flowState, go, back, reset, refreshData } = useSantuarioFlow();

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
    useFlowSync({ state: flowState, go }, view, '/space', map);

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
                flow={{ state: flowState, go, back, reset }}
                onClose={reset}
                {...globalData}
            />
        </div>
    );
};

