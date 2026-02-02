
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { User, ViewState, Professional, CartItem, Product } from './types';
import Layout from './components/Layout';
import { SmartTutorial } from './components/SmartTutorial';
import { CartDrawer } from './components/Checkout'; // Keep lightweight components eager
import { api } from './services/api';
import { supabase } from './lib/supabase';
import { ZenToast } from './components/Common';
import { BuscadorFlowProvider } from './src/flow/BuscadorFlowContext';
import { GuardiaoFlowProvider } from './src/flow/GuardiaoFlowContext';
import { SantuarioFlowProvider } from './src/flow/SantuarioFlowContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { ChatProvider } from './src/contexts/ChatContext';

// Lazy Load Views
const Auth = lazy(() => import('./views/Auth'));
const ResetPasswordView = lazy(() => import('./views/ResetPassword').then(m => ({ default: m.ResetPasswordView })));
const ClientViews = lazy(() => import('./views/ClientViews').then(module => ({ default: module.ClientViews })));
const ProViews = lazy(() => import('./views/ProViews').then(module => ({ default: module.ProViews })));
const SpaceViews = lazy(() => import('./views/SpaceViews').then(module => ({ default: module.SpaceViews })));
const SettingsViews = lazy(() => import('./views/SettingsViews').then(module => ({ default: module.SettingsViews })));
const RegistrationViews = lazy(() => import('./views/Registration').then(module => ({ default: module.RegistrationViews })));
const CheckoutScreen = lazy(() => import('./components/Checkout').then(module => ({ default: module.CheckoutScreen })));
const SuccessScreen = lazy(() => import('./components/Checkout').then(module => ({ default: module.SuccessScreen })));
const OrdersListView = lazy(() => import('./views/ServiceViews').then(module => ({ default: module.OrdersListView })));
const AdminViews = lazy(() => import('./views/AdminViews').then(module => ({ default: module.AdminViews })));
import { NotFoundScreen } from './src/navigation/NotFoundScreen';
import { preloadRoleViews } from './src/utils/loaderUtils';

// Loading Component
const PageLoader = () => (
  <div className="h-full w-full flex items-center justify-center min-h-[50vh]">
    <div className="w-8 h-8 border-4 border-nature-200 border-t-nature-900 rounded-full animate-spin"></div>
  </div>
);

// Splash Screen Component (Keep eager)
const Splash: React.FC = () => (
  <div className="h-screen w-full bg-nature-900 flex flex-col items-center justify-center text-white animate-in fade-in duration-1000">
    <div className="relative mb-8">
      <div className="absolute inset-0 bg-primary-500/20 blur-[60px] rounded-full animate-pulse"></div>
      <div className="w-16 h-16 border-4 border-t-primary-400 border-white/10 rounded-full animate-spin"></div>
    </div>
    <div className="space-y-2 text-center">
      <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary-400 animate-pulse">Sintonizando Frequência</p>
    </div>
  </div>
);

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [cart, setCart] = useState<CartItem[]>(() => {
        const saved = localStorage.getItem('viva360.cart');
        return saved ? JSON.parse(saved) : [];
    });
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [toast, setToast] = useState<{title: string, message: string} | null>(null);
    const [zenMode, setZenMode] = useState(() => localStorage.getItem('viva360.zen_mode') === 'true');
    
    // Persist Cart
    useEffect(() => {
        localStorage.setItem('viva360.cart', JSON.stringify(cart));
    }, [cart]);

    const navigate = useNavigate();
    const location = useLocation();

    // Apply Zen Mode class to body
    useEffect(() => {
        if (zenMode) {
            document.body.classList.add('zen-mode');
        } else {
            document.body.classList.remove('zen-mode');
        }
        localStorage.setItem('viva360.zen_mode', String(zenMode));
    }, [zenMode]);

    // Mapping URL path to ViewState for backwards compatibility
    const getCurrentViewFromPath = (): ViewState => {
        const path = location.pathname;
        if (path === '/login') return ViewState.LOGIN;
        if (path === '/register') return ViewState.REGISTER;
        if (path === '/register/client') return ViewState.REGISTER_CLIENT;
        if (path === '/register/pro') return ViewState.REGISTER_PRO;
        if (path === '/register/space') return ViewState.REGISTER_SPACE;
        
        // Client Routes
        if (path === '/client/home') return ViewState.CLIENT_HOME;
        if (path === '/client/journal') return ViewState.CLIENT_JOURNAL;
        if (path === '/client/journey') return ViewState.CLIENT_JOURNEY;
        if (path === '/client/explore') return ViewState.CLIENT_EXPLORE;
        if (path === '/client/tribe') return ViewState.CLIENT_TRIBO;
        if (path === '/client/oracle') return ViewState.CLIENT_ORACLE;
        if (path === '/client/metamorphosis') return ViewState.CLIENT_METAMORPHOSIS;
        if (path === '/client/timelapse') return ViewState.CLIENT_TIMELAPSE;
        if (path === '/client/orders') return ViewState.CLIENT_ORDERS;
        if (path === '/client/marketplace') return ViewState.CLIENT_MARKETPLACE;
        if (path === '/client/garden') return ViewState.CLIENT_JOURNEY; // Garden is in Journey cluster
        if (path === '/checkout') return ViewState.CLIENT_CHECKOUT;
        if (path === '/checkout/success') return ViewState.CLIENT_CHECKOUT_SUCCESS;

        // Pro Routes
        if (path === '/pro/home') return ViewState.PRO_HOME;
        if (path === '/pro/patients') return ViewState.PRO_PATIENTS;
        if (path === '/pro/agenda') return ViewState.PRO_AGENDA;
        if (path === '/pro/marketplace') return ViewState.PRO_MARKETPLACE;
        if (path === '/pro/network') return ViewState.PRO_NETWORK;
        if (path === '/pro/finance') return ViewState.PRO_FINANCE;
        if (path === '/pro/opportunities') return ViewState.PRO_OPPORTUNITIES;

        // Space Routes
        if (path === '/space/home') return ViewState.SPACE_HOME;
        if (path === '/space/team') return ViewState.SPACE_TEAM;

        if (path === '/space/recruitment') return ViewState.SPACE_RECRUITMENT;
        if (path === '/space/finance') return ViewState.SPACE_FINANCE;
        if (path === '/space/marketplace') return ViewState.SPACE_MARKETPLACE;
        if (path === '/space/rooms') return ViewState.SPACE_ROOMS;

        // Settings
        if (path === '/settings') return ViewState.SETTINGS;
        if (path === '/settings/profile') return ViewState.SETTINGS_PROFILE;
        if (path === '/settings/wallet') return ViewState.SETTINGS_WALLET;
        if (path === '/settings/notifications') return ViewState.SETTINGS_NOTIFICATIONS;

        if (path === '/settings/security') return ViewState.SETTINGS_SECURITY;

        // Admin Routes
        if (path === '/admin/dashboard') return ViewState.ADMIN_DASHBOARD;
        if (path === '/admin/users') return ViewState.ADMIN_USERS;
        if (path === '/admin/lgpd') return ViewState.ADMIN_LGPD;
       
        return ViewState.SPLASH; 


    };

    const currentView = getCurrentViewFromPath();

    // Navigation Helper
    const setView = (view: ViewState) => {
        switch(view) {
            case ViewState.LOGIN: navigate('/login'); break;
        case ViewState.REGISTER: navigate('/register'); break;
        case ViewState.REGISTER_CLIENT: navigate('/register/client'); break;
        case ViewState.REGISTER_PRO: navigate('/register/pro'); break;
        case ViewState.REGISTER_SPACE: navigate('/register/space'); break;
            case ViewState.CLIENT_HOME: navigate('/client/home'); break;
            case ViewState.CLIENT_JOURNAL: navigate('/client/journal'); break;
            case ViewState.CLIENT_JOURNEY: navigate('/client/journey'); break;
            case ViewState.CLIENT_EXPLORE: navigate('/client/explore'); break;
            case ViewState.CLIENT_TRIBO: navigate('/client/tribe'); break;
            case ViewState.CLIENT_ORACLE: navigate('/client/oracle'); break;
            case ViewState.CLIENT_MARKETPLACE: navigate('/client/marketplace'); break;
            case ViewState.CLIENT_METAMORPHOSIS: navigate('/client/metamorphosis'); break;
            case ViewState.CLIENT_TIMELAPSE: navigate('/client/timelapse'); break;
            case ViewState.CLIENT_ORDERS: navigate('/client/orders'); break;
            case ViewState.CLIENT_CHECKOUT: navigate('/checkout'); break;
            case ViewState.CLIENT_CHECKOUT_SUCCESS: navigate('/checkout/success'); break;
            case ViewState.PRO_HOME: navigate('/pro/home'); break;
            case ViewState.PRO_PATIENTS: navigate('/pro/patients'); break;
            case ViewState.PRO_AGENDA: navigate('/pro/agenda'); break;
            case ViewState.PRO_MARKETPLACE: navigate('/pro/marketplace'); break;
            case ViewState.PRO_NETWORK: navigate('/pro/network'); break;
            case ViewState.PRO_FINANCE: navigate('/pro/finance'); break;
            case ViewState.PRO_OPPORTUNITIES: navigate('/pro/opportunities'); break;
            case ViewState.SPACE_HOME: navigate('/space/home'); break;
            case ViewState.SPACE_TEAM: navigate('/space/team'); break;
            case ViewState.SPACE_RECRUITMENT: navigate('/space/recruitment'); break;
            case ViewState.SPACE_FINANCE: navigate('/space/finance'); break;
            case ViewState.SPACE_MARKETPLACE: navigate('/space/marketplace'); break;
            case ViewState.SPACE_ROOMS: navigate('/space/rooms'); break;
            case ViewState.SETTINGS: navigate('/settings'); break;
            case ViewState.SETTINGS_PROFILE: navigate('/settings/profile'); break;
            case ViewState.SETTINGS_WALLET: navigate('/settings/wallet'); break;
            case ViewState.SETTINGS_NOTIFICATIONS: navigate('/settings/notifications'); break;
            case ViewState.SETTINGS_SECURITY: navigate('/settings/security'); break;
            case ViewState.ADMIN_DASHBOARD: navigate('/admin/dashboard'); break;
            case ViewState.ADMIN_USERS: navigate('/admin/users'); break;
            case ViewState.ADMIN_LGPD: navigate('/admin/lgpd'); break;
            default: break; 
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                const user = await api.auth.getCurrentSession();
                if (user) {
                    // Standardize role
                    const standardizedUser = { ...user };
                    if (typeof standardizedUser.role === 'string') {
                        standardizedUser.role = (standardizedUser.role as string).toUpperCase() as any;
                    }
                    setCurrentUser(standardizedUser);
                    preloadRoleViews(standardizedUser.role);
                    
                    if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register') {
                        const role = String(standardizedUser.role).toUpperCase();
                        const homePath = role === 'CLIENT' ? '/client/home' : (role === 'PROFESSIONAL' ? '/pro/home' : (role === 'SPACE' ? '/space/home' : '/admin/dashboard'));
                        navigate(homePath);
                    }
                } else {
                    if (location.pathname !== '/register') {
                        navigate('/login');
                    }
                }
            } catch (e) {
                console.error("Initialization Error", e);
                navigate('/login');
            }
            setIsLoading(false);
        };
        init();
    }, []);

    const handleLogin = (u: any) => {
        if (!u) return;
        handleUpdateUser(u);
        const role = String(u.role).toUpperCase();
        preloadRoleViews(role);
        console.log("DEBUG: handleLogin Role:", role);
        const homePath = role === 'CLIENT' ? '/client/home' : 
                        (role === 'PROFESSIONAL' ? '/pro/home' : 
                        (role === 'SPACE' ? '/space/home' : 
                        (role === 'ADMIN' ? '/admin/dashboard' : '/client/home')));
        console.log("DEBUG: handleLogin Redirecting to:", homePath);
        navigate(homePath);
    };

    const handleUpdateUser = (u: any) => {
        if (!u) return;
        setCurrentUser(prev => {
            if (!prev) return u as User;
            // Use spread to merge, and ensure we don't lose the role if the update is partial
            const updated = { ...prev, ...u };
            // Standardize role to uppercase if it's a string
            if (typeof updated.role === 'string') {
                updated.role = updated.role.toUpperCase();
            }
            return updated;
        });
    };

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
            // Simulated transaction processing logic
            console.log(`[Checkout] Processing ${cart.length} items`);
            
            setCart([]);
            localStorage.removeItem('viva360.cart');
            setToast({ title: "Portal de Abundância", message: "Sua troca foi processada com honra." });
            navigate('/checkout/success');
        } catch (e) {
            console.error("Checkout failed", e);
            setToast({ title: "Erro na Alquimia", message: "Não foi possível completar a troca energética." });
        }
    };

    const handleLogout = async () => {
        try {
            await api.auth.logout();
            await supabase.auth.signOut();
        } catch (e) {
            console.error("Logout error", e);
        } finally {
            setCurrentUser(null);
            navigate('/login');
        }
    };

    if (isLoading) return <Splash />;

    const shouldHideNav = isCartOpen || !currentUser || ['/', '/login', '/register', '/checkout', '/checkout/success'].includes(location.pathname);

    return (
      <NotificationProvider>
        <ChatProvider>
        <Layout user={currentUser} currentView={currentView} setView={setView} onLogout={handleLogout} shouldHideNav={shouldHideNav}>
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<Auth onLogin={handleLogin} setView={setView} />} />
                    <Route path="/reset-password" element={<ResetPasswordView />} />

                    <Route path="/register" element={<RegistrationViews view={ViewState.REGISTER} setView={setView} onRegister={async (u) => { 
                        const user = await api.auth.register(u); 
                        handleLogin(user); 
                    }} />} />
                    <Route path="/register/client" element={<RegistrationViews view={ViewState.REGISTER_CLIENT} setView={setView} onRegister={async (u) => { 
                        const user = await api.auth.register(u); 
                        handleLogin(user);
                    }} />} />
                    <Route path="/register/pro" element={<RegistrationViews view={ViewState.REGISTER_PRO} setView={setView} onRegister={async (u) => { 
                        const user = await api.auth.register(u); 
                        handleLogin(user);
                    }} />} />
                    <Route path="/register/space" element={<RegistrationViews view={ViewState.REGISTER_SPACE} setView={setView} onRegister={async (u) => { 
                        const user = await api.auth.register(u); 
                        handleLogin(user);
                    }} />} />

                    {/* Client Routes */}
                    <Route path="/client/*" element={(String(currentUser?.role).toUpperCase() === 'CLIENT') ? (
                        <BuscadorFlowProvider>
                            <ClientViews 
                                user={currentUser!} 
                                view={currentView} 
                                setView={setView} 
                                updateUser={handleUpdateUser} 
                                onAddToCart={addToCart} 
                                onLogout={handleLogout}
                            />
                        </BuscadorFlowProvider>
                    ) : <Navigate to="/login" />} />

                    <Route path="/checkout" element={<CheckoutScreen total={cart.reduce((a,b)=>a+(b.price*b.quantity),0)} items={cart} onSuccess={processCheckout} onCancel={() => navigate(-1)} />} />
                    <Route path="/checkout/success" element={<SuccessScreen onHome={() => navigate('/client/home')} />} />
                    <Route path="/client/orders" element={<OrdersListView user={currentUser!} onBack={() => navigate('/client/home')} setView={setView} />} />

                    {/* Pro Routes */}
                    <Route path="/pro/*" element={(String(currentUser?.role).toUpperCase() === 'PROFESSIONAL') ? (
                        <GuardiaoFlowProvider>
                            <ProViews user={currentUser as Professional} view={currentView} setView={setView} updateUser={handleUpdateUser} />
                        </GuardiaoFlowProvider>
                    ) : <Navigate to="/login" />} />
                    
                    {/* Space Routes */}

                    <Route path="/space/*" element={(String(currentUser?.role).toUpperCase() === 'SPACE') ? (
                        <SantuarioFlowProvider>
                            <SpaceViews user={currentUser!} view={currentView} setView={setView} />
                        </SantuarioFlowProvider>
                    ) : <Navigate to="/login" />} />

                    {/* Admin Routes */}
                     <Route path="/admin/*" element={(String(currentUser?.role).toUpperCase() === 'ADMIN') ? <AdminViews user={currentUser!} view={currentView} setView={setView} /> : <Navigate to="/login" />} />

                    <Route path="/settings/*" element={<SettingsViews user={currentUser!} view={currentView} setView={setView} updateUser={setCurrentUser} onLogout={handleLogout} zenMode={zenMode} onToggleZenMode={() => setZenMode(!zenMode)} />} />
                    
                    <Route path="*" element={<NotFoundScreen />} />
                </Routes>
            </Suspense>

            {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} items={cart} onRemove={removeFromCart} onProceed={() => {setIsCartOpen(false); navigate('/checkout');}} />
            <SmartTutorial user={currentUser} />
        </Layout>
        </ChatProvider>
      </NotificationProvider>
    );
};

export default App;
