
import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { User, ViewState, Professional, CartItem, Product } from './types';
import Layout from './components/Layout';
import { SmartTutorial } from './components/SmartTutorial';
import { api } from './services/api';
import { supabase, APP_MODE, validateOAuthRuntimeConfig } from './lib/supabase';
import { ZenToast } from './components/Common';
import { BuscadorFlowProvider } from './src/flow/BuscadorFlowContext';
import { GuardiaoFlowProvider } from './src/flow/GuardiaoFlowContext';
import { SantuarioFlowProvider } from './src/flow/SantuarioFlowContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { ChatProvider } from './src/contexts/ChatContext';

// Lazy Load Views
const Auth = lazyWithRetry(() => import('./views/Auth'), 'Auth');
const ResetPasswordView = lazyWithRetry(() => import('./views/ResetPassword').then(m => ({ default: m.ResetPasswordView })), 'ResetPasswordView');
const ClientViews = lazyWithRetry(() => import('./views/ClientViews').then(module => ({ default: module.ClientViews })), 'ClientViews');
const ProViews = lazyWithRetry(() => import('./views/ProViews').then(module => ({ default: module.ProViews })), 'ProViews');
const SpaceViews = lazyWithRetry(() => import('./views/SpaceViews').then(module => ({ default: module.SpaceViews })), 'SpaceViews');
const SettingsViews = lazyWithRetry(() => import('./views/SettingsViews').then(module => ({ default: module.SettingsViews })), 'SettingsViews');
const RegistrationViews = lazyWithRetry(() => import('./views/Registration').then(module => ({ default: module.RegistrationViews })), 'RegistrationViews');
const CartDrawer = lazyWithRetry(() => import('./components/Checkout').then(module => ({ default: module.CartDrawer })), 'CartDrawer');
const CheckoutScreen = lazyWithRetry(() => import('./components/Checkout').then(module => ({ default: module.CheckoutScreen })), 'CheckoutScreen');
const SuccessScreen = lazyWithRetry(() => import('./components/Checkout').then(module => ({ default: module.SuccessScreen })), 'SuccessScreen');
const OrdersListView = lazyWithRetry(() => import('./views/ServiceViews').then(module => ({ default: module.OrdersListView })), 'OrdersListView');
const AdminViews = lazyWithRetry(() => import('./views/AdminViews').then(module => ({ default: module.AdminViews })), 'AdminViews');
import { NotFoundScreen } from './src/navigation/NotFoundScreen';
import { preloadRoleViews } from './src/utils/loaderUtils';
import { lazyWithRetry } from './src/utils/lazyWithRetry';

const PUBLIC_PATHS = ['/login', '/register', '/register/client', '/register/pro', '/register/space', '/reset-password'];

const VIEW_PATHS: Partial<Record<ViewState, string>> = {
    [ViewState.LOGIN]: '/login',
    [ViewState.REGISTER]: '/register',
    [ViewState.REGISTER_CLIENT]: '/register/client',
    [ViewState.REGISTER_PRO]: '/register/pro',
    [ViewState.REGISTER_SPACE]: '/register/space',
    [ViewState.CLIENT_HOME]: '/client/home',
    [ViewState.CLIENT_JOURNAL]: '/client/journal',
    [ViewState.CLIENT_JOURNEY]: '/client/journey',
    [ViewState.CLIENT_EXPLORE]: '/client/explore',
    [ViewState.CLIENT_TRIBO]: '/client/tribe',
    [ViewState.CLIENT_ORACLE]: '/client/oracle',
    [ViewState.CLIENT_METAMORPHOSIS]: '/client/metamorphosis',
    [ViewState.CLIENT_TIMELAPSE]: '/client/timelapse',
    [ViewState.CLIENT_ORDERS]: '/client/orders',
    [ViewState.CLIENT_MARKETPLACE]: '/client/marketplace',
    [ViewState.CLIENT_CHECKOUT]: '/checkout',
    [ViewState.CLIENT_CHECKOUT_SUCCESS]: '/checkout/success',
    [ViewState.PRO_HOME]: '/pro/home',
    [ViewState.PRO_PATIENTS]: '/pro/patients',
    [ViewState.PRO_AGENDA]: '/pro/agenda',
    [ViewState.PRO_MARKETPLACE]: '/pro/marketplace',
    [ViewState.PRO_NETWORK]: '/pro/network',
    [ViewState.PRO_FINANCE]: '/pro/finance',
    [ViewState.PRO_OPPORTUNITIES]: '/pro/opportunities',
    [ViewState.SPACE_HOME]: '/space/home',
    [ViewState.SPACE_TEAM]: '/space/team',
    [ViewState.SPACE_RECRUITMENT]: '/space/recruitment',
    [ViewState.SPACE_FINANCE]: '/space/finance',
    [ViewState.SPACE_MARKETPLACE]: '/space/marketplace',
    [ViewState.SPACE_ROOMS]: '/space/rooms',
    [ViewState.SETTINGS]: '/settings',
    [ViewState.SETTINGS_PROFILE]: '/settings/profile',
    [ViewState.SETTINGS_WALLET]: '/settings/wallet',
    [ViewState.SETTINGS_NOTIFICATIONS]: '/settings/notifications',
    [ViewState.SETTINGS_SECURITY]: '/settings/security',
    [ViewState.ADMIN_DASHBOARD]: '/admin/dashboard',
    [ViewState.ADMIN_USERS]: '/admin/users',
    [ViewState.ADMIN_LGPD]: '/admin/lgpd',
};

const HOME_PATH_BY_ROLE: Record<string, string> = {
    CLIENT: '/client/home',
    PROFESSIONAL: '/pro/home',
    SPACE: '/space/home',
    ADMIN: '/admin/dashboard',
};

const resolveHomePath = (role?: string) => HOME_PATH_BY_ROLE[String(role || '').toUpperCase()] || '/client/home';

const resolveViewFromPath = (path: string): ViewState => {
    const exactMatch = Object.entries(VIEW_PATHS).find(([, routePath]) => routePath === path);
    if (exactMatch) return exactMatch[0] as ViewState;

    // Backward compatibility for internal flow URLs
    if (path === '/client/garden') return ViewState.CLIENT_JOURNEY;
    if (path.startsWith('/client/')) {
        if (path.includes('oracle')) return ViewState.CLIENT_ORACLE;
        if (path.includes('journey') || path.includes('evolution') || path.includes('garden') || path.includes('time-lapse')) return ViewState.CLIENT_JOURNEY;
        if (path.includes('metamorphosis')) return ViewState.CLIENT_METAMORPHOSIS;
        if (path.includes('tribe') || path.includes('chat') || path.includes('healing')) return ViewState.CLIENT_TRIBO;
        if (path.includes('booking') || path.includes('explore')) return ViewState.CLIENT_EXPLORE;
        if (path.includes('marketplace')) return ViewState.CLIENT_MARKETPLACE;
        if (path.includes('journal')) return ViewState.CLIENT_JOURNAL;
        if (path.includes('orders') || path.includes('payment')) return ViewState.CLIENT_ORDERS;
        return ViewState.CLIENT_HOME;
    }
    if (path.startsWith('/pro/')) {
        if (path.includes('finance')) return ViewState.PRO_FINANCE;
        if (path.includes('opportun') || path.includes('vaga')) return ViewState.PRO_OPPORTUNITIES;
        if (path.includes('patient') || path.includes('agenda')) return path.includes('agenda') ? ViewState.PRO_AGENDA : ViewState.PRO_PATIENTS;
        if (path.includes('market') || path.includes('escambo')) return ViewState.PRO_MARKETPLACE;
        if (path.includes('network') || path.includes('tribe') || path.includes('chat')) return ViewState.PRO_NETWORK;
        return ViewState.PRO_HOME;
    }
    if (path.startsWith('/space/')) {
        if (path.includes('team') || path.includes('pros')) return ViewState.SPACE_TEAM;
        if (path.includes('recruit') || path.includes('vaga')) return ViewState.SPACE_RECRUITMENT;
        if (path.includes('finance')) return ViewState.SPACE_FINANCE;
        if (path.includes('market')) return ViewState.SPACE_MARKETPLACE;
        if (path.includes('room')) return ViewState.SPACE_ROOMS;
        return ViewState.SPACE_HOME;
    }
    if (path.startsWith('/admin/')) {
        if (path.includes('/users')) return ViewState.ADMIN_USERS;
        if (path.includes('/lgpd')) return ViewState.ADMIN_LGPD;
        return ViewState.ADMIN_DASHBOARD;
    }

    return ViewState.SPLASH;
};

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

    // Persist Cart
    useEffect(() => {
        localStorage.setItem('viva360.cart', JSON.stringify(cart));
    }, [cart]);

    const navigate = useNavigate();
    const location = useLocation();

    const currentView = resolveViewFromPath(location.pathname);

    // Navigation Helper
    const setView = (view: ViewState) => {
        const targetPath = VIEW_PATHS[view];
        if (targetPath) navigate(targetPath);
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
                    
                    const homePath = resolveHomePath(String(standardizedUser.role));
                    if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register' || currentView === ViewState.SPLASH) {
                        navigate(homePath, { replace: true });
                    }
                } else {
                    // Block entry without login - redirect to login for all protected routes
                    if (!PUBLIC_PATHS.includes(location.pathname)) {
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

    useEffect(() => {
        if (APP_MODE !== 'PROD') return;
        const { ok, issues } = validateOAuthRuntimeConfig();
        if (!ok) {
            console.warn('[OAuth Validation] Problemas detectados:', issues);
            setToast({
                title: 'OAuth Google',
                message: 'Configuração de redirect inválida. Verifique domínio e URL de callback no Supabase.'
            });
        }
    }, []);

    useEffect(() => {
        const container = document.getElementById('viva360-main-scroll');
        if (container) {
            container.scrollTo({ top: 0, behavior: 'auto' });
            return;
        }
        window.scrollTo({ top: 0, behavior: 'auto' });
    }, [location.pathname]);

    // Global OAuth Listener - Detects Google login callbacks from any route
    useEffect(() => {
        if (APP_MODE === 'MOCK') {
            // In mock mode, session is local-only and should never be overridden by Supabase events.
            return;
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🔐 Auth State Changed:', event);
            if (event === 'SIGNED_IN' && session) {
                try {
                    const user = await api.auth.getCurrentSession();
                    if (user) {
                        handleLogin(user);
                    }
                } catch (err: any) {
                    console.error('OAuth callback error:', err);
                    setToast({
                        title: 'Acesso não autorizado',
                        message: err?.message || 'Sua conta não está autorizada para este login.'
                    });
                    await api.auth.logout();
                    navigate('/login');
                }
            } else if (event === 'SIGNED_OUT') {
                setCurrentUser(null);
                navigate('/login');
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);


    const handleLogin = (u: any) => {
        if (!u) return;
        handleUpdateUser(u);
        const role = String(u.activeRole || u.role).toUpperCase();
        preloadRoleViews(role);
        console.log("DEBUG: handleLogin Role:", role);
        const homePath = resolveHomePath(role);
        console.log("DEBUG: handleLogin Redirecting to:", homePath);
        navigate(homePath);
    };

    const handleUpdateUser = (u: any) => {
        if (!u) return;
        setCurrentUser(prev => {
            const incoming = { ...(u as User) } as User;
            if (typeof incoming.role === 'string') {
                incoming.role = incoming.role.toUpperCase() as any;
            }
            if (typeof incoming.activeRole === 'string') {
                incoming.activeRole = incoming.activeRole.toUpperCase() as any;
                incoming.role = incoming.activeRole;
            }
            if (Array.isArray(incoming.roles)) {
                incoming.roles = incoming.roles.map((entry: any) => String(entry).toUpperCase() as any);
            }

            if (!prev) return incoming;

            const sameIdentity = String(prev.id || '') === String(incoming.id || '')
                && String(prev.email || '').toLowerCase() === String(incoming.email || '').toLowerCase();

            if (!sameIdentity) {
                return incoming;
            }

            const updated = { ...prev, ...incoming };
            if (typeof updated.role === 'string') {
                updated.role = updated.role.toUpperCase() as any;
            }
            if (typeof updated.activeRole === 'string') {
                updated.activeRole = updated.activeRole.toUpperCase() as any;
                updated.role = updated.activeRole;
            }
            if (Array.isArray(updated.roles)) {
                updated.roles = updated.roles.map((entry: any) => String(entry).toUpperCase() as any);
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
            const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
            const response = await api.payment.checkout(
                totalAmount,
                `Checkout com ${cart.length} item(ns)`,
                undefined,
                {
                    contextType: 'BAZAR',
                    items: cart.map((item) => ({
                        id: item.id,
                        price: Number(item.price || 0),
                        type: item.type || 'service',
                    })),
                }
            );
            const txId = String(response?.transaction?.id || response?.id || '');
            if (!response || response?.code !== 'CHECKOUT_CONFIRMED' || !txId) {
                throw new Error('Falha ao processar pagamento.');
            }
            
            setCart([]);
            localStorage.removeItem('viva360.cart');
            const protocol = String(response?.confirmation?.confirmationId || '').slice(0, 8).toUpperCase();
            setToast({
                title: "Portal de Abundância",
                message: protocol
                    ? `Sua troca foi processada com honra. Protocolo ${protocol}.`
                    : "Sua troca foi processada com honra."
            });
            navigate('/checkout/success', {
                state: {
                    confirmation: response?.confirmation || null,
                    transactionId: txId,
                },
            });
        } catch (e) {
            console.error("Checkout failed", e);
            setToast({ title: "Erro na Alquimia", message: "Não foi possível completar a troca energética." });
        }
    };

    const handleLogout = async () => {
        try {
            await api.auth.logout();
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
                    <Route path="/invite/*" element={<Navigate to="/register/client?ref=invite" replace />} />

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

                    <Route path="/checkout" element={(String(currentUser?.role).toUpperCase() === 'CLIENT') ? (
                        <CheckoutScreen total={cart.reduce((a,b)=>a+(b.price*b.quantity),0)} items={cart} onSuccess={processCheckout} onCancel={() => navigate(-1)} />
                    ) : <Navigate to="/login" />} />
                    <Route path="/checkout/success" element={(String(currentUser?.role).toUpperCase() === 'CLIENT') ? (
                        <SuccessScreen onHome={() => navigate('/client/home')} />
                    ) : <Navigate to="/login" />} />
                    <Route path="/client/orders" element={(String(currentUser?.role).toUpperCase() === 'CLIENT') ? (
                        <OrdersListView user={currentUser!} onBack={() => navigate('/client/home')} setView={setView} />
                    ) : <Navigate to="/login" />} />

                    {/* Pro Routes */}
                    <Route path="/pro/*" element={(String(currentUser?.role).toUpperCase() === 'PROFESSIONAL') ? (
                        <GuardiaoFlowProvider>
                            <ProViews user={currentUser as Professional} view={currentView} setView={setView} updateUser={handleUpdateUser} onLogout={handleLogout} />
                        </GuardiaoFlowProvider>
                    ) : <Navigate to="/login" />} />
                    
                    {/* Space Routes */}

                    <Route path="/space/*" element={(String(currentUser?.role).toUpperCase() === 'SPACE') ? (
                        <SantuarioFlowProvider>
                            <SpaceViews user={currentUser!} view={currentView} setView={setView} onLogout={handleLogout} />
                        </SantuarioFlowProvider>
                    ) : <Navigate to="/login" />} />

                    {/* Admin Routes */}
                     <Route path="/admin/*" element={(String(currentUser?.role).toUpperCase() === 'ADMIN') ? <AdminViews user={currentUser!} view={currentView} setView={setView} /> : <Navigate to="/login" />} />

                    <Route path="/settings/*" element={currentUser ? (
                        <SettingsViews user={currentUser} view={currentView} setView={setView} updateUser={setCurrentUser} onLogout={handleLogout} />
                    ) : <Navigate to="/login" />} />
                    
                    <Route path="*" element={<NotFoundScreen />} />
                </Routes>
            </Suspense>

            {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}
            <Suspense fallback={null}>
                <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} items={cart} onRemove={removeFromCart} onProceed={() => {setIsCartOpen(false); navigate('/checkout');}} />
            </Suspense>
            <SmartTutorial user={currentUser} />
        </Layout>
        </ChatProvider>
      </NotificationProvider>
    );
};

export default App;
