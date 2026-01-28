
import React, { useEffect } from 'react';
import { ViewState, Product, User } from '../types';
import { ScreenConnector } from '../src/navigation/ScreenConnector';
import { useBuscadorFlow } from '../src/flow/BuscadorFlowContext';
import { BuscadorState } from '../src/flow/types';
import { ZenToast } from '../components/Common';

export const ClientViews: React.FC<{ 
  user: User, view: ViewState, setView: (v: ViewState) => void, updateUser: (u: User) => void, onAddToCart: (p: Product) => void
}> = ({ user, view, setView, updateUser, onAddToCart }) => {
  const { state: flowState, go, refreshData } = useBuscadorFlow();

   // Sync Router View -> Flow State (Deep Linking Support)
   useEffect(() => {
       const map: Record<string, BuscadorState> = {
           [ViewState.CLIENT_HOME]: 'DASHBOARD',
           [ViewState.CLIENT_ORACLE]: 'ORACLE_PORTAL',
           [ViewState.CLIENT_JOURNEY]: 'HISTORY', 
           [ViewState.CLIENT_METAMORPHOSIS]: 'METAMORPHOSIS_CHECKIN', 
           [ViewState.CLIENT_TRIBO]: 'TRIBE_DASH',
           [ViewState.CLIENT_EXPLORE]: 'BOOKING_SEARCH',
           [ViewState.CLIENT_PRO_DETAILS]: 'BOOKING_SELECT',
       };
       const target = map[view];
       if (target && flowState.currentState !== target) {
           if (flowState.currentState === 'START' || flowState.currentState === 'DASHBOARD') {
              go(target);
           }
       }
   }, [view]);

  const globalData = {
      pros: flowState.data.pros,
      products: flowState.data.products,
      isLoading: flowState.isLoading,
      onAddToCart,
      refreshData
  };

  return (
    <div className="w-full h-full bg-[#f8faf9]">
        {flowState.error && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[500] bg-rose-50 border border-rose-100 p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top duration-500">
                <p className="text-rose-900 text-xs font-bold uppercase tracking-widest">{flowState.error}</p>
                <button onClick={() => refreshData()} className="p-2 bg-rose-100 rounded-lg text-rose-600 hover:bg-rose-200 transition-colors uppercase text-[9px] font-bold">Tentar Novamente</button>
            </div>
        )}
        {flowState.toast && <ZenToast toast={flowState.toast} onClose={() => {}} />} 
        <ScreenConnector 
            profile="BUSCADOR" 
            user={user} 
            updateUser={updateUser}
            setView={setView} 
            flow={{ state: flowState, go }}
            {...globalData}
        />
    </div>
  );
};
