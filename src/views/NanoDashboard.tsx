
import React from 'react';
import { User, ViewState, Product } from '../types';
import { NanoCard, NanoButton } from '../components/common/NanoComponents';
import { Sparkles, Calendar, Zap, ArrowRight, Play, ShoppingBag } from 'lucide-react';

interface NanoDashboardProps {
  user: User;
  setView: (view: ViewState) => void;
  onAddToCart: (product: Product) => void;
}

export const NanoDashboard: React.FC<NanoDashboardProps> = ({ user, setView, onAddToCart }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-nano-400 bg-clip-text text-transparent">
                Hello, {user.name.split(' ')[0]}.
            </h1>
            <p className="text-nano-400 mt-2">Your frequency is rising today.</p>
        </div>
        <div className="hidden sm:block">
             <div className="text-right">
                <span className="text-sm text-nano-500 uppercase tracking-widest font-bold">Karma Balance</span>
                <p className="text-2xl font-bold text-banana-400">{user.karma || 0} pts</p>
             </div>
        </div>
      </div>

      {/* Hero / Next Action */}
      <NanoCard className="relative overflow-hidden group hover:border-banana-400/50 transition-colors">
        <div className="absolute top-0 right-0 w-96 h-96 bg-banana-400/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 group-hover:bg-banana-400/10 transition-colors"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-banana-400/10 rounded-md text-xs font-bold text-banana-400 uppercase tracking-wider">Next Ritual</span>
                    <span className="text-nano-400 text-xs">Today, 14:00</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">Energy Alignment</h3>
                <p className="text-nano-400 max-w-md">Master Alchemist Sarah is waiting for your session.</p>
            </div>
            <NanoButton onClick={() => setView(ViewState.CLIENT_VIDEO_SESSION)} icon={Play} className="w-full md:w-auto shadow-[0_0_20px_rgba(250,204,21,0.2)]">
                Start Session
            </NanoButton>
        </div>
      </NanoCard>

      {/* Quick Actions Grid using Bento Grid Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Marketplace Highlight */}
        <NanoCard className="col-span-1 md:col-span-2 bg-gradient-to-br from-nano-800 to-nano-900 border-white/5 p-0 relative overflow-hidden group cursor-pointer" onClick={() => setView(ViewState.CLIENT_MARKETPLACE)}>
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-nano-950 via-nano-950/50 to-transparent"></div>
            <div className="relative p-6 h-64 flex flex-col justify-end">
                <h3 className="text-xl font-bold text-white mb-1">Elixirs & Rituals</h3>
                <p className="text-nano-300 text-sm mb-4">Discover potent tools for your journey.</p>
                <div className="flex items-center gap-2 text-banana-400 text-sm font-bold group-hover:translate-x-2 transition-transform">
                    Explore Shop <ArrowRight size={16} />
                </div>
            </div>
        </NanoCard>

        {/* Tribe / Social */}
        <NanoCard className="col-span-1 bg-nano-800 p-6 flex flex-col justify-between group cursor-pointer hover:border-white/20" onClick={() => setView(ViewState.CLIENT_TRIBO)}>
             <div>
                <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center text-sky-400 mb-4">
                    <Sparkles size={20} />
                </div>
                <h3 className="text-lg font-bold text-white">Your Tribe</h3>
                <p className="text-nano-400 text-sm mt-1">3 new members joined.</p>
             </div>
             <div className="mt-4 flex -space-x-3">
                {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-nano-700 border-2 border-nano-800 flex items-center justify-center text-xs text-white">
                        U{i}
                    </div>
                ))}
             </div>
        </NanoCard>

        {/* Stats / Progress */}
        <NanoCard className="col-span-1 md:col-span-3 bg-nano-800 p-6 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-400">
                    <Zap size={24} />
                </div>
                <div>
                    <p className="text-sm text-nano-400 uppercase tracking-widest font-bold">Current Streak</p>
                    <h3 className="text-2xl font-bold text-white">{user.streak || 0} Days</h3>
                </div>
             </div>
             <div className="h-2 w-32 bg-nano-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-3/4"></div>
             </div>
        </NanoCard>
      </div>

    </div>
  );
};
