
import React, { useState, useEffect } from 'react';
import { User, UserRole, ViewState, Notification } from '../types';
import { Home, Compass, ShoppingBag, User as UserIcon, LogOut, Activity, Building, Users, Wallet, Calendar, Sun, Settings, Heart, Flower, Bell, Briefcase, Zap } from 'lucide-react';
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
            { id: ViewState.PRO_NETWORK, label: 'Alquimia', icon: Zap },
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

const isActive = (currentView: ViewState, id: ViewState) => {
    if (id === ViewState.SETTINGS && currentView.startsWith('SETTINGS')) return true;
    if (id === ViewState.CLIENT_HOME && (currentView === ViewState.CLIENT_RITUAL || currentView === ViewState.CLIENT_VIDEO_SESSION)) return true;
    if (id === ViewState.CLIENT_EXPLORE && (currentView === ViewState.CLIENT_PRO_DETAILS)) return true;
    if (id === ViewState.CLIENT_MARKETPLACE && (currentView === ViewState.CLIENT_PRODUCT_DETAILS)) return true;
    if (id === ViewState.PRO_PATIENTS && currentView === ViewState.PRO_PATIENT_DETAILS) return true;
    if (id === ViewState.SPACE_TEAM && currentView === ViewState.SPACE_TEAM_DETAILS) return true;
    if (id === ViewState.SPACE_RECRUITMENT && currentView === ViewState.SPACE_VACANCY_DETAILS) return true;
    return currentView === id;
};

const Sidebar: React.FC<Omit<LayoutProps, 'children'> & { unreadCount: number, onOpenNotifications: () => void }> = ({ user, currentView, setView, onLogout, unreadCount, onOpenNotifications }) => {
    const navItems = navItemsDefinition(user);
    return (
        <aside className="hidden lg:flex flex-col w-72 bg-white/50 backdrop-blur-xl border-r border-nature-100 flex-none h-full shadow-sm z-20">
            <div className="p-8 flex items-center gap-3">
                <div className="w-10 h-10 bg-nature-900 rounded-2xl flex items-center justify-center text-white font-serif italic text-xl shadow-lg">V</div>
                <span className="font-serif italic font-bold text-xl tracking-tight text-nature-900">Viva360</span>
            </div>
            <nav className="flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar">
                {navItems.map(item => {
                    const active = isActive(currentView, item.id);
                    return (
                        <button key={item.id} onClick={() => setView(item.id)} className={`flex items-center gap-4 p-4 rounded-2xl w-full text-left transition-all group ${active ? 'bg-white text-nature-900 shadow-md' : 'text-nature-400 hover:bg-white/60 hover:text-nature-700'}`}>
                            <div className={`p-2 rounded-xl transition-colors ${active ? 'bg-nature-900 text-white' : 'bg-transparent group-hover:bg-nature-100'}`}>
                                <item.icon size={20} />
                            </div>
                            <span className="font-bold text-sm">{item.label}</span>
                        </button>
                    );
                })}
            </nav>
            <div className="p-4 mt-auto space-y-2">
                <button onClick={onOpenNotifications} className="flex items-center gap-4 p-4 rounded-2xl w-full text-left text-nature-400 hover:bg-white/60 transition-colors relative">
                    <div className="p-2 rounded-xl bg-transparent transition-colors relative">
                        <Bell size={20} />
                        {unreadCount > 0 && <div className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-pulse"></div>}
                    </div>
                    <span className="font-bold text-sm">Avisos</span>
                </button>
                <button onClick={onLogout} className="flex items-center gap-4 p-4 rounded-2xl w-full text-left text-nature-400 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                    <div className="p-2 rounded-xl bg-transparent transition-colors">
                        <LogOut size={20} />
                    </div>
                    <span className="font-bold text-sm">Sair</span>
                </button>
            </div>
        </aside>
    );
};

const BottomNav: React.FC<Omit<LayoutProps, 'children'> & { unreadCount: number, onOpenNotifications: () => void }> = ({ user, currentView, setView, unreadCount, onOpenNotifications }) => {
    const navItems = navItemsDefinition(user);
    return (
        <div className="lg:hidden fixed bottom-0 left-0 w-full px-4 z-[50] pb-[calc(env(safe-area-inset-bottom,20px)+10px)] pt-4 pointer-events-none">
            <nav className="mx-auto bg-white/95 backdrop-blur-2xl border border-white/50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-[2.5rem] flex justify-between items-center px-2 h-[4.5rem] pointer-events-auto max-w-sm relative">
                {navItems.map(item => {
                    const active = isActive(currentView, item.id);
                    return (
                        <button key={item.id} onClick={() => setView(item.id)} className="flex-1 flex flex-col items-center justify-center h-full relative group">
                            <div className={`p-3 rounded-2xl transition-all duration-500 ${active ? 'bg-nature-900 text-white -translate-y-6 shadow-2xl scale-110' : 'text-nature-400'}`}>
                                <item.icon size={22} />
                            </div>
                            <span className={`absolute bottom-2 text-[9px] font-bold uppercase tracking-wider transition-all duration-300 ${active ? 'opacity-100 translate-y-0 text-nature-900' : 'opacity-0 translate-y-2'}`}>{item.label}</span>
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

    useEffect(() => {
        if (user) {
            api.notifications.list(user.id).then(setNotifications);
        }
    }, [user, isNotifOpen]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleMarkAsRead = async (id: string) => {
        if (user) {
            await api.notifications.markAsRead(user.id, id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        }
    };

    const handleMarkAllRead = async () => {
        if (user) {
            await api.notifications.markAllAsRead(user.id);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        }
    }

    return (
        <div className="h-[100dvh] w-full bg-primary-50 flex relative text-nature-800 font-sans overflow-hidden">
            <AuroraBackground />
            {!shouldHideNav && <Sidebar user={user} currentView={currentView} setView={setView} onLogout={onLogout} unreadCount={unreadCount} onOpenNotifications={() => setIsNotifOpen(true)} />}
            
            <div className="flex-1 flex flex-col min-w-0 h-full relative">
                <main className="flex-1 w-full h-full overflow-hidden">
                    <div className="h-full w-full overflow-y-auto no-scrollbar scroll-smooth">
                        <div className={`w-full lg:max-w-4xl lg:mx-auto min-h-screen ${shouldHideNav ? 'pb-20' : 'pb-40 pt-4 px-4'}`}>
                            {children}
                        </div>
                    </div>
                </main>
                {!shouldHideNav && <BottomNav user={user} currentView={currentView} setView={setView} unreadCount={unreadCount} onOpenNotifications={() => setIsNotifOpen(true)} />}
            </div>

            <NotificationDrawer 
                isOpen={isNotifOpen} 
                onClose={() => setIsNotifOpen(false)} 
                notifications={notifications} 
                onMarkAsRead={handleMarkAsRead}
                onMarkAllRead={handleMarkAllRead}
            />
        </div>
    );
};

export default Layout;
