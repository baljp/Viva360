
import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { User, ViewState, Professional, CartItem, Product } from './types';
import Layout from './components/Layout';
import { api } from './services/api';
import type { AuthRegisterInput } from './services/api/authProxy';
import { ZenToast } from './components/Common';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { ChatProvider } from './src/contexts/ChatContext';
import { AppToastProvider } from './src/contexts/AppToastContext';

// Lazy Load Views
const Auth = lazyWithRetry(() => import('./views/Auth'), 'Auth');
const ResetPasswordView = lazyWithRetry(() => import('./views/ResetPassword').then(m => ({ default: m.ResetPasswordView })), 'ResetPasswordView');
const ClientRouteShell = lazyWithRetry(() => import('./views/routes/ClientRouteShell').then(module => ({ default: module.ClientRouteShell })), 'ClientRouteShell');
const ProRouteShell = lazyWithRetry(() => import('./views/routes/ProRouteShell').then(module => ({ default: module.ProRouteShell })), 'ProRouteShell');
const SpaceRouteShell = lazyWithRetry(() => import('./views/routes/SpaceRouteShell').then(module => ({ default: module.SpaceRouteShell })), 'SpaceRouteShell');
const SettingsViews = lazyWithRetry(() => import('./views/SettingsViews').then(module => ({ default: module.SettingsViews })), 'SettingsViews');
const RegistrationViews = lazyWithRetry(() => import('./views/Registration').then(module => ({ default: module.RegistrationViews })), 'RegistrationViews');
const InviteLanding = lazyWithRetry(() => import('./views/InviteLanding'), 'InviteLanding');
const CartDrawer = lazyWithRetry(() => import('./components/Checkout').then(module => ({ default: module.CartDrawer })), 'CartDrawer');
const CheckoutScreen = lazyWithRetry(() => import('./components/Checkout').then(module => ({ default: module.CheckoutScreen })), 'CheckoutScreen');
const SuccessScreen = lazyWithRetry(() => import('./components/Checkout').then(module => ({ default: module.SuccessScreen })), 'SuccessScreen');
const OrdersListView = lazyWithRetry(() => import('./views/ServiceViews').then(module => ({ default: module.OrdersListView })), 'OrdersListView');
const AdminViews = lazyWithRetry(() => import('./views/AdminViews').then(module => ({ default: module.AdminViews })), 'AdminViews');
const SmartTutorial = lazyWithRetry(() => import('./components/SmartTutorial').then(module => ({ default: module.SmartTutorial })), 'SmartTutorial');
import { NotFoundScreen } from './src/navigation/NotFoundScreen';
import { preloadRoleViews } from './src/utils/loaderUtils';
import { lazyWithRetry } from './src/utils/lazyWithRetry';
import { telemetry } from './lib/telemetry';
import { VIEW_PATHS, resolveHomePath, resolveViewFromPath } from './src/app/routing';
import { clearCartStorage, clearPendingInvite, loadCartFromStorage, mergeUserForApp, persistCartToStorage, readPendingInvite } from './src/app/userSession';
import { useAppSessionBootstrap, useOAuthConfigWarning, useScrollResetOnPathChange } from './src/app/bootstrap';
import { useGlobalAuthStateListener } from './src/app/listeners';
import { RequireAuth, RequireRole } from './src/app/guards';
import { captureFrontendError, captureFrontendMessage } from './lib/frontendLogger';

// Loading Component
const PageLoader = () => (
  <div className="h-full w-full flex items-center justify-center min-h-[50vh]">
    <div className="w-8 h-8 border-4 border-nature-200 border-t-nature-900 rounded-full animate-spin"></div>
  </div>
);

const toAuthRegisterInput = (input: Partial<User | Professional>): AuthRegisterInput => {
    const email = String(input.email || '').trim();
    const password = String((input as { password?: string }).password || '').trim();
    const name = String(input.name || '').trim();
    const role = input.role;

    if (!email || !password || !role) {
        throw new Error('Dados de cadastro incompletos.');
    }

    return {
        email,
        password,
        role,
        ...(name ? { name } : {}),
    };
};

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
    const [cart, setCart] = useState<CartItem[]>(loadCartFromStorage);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [toast, setToast] = useState<{title: string, message: string, type?: 'success' | 'error' | 'info' | 'warning'} | null>(null);

    // Persist Cart
    useEffect(() => {
        persistCartToStorage(cart);
    }, [cart]);

    const navigate = useNavigate();
    const location = useLocation();

    const currentView = resolveViewFromPath(location.pathname);

    // Navigation Helper
    const setView = (view: ViewState) => {
        const targetPath = VIEW_PATHS[view];
        if (targetPath) navigate(targetPath);
    };

    const handleUpdateUser = useCallback((u: User | Partial<User> | null) => {
        if (!u) return;
        setCurrentUser(prev => mergeUserForApp(prev, u));
    }, []);

    const handleLogin = useCallback((u: User | Partial<User> | null) => {
        if (!u) return;
        handleUpdateUser(u);
        telemetry.setUser(u.id || null);
        const role = String(u.activeRole || u.role).toUpperCase();
        preloadRoleViews(role);
        const homePath = resolveHomePath(role);
        const pending = readPendingInvite();
        const pendingToken = pending.token;
        const pendingDest = pending.destination;
        const dest = pendingDest || homePath;
        navigate(dest);

        // Accept pending invite post-login (best-effort, non-blocking).
        (async () => {
            if (!pendingToken) return;
            try {
                await api.invites.accept(pendingToken);
                setToast({ title: 'Vínculo ativado', message: 'Seu chamado foi aceito e o vínculo foi concluído.' });
            } catch (e) {
                captureFrontendError(e, { domain: 'invite', op: 'accept.pending_after_login' });
                setToast({ title: 'Convite', message: 'Não foi possível concluir o vínculo automaticamente.' });
            } finally {
                clearPendingInvite();
            }
        })();
    }, [handleUpdateUser, navigate]);

    useAppSessionBootstrap({
        pathname: location.pathname,
        currentView,
        navigate,
        setCurrentUser,
        setIsLoading,
    });
    useOAuthConfigWarning(setToast);
    useScrollResetOnPathChange(location.pathname);
    useGlobalAuthStateListener({ navigate, onLogin: handleLogin, setCurrentUser, setToast });

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
            clearCartStorage();
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
            captureFrontendError(e, { domain: 'checkout', op: 'processCheckout' });
            setToast({ title: "Erro na Alquimia", message: "Não foi possível completar a troca energética." });
        }
    };

    const handleLogout = async () => {
        try {
            await api.auth.logout();
        } catch (e) {
            captureFrontendMessage('auth.logout.failed', { domain: 'auth', op: 'logout', error: String(e) });
        } finally {
            telemetry.setUser(null);
            setCurrentUser(null);
            navigate('/login');
        }
    };

    if (isLoading) return <Splash />;

    const shouldHideNav = isCartOpen || !currentUser || ['/', '/login', '/register', '/checkout', '/checkout/success'].includes(location.pathname);

    return (
      <NotificationProvider>
        <ChatProvider>
        <AppToastProvider toast={toast} setToast={setToast}>
        <Layout user={currentUser} currentView={currentView} setView={setView} onLogout={handleLogout} shouldHideNav={shouldHideNav}>
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<Auth onLogin={handleLogin} setView={setView} />} />
                    <Route path="/reset-password" element={<ResetPasswordView />} />
                    <Route path="/invite/*" element={<InviteLanding />} />

                    <Route path="/register" element={<RegistrationViews view={ViewState.REGISTER} setView={setView} onRegister={async (u) => { 
                        const user = await api.auth.register(toAuthRegisterInput(u)); 
                        handleLogin(user); 
                    }} />} />
                    <Route path="/register/client" element={<RegistrationViews view={ViewState.REGISTER_CLIENT} setView={setView} onRegister={async (u) => { 
                        const user = await api.auth.register(toAuthRegisterInput(u)); 
                        handleLogin(user);
                    }} />} />
                    <Route path="/register/pro" element={<RegistrationViews view={ViewState.REGISTER_PRO} setView={setView} onRegister={async (u) => { 
                        const user = await api.auth.register(toAuthRegisterInput(u)); 
                        handleLogin(user);
                    }} />} />
                    <Route path="/register/space" element={<RegistrationViews view={ViewState.REGISTER_SPACE} setView={setView} onRegister={async (u) => { 
                        const user = await api.auth.register(toAuthRegisterInput(u)); 
                        handleLogin(user);
                    }} />} />

                    {/* Client Routes */}
                    <Route path="/client/*" element={(
                        <RequireRole user={currentUser} role="CLIENT">
                            <ClientRouteShell 
                                user={currentUser!} 
                                view={currentView} 
                                setView={setView} 
                                updateUser={handleUpdateUser} 
                                onAddToCart={addToCart} 
                                onLogout={handleLogout}
                            />
                        </RequireRole>
                    )} />

                    <Route path="/checkout" element={(
                        <RequireRole user={currentUser} role="CLIENT">
                            <CheckoutScreen total={cart.reduce((a,b)=>a+(b.price*b.quantity),0)} items={cart} onSuccess={processCheckout} onCancel={() => navigate(-1)} />
                        </RequireRole>
                    )} />
                    <Route path="/checkout/success" element={(
                        <RequireRole user={currentUser} role="CLIENT">
                            <SuccessScreen onHome={() => navigate('/client/home')} />
                        </RequireRole>
                    )} />
                    <Route path="/client/orders" element={(
                        <RequireRole user={currentUser} role="CLIENT">
                            <OrdersListView user={currentUser!} onBack={() => navigate('/client/home')} setView={setView} />
                        </RequireRole>
                    )} />

                    {/* Pro Routes */}
                    <Route path="/pro/*" element={(
                        <RequireRole user={currentUser} role="PROFESSIONAL">
                            <ProRouteShell user={currentUser as Professional} view={currentView} setView={setView} updateUser={handleUpdateUser} onLogout={handleLogout} />
                        </RequireRole>
                    )} />
                    
                    {/* Space Routes */}

                    <Route path="/space/*" element={(
                        <RequireRole user={currentUser} role="SPACE">
                            <SpaceRouteShell user={currentUser!} view={currentView} setView={setView} onLogout={handleLogout} />
                        </RequireRole>
                    )} />

                    {/* Admin Routes */}
                     <Route path="/admin/*" element={(
                        <RequireRole user={currentUser} role="ADMIN">
                            <AdminViews user={currentUser!} view={currentView} setView={setView} />
                        </RequireRole>
                     )} />

                    <Route path="/settings/*" element={(
                        <RequireAuth user={currentUser}>
                            <SettingsViews user={currentUser!} view={currentView} setView={setView} updateUser={setCurrentUser} onLogout={handleLogout} />
                        </RequireAuth>
                    )} />
                    
                    <Route path="*" element={<NotFoundScreen />} />
                </Routes>
            </Suspense>

            {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}
            <Suspense fallback={null}>
                <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} items={cart} onRemove={removeFromCart} onProceed={() => {setIsCartOpen(false); navigate('/checkout');}} />
            </Suspense>
            <Suspense fallback={null}>
                <SmartTutorial user={currentUser} />
            </Suspense>
        </Layout>
        </AppToastProvider>
        </ChatProvider>
      </NotificationProvider>
    );
};

export default App;
