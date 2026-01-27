
import React, { useState, useEffect } from 'react';
import { ViewState, Professional, User, Appointment, Vacancy, Product, Transaction } from '../types';
import { ScreenConnector } from '../src/navigation/ScreenConnector';
import { useGuardiaoFlow } from '../src/flow/GuardiaoFlowContext';
import { GuardiaoState } from '../src/flow/guardiaoTypes';
import { api } from '../services/api';
import { ZenToast } from '../components/Common';

export const ProViews: React.FC<{ 
    user: Professional, view: ViewState, setView: (v: ViewState) => void, updateUser: (u: User) => void 
}> = ({ user, view, setView, updateUser }) => {
    const { state: flowState, go } = useGuardiaoFlow();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [vacancies, setVacancies] = useState<Vacancy[]>([]);
    const [myProducts, setMyProducts] = useState<Product[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState<{title: string, message: string} | null>(null);

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

     const refreshData = async () => {
        setIsLoading(true);
        try {
            const [apts, vacs, prods, txs] = await Promise.all([
                api.appointments.list(user.id, user.role),
                api.spaces.getVacancies(),
                api.marketplace.listByOwner(user.id),
                api.professionals.getFinanceSummary(user.id).then(res => res.transactions)
            ]);
            setAppointments(apts);
            setVacancies(vacs);
            setMyProducts(prods);
            setTransactions(txs);
        } catch (e) {
            console.error(e);
        }
        setIsLoading(false);
      };
    
      useEffect(() => { refreshData(); }, [user.id]);

       // Prepare Data Object
        const globalData = {
            appointments,
            vacancies,
            myProducts,
            transactions,
            refreshData
        };

    return (
        <div className="w-full h-full bg-[#fcfdfc]">
            {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}
            <ScreenConnector 
                profile="GUARDIAO" 
                user={user} 
                updateUser={updateUser}
                setView={setView} 
                setToast={setToast}
                data={globalData} 
            />
        </div>
    );
};
