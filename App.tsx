
import React, { useState, useEffect } from 'react';
import { User, UserRole, ViewState, Professional, CartItem, Product, Appointment } from './types';
import Layout from './components/Layout';
import Auth from './views/Auth';
import { ClientViews } from './views/ClientViews';
import { ProViews } from './views/ProViews';
import { SpaceViews } from './views/SpaceViews';
import { SettingsViews } from './views/SettingsViews';
import { RegistrationViews } from './views/Registration';
import { OnboardingTutorial } from './components/Onboarding';
import { CartDrawer, CheckoutScreen, SuccessScreen } from './components/Checkout';
import { VideoSessionView, OrdersListView } from './views/ServiceViews';
import { api } from './services/api';
import { supabase } from './lib/supabase';
import { ZenToast } from './components/Common';

const Splash: React.FC = () => (
  <div className="h-screen w-full bg-nature-900 flex flex-col items-center justify-center text-white animate-in fade-in duration-1000">
    <div className="relative mb-8">
      <div className="absolute inset-0 bg-primary-500/20 blur-[60px] rounded-full animate-pulse"></div>
      <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center text-nature-900 font-serif italic text-4xl shadow-2xl relative z-10 animate-float">V</div>
    </div>
    <div className="space-y-2 text-center">
      <h1 className="text-2xl font-serif italic tracking-widest opacity-90">Viva360</h1>
      <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary-400 animate-pulse">Sintonizando Frequência</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.SPLASH);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState<{title: string, message: string} | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await api.auth.getCurrentSession();
        if (user) {
            setCurrentUser(user);
            const homeView = user.role === UserRole.CLIENT ? ViewState.CLIENT_HOME : user.role === UserRole.PROFESSIONAL ? ViewState.PRO_HOME : ViewState.SPACE_HOME;
            setCurrentView(homeView);
        } else {
            setCurrentView(ViewState.LOGIN);
        }
      } catch (e) {
        console.error("Erro na inicialização:", e);
        setCurrentView(ViewState.LOGIN);
      }
      setIsLoading(false);
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

  const removeFromCart = (id: string) => {
      setCart(c => c.filter(x => x.id !== id));
      setToast({ title: "Item Removido", message: "O item foi devolvido ao fluxo." });
  };

  const processCheckout = async () => {
    if (!currentUser) return;
    
    try {
        for (const item of cart) {
            const itemTotal = item.price * item.quantity;
            let providerId = item.ownerId;

            if (item.type === 'service') {
                const proId = item.id.split('_')[1] || 'pro_0';
                providerId = proId;
                const pro = (await api.professionals.list()).find(p => p.id === proId);
                
                await api.appointments.create({
                    id: `a_${Date.now()}_${item.id}`,
                    clientId: currentUser.id,
                    clientName: currentUser.name,
                    professionalId: proId,
                    professionalName: pro?.name || "Guardião",
                    serviceName: item.name.replace('Ritual: ', ''),
                    price: item.price,
                    date: new Date().toISOString(),
                    time: "14:00",
                    status: 'pending'
                });
            }

            await api.payment.checkout(itemTotal, `Compra: ${item.name}`, providerId);
        }

        const updatedUser = await api.users.getById(currentUser.id);
        if (updatedUser) {
            setCurrentUser(updatedUser);
        }
        
        setCart([]);
        setCurrentView(ViewState.CLIENT_CHECKOUT_SUCCESS);
        
    } catch (e: any) {
        console.error("Erro no checkout:", e);
        setToast({ title: "Fluxo Interrompido", message: e.message || "Saldo insuficiente ou erro no sistema." });
    }
  };

  if (isLoading) return <Splash />;

  let content = null;

  if (!currentUser) {
    content = <Auth onLogin={(u) => { 
        if(u) {
            setCurrentUser(u);
            setCurrentView(u.role === UserRole.CLIENT ? ViewState.CLIENT_HOME : u.role === UserRole.PROFESSIONAL ? ViewState.PRO_HOME : u.role === UserRole.SPACE ? ViewState.SPACE_HOME : ViewState.LOGIN);
        }
    }} setView={setCurrentView} />;
  } else if (currentView === ViewState.CLIENT_CHECKOUT) {
    content = <CheckoutScreen total={cart.reduce((a,b)=>a+(b.price*b.quantity),0)} onSuccess={processCheckout} onCancel={() => setCurrentView(ViewState.CLIENT_HOME)} />;
  } else if (currentView === ViewState.CLIENT_CHECKOUT_SUCCESS) {
    content = <SuccessScreen onHome={() => setCurrentView(ViewState.CLIENT_HOME)} />;
  } else if (currentView === ViewState.CLIENT_ORDERS) {
    content = <OrdersListView user={currentUser} onBack={() => setCurrentView(currentUser.role === UserRole.CLIENT ? ViewState.CLIENT_HOME : currentUser.role === UserRole.PROFESSIONAL ? ViewState.PRO_HOME : ViewState.SPACE_HOME)} setView={setCurrentView} />;
  } else if (currentView === ViewState.CLIENT_VIDEO_SESSION) {
     content = <VideoSessionView appointment={{} as Appointment} onEnd={() => setCurrentView(currentUser.role === UserRole.CLIENT ? ViewState.CLIENT_ORDERS : ViewState.PRO_HOME)} />;
  } else if (currentView.startsWith('SETTINGS')) {
     content = <SettingsViews user={currentUser} view={currentView} setView={setCurrentView} updateUser={setCurrentUser} onLogout={async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
        setCurrentView(ViewState.LOGIN);
     }} />;
  } else if (currentView.startsWith('REGISTER')) {
    content = <RegistrationViews view={currentView} setView={setCurrentView} onRegister={async (u) => { const user = await api.auth.register(u); setCurrentUser(user); setCurrentView(user.role === UserRole.CLIENT ? ViewState.CLIENT_HOME : user.role === UserRole.PROFESSIONAL ? ViewState.PRO_HOME : user.role === UserRole.SPACE ? ViewState.SPACE_HOME : ViewState.LOGIN); }} />;
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
            content = <div className="p-12 text-center italic text-nature-400">Sincronia de perfil não identificada.</div>;
    }
  }

  // LISTA COMPLETA DE SUB-VIEWS QUE USAM PORTALVIEW (FullScreen) PARA OCULTAR NAV PADRÃO
  const shouldHideNav = isCartOpen || !currentUser || [
    ViewState.SPLASH, ViewState.LOGIN, ViewState.CLIENT_RITUAL, ViewState.CLIENT_VIDEO_SESSION,
    ViewState.CLIENT_CHECKOUT, ViewState.CLIENT_CHECKOUT_SUCCESS, ViewState.CLIENT_PRO_DETAILS,
    ViewState.CLIENT_PRODUCT_DETAILS, ViewState.CLIENT_JOURNEY, ViewState.CLIENT_EXPLORE,
    ViewState.CLIENT_MARKETPLACE, ViewState.CLIENT_TRIBO, ViewState.PRO_PATIENT_DETAILS,
    ViewState.PRO_OPPORTUNITIES, ViewState.PRO_AGENDA, ViewState.PRO_NETWORK,
    ViewState.PRO_MARKETPLACE, ViewState.PRO_FINANCE, ViewState.PRO_PATIENTS,
    ViewState.SPACE_TEAM_DETAILS, ViewState.SPACE_VACANCY_DETAILS, ViewState.SPACE_MARKETPLACE,
    ViewState.SPACE_FINANCE, ViewState.SPACE_TEAM, ViewState.SPACE_RECRUITMENT, ViewState.SPACE_ROOMS
  ].includes(currentView) || currentView.startsWith('REGISTER') || currentView.startsWith('SETTINGS_');

  return (
    <Layout user={currentUser} currentView={currentView} setView={setCurrentView} onLogout={async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
        setCurrentView(ViewState.LOGIN);
    }} shouldHideNav={shouldHideNav}>
        {content}
        {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} items={cart} onRemove={removeFromCart} onProceed={() => {setIsCartOpen(false); setCurrentView(ViewState.CLIENT_CHECKOUT)}} />
        <OnboardingTutorial />
    </Layout>
  );
};

export default App;
