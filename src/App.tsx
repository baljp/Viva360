import React, { useState, useEffect, Suspense, lazy } from 'react';
import { User, UserRole, ViewState, Professional, Service, CartItem, ToastMessage } from './types';
import { MOCK_USERS, MOCK_PROS } from './constants';
import Layout from './components/Layout';
import Auth from './views/Auth';
const ClientViews = lazy(() => import('./views/ClientViews').then(m => ({ default: m.ClientViews })));
const ProViews = lazy(() => import('./views/ProViews'));
const SpaceViews = lazy(() => import('./views/SpaceViews'));
const SettingsViews = lazy(() => import('./views/SettingsViews'));
import { ZenToast, OfflineState, NotificationCenter, NotificationItem } from './components/Common';
import { useApi } from './hooks/useApi';
import { endpoints } from './utils/api';
import AppointmentsManager from './views/AppointmentsManager';
import ProProfileEdit from './views/ProProfileEdit';

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentView, setCurrentView] = useState<ViewState>(ViewState.SPLASH);

    // Global System State
    const [toast, setToast] = useState<ToastMessage | null>(null);
    const [isOffline, setIsOffline] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([
        { id: 'n1', title: 'Bem-vindo ao Viva360', message: 'Sua jornada de autoconhecimento começa aqui.', time: 'Hoje', read: false, type: 'system' },
        { id: 'n2', title: 'Mensagem de Sofia', message: 'Como você está se sentindo hoje?', time: '2h atrás', read: false, type: 'message' },
    ]);

    const authApi = useApi<User>();
    const notificationsApi = useApi<NotificationItem[]>();

    // Notification Polling
    useEffect(() => {
        if (currentUser) {
            notificationsApi.request(`${endpoints.notifications}?userId=${currentUser.id}`)
                .then(data => setNotifications(data))
                .catch(err => console.error("Failed to fetch notifications"));
        }
    }, [currentUser, isNotificationsOpen, notificationsApi]);

    // API Hooks
    const { data: professionals, request: fetchPros } = useApi<Professional[]>();

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

    // Fetch initial data
    useEffect(() => {
        fetchPros('professionals').catch(error => {
            console.error('Failed to fetch professionals:', error);
            showToast({ id: 'err-pros', type: 'error', title: 'Erro ao carregar profissionais' });
        });
    }, [fetchPros]);

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
    const handleLogin = async (loginForm: any) => { // Assuming loginForm is passed from Auth component
        try {
            const user = await authApi.request(endpoints.auth, {
                method: 'POST',
                body: JSON.stringify({ action: 'login', email: loginForm.email, password: loginForm.password })
            });
            setCurrentUser(user);
            setCurrentView(user.role === UserRole.CLIENT ? ViewState.CLIENT_HOME : (user.role === UserRole.PROFESSIONAL ? ViewState.PRO_HOME : ViewState.SPACE_HOME));
            setToast({ title: 'Bem-vindo!', message: `Olá, ${user.name}`, type: 'success' });
        } catch (err) {
            setToast({ title: 'Erro', message: 'Credenciais inválidas', type: 'error' });
        }
    };

    const handleRegister = async (registerForm: any) => { // Assuming registerForm is passed from Auth component
        try {
            const user = await authApi.request(endpoints.auth, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'register',
                    name: registerForm.name,
                    email: registerForm.email,
                    password: registerForm.password,
                    role: registerForm.role
                })
            });
            setCurrentUser(user);
            setCurrentView(ViewState.ONBOARDING_INTENT); // Assuming this is the next step after registration
            setToast({ title: 'Sucesso!', message: 'Conta criada com sucesso', type: 'success' });
        } catch (err) {
            setToast({ title: 'Erro', message: 'Falha ao criar conta. Usuário já existe?', type: 'error' });
        }
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

        if (!currentUser) return <Auth onLogin={handleLogin} onRegister={handleRegister} />;

        // Handle Shared Views
        if ([
            ViewState.SETTINGS,
            ViewState.VERIFICATION,
            ViewState.TERMS,
            ViewState.INVITE_FRIEND,
            ViewState.SUPPORT,
            ViewState.SETTINGS_PRIVACY_HEALTH,
            ViewState.SETTINGS_PRO_SERVICES,
            ViewState.SETTINGS_PROFILE_EDIT,
            ViewState.SETTINGS_COMMISSION
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
                    onBookingComplete={() => { }}
                    onStartBooking={handleStartBooking}
                    onToggleFavorite={handleToggleFavorite}
                    // API Data
                    professionals={professionals || []}
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

        if (currentView === ViewState.CLIENT_ORDERS) {
            return (
                <AppointmentsManager
                    userRole={UserRole.CLIENT}
                    appointments={[]} // To be fetched
                    onBack={() => setCurrentView(ViewState.CLIENT_HOME)}
                />
            );
        }

        if (currentUser.role === UserRole.PROFESSIONAL) {
            if (currentView === ViewState.SETTINGS_PROFILE_EDIT) {
                return (
                    <ProProfileEdit
                        pro={currentUser as Professional}
                        onBack={() => setCurrentView(ViewState.PRO_HOME)}
                        onSave={(updated) => {
                            setCurrentUser({ ...currentUser, ...updated });
                            setCurrentView(ViewState.PRO_HOME);
                            showToast({ id: 'save-pro', type: 'success', title: 'Perfil atualizado' });
                        }}
                    />
                );
            }
            return <ProViews user={currentUser} view={currentView} setView={setCurrentView} />;
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
            onToggleNotifications={() => setIsNotificationsOpen(true)}
            hasUnreadNotifications={notifications.some(n => !n.read)}
        >
            <Suspense fallback={<div className="flex items-center justify-center p-20 text-primary-500">Carregando...</div>}>
                {renderView()}
            </Suspense>
            <NotificationCenter
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                notifications={notifications}
                onMarkRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
            />
            <ZenToast toast={toast} onClose={() => setToast(null)} />
        </Layout>
    );
};

export default App;