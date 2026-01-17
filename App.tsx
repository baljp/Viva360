import React, { useState, useEffect } from 'react';
import { User, UserRole, ViewState, Professional, Service, CartItem, ToastMessage } from './types';
import { MOCK_USERS, MOCK_PROS } from './constants';
import Layout from './components/Layout';
import Auth from './views/Auth';
import { ClientViews } from './views/ClientViews';
import { ProViews } from './views/ProViews';
import { SpaceViews } from './views/SpaceViews';
import { SettingsViews } from './views/SettingsViews';
import { ZenToast, OfflineState } from './components/Common';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.SPLASH);
  
  // Global System State
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  
  // Specific state for Client flows
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Simulate Network Check
  useEffect(() => {
      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
      };
  }, []);

  // Toast Handler
  const showToast = (message: ToastMessage) => {
      setToast(message);
  };

  // Cart Handlers
  const addToCart = (item: CartItem) => {
      setCart(prev => [...prev, item]);
      showToast({ id: Date.now().toString(), type: 'success', title: 'Adicionado à Cesta' });
  };

  const removeFromCart = (itemId: string) => {
      setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const clearCart = () => {
      setCart([]);
  };

  // Fake auth handler
  const handleLogin = (role: UserRole) => {
    let user = MOCK_USERS['client1'];
    if (role === UserRole.PROFESSIONAL) {
        user = { ...MOCK_PROS[0], role: UserRole.PROFESSIONAL };
    } else if (role === UserRole.SPACE) {
        user = { ...user, id: 'space1', name: 'Espaço Zen', role: UserRole.SPACE };
    }
    
    setCurrentUser(user);
    
    if (role === UserRole.CLIENT) setCurrentView(ViewState.CLIENT_HOME);
    else if (role === UserRole.PROFESSIONAL) setCurrentView(ViewState.PRO_HOME);
    else setCurrentView(ViewState.SPACE_HOME);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView(ViewState.ROLE_SELECTION);
    setSelectedPro(null);
    clearCart();
  };

  // --- Client Actions ---
  const handleViewProDetails = (pro: Professional) => {
      setSelectedPro(pro);
      setCurrentView(ViewState.CLIENT_PRO_DETAILS);
  };

  const handleStartBooking = () => {
      if (selectedPro) {
          setCurrentView(ViewState.CLIENT_BOOKING_FLOW);
      }
  };

  const handleSelectPro = (pro: Professional) => {
      setSelectedPro(pro);
      setCurrentView(ViewState.CLIENT_BOOKING_FLOW);
  };

  const handleToggleFavorite = (proId: string) => {
    if (!currentUser) return;
    const favorites = currentUser.favorites || [];
    const newFavorites = favorites.includes(proId) 
        ? favorites.filter(id => id !== proId) 
        : [...favorites, proId];
    
    setCurrentUser({ ...currentUser, favorites: newFavorites });
    showToast({ id: Date.now().toString(), type: 'neutral', title: newFavorites.includes(proId) ? 'Salvo nos Favoritos' : 'Removido dos Favoritos' });
  };

  // --- View Router ---
  const renderView = () => {
      if (isOffline) return <OfflineState onRetry={() => setIsOffline(false)} />;

      if (!currentUser) return <Auth onLogin={handleLogin} />;

      // Handle Shared Views
      if ([
          ViewState.SETTINGS, 
          ViewState.VERIFICATION, 
          ViewState.TERMS, 
          ViewState.INVITE_FRIEND, 
          ViewState.SUPPORT,
          ViewState.SETTINGS_PRIVACY_HEALTH,
          ViewState.SETTINGS_PRO_SERVICES,
          ViewState.SETTINGS_PROFILE_EDIT
        ].includes(currentView)) {
          return <SettingsViews user={currentUser} view={currentView} setView={setCurrentView} />;
      }

      if (currentUser.role === UserRole.CLIENT) {
          return (
            <ClientViews 
                user={currentUser} 
                view={currentView} 
                setView={setCurrentView}
                // Selection Props
                onSelectPro={handleSelectPro}
                onViewDetails={handleViewProDetails}
                selectedPro={selectedPro}
                onBookingComplete={() => {}} 
                onStartBooking={handleStartBooking}
                onToggleFavorite={handleToggleFavorite}
                // Cart Props
                cart={cart}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                clearCart={clearCart}
                // Global Feedback
                showToast={showToast}
            />
          );
      }

      if (currentUser.role === UserRole.PROFESSIONAL) {
          return <ProViews view={currentView} setView={setCurrentView} />;
      }

      if (currentUser.role === UserRole.SPACE) {
          return <SpaceViews view={currentView} setView={setCurrentView} />;
      }
      
      return null;
  };

  return (
    <Layout 
        user={currentUser} 
        currentView={currentView} 
        setView={setCurrentView}
        onLogout={handleLogout}
    >
        {renderView()}
        <ZenToast toast={toast} onClose={() => setToast(null)} />
    </Layout>
  );
};

export default App;