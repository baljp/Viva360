
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
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[500] bg-rose-50 border border-rose-100 p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top duration-500">
                    <p className="text-rose-900 text-xs font-bold uppercase tracking-widest">{flowState.error}</p>
                    <button onClick={() => refreshData(user.id)} className="p-2 bg-rose-100 rounded-lg text-rose-600 hover:bg-rose-200 transition-colors uppercase text-[9px] font-bold">Tentar Novamente</button>
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
