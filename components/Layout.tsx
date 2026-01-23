
import React, { useState, useEffect } from 'react';
import { User, UserRole, ViewState, Notification } from '../types';
import { Home, Compass, ShoppingBag, User as UserIcon, LogOut, Activity, Building, Users, Wallet, Calendar, Sun, Settings, Heart, Flower, Bell, Briefcase, Zap, Sparkles } from 'lucide-react';
import { AuroraBackground, NotificationDrawer } from './Common';
import { api } from '../services/api';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  currentView: ViewState;
  setView: (view: ViewState) => void;
  onLogout: () => void;
  shouldHideNav?: boolean;
}

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
            { id: ViewState.PRO_HOME, label: 'Início', icon: Activity },
            { id: ViewState.PRO_PATIENTS, label: 'Jardim', icon: Flower }, 
            { id: ViewState.PRO_MARKETPLACE, label: 'Bazar', icon: ShoppingBag },
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

const Sidebar: React.FC<Omit<LayoutProps, 'children'> & { unreadCount: number, onOpenNotifications: () => void }> = ({ user, currentView, setView, onLogout, unreadCount, onOpenNotifications }) => {
    const navItems = navItemsDefinition(user);
    return (
        <aside className="hidden lg:flex flex-col w-80 bg-white border-r border-nature-100 h-full shadow-[10px_0_30px_rgba(0,0,0,0.02)] z-50">
            <div className="p-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-nature-900 rounded-[1.25rem] flex items-center justify-center text-white font-serif italic text-2xl shadow-xl shadow-nature-900/20">V</div>
                <div className="flex flex-col">
                    <span className="font-serif italic font-bold text-2xl tracking-tight text-nature-900 leading-none">Viva360</span>
                    <span className="text-[9px] font-bold text-primary-500 uppercase tracking-[0.3em] mt-1">Ecosistema Holístico</span>
                </div>
            </div>
            <nav className="flex-1 px-6 space-y-3 overflow-y-auto no-scrollbar py-4">
                {navItems.map(item => {
                    const active = currentView === item.id;
                    return (
                        <button key={item.id} onClick={() => setView(item.id)} className={`flex items-center gap-4 p-5 rounded-[1.8rem] w-full text-left transition-all ${active ? 'bg-nature-900 text-white shadow-2xl' : 'text-nature-400 hover:bg-nature-50'}`}>
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
    return (
        <div className="lg:hidden fixed bottom-0 left-0 w-full px-4 z-[100] pb-[calc(1.5rem+env(safe-area-inset-bottom,20px))] pt-4 pointer-events-none">
            <nav className="mx-auto bg-white/95 backdrop-blur-2xl border border-nature-100 shadow-[0_10px_60px_rgba(0,0,0,0.15)] rounded-[2.8rem] flex justify-between items-center px-2 h-[4.8rem] pointer-events-auto max-w-md relative ring-1 ring-white/50">
                {navItems.map(item => {
                    const active = currentView === item.id;
                    return (
                        <button key={item.id} onClick={() => setView(item.id)} className="flex-1 flex flex-col items-center justify-center h-full relative group outline-none">
                            <div className={`p-3.5 rounded-[1.4rem] transition-all duration-500 ease-out ${active ? 'bg-nature-900 text-white -translate-y-8 shadow-[0_15px_30px_rgba(0,0,0,0.2)] scale-110' : 'text-nature-400'}`}>
                                <item.icon size={22} />
                            </div>
                            <span className={`absolute bottom-2.5 text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${active ? 'opacity-100 translate-y-0 text-nature-900' : 'opacity-0 translate-y-2'}`}>{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

const Layout: React.FC<LayoutProps> = ({ children, user, currentView, setView, onLogout, shouldHideNav }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    useEffect(() => { if (user) api.notifications.list(user.id).then(setNotifications); }, [user]);

    return (
        <div className="h-[100dvh] w-full bg-[#f8faf9] flex relative text-nature-800 font-sans overflow-hidden">
            <AuroraBackground />
            {!shouldHideNav && <Sidebar user={user} currentView={currentView} setView={setView} onLogout={onLogout} unreadCount={notifications.filter(n => !n.read).length} onOpenNotifications={() => setIsNotifOpen(true)} />}
            <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
                <main className="flex-1 w-full h-full relative overflow-hidden">
                    <div className="h-full w-full overflow-y-auto no-scrollbar scroll-smooth">
                        <div className={`w-full lg:max-w-5xl lg:mx-auto min-h-full ${shouldHideNav ? '' : 'pb-[calc(8rem+env(safe-area-inset-bottom))] lg:pb-12 lg:pt-8'}`}>
                            <div className={shouldHideNav ? "" : "px-4 lg:px-10"}>{children}</div>
                        </div>
                    </div>
                </main>
                {!shouldHideNav && <BottomNav user={user} currentView={currentView} setView={setView} onLogout={onLogout} />}
            </div>
            <NotificationDrawer isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} notifications={notifications} onMarkAsRead={(id) => {}} onMarkAllRead={() => {}} />
        </div>
    );
};

export default Layout;
