import React, { useState } from 'react';
import { Briefcase, UserPlus, Users, ChevronRight, Award, Plus } from 'lucide-react';
import { ViewState, User, Vacancy } from '../../types';
import { PortalView, VacancyFormModal } from '../../components/Common';
import { api } from '../../services/api';
import { runConfirmedAction } from '../../src/utils/runConfirmedAction';

import type { SantuarioFlowContextValue } from '../../src/flow/SantuarioFlowContext';

interface SpaceRecruitmentProps {
    view: ViewState;
    setView: (v: ViewState) => void;
    user: User;
    vacancies: Vacancy[];
    refreshData: () => Promise<void>;
    flow: Pick<SantuarioFlowContextValue, 'go' | 'notify'>;
}

export const SpaceRecruitment: React.FC<SpaceRecruitmentProps> = ({ view, setView, user, vacancies, refreshData, flow }) => {
    const [showAddVacancy, setShowAddVacancy] = useState(false);
    const [inviteLoading, setInviteLoading] = useState(false);
    const notify = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') =>
      flow?.notify?.(title, message, type);

    return (
        <>
            <PortalView 
              title="Sincronia Mestra" 
              subtitle="EXPANSÃO DO CÍRCULO" 
              onBack={() => flow.go('EXEC_DASHBOARD')}
              footer={
                <button onClick={() => setShowAddVacancy(true)} className="w-full py-5 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                    <Plus size={18}/> Novo Manifesto de Busca
                </button>
              }
            >
              <div className="space-y-8">
                <div className="bg-indigo-900 rounded-[3.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                   <Briefcase size={160} className="absolute -right-12 -bottom-12 opacity-10 rotate-12" />
                   <div className="relative z-10 space-y-4">
                      <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full w-fit border border-white/10">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                         <span className="text-[9px] font-bold uppercase tracking-widest">Hub em Expansão</span>
                      </div>
                      <h3 className="text-2xl font-serif italic leading-tight">Manifeste o Guardião Ideal</h3>
                      <p className="text-xs text-indigo-200 italic leading-relaxed">Conecte seu Santuário a mestres que vibram na mesma frequência. Gerencie o funil de luz aqui.</p>
                   </div>
                </div>
        
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={async () => {
                            if (inviteLoading) return;
                            setInviteLoading(true);
                            try {
                                await runConfirmedAction({
                                    action: async () => {
                                        const codeRes = await api.spaces.createInvite({ role: 'GUARDIAN', uses: 1 });
                                        const code = String((codeRes as Record<string, unknown>)?.code || '').trim();
                                        if (!code) throw new Error('Código inválido do servidor.');
                                        const invite = await api.invites.create({ kind: 'space', targetRole: 'PROFESSIONAL', contextRef: code });
                                        const url = String((invite as Record<string, unknown>)?.url || '').trim();
                                        if (!url) throw new Error('Link de convite inválido.');
                                        return { code, url };
                                    },
                                    notify,
                                    successToast: {
                                        title: 'Convite Gerado',
                                        message: 'Portal de convite validado e pronto para compartilhar.',
                                        type: 'success',
                                    },
                                    failToast: {
                                        title: 'Falha ao gerar convite',
                                        message: (err) => (err as Error)?.message || 'Não foi possível abrir o portal de convite agora.',
                                        type: 'error',
                                    },
                                    onSuccess: ({ result }) => {
                                        const text = encodeURIComponent(
                                          `🌿 Olá! Convido você a ser um Guardião no Viva360 e integrar nosso Santuário. Vamos expandir a cura juntos? 🌱\n\nAcesse aqui: ${result.url}\n\n(Código de backup: ${result.code})`
                                        );
                                        window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
                                    },
                                });
                            } finally {
                                setInviteLoading(false);
                            }
                        }}
                        disabled={inviteLoading}
                        className="bg-amber-50 p-6 rounded-[2.5rem] border border-amber-100 shadow-sm flex flex-col items-center justify-center gap-3 hover:bg-amber-100 transition-all group"
                    >
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-amber-500 group-hover:scale-110 transition-transform"><Plus size={24}/></div>
                        <div className="text-center">
                            <span className="text-[11px] font-bold text-amber-900 block">{inviteLoading ? 'Gerando...' : 'Ampliar Chamado'}</span>
                            <span className="text-[9px] text-amber-600 font-bold uppercase tracking-widest">Convite Direto</span>
                        </div>
                    </button>
                    <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm text-center flex flex-col items-center justify-center gap-1">
                        <p className="text-[9px] font-bold text-nature-400 uppercase tracking-widest">Guardiões Ativos</p>
                        <h4 className="text-2xl font-serif italic text-nature-900">12</h4>
                    </div>
                </div>
        
                <div className="space-y-4">
                   <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Manifestos de Busca (Vagas)</h4>
                   {(vacancies || []).length > 0 ? (vacancies || []).map(v => (
                     <div key={v.id} className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm space-y-5 group hover:shadow-md transition-all">
                        <div className="flex justify-between items-start">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><UserPlus size={24}/></div>
                              <div>
                                 <h4 className="font-bold text-nature-900 text-sm leading-none">{v.title}</h4>
                                 <div className="flex gap-1.5 mt-2">
                                   {(v.specialties || []).map(s => <span key={s} className="text-[9px] px-2 py-0.5 bg-nature-50 text-nature-400 rounded-lg font-bold uppercase border border-nature-100">{s}</span>)}
                                 </div>
                              </div>
                           </div>
                           <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">Ativo</div>
                        </div>
                        <p className="text-xs text-nature-500 line-clamp-2 italic leading-relaxed px-1">"{v.description}"</p>
                        <div className="flex items-center justify-between pt-4 border-t border-nature-50">
                           <div className="flex items-center gap-2 text-nature-400">
                              <Users size={14}/>
                              <span className="text-[10px] font-bold uppercase tracking-tighter">{v.applicantsCount} Guardiões Inscritos</span>
                           </div>
                           <button onClick={() => { notify('Candidaturas abertas', `Abrindo inscrições de ${v.title}.`, 'info'); flow.go('VAGA_CANDIDATES'); }} className="flex items-center gap-1.5 px-4 py-2 bg-nature-900 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                              Sincronizar <ChevronRight size={12}/>
                           </button>
                        </div>
                     </div>
                   )) : (
                     <div className="py-20 text-center space-y-4 opacity-40">
                        <div className="w-20 h-20 bg-nature-100 rounded-full flex items-center justify-center mx-auto text-nature-300 shadow-inner"><Briefcase size={32} /></div>
                        <p className="italic text-sm">Nenhum manifesto ativo no momento.<br/>O Santuário está em equilíbrio completo.</p>
                     </div>
                   )}
                </div>
        
                <div className="bg-amber-50 p-8 rounded-[3.5rem] border border-amber-100 space-y-4 text-center">
                    <Award size={40} className="mx-auto text-amber-500" />
                    <h4 className="font-serif italic text-lg text-amber-900">Impulsione seu Santuário</h4>
                    <p className="text-xs text-amber-700 italic px-4 leading-relaxed">Destaque suas vagas no topo do Mapa da Cura de todos os Guardiões do Viva360.</p>
                    <button 
                        onClick={() => notify('Selo de Destaque', 'Suas vagas agora brilham no topo do Mapa da Cura!', 'success')}
                        className="px-6 py-3 bg-amber-500 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                    >
                        Ativar Selo de Destaque
                    </button>
                </div>
              </div>
              <VacancyFormModal isOpen={showAddVacancy} onClose={() => setShowAddVacancy(false)} onSubmit={async (title, desc, specs) => {
                  await runConfirmedAction({
                      action: () => api.spaces.createVacancy({ title, description: desc, specialties: specs, hubId: user.id }),
                      refresh: () => Promise.resolve(refreshData()),
                      notify,
                      successToast: {
                          title: 'Oportunidade Criada',
                          message: 'O universo agora sabe que você busca novos guardiões.',
                          type: 'success',
                      },
                      failToast: {
                          title: 'Falha ao criar vaga',
                          message: 'Não foi possível registrar o manifesto agora.',
                          type: 'error',
                      },
                  });
              }} />
            </PortalView>
        </>
    );
};
