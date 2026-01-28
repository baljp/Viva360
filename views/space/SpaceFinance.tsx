import React from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, BarChart3, Filter } from 'lucide-react';
import { ViewState, Transaction } from '../../types';
import { PortalView } from '../../components/Common';

interface SpaceFinanceProps {
    view: ViewState;
    setView: (v: ViewState) => void;
    transactions: Transaction[];
    flow: any;
}

export const SpaceFinance: React.FC<SpaceFinanceProps> = ({ view, setView, transactions, flow }) => {
    return (
        <PortalView title="Prosperidade" subtitle="GESTÃO DE FLUXO" onBack={() => flow.go('EXEC_DASHBOARD')}>
            <div className="space-y-8">
                <div className="bg-nature-900 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-[80px] -translate-y-12 translate-x-12"></div>
                   <TrendingUp size={140} className="absolute -right-8 -bottom-8 opacity-10 rotate-12" />
                   <div className="relative z-10 space-y-6">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary-400 mb-2">Faturamento Consolidado</p>
                        <h3 className="text-5xl font-serif italic">R$ 24.850<span className="text-xl text-primary-400">,00</span></h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/10">
                            <p className="text-[8px] font-bold uppercase text-primary-200 mb-1">Média p/ Sala</p>
                            <span className="text-lg font-bold text-white">R$ 4.2k</span>
                          </div>
                          <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/10">
                            <p className="text-[8px] font-bold uppercase text-primary-200 mb-1">Crescimento</p>
                            <div className="flex items-center gap-1.5 text-emerald-400">
                                <ArrowUpRight size={14} />
                                <span className="text-lg font-bold">12%</span>
                            </div>
                          </div>
                      </div>
                   </div>
                </div>

                <div className="bg-white p-8 rounded-[3.5rem] border border-nature-100 shadow-sm space-y-6">
                   <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Performance da Egrégora</h4>
                      <BarChart3 size={14} className="text-nature-200"/>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       {/* Occupancy Chart */}
                       <div className="space-y-3">
                           <h5 className="text-xs font-serif italic text-nature-900">Ocupação dos Altares</h5>
                           <div className="flex items-end gap-2 h-24 pb-2 border-b border-nature-50">
                               {[45, 60, 75, 80, 65, 90, 85].map((val, i) => (
                                   <div key={i} className="flex-1 bg-indigo-100 rounded-t-lg relative group">
                                       <div className="absolute bottom-0 inset-x-0 bg-indigo-500 rounded-t-lg transition-all duration-1000" style={{ height: `${val}%` }}></div>
                                   </div>
                               ))}
                           </div>
                           <div className="flex justify-between text-[8px] text-nature-300 font-bold uppercase">
                               <span>Seg</span><span>Dom</span>
                           </div>
                       </div>

                       {/* Top Pros */}
                       <div className="space-y-3">
                           <h5 className="text-xs font-serif italic text-nature-900">Guardiões em Destaque</h5>
                           <div className="space-y-3">
                               {['Ana S. (Reiki)', 'Pedro L. (Yoga)', 'Maria C. (Theta)'].map((name, i) => (
                                   <div key={i} className="flex items-center justify-between text-xs">
                                       <span className="text-nature-600 font-medium">{name}</span>
                                       <div className="flex items-center gap-1">
                                           <div className="w-16 h-1.5 bg-nature-50 rounded-full overflow-hidden">
                                               <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${90 - i * 15}%` }}></div>
                                           </div>
                                       </div>
                                   </div>
                               ))}
                           </div>
                       </div>
                   </div>
                </div>

                <div className="bg-white p-8 rounded-[3.5rem] border border-nature-100 shadow-sm space-y-6">
                   <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Distribuição de Receita</h4>
                      <BarChart3 size={14} className="text-nature-200"/>
                   </div>
                   <div className="space-y-4">
                      {[
                          { label: 'Aluguel de Altares', value: 65, color: 'bg-primary-500' },
                          { label: 'Eventos & Workshops', value: 20, color: 'bg-indigo-500' },
                          { label: 'Vendas Bazar', value: 15, color: 'bg-amber-500' }
                      ].map(item => (
                          <div key={item.label} className="space-y-1.5">
                              <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                                  <span className="text-nature-500">{item.label}</span>
                                  <span className="text-nature-900">{item.value}%</span>
                              </div>
                              <div className="h-2 w-full bg-nature-50 rounded-full overflow-hidden">
                                  <div className={`h-full ${item.color} rounded-full transition-all duration-1000`} style={{ width: `${item.value}%` }}></div>
                              </div>
                          </div>
                      ))}
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between items-center px-2">
                      <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Fluxo Recente</h4>
                      <button className="p-2 bg-white rounded-xl border border-nature-100"><Filter size={14} className="text-nature-400"/></button>
                   </div>
                   {(transactions || []).map(tx => (
                     <div key={tx.id} className="bg-white p-5 rounded-[2.5rem] border border-nature-100 flex items-center justify-between shadow-sm group hover:shadow-md transition-all">
                        <div className="flex items-center gap-4">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                              {tx.type === 'income' ? <ArrowUpRight size={20}/> : <ArrowDownRight size={20}/>}
                           </div>
                           <div>
                              <h4 className="font-bold text-nature-900 text-sm truncate max-w-[150px]">{tx.description}</h4>
                              <p className="text-[10px] text-nature-400 font-bold uppercase">{new Date(tx.date).toLocaleDateString()}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className={`font-bold text-sm ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {tx.type === 'income' ? '+' : '-'} R$ {tx.amount}
                           </p>
                           <span className="text-[8px] text-nature-200 uppercase font-bold tracking-tighter">{tx.status}</span>
                        </div>
                     </div>
                   ))}
                </div>
            </div>
        </PortalView>
    );
};
