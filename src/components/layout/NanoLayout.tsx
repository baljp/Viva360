import React, { useState, useEffect } from 'react';
import { User, UserRole, ViewState, Notification } from '../../types';
import { Home, Compass, ShoppingBag, User as UserIcon, LogOut, Activity, Flower, Zap, Calendar, Users, Briefcase, Bell, Search, Menu, X } from 'lucide-react';
import { api } from '../../services/api';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  currentView: ViewState;
  setView: (view: ViewState) => void;
  onLogout: () => void;
  shouldHideNav?: boolean;
}

const getNavItems = (role: UserRole) => {
    switch(role) {
        case UserRole.CLIENT: return [
            { id: ViewState.CLIENT_HOME, label: 'Home', icon: Home },
            { id: ViewState.CLIENT_EXPLORE, label: 'Explore', icon: Compass },
            { id: ViewState.CLIENT_TRIBO, label: 'Tribo', icon: Users },
            { id: ViewState.SETTINGS, label: 'Profile', icon: UserIcon },
        ];
        case UserRole.PROFESSIONAL: return [
            { id: ViewState.PRO_HOME, label: 'Dashboard', icon: Activity },
            { id: ViewState.PRO_PATIENTS, label: 'Patients', icon: Flower }, 
            { id: ViewState.PRO_AGENDA, label: 'Agenda', icon: Calendar },
            { id: ViewState.SETTINGS, label: 'Profile', icon: UserIcon },
        ];
        case UserRole.SPACE: return [
            { id: ViewState.SPACE_HOME, label: 'Hub', icon: Activity },
            { id: ViewState.SPACE_TEAM, label: 'Team', icon: Users },
            { id: ViewState.SETTINGS, label: 'Profile', icon: UserIcon },
        ];
        default: return [];
    }
};

export const NanoLayout: React.FC<LayoutProps> = ({ children, user, currentView, setView, onLogout, shouldHideNav }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // Auto-close mobile menu on view change
    useEffect(() => setIsMobileMenuOpen(false), [currentView]);

    const navItems = user ? getNavItems(user.role) : [];

    return (
        <div className="min-h-screen w-full bg-nano-950 text-nano-100 font-sans flex overflow-hidden">
            {/* Desktop Sidebar */}
            {!shouldHideNav && (
                <aside className="hidden lg:flex flex-col w-20 hover:w-64 transition-all duration-300 group bg-nano-900 border-r border-white/5 h-screen z-50 fixed left-0 top-0">
                    <div className="p-4 flex items-center justify-center group-hover:justify-start gap-3 h-20">
                        <div className="w-10 h-10 bg-banana-400 rounded-xl flex items-center justify-center text-nano-900 font-bold text-xl shrink-0">V</div>
                        <span className="font-bold text-xl text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden">Viva360</span>
                    </div>

                    <nav className="flex-1 px-3 space-y-2 mt-8">
                        {navItems.map(item => {
                            const active = currentView === item.id; // Simplified active check
                            return (
                                <button 
                                    key={item.id} 
                                    onClick={() => setView(item.id)}
                                    className={`flex items-center gap-4 p-3 rounded-xl w-full transition-all relative ${active ? 'bg-banana-400/10 text-banana-400' : 'text-nano-400 hover:bg-white/5 hover:text-white'}`}
                                >
                                    <item.icon size={24} className="shrink-0" />
                                    <span className="font-medium opacity-0 group-hover:opacity-100 transition-opacity absolute left-14 whitespace-nowrap">{item.label}</span>
                                    {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-banana-400 rounded-r-full" />}
                                </button>
                            )
                        })}
                    </nav>

                    <div className="p-3 mt-auto mb-4 space-y-2">
                        <button onClick={onLogout} className="flex items-center gap-4 p-3 rounded-xl w-full text-nano-400 hover:bg-red-500/10 hover:text-red-400 transition-all">
                             <LogOut size={24} className="shrink-0" />
                             <span className="font-medium opacity-0 group-hover:opacity-100 transition-opacity absolute left-14">Logout</span>
                        </button>
                    </div>
                </aside>
            )}

            {/* Mobile Header */}
            {!shouldHideNav && (
                <header className="lg:hidden fixed top-0 left-0 w-full h-16 bg-nano-900/80 backdrop-blur-md border-b border-white/5 z-50 flex items-center justify-between px-4">
                     <div className="w-8 h-8 bg-banana-400 rounded-lg flex items-center justify-center text-nano-900 font-bold">V</div>
                     <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-white">
                        {isMobileMenuOpen ? <X /> : <Menu />}
                     </button>
                </header>
            )}

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-nano-950/95 z-40 lg:hidden flex flex-col justify-center items-center gap-8 pt-16 animate-in slide-in-from-top-10">
                    {navItems.map(item => (
                        <button key={item.id} onClick={() => setView(item.id)} className={`text-2xl font-bold ${currentView === item.id ? 'text-banana-400' : 'text-white'}`}>
                            {item.label}
                        </button>
                    ))}
                    <button onClick={onLogout} className="text-xl text-red-400 mt-8">Logout</button>
                </div>
            )}

            {/* Main Content Area */}
            <main className={`flex-1 relative w-full h-screen overflow-y-auto overflow-x-hidden ${!shouldHideNav ? 'lg:pl-20 pt-16 lg:pt-0' : ''}`}>
                 <div className="w-full max-w-7xl mx-auto p-4 lg:p-8 min-h-full">
                    {children}
                 </div>
            </main>
        </div>
    );
};
