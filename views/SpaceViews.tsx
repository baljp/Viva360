import React, { useEffect, useState } from 'react';
import { ViewState, Professional, SpaceRoom, User, Transaction, Vacancy, Product } from '../types';
import { 
    Users, BarChart3, Sparkles, Activity, Briefcase, DoorOpen, Award, Clock, TrendingUp, ShoppingBag, Calendar, Wallet 
} from 'lucide-react';
import { api } from '../services/api';
import { PortalCard, ZenToast } from '../components/Common';
import { getDailyMessage } from '../src/utils/dailyWisdom';

// Sub-views
import { SpaceCalendar } from './space/SpaceCalendar';
import { SpaceFinance } from './space/SpaceFinance';
import { SpaceMarketplace } from './space/SpaceMarketplace';
import { SpaceRecruitment } from './space/SpaceRecruitment';
import { SpaceRooms } from './space/SpaceRooms';
import { SpaceTeam } from './space/SpaceTeam';

export const SpaceViews: React.FC<{ user: User, view: ViewState, setView: (v: ViewState) => void }> = ({ user, view, setView }) => {
  const [rooms, setRooms] = useState<SpaceRoom[]>([]);
  const [team, setTeam] = useState<Professional[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{title: string, message: string} | null>(null);

  const refreshData = async () => {
      setIsLoading(true);
      try {
          const [r, t, v, tx, prods] = await Promise.all([
              api.spaces.getRooms(user.id),
              api.spaces.getTeam(user.id),
              api.spaces.getVacancies(),
              api.spaces.getTransactions(user.id),
              api.marketplace.listByOwner(user.id)
          ]);
          setRooms(r);
          setTeam(t.map(p => ({ ...p, isOccupied: Math.random() > 0.7 } as any)));
          setVacancies(v);
          setTransactions(tx);
          setMyProducts(prods);
      } catch (e) { console.error(e); }
      setIsLoading(false);
  };

  useEffect(() => { refreshData(); }, [user.id]); 

  // --- ROUTER (SUB-VIEWS) ---
  if ((view as any) === ViewState.SPACE_CALENDAR) return <SpaceCalendar team={team} setView={setView} />;
  if (view === ViewState.SPACE_FINANCE) return <SpaceFinance view={view} setView={setView} transactions={transactions} />;
  if (view === ViewState.SPACE_RECRUITMENT) return <SpaceRecruitment view={view} setView={setView} user={user} vacancies={vacancies} refreshData={refreshData} />;
  if (view === ViewState.SPACE_MARKETPLACE) return <SpaceMarketplace view={view} setView={setView} user={user} myProducts={myProducts} refreshData={refreshData} />;
  if (view === ViewState.SPACE_ROOMS) return <SpaceRooms view={view} setView={setView} rooms={rooms} />;
  if (view === ViewState.SPACE_TEAM) return <SpaceTeam view={view} setView={setView} team={team} />;

  // --- TELA: HOME (DASHBOARD) ---
  return (
    <div className="flex flex-col animate-in fade-in w-full bg-[#fcfdfc] min-h-screen pb-24">
        {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}
        <header className="flex items-center justify-between mt-8 mb-8 px-6 flex-none">
            <div className="flex items-center gap-4">
                <div className="relative group" onClick={() => setView(ViewState.SETTINGS)}>
                  <img src={user.avatar} className="w-14 h-14 rounded-[1.5rem] border-4 border-white shadow-xl object-cover cursor-pointer group-hover:scale-110 transition-transform" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-900 border-4 border-white rounded-full flex items-center justify-center shadow-md animate-pulse"><Award size={10} className="text-white" /></div>
                </div>
                <div><p className="text-[10px] font-bold text-nature-400 uppercase tracking-[0.3em]">Santuário Viva360</p><h2 className="text-2xl font-serif italic text-nature-900 leading-none mt-1">{user.name.split(' ')[0]}</h2></div>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setView(ViewState.SPACE_CALENDAR)} className="p-3 bg-white rounded-2xl shadow-sm border border-nature-100 text-nature-400 active:scale-95 transition-all"><Calendar size={20}/></button>
                <button onClick={() => setView(ViewState.SPACE_FINANCE)} className="p-3 bg-white rounded-2xl shadow-sm border border-nature-100 text-indigo-600 active:scale-95 transition-all"><BarChart3 size={20}/></button>
            </div>
        </header>

        <div className="px-4 space-y-8">
            <div className="bg-indigo-900 rounded-[3.5rem] p-8 text-white shadow-2xl overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -translate-y-12 translate-x-12"></div>
                <div className="relative z-10 space-y-6">
                    <div className="flex justify-between items-start">
                       <div><p className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-200">Radiance Score</p><h3 className="text-4xl font-serif italic flex items-center gap-2">94% <Sparkles size={20} className="text-amber-400"/></h3></div>
                       <TrendingUp size={24} className="text-emerald-400" />
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/10">
                        <p className="text-[8px] font-bold uppercase text-indigo-200 mb-1">Vibração do Dia</p>
                        <p className="text-xs text-white italic leading-relaxed">"{getDailyMessage()}"</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setView(ViewState.SPACE_TEAM)} className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/10 text-left hover:bg-white/20 transition-all"><p className="text-[8px] font-bold uppercase text-indigo-300">Equipe Ativa</p><span className="text-xl font-bold">{team.length} Mestres</span></button>
                        <button onClick={() => setView(ViewState.SPACE_FINANCE)} className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/10 text-left hover:bg-white/20 transition-all"><p className="text-[8px] font-bold uppercase text-indigo-300">Fluxo Hoje</p><span className="text-xl font-bold">R$ 1.4k</span></button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <PortalCard title="Altares" subtitle="GESTÃO DE SALAS" icon={DoorOpen} bgImage="https://images.unsplash.com/photo-1600618528240-fb9fc964b853?q=80&w=600" onClick={() => setView(ViewState.SPACE_ROOMS)} />
                <PortalCard title="Equipe" subtitle="CONEXÃO MESTRES" icon={Users} bgImage="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=600" onClick={() => setView(ViewState.SPACE_TEAM)} delay={100} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <PortalCard title="Expansão" subtitle="RECRUTAMENTO" icon={Briefcase} bgImage="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=600" onClick={() => setView(ViewState.SPACE_RECRUITMENT)} delay={200} />
                <PortalCard title="Abundância" subtitle="FINANCEIRO" icon={Wallet} bgImage="https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?q=80&w=600" onClick={() => setView(ViewState.SPACE_FINANCE)} delay={300} />
            </div>

            <div className="pb-8">
                 <PortalCard 
                    title="Bazar do Hub" 
                    subtitle="LOJA" 
                    icon={ShoppingBag} 
                    bgImage="https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?q=80&w=600" 
                    onClick={() => setView(ViewState.SPACE_MARKETPLACE)} 
                    delay={400} 
                />
            </div>

            <div className="space-y-4 pb-8">
                <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-[0.3em] px-2 flex justify-between items-center">Monitor de Altares <span className="text-emerald-600 text-[9px] font-bold animate-pulse">AO VIVO</span></h4>
                <div className="grid grid-cols-1 gap-3">
                    {rooms.slice(0, 3).map(room => (
                         <div key={room.id} className="bg-white p-5 rounded-3xl border border-nature-100 flex items-center justify-between group shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${room.status === 'occupied' ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-500'}`}><Activity size={18} className={room.status === 'occupied' ? 'animate-pulse' : ''} /></div>
                                <div><h4 className="text-xs font-bold text-nature-900">{room.name}</h4><p className="text-[9px] text-nature-400 uppercase font-bold">{room.status === 'occupied' ? `Com ${room.currentOccupant}` : 'Disponível'}</p></div>
                            </div>
                            {room.status === 'occupied' && <div className="text-right"><span className="text-[10px] font-bold text-indigo-400 flex items-center gap-1"><Clock size={10}/> 45min</span></div>}
                            {room.status === 'available' && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                        </div>
                    ))}
                    <button onClick={() => setView(ViewState.SPACE_ROOMS)} className="w-full py-4 text-center text-[10px] font-bold text-nature-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">Ver Todas as Salas</button>
                </div>
            </div>
        </div>
    </div>
  );
};
