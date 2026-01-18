import React, { useState } from 'react';
import { User, UserRole, ViewState } from '../types';
import { Home, Search, Calendar, ShoppingBag, User as UserIcon, Bell, ChevronLeft, Wallet, Radio, LifeBuoy, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  currentView: ViewState;
  setView: (view: ViewState) => void;
  onLogout: () => void;
  onToggleNotifications: () => void;
  hasUnreadNotifications?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, user, currentView, setView, onLogout, onToggleNotifications, hasUnreadNotifications }) => {
  const [sosActive, setSosActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false); // Fake Radio State

  // SOS Mode Overlay Component
  const SOSOverlay = () => (
    <div className="fixed inset-0 z-[100] bg-nature-900 flex flex-col items-center justify-center text-white animate-in fade-in duration-1000">
      <button
        onClick={() => setSosActive(false)}
        className="absolute top-8 right-8 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <X size={24} />
      </button>

      <div className="text-center space-y-8">
        <h2 className="text-3xl font-light tracking-[0.2em] uppercase opacity-80">Respire</h2>

        {/* Breathing Animation */}
        <div className="relative flex items-center justify-center w-64 h-64">
          <div className="absolute w-full h-full bg-primary-500/20 rounded-full animate-ping" style={{ animationDuration: '4s' }}></div>
          <div className="absolute w-48 h-48 bg-primary-500/30 rounded-full animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>
          <div className="w-32 h-32 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center shadow-2xl">
            <span className="text-xs font-medium tracking-widest opacity-70">4 - 7 - 8</span>
          </div>
        </div>

        <p className="text-nature-300 text-sm max-w-xs mx-auto leading-relaxed">
          Inspire pelo nariz (4s)<br />
          Segure o ar (7s)<br />
          Solte pela boca (8s)
        </p>
      </div>

      <div className="absolute bottom-12 w-full px-8">
        <button className="w-full py-4 rounded-full bg-primary-600/80 hover:bg-primary-600 transition-colors text-sm font-bold tracking-widest uppercase">
          Tocar Ruído Branco
        </button>
      </div>
    </div>
  );

  // If no user or in Auth/Onboarding flow, render simpler layout
  if (!user || [ViewState.SPLASH, ViewState.ROLE_SELECTION, ViewState.ONBOARDING_INTENT, ViewState.LOGIN, ViewState.REGISTER].includes(currentView)) {
    return <div className="min-h-screen bg-primary-50 flex flex-col">{children}</div>;
  }

  // Navigation Logic for "Back" button
  const getBackTarget = (view: ViewState): ViewState | null => {
    switch (view) {
      case ViewState.CLIENT_PRO_DETAILS: return ViewState.CLIENT_SEARCH;
      case ViewState.CLIENT_BOOKING_FLOW: return ViewState.CLIENT_PRO_DETAILS;
      case ViewState.CLIENT_METRICS: return ViewState.CLIENT_HOME;
      case ViewState.CLIENT_JOURNEY: return ViewState.CLIENT_HOME;
      case ViewState.CLIENT_CHAT: return ViewState.CLIENT_HOME;
      case ViewState.CLIENT_NOTIFICATIONS: return ViewState.CLIENT_HOME;
      case ViewState.CLIENT_PRODUCT_DETAILS: return ViewState.CLIENT_MARKET;

      case ViewState.PRO_AGENDA: return ViewState.PRO_HOME;
      case ViewState.PRO_RECORDS: return ViewState.PRO_HOME;

      default: return null;
    }
  };

  const backTarget = getBackTarget(currentView);

  const renderBottomNav = () => {
    const navItemClass = (active: boolean) =>
      `flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 ${active ? 'text-primary-700 scale-105' : 'text-nature-400 hover:text-primary-500'
      }`;

    const iconSize = 22;

    if (user.role === UserRole.CLIENT) {
      return (
        <div className="flex justify-between items-center h-20 px-6 pb-2">
          <button onClick={() => setView(ViewState.CLIENT_HOME)} className={navItemClass([ViewState.CLIENT_HOME, ViewState.CLIENT_METRICS, ViewState.CLIENT_JOURNEY, ViewState.CLIENT_CHAT].includes(currentView))}>
            <Home size={iconSize} strokeWidth={currentView === ViewState.CLIENT_HOME ? 2.5 : 1.5} />
            <span className={`text-[10px] font-medium ${currentView === ViewState.CLIENT_HOME ? 'font-semibold' : ''}`}>Jardim</span>
          </button>
          <button onClick={() => setView(ViewState.CLIENT_SEARCH)} className={navItemClass([ViewState.CLIENT_SEARCH, ViewState.CLIENT_PRO_DETAILS, ViewState.CLIENT_BOOKING_FLOW].includes(currentView))}>
            <Search size={iconSize} strokeWidth={currentView === ViewState.CLIENT_SEARCH ? 2.5 : 1.5} />
            <span className={`text-[10px] font-medium ${currentView === ViewState.CLIENT_SEARCH ? 'font-semibold' : ''}`}>Buscar</span>
          </button>
          <button onClick={() => setView(ViewState.CLIENT_CALENDAR)} className={navItemClass(currentView === ViewState.CLIENT_CALENDAR)}>
            <Calendar size={iconSize} strokeWidth={currentView === ViewState.CLIENT_CALENDAR ? 2.5 : 1.5} />
            <span className={`text-[10px] font-medium ${currentView === ViewState.CLIENT_CALENDAR ? 'font-semibold' : ''}`}>Agenda</span>
          </button>
          <button onClick={() => setView(ViewState.CLIENT_MARKET)} className={navItemClass([ViewState.CLIENT_MARKET, ViewState.CLIENT_PRODUCT_DETAILS].includes(currentView))}>
            <ShoppingBag size={iconSize} strokeWidth={currentView === ViewState.CLIENT_MARKET ? 2.5 : 1.5} />
            <span className={`text-[10px] font-medium ${currentView === ViewState.CLIENT_MARKET ? 'font-semibold' : ''}`}>Shop</span>
          </button>
          <button onClick={() => setView(ViewState.CLIENT_PROFILE)} className={navItemClass(currentView === ViewState.CLIENT_PROFILE)}>
            <UserIcon size={iconSize} strokeWidth={currentView === ViewState.CLIENT_PROFILE ? 2.5 : 1.5} />
            <span className={`text-[10px] font-medium ${currentView === ViewState.CLIENT_PROFILE ? 'font-semibold' : ''}`}>Perfil</span>
          </button>
        </div>
      );
    }

    // Pro & Space Navigation
    return (
      <div className="flex justify-between items-center h-20 px-6 pb-2">
        <button onClick={() => setView(user.role === UserRole.PROFESSIONAL ? ViewState.PRO_HOME : ViewState.SPACE_HOME)} className={navItemClass(true)}>
          <Home size={iconSize} strokeWidth={2.5} />
          <span className="text-[10px] font-medium font-semibold">Início</span>
        </button>
        <button onClick={() => setView(user.role === UserRole.PROFESSIONAL ? ViewState.PRO_FINANCE : ViewState.SPACE_FINANCE)} className={navItemClass(false)}>
          <Wallet size={iconSize} strokeWidth={1.5} />
          <span className="text-[10px] font-medium">Caixa</span>
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f2f7f5] flex flex-col relative text-nature-800 font-sans selection:bg-primary-200">

      {/* SOS OVERLAY */}
      {sosActive && <SOSOverlay />}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#f2f7f5]/90 backdrop-blur-md transition-all duration-300">
        <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">

          {/* Left: Back Button or Logo */}
          <div className="flex items-center gap-2">
            {backTarget ? (
              <button
                onClick={() => setView(backTarget)}
                className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-nature-600 hover:bg-nature-100 transition-colors animate-in fade-in slide-in-from-left-2"
              >
                <ChevronLeft size={24} />
              </button>
            ) : (
              <div className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80" onClick={() => setView(user.role === UserRole.CLIENT ? ViewState.CLIENT_HOME : (user.role === UserRole.PROFESSIONAL ? ViewState.PRO_HOME : ViewState.SPACE_HOME))}>
                <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white shadow-sm shadow-primary-200">
                  <span className="font-serif italic font-bold text-lg">V</span>
                </div>
                <h1 className="font-medium text-lg tracking-tight text-primary-800">Viva360</h1>
              </div>
            )}
          </div>

          {/* Right: Notifications & Profile */}
          <div className="flex items-center gap-4">
            {user.role === UserRole.CLIENT && (
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-primary-100 text-primary-600 animate-pulse' : 'bg-transparent text-nature-400 hover:text-nature-600'}`}
              >
                <Radio size={18} />
              </button>
            )}
            <button
              onClick={onToggleNotifications}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all relative ${hasUnreadNotifications ? 'text-primary-600' : 'text-nature-400 hover:text-nature-600'}`}
            >
              <Bell size={20} />
              {hasUnreadNotifications && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-400 border-2 border-white rounded-full"></span>}
            </button>
            <button onClick={onLogout} className="w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-nature-100 hover:ring-primary-300 transition-all">
              <img src={user.avatar || 'https://picsum.photos/100/100'} alt="User" className="w-full h-full object-cover" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-md w-full mx-auto p-6 pb-28 animate-in fade-in duration-500">
        {children}
      </main>

      {/* FLOATING SOS BUTTON (Client Only) */}
      {user.role === UserRole.CLIENT && !sosActive && (
        <button
          onClick={() => setSosActive(true)}
          className="fixed bottom-24 right-6 z-40 bg-nature-900 text-white p-4 rounded-full shadow-2xl shadow-nature-900/40 hover:scale-105 transition-transform group"
        >
          <LifeBuoy size={24} className="group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-white/50 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-50 md:max-w-md md:mx-auto md:rounded-t-[2.5rem] md:bottom-0">
        {renderBottomNav()}
      </nav>
    </div>
  );
};

export default Layout;