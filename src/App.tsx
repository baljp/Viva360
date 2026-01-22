import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ViewState } from './types';
import { NanoLayout } from './components/layout/NanoLayout';
import { useAuth } from './contexts/AuthContext';
import { CartDrawer, SuccessScreen } from './components/Checkout';
import { OnboardingTutorial } from './components/Onboarding';

const App: React.FC = () => {
    console.log("🚀 [App.tsx] Rendering App component...");
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    // We map the current path to a "ViewState" for the NanoLayout highlight logic
    // This is a temporary adapter until NanoLayout is fully router-aware
    const getCurrentViewFromPath = (): ViewState => {
        const path = location.pathname;
        if (path.includes('/client')) return ViewState.CLIENT_HOME;
        if (path.includes('/pro')) return ViewState.PRO_HOME;
        if (path.includes('/space')) return ViewState.SPACE_HOME;
        if (path.includes('/login')) return ViewState.LOGIN;
        if (path.includes('/register')) return ViewState.REGISTER;
        return ViewState.LANDING;
    };

    const currentView = getCurrentViewFromPath();
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Dummy setView to satisfy NanoLayout (navigation is now handled by router links mostly)
    const setView = (v: ViewState) => {
        // Logic to navigate based on ViewState if needed, or just let Router handle it
        console.log("NanoLayout requested view change to", v);
    };

    const shouldHideNav = !user || location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/';

    return (
        <NanoLayout 
            user={user} 
            currentView={currentView} 
            setView={setView} 
            onLogout={logout} 
            shouldHideNav={shouldHideNav}
        >
            <Outlet />
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} items={[]} onRemove={()=>{}} onProceed={() => {}} />
            <OnboardingTutorial />
        </NanoLayout>
    );
};

export default App;
