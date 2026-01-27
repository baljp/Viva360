
import React, { useState, useEffect } from 'react';
import { ViewState, Professional, User, Product } from '../types';
import { ScreenConnector } from '../src/navigation/ScreenConnector';
import { useBuscadorFlow } from '../src/flow/BuscadorFlowContext';
import { BuscadorState } from '../src/flow/types';
import { api } from '../services/api';
import { ZenToast } from '../components/Common';

export const ClientViews: React.FC<{ 
  user: User, view: ViewState, setView: (v: ViewState) => void, updateUser: (u: User) => void, onAddToCart: (p: Product) => void
}> = ({ user, view, setView, updateUser, onAddToCart }) => {
  const { state: flowState, go } = useBuscadorFlow();
  const [pros, setPros] = useState<Professional[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{title: string, message: string} | null>(null);

   // Sync Router View -> Flow State (Deep Linking Support)
   useEffect(() => {
       const map: Record<string, BuscadorState> = {
           [ViewState.CLIENT_HOME]: 'DASHBOARD',
           [ViewState.CLIENT_ORACLE]: 'ORACLE_PORTAL',
           [ViewState.CLIENT_JOURNEY]: 'HISTORY', 
           [ViewState.CLIENT_METAMORPHOSIS]: 'METAMORPHOSIS_CHECKIN', 
           [ViewState.CLIENT_TRIBO]: 'TRIBE_DASH',
           [ViewState.CLIENT_EXPLORE]: 'BOOKING_SEARCH',
           [ViewState.CLIENT_MARKETPLACE]: 'ORACLE_PORTAL', // Placeholder shift as per previous logic discussion, or we update types.
           // Actually, 'ORACLE_PORTAL' was used in extract? No.
           // In ClientDashboard extracted, Marketplace card goes to 'ORACLE_PORTAL' because I put it there? 
           // Wait, ClientDashboard line 506: onClick={() => go('BOOKING_SEARCH')} 
           // Let's keep it consistent.
           [ViewState.CLIENT_PRO_DETAILS]: 'BOOKING_SELECT',
       };
       const target = map[view];
       if (target && flowState.currentState !== target) {
           if (flowState.currentState === 'START' || flowState.currentState === 'DASHBOARD') {
              go(target);
           }
       }
   }, [view]);

   useEffect(() => { 
    setIsLoading(true);
    Promise.all([
      api.professionals.list(),
      api.marketplace.listAll()
    ]).then(([prosData, productsData]) => {
      setPros(prosData);
      setProducts(productsData);
      setIsLoading(false);
    });
  }, []);

  const globalData = {
      pros,
      products,
      isLoading,
      onAddToCart // Special prop for client
  };

  return (
    <div className="w-full h-full bg-[#f8faf9]">
        {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}
        <ScreenConnector 
            profile="BUSCADOR" 
            user={user} 
            updateUser={updateUser}
            setView={setView} 
            {...{data: globalData} as any}
        />
    </div>
  );
};
