
import React from 'react';
import { ViewState, Professional } from '../../types';
import { Zap, RefreshCw, Users } from 'lucide-react';
import { PortalView } from '../../components/Common';
import { useGuardiaoFlow } from '../../src/flow/GuardiaoFlowContext';

export const ProTribe: React.FC<{ user: Professional }> = ({ user }) => {
    const { go } = useGuardiaoFlow();

    return (
    <PortalView title="Rede Alquimia" subtitle="ESCAMBO HOLÍSTICO" onBack={() => go('DASHBOARD')}>
      <div className="space-y-8">
        <div className="bg-indigo-900 rounded-[3.5rem] p-8 text-white relative overflow-hidden">
           <Zap size={140} className="absolute -right-8 -bottom-8 opacity-10 rotate-12" />
           <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-300 mb-2">Seus Créditos de Troca</p>
           <h3 className="text-5xl font-serif italic mb-6">{(typeof user.swapCredits === 'number' ? user.swapCredits : 120)} <span className="text-xl text-indigo-300">Créditos</span></h3>
           <div className="flex gap-3">
              <button className="flex-1 bg-white/10 backdrop-blur-md py-3 rounded-2xl text-[9px] font-bold uppercase tracking-widest border border-white/10">Ver Ofertas</button>
              <button className="flex-1 bg-white/10 backdrop-blur-md py-3 rounded-2xl text-[9px] font-bold uppercase tracking-widest border border-white/10">Listar Oferta</button>
           </div>
        </div>

        <div className="space-y-6">
           <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Trocas Sugeridas</h4>
           {user.offers?.map((offer, i) => (
              <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600"><RefreshCw size={24}/></div>
                    <div><h4 className="font-bold text-nature-900 text-sm">{offer}</h4><p className="text-[9px] text-nature-400 font-bold uppercase">Disponível para Permuta</p></div>
                 </div>
                 <div className="text-right"><span className="text-xs font-bold text-nature-900">45 Cr</span></div>
              </div>
           ))}
        </div>

        <div className="bg-white p-8 rounded-[3.5rem] border border-nature-100 text-center space-y-4">
           <Users size={40} className="mx-auto text-indigo-600" />
           <h4 className="font-serif italic text-lg text-nature-900">Comunidade de Guardiões</h4>
           <p className="text-xs text-nature-500 italic px-4">"Ninguém cura sozinho. Fortaleça sua rede trocando saberes e ferramentas."</p>
           <button className="w-full py-4 bg-nature-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest">Acessar Fórum da Tribo</button>
        </div>
      </div>
    </PortalView>
    );
};
