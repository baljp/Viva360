
import React from 'react';
import { ViewState, Professional, Transaction } from '../../types';
import { TrendingUp, Filter, ArrowUpRight, ArrowDownRight, Share2 } from 'lucide-react';
import { PortalView } from '../../components/Common';
import { useGuardiaoFlow } from '../../src/flow/GuardiaoFlowContext';

export const ProFinance: React.FC<{ user: Professional, transactions?: Transaction[] }> = ({ user, transactions = [] }) => {
    const { go } = useGuardiaoFlow();

    return (
    <PortalView title="Abundância" subtitle="FLUXO DE PROSPERIDADE" onBack={() => go('DASHBOARD')}>
      <div className="space-y-8">
        <div className="bg-nature-900 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
           <TrendingUp size={160} className="absolute -right-8 -bottom-8 opacity-10 rotate-12" />
           <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary-400 mb-2">Saldo Disponível</p>
              <h3 className="text-5xl font-serif italic mb-8">R$ {user.personalBalance}<span className="text-xl text-primary-400">,00</span></h3>
              
              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/10">
                    <p className="text-[8px] font-bold uppercase text-primary-200 mb-1">A Liberar</p>
                    <span className="text-lg font-bold text-emerald-400">R$ 1.840</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/10">
                    <p className="text-[8px] font-bold uppercase text-primary-200 mb-1">Meta Mensal</p>
                    <span className="text-lg font-bold text-white">82%</span>
                  </div>
              </div>
           </div>
        </div>

        <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
                <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Histórico do Fluxo</h4>
                <button className="p-2 bg-white rounded-xl border border-nature-100"><Filter size={14} className="text-nature-400"/></button>
            </div>
            {transactions.map(tx => (
                <div key={tx.id} className="bg-white p-5 rounded-[2.5rem] border border-nature-100 shadow-sm flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                            {tx.type === 'income' ? <ArrowUpRight size={20}/> : <ArrowDownRight size={20}/>}
                        </div>
                        <div>
                            <h4 className="font-bold text-nature-900 text-sm truncate max-w-[160px]">{tx.description}</h4>
                            <p className="text-[9px] text-nature-400 font-bold uppercase">{new Date(tx.date).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className={`font-bold text-sm ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {tx.type === 'income' ? '+' : '-'} R$ {tx.amount}
                        </p>
                        <span className="text-[8px] text-nature-200 uppercase font-bold">{tx.status}</span>
                    </div>
                </div>
            ))}
        </div>

        <button className="w-full py-5 border-2 border-dashed border-nature-100 rounded-[2.5rem] text-nature-400 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-white transition-all"><Share2 size={16}/> Baixar Relatório Mensal</button>
      </div>
    </PortalView>
    );
};
