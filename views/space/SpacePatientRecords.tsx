import React, { useEffect, useState } from 'react';
import { useSantuarioFlow } from '../../src/flow/useSantuarioFlow';
import { PortalView } from '../../components/Common';
import { Calendar, ChevronRight, Shield } from 'lucide-react';
import { api } from '../../services/api';

export const SpacePatientRecords: React.FC = () => {
  const { state, back, go, notify} = useSantuarioFlow();
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);

  const patientId = state.selectedPatientId;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!patientId) {
        notify('Paciente não selecionado', 'Volte e selecione um buscador.', 'info');
        return;
      }
      setLoading(true);
      try {
        const data = await api.spaces.getPatient(patientId);
        const appts = Array.isArray(data?.appointments) ? data.appointments : [];
        if (mounted) setSessions(appts);
      } catch {
        if (mounted) setSessions([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [patientId]);

  return (
    <PortalView
      title="Histórico"
      subtitle="SESSÕES (NÃO SENSÍVEL)"
      onBack={back}
      onClose={() => go('EXEC_DASHBOARD')}
      heroImage="https://images.unsplash.com/photo-1518609878319-a16322081109?q=80&w=1200"
    >
      <div className="space-y-4">
        <div className="bg-amber-50 p-6 rounded-[2.5rem] border border-amber-100 flex items-start gap-4">
          <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm shrink-0">
            <Shield size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-900">Proteção LGPD</h4>
            <p className="text-[10px] text-amber-700 uppercase tracking-widest font-bold mt-1">
              O Santuário vê apenas informações não sensíveis.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            [1,2,3].map((i) => (
              <div key={i} className="bg-white p-5 rounded-[2.5rem] border border-nature-100 shadow-sm animate-pulse">
                <div className="h-4 w-1/2 bg-nature-100 rounded mb-3"></div>
                <div className="h-3 w-2/3 bg-nature-100 rounded"></div>
              </div>
            ))
          ) : sessions.length === 0 ? (
            <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 text-center text-nature-400 italic">
              Nenhuma sessão encontrada.
            </div>
          ) : sessions.map((s) => (
            <div key={s.id} className="bg-white p-5 rounded-[2.5rem] border border-nature-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 bg-nature-50 rounded-2xl flex items-center justify-center text-nature-400">
                  <Calendar size={18} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-nature-900 text-sm truncate">{s.serviceName || s.title}</h4>
                  <p className="text-[9px] text-nature-400 font-bold uppercase tracking-widest mt-1 truncate">
                    {new Date(s.date).toLocaleDateString('pt-BR')} · {s.time || '--:--'} · Guardião: {s.guardian?.name || s.guardian || 'Equipe'}
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-nature-200" />
            </div>
          ))}
        </div>
      </div>
    </PortalView>
  );
};
