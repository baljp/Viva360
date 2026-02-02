
import React, { useEffect } from 'react';
import { ViewState, Professional, User } from '../types';
import { ScreenConnector } from '../src/navigation/ScreenConnector';
import { useGuardiaoFlow } from '../src/flow/GuardiaoFlowContext';
import { GuardiaoState } from '../src/flow/guardiaoTypes';
import { ZenToast } from '../components/Common';

export const ProViews: React.FC<{ 
    user: Professional, view: ViewState, setView: (v: ViewState) => void, updateUser: (u: User) => void 
}> = ({ user, view, setView, updateUser }) => {
    const { state: flowState, go, back, reset, refreshData } = useGuardiaoFlow();

    // Sync Router View -> Flow State (Deep Linking Support)
    useEffect(() => {
         const map: Record<string, GuardiaoState> = {
             [ViewState.PRO_HOME]: 'DASHBOARD',
             [ViewState.PRO_FINANCE]: 'FINANCE_OVERVIEW',
             [ViewState.PRO_OPPORTUNITIES]: 'VAGAS_LIST',
             [ViewState.PRO_PATIENTS]: 'PATIENTS_LIST',
             [ViewState.PRO_PATIENT_DETAILS]: 'PATIENT_PROFILE',
             [ViewState.PRO_MARKETPLACE]: 'ESCAMBO_MARKET',
             [ViewState.PRO_AGENDA]: 'AGENDA_VIEW',
             [ViewState.PRO_NETWORK]: 'TRIBE_PRO',
         };
         const target = map[view];
         if (target && flowState.currentState !== target) {
             if (flowState.currentState === 'START' || flowState.currentState === 'DASHBOARD') {
                go(target);
             }
         }
    }, [view]);

    // Initial load and re-fetch when user.id changes
    useEffect(() => {
        if (user.id) {
            refreshData(user.id);
        }
    }, [user.id]);

    // Prepare Data Object
    const globalData = {
        appointments: flowState.data.appointments,
        vacancies: flowState.data.vacancies,
        myProducts: flowState.data.myProducts,
        transactions: flowState.data.transactions,
        isLoading: flowState.isLoading,
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
                profile="GUARDIAO" 
                user={user} 
                updateUser={updateUser}
                setView={setView} 
                flow={{ state: flowState, go, back, reset }}
                onClose={reset}
                {...globalData}
            />
        </div>
    );
};
