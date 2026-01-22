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
        <div className="min-h-screen w-full bg-nature-900 text-nature-100 font-sans flex overflow-hidden selection:bg-primary-500 selection:text-white">
            {/* Desktop Sidebar */}
            {!shouldHideNav && (
                <aside className="hidden lg:flex flex-col w-20 hover:w-64 transition-all duration-500 ease-out group bg-nature-800/50 backdrop-blur-xl border-r border-white/5 h-screen z-50 fixed left-0 top-0 shadow-2xl">
                    <div className="p-4 flex items-center justify-center group-hover:justify-start gap-4 h-24">
                        <div className="w-10 h-10 bg-nature-800 border border-white/10 rounded-xl flex items-center justify-center text-primary-400 font-serif font-bold text-xl shrink-0 shadow-lg group-hover:bg-nature-700 transition-colors">V</div>
                        <span className="font-serif font-medium text-xl text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden tracking-wide">Viva360</span>
                    </div>

                    <nav className="flex-1 px-3 space-y-2 mt-8">
                        {navItems.map(item => {
                            const active = currentView === item.id;
                            return (
                                <button 
                                    key={item.id} 
                                    onClick={() => setView(item.id)}
                                    className={`flex items-center gap-4 p-3 rounded-full w-full transition-all duration-300 relative group/btn ${active ? 'bg-primary-500/10 text-primary-400 shadow-[0_0_20px_rgba(14,165,233,0.1)]' : 'text-nature-400 hover:bg-white/5 hover:text-nature-100'}`}
                                >
                                    <item.icon size={22} className={`shrink-0 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover/btn:scale-105'}`} />
                                    <span className="font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute left-14 whitespace-nowrap tracking-wide text-sm">{item.label}</span>
                                    {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-r-full shadow-[0_0_10px_rgba(14,165,233,0.5)]" />}
                                </button>
                            )
                        })}
                    </nav>

                    <div className="p-3 mt-auto mb-6 space-y-2">
                        <button onClick={onLogout} className="flex items-center gap-4 p-3 rounded-full w-full text-nature-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 group/logout">
                             <LogOut size={22} className="shrink-0 group-hover/logout:rotate-[-10deg] transition-transform" />
                             <span className="font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute left-14 text-sm">Logout</span>
                        </button>
                    </div>
                </aside>
            )}

            {/* Mobile Header */}
            {!shouldHideNav && (
                <header className="lg:hidden fixed top-0 left-0 w-full h-16 bg-nature-900/80 backdrop-blur-xl border-b border-white/5 z-50 flex items-center justify-between px-4">
                     <div className="w-8 h-8 bg-nature-800 border border-white/10 rounded-lg flex items-center justify-center text-primary-400 font-serif font-bold">V</div>
                     <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-nature-100 hover:bg-white/5 rounded-full transition-colors">
                        {isMobileMenuOpen ? <X /> : <Menu />}
                     </button>
                </header>
            )}

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-nature-900/98 backdrop-blur-xl z-40 lg:hidden flex flex-col justify-center items-center gap-8 pt-16 animate-in slide-in-from-top-10">
                    {navItems.map(item => (
                        <button key={item.id} onClick={() => setView(item.id)} className={`text-2xl font-serif font-medium tracking-wide ${currentView === item.id ? 'text-primary-400 scale-110' : 'text-nature-200'} transition-all`}>
                            {item.label}
                        </button>
                    ))}
                    <button onClick={onLogout} className="text-lg text-red-400/80 font-medium mt-8 hover:text-red-400 transition-colors">Logout</button>
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
