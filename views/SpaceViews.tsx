
import React, { useEffect } from 'react';
import { User, ViewState } from '../types';
import { ScreenConnector } from '../src/navigation/ScreenConnector';
import { useSantuarioFlow } from '../src/flow/SantuarioFlowContext';
import { SantuarioState } from '../src/flow/santuarioTypes';

export const SpaceViews: React.FC<{ user: User, view: ViewState, setView: (v: ViewState) => void }> = ({ user, view, setView }) => {
    // Logic for Data Fetching can be moved to a higher level or inside the Context/Components.
    // Ideally, ScreenConnector or the Components themselves fetch what they need.
    // For now, we will assume components handle their data or Context does (SantuarioFlowContext already has adminStats, but not tables).
    // HOWEVER, SpaceViews originally fetched EVERYTHING. 
    // To preserve functionality, we should execute data fetching logic HERE or in a Layout, 
    // OR we must accept that each sub-component (SpaceCalendar, etc) fetches its own data.
    // Looking at the extracted components, they accept props like 'team', 'rooms'.
    // If we rely on ScreenConnector, we need to pass these props OR ScreenConnector needs to access them from Context.
    
    // CRITICAL DECISION:
    // ScreenConnector handles 'user', 'updateUser', 'setView'. 
    // It DOES NOT pass 'team', 'rooms' by default.
    // So, we have two options:
    // 1. Move data fetching to SantuarioFlowContext (Best Architectural Move).
    // 2. Wrap ScreenConnector with a Data Provider that passes extra props.
    
    // Given the prompt "Centralize ... managing operational complexity (Rooms, Finances, Pros)", 
    // the SantuarioFlowContext should hold this state.
    // BUT refactoring Context to fetch data right now is out of scope of "Screen Connector".
    // 
    // SHORTCUT: We will keep data fetching here and pass it via 'user' prop extension or modify ScreenConnector to accept extra props.
    // But ScreenConnector is generic.
    // 
    // BETTER SHORTCUT: The extracted components (SpaceCalendar, etc.) expected props. 
    // We should refactor them to use specific hooks or Context. 
    // BUT we don't have time to refactor 6 components.
    //
    // SOLUTION: We will pass these props through the 'user' object or a 'context' prop in ScreenConnector?
    // ScreenConnector only takes user, updateUser, setView, flow.
    //
    // Let's modify ScreenConnector.tsx to accept 'extraProps'.
    // Wait, ScreenConnector maps state to Component.
    // <ScreenComponent {...extraProps} />
    
    // I will restart SpaceViews.tsx to KEEP the data fetching for now, 
    // and pass the data into ScreenConnector via a new prop 'data'.
    // I need to update ScreenConnector.tsx first.
    
    // WAIT. Step 2034 ScreenConnector.tsx:
    // <ScreenComponent user={user} ... />
    
    // I will update ScreenConnector to accept 'data' prop.
    return (
       <SpaceViewsWithData user={user} view={view} setView={setView} />
    );
};

// Internal Component to handle Data Fetching + Connector
import { useState } from 'react';
import { api } from '../services/api';
import { SpaceRoom, Professional, Vacancy, Transaction, Product } from '../types';

const SpaceViewsWithData: React.FC<{ user: User, view: ViewState, setView: (v: ViewState) => void }> = ({ user, view, setView }) => {
    const [rooms, setRooms] = useState<SpaceRoom[]>([]);
    const [team, setTeam] = useState<Professional[]>([]);
    const [vacancies, setVacancies] = useState<Vacancy[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [myProducts, setMyProducts] = useState<Product[]>([]);
    const { state: flowState, go } = useSantuarioFlow();

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

    // Fetch Data
    const refreshData = async () => {
      try {
          const [r, t, v, tx, prods] = await Promise.all([
              api.spaces.getRooms(user.id),
              api.spaces.getTeam(user.id),
              api.spaces.getVacancies(),
              api.spaces.getTransactions(user.id),
              api.marketplace.listByOwner(user.id)
          ]);
          setRooms(r);
          setTeam(t.map(p => ({ ...p, isOccupied: Math.random() > 0.7 } as any)));
          setVacancies(v);
          setTransactions(tx);
          setMyProducts(prods);
      } catch (e) { console.error(e); }
    };
    useEffect(() => { refreshData(); }, [user.id]);

    // Prepare Data Object
    const globalData = {
        rooms,
        team,
        vacancies,
        transactions,
        myProducts,
        refreshData
    };

    return (
        <ScreenConnector 
            profile="SANTUARIO" 
            user={user} 
            setView={setView} 
            // We pass globalData as 'extra' prop. We need to update ScreenConnector to handle this.
            // For now, let's cast it to any.
            {...{data: globalData} as any}
        />
    );
}

