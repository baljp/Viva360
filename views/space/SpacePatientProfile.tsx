import React, { useEffect, useMemo, useState } from 'react';
import { useSantuarioFlow } from '../../src/flow/SantuarioFlowContext';
import { PortalView, DynamicAvatar } from '../../components/Common';
import { Heart, Shield, Calendar, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';

type CachedPatient = {
  id: string;
  name: string;
  health?: number;
  karma?: number;
  lastVisit?: string;
  condition?: string;
  pro?: string;
};

const readCachedPatient = (): CachedPatient | null => {
  try {
    const raw = sessionStorage.getItem('viva360.space.selectedPatient');
    if (!raw) return null;
    return JSON.parse(raw) as CachedPatient;
  } catch {
    return null;
  }
};

export const SpacePatientProfile: React.FC = () => {
  const { state, back, go, notify} = useSantuarioFlow();
  const [detail, setDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const cached = useMemo(() => readCachedPatient(), []);
  const patientId = state.selectedPatientId || cached?.id || null;

  useEffect(() => {
    if (!patientId) {
      notify('Paciente não selecionado', 'Volte ao Portal de Almas e selecione um buscador.', 'info');
    }
  }, [patientId]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!patientId) return;
      setLoading(true);
      try {
        const data = await api.spaces.getPatient(patientId);
        if (mounted) setDetail(data);
      } catch {
        if (mounted) setDetail(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [patientId]);

  const serverPatient = detail?.patient || null;
  const name = cached?.name || serverPatient?.name || 'Buscador';
  const karma = typeof cached?.karma === 'number' ? cached.karma : Number(serverPatient?.karma || 0);
  const lastVisit = cached?.lastVisit || (detail?.appointments?.[0]?.date ? new Date(detail.appointments[0].date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '--/--');
  const pro = cached?.pro || (detail?.appointments?.[0]?.guardian?.name || 'Equipe');
  const condition = cached?.condition || (detail?.appointments?.length ? 'Em acompanhamento' : 'Em observação');
  const health = typeof cached?.health === 'number' ? cached.health : 0;

  const healthLabel = health > 70 ? 'Estável' : health > 40 ? 'Em atenção' : 'Crítico';
  const healthColor = health > 70 ? 'text-emerald-600' : health > 40 ? 'text-amber-600' : 'text-rose-600';
  const healthBg = health > 70 ? 'bg-emerald-50 border-emerald-100' : health > 40 ? 'bg-amber-50 border-amber-100' : 'bg-rose-50 border-rose-100';

  return (
    <PortalView
      title="Perfil do Buscador"
      subtitle="PORTAL DE ALMAS"
      onBack={back}
      onClose={() => go('EXEC_DASHBOARD')}
      heroImage="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=1200"
    >

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative">
              <DynamicAvatar user={{ name } as any} size="lg" className="border-4 border-white shadow-lg" />
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${health > 70 ? 'bg-emerald-500' : health > 40 ? 'bg-amber-500' : 'bg-rose-500'}`} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-serif italic text-2xl text-nature-900 truncate">{name}</h3>
              <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest mt-1 truncate">{condition} · {pro}</p>
            </div>
            <div className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${healthBg} ${healthColor}`}>
              {healthLabel}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-nature-50">
            <div className="bg-nature-50 p-4 rounded-2xl border border-nature-100">
              <p className="text-[9px] font-bold text-nature-400 uppercase tracking-widest">Karma</p>
              <p className="text-lg font-black text-nature-900">{karma}</p>
            </div>
            <div className="bg-nature-50 p-4 rounded-2xl border border-nature-100">
              <p className="text-[9px] font-bold text-nature-400 uppercase tracking-widest">Saúde</p>
              <p className={`text-lg font-black ${healthColor}`}>{health || '--'}%</p>
            </div>
            <div className="bg-nature-50 p-4 rounded-2xl border border-nature-100">
              <p className="text-[9px] font-bold text-nature-400 uppercase tracking-widest">Último</p>
              <p className="text-lg font-black text-nature-900">{lastVisit}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Sessões Recentes</h4>
            {loading && <span className="text-[10px] font-bold text-nature-300 uppercase tracking-widest">Carregando...</span>}
          </div>
          {(detail?.appointments || []).length === 0 ? (
            <p className="text-sm text-nature-400 italic">Nenhuma sessão encontrada para este vínculo.</p>
          ) : (
            <div className="space-y-3">
              {(detail?.appointments || []).slice(0, 6).map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-4 bg-nature-50 rounded-2xl border border-nature-100">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-nature-900 truncate">{a.serviceName}</p>
                    <p className="text-[9px] font-bold text-nature-400 uppercase tracking-widest mt-1 truncate">
                      {new Date(a.date).toLocaleDateString('pt-BR')} · {a.time} · {a.guardian?.name || 'Guardião'}
                    </p>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-nature-500">{String(a.status || '').toUpperCase()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-nature-900 text-white p-6 rounded-[2.5rem] shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-16 translate-x-16" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300/80">Acompanhamento</p>
                <h4 className="font-serif italic text-xl">Trilha de Jornada</h4>
              </div>
              <Heart size={22} className="text-emerald-400" />
            </div>
            <p className="text-xs text-white/60 leading-relaxed italic">
              "Visão do Santuário: dados não sensíveis para cuidado coletivo. Prontuário clínico permanece protegido."
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-white/70">
                  <Shield size={14} className="text-indigo-300" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Status</span>
                </div>
                <p className="mt-2 text-sm font-bold">{condition}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-white/70">
                  <Calendar size={14} className="text-amber-300" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Próximo</span>
                </div>
                <p className="mt-2 text-sm font-bold">A definir</p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => go('PATIENT_RECORDS')}
          disabled={!patientId}
          className="w-full py-5 bg-white border border-nature-200 text-nature-900 rounded-[2rem] font-bold uppercase tracking-widest text-[10px] shadow-sm hover:bg-nature-50 transition-colors active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          Ver Histórico de Sessões <ChevronRight size={18} />
        </button>
      </div>
    </PortalView>
  );
};
