import React, { useState, Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { UserRole, ViewState, User, Professional, Product } from './types';
import App from './App';
import { useAuth } from './contexts/AuthContext';
import { api } from './services/api';

// Lazy load views for code-splitting (reduces initial bundle by ~60%)
const Auth = lazy(() => import('./views/Auth'));
const LegalPages = lazy(() => import('./views/LegalPages').then(m => ({ default: m.PrivacyPolicy })));
const TermsPage = lazy(() => import('./views/LegalPages').then(m => ({ default: m.TermsOfUse })));
const ClientViews = lazy(() => import('./views/ClientViews').then(m => ({ default: m.ClientViews })));
const ProViews = lazy(() => import('./views/ProViews').then(m => ({ default: m.ProViews })));
const SpaceViews = lazy(() => import('./views/SpaceViews').then(m => ({ default: m.SpaceViews })));
const RegistrationViews = lazy(() => import('./views/Registration').then(m => ({ default: m.RegistrationViews })));

// Loading fallback component
const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-nature-900 border-t-transparent rounded-full animate-spin" />
    </div>
);

// --- Wrapper Components to adapter Context -> Props ---

const AuthWrapper = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [view, setView] = useState<ViewState>(ViewState.LOGIN); 

    return (
        <Suspense fallback={<LoadingFallback />}>
            <Auth onLogin={(u) => { login(u); navigate(getHomeRoute(u.role)); }} setView={setView} />
        </Suspense>
    );
};

const ClientWrapper = () => {
    const { user, updateUser } = useAuth();
    const [view, setView] = useState<ViewState>(ViewState.CLIENT_HOME);
    const addToCart = (p: Product) => { console.log('Add to cart', p); };

    if (!user || user.role !== UserRole.CLIENT) return <Navigate to="/login" />;

    return (
        <Suspense fallback={<LoadingFallback />}>
            <ClientViews user={user} view={view} setView={setView} updateUser={updateUser} onAddToCart={addToCart} />
        </Suspense>
    );
};

const ProWrapper = () => {
    const { user, updateUser } = useAuth();
    const [view, setView] = useState<ViewState>(ViewState.PRO_HOME);

    if (!user || user.role !== UserRole.PROFESSIONAL) return <Navigate to="/login" />;

    return (
        <Suspense fallback={<LoadingFallback />}>
            <ProViews user={user as Professional} view={view} setView={setView} updateUser={updateUser} />
        </Suspense>
    );
};

const SpaceWrapper = () => {
    const { user } = useAuth();
    const [view, setView] = useState<ViewState>(ViewState.SPACE_HOME);

    if (!user || user.role !== UserRole.SPACE) return <Navigate to="/login" />;

    return (
        <Suspense fallback={<LoadingFallback />}>
            <SpaceViews user={user} view={view} setView={setView} />
        </Suspense>
    );
};

const RegisterWrapper = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [view, setView] = useState<ViewState>(ViewState.REGISTER);

    return (
        <Suspense fallback={<LoadingFallback />}>
            <RegistrationViews view={view} setView={setView} onRegister={async (u) => {
                const { user } = await api.auth.register(u);
                login(user);
                navigate(getHomeRoute(user.role));
            }} />
        </Suspense>
    );
};

// Helper
const getHomeRoute = (role: UserRole) => {
    switch(role) {
        case UserRole.CLIENT: return '/client';
        case UserRole.PROFESSIONAL: return '/pro';
        case UserRole.SPACE: return '/space';
        default: return '/';
    }
};

const NotFound = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-nature-50">
        <h2 className="text-4xl font-serif text-nature-900 mb-4">404</h2>
        <p className="text-nature-600 mb-8">Página não encontrada ou removida do jardim.</p>
        <Link to="/" className="px-6 py-3 bg-nature-900 text-white rounded-xl font-bold uppercase tracking-widest text-xs">
            Voltar ao Início
        </Link>
    </div>
);

export const router = createBrowserRouter([
    {
        path: "/",
        element: <App />, 
        errorElement: <NotFound />,
        children: [
            { index: true, element: <Navigate to="/login" replace /> },
            { path: "login", element: <AuthWrapper /> },
            { path: "register", element: <RegisterWrapper /> },
            { path: "privacy", element: <Suspense fallback={<LoadingFallback />}><LegalPages onBack={() => window.history.back()} /></Suspense> },
            { path: "terms", element: <Suspense fallback={<LoadingFallback />}><TermsPage onBack={() => window.history.back()} /></Suspense> },
            
            { path: "client/*", element: <ClientWrapper /> },
            { path: "pro/*", element: <ProWrapper /> },
            { path: "space/*", element: <SpaceWrapper /> },
            
            // Catch-all for unknown routes
            { path: "*", element: <NotFound /> },
        ]
    }
]);
