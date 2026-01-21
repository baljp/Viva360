
import React, { useState, useEffect } from 'react';
import { User, UserRole, ViewState, Professional, CartItem, Product, Appointment } from './types';
import { NanoLayout } from './components/layout/NanoLayout';
import Auth from './views/Auth';
import { ClientViews } from './views/ClientViews';
import { ProViews } from './views/ProViews';
import { SpaceViews } from './views/SpaceViews';
import { SettingsViews } from './views/SettingsViews';
import { RegistrationViews } from './views/Registration';
import { OnboardingTutorial } from './components/Onboarding';
import { CartDrawer, SuccessScreen } from './components/Checkout';
import { FastCheckout } from './components/Checkout/FastCheckout';
import { VideoSessionView, OrdersListView } from './views/ServiceViews';
import { PrivacyPolicy, TermsOfUse } from './views/LegalPages';
import { api } from './services/api';

const Splash: React.FC = () => (
  <div className="h-screen w-full bg-nano-950 flex flex-col items-center justify-center text-white animate-in fade-in duration-700">
    <div className="relative mb-8">
      <div className="absolute inset-0 bg-banana-400/20 blur-[80px] rounded-full animate-pulse"></div>
      <div className="w-24 h-24 bg-banana-400 rounded-3xl flex items-center justify-center text-nano-900 font-bold text-4xl shadow-[0_0_40px_rgba(250,204,21,0.4)] relative z-10 animate-bounce">V</div>
    </div>
    <div className="space-y-4 text-center">
      <h1 className="text-3xl font-bold tracking-tight text-white">Viva360</h1>
      <div className="flex flex-col items-center gap-2">
        <div className="h-1 w-32 bg-nano-800 rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-banana-400 animate-[loading_1s_ease-in-out_infinite]"></div>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-nano-400">Loading System</p>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.SPLASH);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      await new Promise(resolve => setTimeout(resolve, 800)); // Faster nano load
      try {
        const stored = localStorage.getItem('viva360_user');
        if (stored) {
            const u = JSON.parse(stored);
            if (!u || !u.role || !u.id) throw new Error("Invalid user data");
            
            setCurrentUser(u);
            const homeView = u.role === UserRole.CLIENT ? ViewState.CLIENT_HOME : u.role === UserRole.PROFESSIONAL ? ViewState.PRO_HOME : ViewState.SPACE_HOME;
            setCurrentView(homeView);
        } else {
            setCurrentView('LANDING' as ViewState);
        }
      } catch (e) {
        console.error("Failed to load user session:", e);
        localStorage.removeItem('viva360_user');
        setCurrentUser(null);
        setCurrentView('LANDING' as ViewState);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const addToCart = (p: Product) => {
    setCart(prev => {
        const exist = prev.find(x => x.id === p.id);
        if (exist) return prev.map(x => x.id === p.id ? {...x, quantity: x.quantity + 1} : x);
        return [...prev, {...p, quantity: 1}];
    });
    setIsCartOpen(true);
  };

  const processCheckout = async () => {
    if (!currentUser) return;
    const total = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    
    for (const item of cart) {
        if (item.type === 'service') {
            const proId = item.id.split('_')[1] || 'pro_0';
            const pro = (await api.professionals.list()).find(p => p.id === proId);
            await api.appointments.create({
                id: `a_${Date.now()}_${item.id}`,
                clientId: currentUser.id,
                clientName: currentUser.name,
                professionalId: proId,
                professionalName: pro?.name || "Professional",
                serviceName: item.name.replace('Ritual: ', ''),
                price: item.price,
                date: new Date().toISOString(),
                time: "14:00",
                status: 'pending'
            });
        }
    }

    const updatedUser = { 
        ...currentUser, 
        personalBalance: (currentUser.personalBalance || 0) - total, 
        karma: (currentUser.karma || 0) + Math.floor(total * 2),
        plantXp: (currentUser.plantXp || 0) + Math.floor(total / 10),
        streak: (currentUser.streak || 0) + 1
    };
    
    setCurrentUser(updatedUser);
    localStorage.setItem('viva360_user', JSON.stringify(updatedUser));
    setCart([]);
  };


// ... (in App component)

  if (isLoading) return <Splash />;

  let content = null;

  if (currentView === ViewState.SPLASH) {
      // Should have been handled by useEffect, but just in case
      content = <Auth onLogin={(u) => { 
        if(u) {
            setCurrentUser(u);
            localStorage.setItem('viva360_user', JSON.stringify(u));
            setCurrentView(u.role === UserRole.CLIENT ? ViewState.CLIENT_HOME : u.role === UserRole.PROFESSIONAL ? ViewState.PRO_HOME : u.role === UserRole.SPACE ? ViewState.SPACE_HOME : ViewState.LOGIN);
        }
    }} setView={setCurrentView} />;
  } else if (!currentUser) {
     if (currentView === ViewState.LOGIN) {
        content = <Auth onLogin={(u) => { 
            if(u) {
                setCurrentUser(u);
                localStorage.setItem('viva360_user', JSON.stringify(u));
                setCurrentView(u.role === UserRole.CLIENT ? ViewState.CLIENT_HOME : u.role === UserRole.PROFESSIONAL ? ViewState.PRO_HOME : u.role === UserRole.SPACE ? ViewState.SPACE_HOME : ViewState.LOGIN);
            }
        }} setView={setCurrentView} />;
     } else {
        // Landing page state
        content = <Auth onLogin={(u) => { 
        if(u) {
            setCurrentUser(u);
            localStorage.setItem('viva360_user', JSON.stringify(u));
            setCurrentView(u.role === UserRole.CLIENT ? ViewState.CLIENT_HOME : u.role === UserRole.PROFESSIONAL ? ViewState.PRO_HOME : u.role === UserRole.SPACE ? ViewState.SPACE_HOME : ViewState.LOGIN);
        }
    }} setView={setCurrentView} />;
     }
  } else if (currentView === ViewState.CLIENT_CHECKOUT) {
    content = <FastCheckout total={cart.reduce((a,b)=>a+(b.price*b.quantity),0)} onSuccess={processCheckout} onCancel={() => setCurrentView(ViewState.CLIENT_HOME)} />;
  } else if (currentView === ViewState.CLIENT_CHECKOUT_SUCCESS) {
    content = <SuccessScreen onHome={() => setCurrentView(ViewState.CLIENT_HOME)} />;
  } else if (currentView === ViewState.CLIENT_ORDERS) {
    content = <OrdersListView user={currentUser} onBack={() => setCurrentView(currentUser.role === UserRole.CLIENT ? ViewState.CLIENT_HOME : currentUser.role === UserRole.PROFESSIONAL ? ViewState.PRO_HOME : ViewState.SPACE_HOME)} setView={setCurrentView} />;
  } else if (currentView === ViewState.CLIENT_VIDEO_SESSION) {
     content = <VideoSessionView appointment={{} as Appointment} onEnd={() => setCurrentView(currentUser.role === UserRole.CLIENT ? ViewState.CLIENT_ORDERS : ViewState.PRO_HOME)} />;
  } else if (currentView.startsWith('SETTINGS')) {
     content = <SettingsViews user={currentUser} view={currentView} setView={setCurrentView} updateUser={setCurrentUser} onLogout={() => {setCurrentUser(null); localStorage.removeItem('viva360_user'); setCurrentView(ViewState.LOGIN);}} />;
  } else if (currentView === ViewState.PRIVACY) {
     content = <PrivacyPolicy onBack={() => setCurrentView(currentUser ? (currentUser.role === UserRole.CLIENT ? ViewState.CLIENT_HOME : currentUser.role === UserRole.PROFESSIONAL ? ViewState.PRO_HOME : ViewState.SPACE_HOME) : ViewState.LOGIN)} />;
  } else if (currentView === ViewState.TERMS) {
     content = <TermsOfUse onBack={() => setCurrentView(currentUser ? (currentUser.role === UserRole.CLIENT ? ViewState.CLIENT_HOME : currentUser.role === UserRole.PROFESSIONAL ? ViewState.PRO_HOME : ViewState.SPACE_HOME) : ViewState.LOGIN)} />;
  } else if (currentView.startsWith('REGISTER')) {
    content = <RegistrationViews view={currentView} setView={setCurrentView} onRegister={async (u) => { const { user } = await api.auth.register(u); setCurrentUser(user); setCurrentUser(user); setCurrentView(user.role === UserRole.CLIENT ? ViewState.CLIENT_HOME : user.role === UserRole.PROFESSIONAL ? ViewState.PRO_HOME : user.role === UserRole.SPACE ? ViewState.SPACE_HOME : ViewState.LOGIN); }} />;
  } else {
    switch(currentUser.role) {
        case UserRole.CLIENT: 
            content = <ClientViews user={currentUser} view={currentView} setView={setCurrentView} updateUser={setCurrentUser} onAddToCart={addToCart} />; 
            break;
        case UserRole.PROFESSIONAL: 
            content = <ProViews user={currentUser as Professional} view={currentView} setView={setCurrentView} updateUser={setCurrentUser} />; 
            break;
        case UserRole.SPACE: 
            content = <SpaceViews user={currentUser} view={currentView} setView={setCurrentView} />; 
            break;
        default: 
            content = <div className="p-12 text-center italic text-nano-400">Profile sync error.</div>;
    }
  }

  const shouldHideNav = isCartOpen || !currentUser || [
    ViewState.SPLASH, 
    ViewState.LOGIN, 
    ViewState.CLIENT_RITUAL, 
    ViewState.CLIENT_VIDEO_SESSION,
    ViewState.CLIENT_CHECKOUT,
    ViewState.CLIENT_CHECKOUT_SUCCESS,
    ViewState.CLIENT_PRO_DETAILS,
    ViewState.CLIENT_PRODUCT_DETAILS,
    ViewState.PRO_PATIENT_DETAILS,
    ViewState.PRO_OPPORTUNITIES,
    ViewState.SPACE_TEAM_DETAILS,
    ViewState.SPACE_VACANCY_DETAILS
  ].includes(currentView) || currentView.startsWith('REGISTER') || currentView.startsWith('SETTINGS_');

  return (
    <NanoLayout user={currentUser} currentView={currentView} setView={setCurrentView} onLogout={() => {setCurrentUser(null); localStorage.removeItem('viva360_user'); setCurrentView(ViewState.LOGIN)}} shouldHideNav={shouldHideNav}>
        {content}
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} items={cart} onRemove={(id)=>setCart(c=>c.filter(x=>x.id!==id))} onProceed={() => {setIsCartOpen(false); setCurrentView(ViewState.CLIENT_CHECKOUT)}} />
        <OnboardingTutorial />
    </NanoLayout>
  );
};

export default App;
