
import React, { useState } from 'react';
import { User, UserRole, ViewState } from '../types';
import { Home, Compass, ShoppingBag, User as UserIcon, LogOut, Activity, Building, Users, Wallet, Calendar, Sun, Settings, Heart, Flower, Bell, Briefcase, Zap, Sparkles, Book } from 'lucide-react';
import { AuroraBackground, NotificationDrawer } from './Common';
import { isDemoMode, isMockMode } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../src/contexts/NotificationContext';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  currentView: ViewState;
  setView: (view: ViewState) => void;
  onLogout: () => void;
  shouldHideNav?: boolean;
}

const scrollMainContentToTop = () => {
    const container = document.getElementById('viva360-main-scroll');
    if (container) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

const navItemsDefinition = (user: User | null) => {
    if (!user) return [];
    switch(user.role) {
        case UserRole.CLIENT: return [
            { id: ViewState.CLIENT_HOME, label: 'Início', icon: Home },
            { id: ViewState.CLIENT_JOURNEY, label: 'Jornada', icon: Sun },
            { id: ViewState.CLIENT_EXPLORE, label: 'Explorar', icon: Compass },
            { id: ViewState.CLIENT_TRIBO, label: 'Tribo', icon: Heart },
            { id: ViewState.SETTINGS, label: 'Perfil', icon: UserIcon },
        ];
        case UserRole.PROFESSIONAL: return [
            { id: ViewState.PRO_HOME, label: 'Início', icon: Home },
            { id: ViewState.PRO_PATIENTS, label: 'Jardim', icon: Flower }, 
            { id: ViewState.PRO_AGENDA, label: 'Agenda', icon: Calendar },
            { id: ViewState.SETTINGS, label: 'Perfil', icon: UserIcon },
        ];
        case UserRole.SPACE: return [
            { id: ViewState.SPACE_HOME, label: 'Hub', icon: Building },
            { id: ViewState.SPACE_TEAM, label: 'Equipe', icon: Users }, 
            { id: ViewState.SPACE_RECRUITMENT, label: 'Vagas', icon: Briefcase },
            { id: ViewState.SETTINGS, label: 'Perfil', icon: UserIcon },
        ];
        default: return [];
    }
};

const canonicalPathForView = (user: User | null, view: ViewState): string | null => {
    if (!user) return null;
    // Keep navigation deterministic so clicking an already-active tab can still "escape" deep screens.
    // This is important for zero-dead-end UX and QA stability.
    switch (view) {
        case ViewState.SETTINGS:
            return '/settings';
        default:
            break;
    }
    if (user.role === UserRole.CLIENT) {
        switch (view) {
            case ViewState.CLIENT_HOME: return '/client/home';
            case ViewState.CLIENT_JOURNEY: return '/client/journey';
            case ViewState.CLIENT_EXPLORE: return '/client/explore';
            // Route is `/client/tribe` (see views/InviteLanding.tsx + views/client flow map).
            case ViewState.CLIENT_TRIBO: return '/client/tribe';
            default: return null;
        }
    }
    if (user.role === UserRole.PROFESSIONAL) {
        switch (view) {
            case ViewState.PRO_HOME: return '/pro/home';
            case ViewState.PRO_PATIENTS: return '/pro/patients';
            case ViewState.PRO_AGENDA: return '/pro/agenda';
            default: return null;
        }
    }
    if (user.role === UserRole.SPACE) {
        switch (view) {
            case ViewState.SPACE_HOME: return '/space/home';
            case ViewState.SPACE_TEAM: return '/space/team';
            case ViewState.SPACE_RECRUITMENT: return '/space/recruitment';
            default: return null;
        }
    }
    return null;
};

const Sidebar: React.FC<Omit<LayoutProps, 'children'> & { unreadCount: number, onOpenNotifications: () => void }> = ({ user, currentView, setView, onLogout, unreadCount, onOpenNotifications }) => {
    const navItems = navItemsDefinition(user);
    const navigate = useNavigate();
    return (
        <aside className="hidden lg:flex flex-col w-80 bg-white border-r border-nature-100 h-full shadow-[10px_0_30px_rgba(0,0,0,0.02)] z-50">
            <div className="p-10 flex items-center gap-4">
                <div className="flex flex-col">
                    <span className="font-serif italic font-bold text-2xl tracking-tight text-nature-900 leading-none">Viva360</span>
                    <span className="text-[9px] font-bold text-primary-500 uppercase tracking-[0.3em] mt-1">Ecosistema Holístico</span>
                </div>
            </div>
            <nav className="flex-1 px-6 space-y-3 overflow-y-auto no-scrollbar py-4">
                {navItems.map(item => {
                    const active = currentView === item.id;
                    return (

                        <button 
                            key={item.id} 
                            onClick={() => {
                                setView(item.id);
                                const path = canonicalPathForView(user, item.id);
                                if (path) navigate(path);
                                scrollMainContentToTop();
                            }} 
                            className={`flex items-center gap-4 p-5 rounded-[1.8rem] w-full text-left transition-all ${active ? 'bg-nature-900 text-white shadow-2xl' : 'text-nature-400 hover:bg-nature-50'}`}
                        >
                            <item.icon size={20} />
                            <span className="font-bold text-sm">{item.label}</span>
                        </button>
                    );

                })}
            </nav>
            <div className="p-8 border-t border-nature-50 space-y-3">
                <button onClick={onOpenNotifications} className="flex items-center gap-4 p-4 rounded-2xl w-full text-left text-nature-400 hover:bg-nature-50 relative">
                    <Bell size={20} />
                    <span className="font-bold text-sm">Notificações</span>
                    {unreadCount > 0 && <span className="ml-auto px-2 py-0.5 bg-rose-500 text-white rounded-lg text-[10px] font-bold">{unreadCount}</span>}
                </button>
                <button onClick={onLogout} className="flex items-center gap-4 p-4 rounded-2xl w-full text-left text-nature-400 hover:bg-rose-50 hover:text-rose-600"><LogOut size={20} /><span className="font-bold text-sm">Sair</span></button>
            </div>
        </aside>
    );
};

const BottomNav: React.FC<Omit<LayoutProps, 'children'>> = ({ user, currentView, setView }) => {
    const navItems = navItemsDefinition(user);
    const navigate = useNavigate();
    return (
        <div className="lg:hidden fixed bottom-6 left-0 w-full px-6 z-[100] pb-[env(safe-area-inset-bottom,20px)] pointer-events-none">
            <nav className="mx-auto bg-white/95 backdrop-blur-2xl border border-nature-100 shadow-[0_10px_60px_rgba(0,0,0,0.15)] rounded-full flex justify-between items-center px-2 h-14 pointer-events-auto max-w-md relative ring-1 ring-white/50">
                {navItems.map(item => {
                    const active = currentView === item.id;
                    return (
                        <button 
                            key={item.id} 
                            onClick={() => {
                                setView(item.id);
                                const path = canonicalPathForView(user, item.id);
                                if (path) navigate(path);
                                scrollMainContentToTop();
                            }} 
                            className="flex-1 flex flex-col items-center justify-center h-full relative group outline-none focus:outline-none touch-manipulation"
                        >
                            <div className={`p-2.5 rounded-2xl transition-all duration-500 ease-out ${active ? 'bg-nature-900 text-white -translate-y-6 shadow-[0_15px_30px_rgba(0,0,0,0.2)] scale-110' : 'text-nature-400'}`}>
                                <item.icon size={22} />
                            </div>
                            <span className={`absolute bottom-1.5 text-[9px] font-black uppercase tracking-[0.1em] transition-all duration-300 ${active ? 'opacity-100 translate-y-0 text-nature-900' : 'opacity-0 translate-y-2'}`}>{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

const Layout: React.FC<LayoutProps> = ({ children, user, currentView, setView, onLogout, shouldHideNav }) => {
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();

    return (
        <div className="h-[100dvh] w-full bg-[#f8faf9] flex relative text-nature-800 font-sans overflow-hidden">
            <AuroraBackground />
            {!shouldHideNav && <Sidebar user={user} currentView={currentView} setView={setView} onLogout={onLogout} unreadCount={unreadCount} onOpenNotifications={() => setIsNotifOpen(true)} />}
            <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
                <main className="flex-1 w-full h-full relative overflow-hidden">
                    <div id="viva360-main-scroll" className="h-full w-full overflow-y-auto overflow-x-hidden overscroll-contain scroll-smooth">
                        <div className={`w-full lg:max-w-5xl lg:mx-auto min-h-full ${shouldHideNav ? '' : 'pb-[calc(8rem+env(safe-area-inset-bottom))] lg:pb-12 lg:pt-8'}`}>
                            <div className={shouldHideNav ? "" : "px-4 lg:px-10"}>{children}</div>
                        </div>
                    </div>
                </main>
                {!shouldHideNav && <BottomNav user={user} currentView={currentView} setView={setView} onLogout={onLogout} />}
            </div>
            <NotificationDrawer isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} notifications={notifications} onMarkAsRead={(id) => {
                markAsRead(id).catch(() => {});
            }} onMarkAllRead={() => {
                markAllRead().catch(() => {});
            }} />
            
            {/* Mock indicator removed */}
        </div>
    );
};

export default Layout;
