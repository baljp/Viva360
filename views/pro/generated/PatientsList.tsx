import React, { useEffect, useMemo, useState } from 'react';
import { useGuardiaoFlow } from '../../../src/flow/GuardiaoFlowContext';
import { Search, Flower, ChevronRight, Activity, Zap, Sprout, MessageCircle } from 'lucide-react';
import { PortalView } from '../../../components/Common';
import { api } from '../../../services/api';

export default function PatientsList() {
  const { go, state, selectPatient } = useGuardiaoFlow();
  const [myId, setMyId] = useState<string>('');
  const [linkEmail, setLinkEmail] = useState('');
  const [linkSending, setLinkSending] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');
  const [patientLinks, setPatientLinks] = useState<any[]>([]);
  const [linksLoading, setLinksLoading] = useState(false);

  const loadLinks = async () => {
    setLinksLoading(true);
    try {
      const links = await api.links.getMyLinks();
      const list = Array.isArray(links) ? links : [];
      setPatientLinks(list.filter((l) => String(l?.type || '').toLowerCase() === 'paciente'));
    } catch {
      setPatientLinks([]);
    } finally {
      setLinksLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    api.auth.getCurrentSession().then((u) => {
      if (!cancelled && u?.id) setMyId(String(u.id));
    });
    const doLoad = async () => {
      setLinksLoading(true);
      try {
        const links = await api.links.getMyLinks();
        if (cancelled) return;
        const list = Array.isArray(links) ? links : [];
        setPatientLinks(list.filter((l) => String(l?.type || '').toLowerCase() === 'paciente'));
      } catch {
        if (!cancelled) setPatientLinks([]);
      } finally {
        if (!cancelled) setLinksLoading(false);
      }
    };
    doLoad().catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const patients = useMemo(() => {
    const map = new Map<string, any>();
    for (const appointment of state.data.appointments || []) {
      const patientId = String((appointment as any).client_id || (appointment as any).clientId || '').trim();
      if (!patientId) continue;
      const dateRaw = String((appointment as any).date || '').slice(0, 10);
      const dateLabel = dateRaw ? new Date(dateRaw).toLocaleDateString('pt-BR') : 'Sem data';
      const current = map.get(patientId);
      const sessions = Number(current?.sessions || 0) + 1;
      const progress = Math.min(100, sessions * 8);
      const candidate = {
        id: patientId,
        name: String((appointment as any).client_name || current?.name || 'Buscador'),
        sessions,
        mood: String(current?.mood || 'Em Jornada'),
        progress,
        nextSession: dateLabel,
      };
      map.set(patientId, candidate);
    }
    return Array.from(map.values());
  }, [state.data.appointments]);

  const criticalPatients = patients.filter((patient) => patient.progress < 20);
  const flourishingPatients = patients.filter((patient) => !criticalPatients.includes(patient));

  return (
    <PortalView title="Meu Jardim" subtitle="ALMAS EM JORNADA" onBack={() => go('DASHBOARD')} heroImage="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=800">

      <div className="px-2 mb-8 animate-in slide-in-from-bottom-4 duration-700">
        <div className="bg-nature-900 rounded-[2.5rem] p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-end relative z-10">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-400 mb-1">Métrica Viva</p>
              <h3 className="text-3xl font-serif italic mb-1">{patients.length} <span className="text-lg opacity-60 not-italic sans-serif">Almas</span></h3>
              <div className="flex items-center gap-2 mt-2">
                <Activity size={14} className="text-emerald-400" />
                <span className="text-[10px] uppercase font-bold tracking-wider">Vitalidade Média: 78%</span>
              </div>
            </div>
            <div className="text-right">
              <Sprout size={32} className="text-emerald-400 mb-2 ml-auto" />
              <span className="text-[9px] font-bold uppercase tracking-wider block">Evolução Coletiva</span>
              <span className="text-emerald-400 font-bold text-sm">Em Crescimento</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-2 mb-6">
        <div className="bg-white p-4 rounded-3xl border border-nature-100 flex items-center gap-3 shadow-sm hover:border-emerald-200 transition-colors">
          <Search size={20} className="text-nature-300" />
          <input type="text" placeholder="Buscar alma no jardim..." className="flex-1 bg-transparent border-none outline-none text-nature-900 placeholder:text-nature-300 font-medium" />
        </div>
      </div>

      <div className="space-y-4 pb-4 px-2">
        {criticalPatients.length > 0 && (
          <>
            <h4 className="text-[10px] font-bold text-rose-500 uppercase tracking-widest pl-2 flex items-center gap-2">
              <Zap size={12} className="fill-rose-500" /> Necessitam de Cuidado
            </h4>
            {criticalPatients.map((p) => (
              <div key={p.id} onClick={() => { selectPatient({ id: String(p.id), name: p.name }); go('PATIENT_PROFILE'); }} className="bg-rose-50/50 p-5 rounded-[2.5rem] border border-rose-100 flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer group animate-in slide-in-from-bottom-2">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-rose-400 relative">
                    <Flower size={24} />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white bg-rose-500 animate-pulse"></div>
                  </div>
                  <div>
                    <h4 className="font-bold text-nature-900">{p.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded-md text-[9px] font-bold uppercase tracking-wide">{p.mood}</span>
                      <span className="text-[9px] text-rose-400 font-bold">• {p.nextSession}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-rose-300 group-hover:text-rose-600 transition-colors" />
              </div>
            ))}
          </>
        )}
      </div>

      <div className="space-y-4 pb-24 px-2">
        <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest pl-2">Florescimento Recente</h4>
        {flourishingPatients.map((p, i) => (
          <div key={p.id} onClick={() => { selectPatient({ id: String(p.id), name: p.name }); go('PATIENT_PROFILE'); }} className="bg-white p-5 rounded-[2.5rem] border border-nature-100 flex items-center justify-between shadow-sm hover:shadow-lg transition-all cursor-pointer group animate-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-nature-50 rounded-2xl flex items-center justify-center text-nature-400 relative group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                <Flower size={24} />
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${p.progress > 80 ? 'bg-emerald-500' : (p.progress > 40 ? 'bg-amber-400' : 'bg-rose-400')}`}></div>
              </div>
              <div>
                <h4 className="font-bold text-nature-900 group-hover:text-emerald-800 transition-colors">{p.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-nature-50 rounded-md text-[9px] font-bold uppercase tracking-wide text-nature-500">{p.mood}</span>
                  <span className="text-[9px] text-nature-300 font-bold">• {p.nextSession}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="w-12 h-1 bg-nature-100 rounded-full mt-1 overflow-hidden">
                  <div className={`h-full rounded-full ${p.progress > 80 ? 'bg-emerald-500' : (p.progress > 40 ? 'bg-amber-400' : 'bg-rose-400')}`} style={{ width: `${p.progress}%` }}></div>
                </div>
              </div>
              <ChevronRight size={16} className="text-nature-300 group-hover:text-nature-900 transition-colors" />
            </div>
          </div>
        ))}
        {patients.length === 0 && (
          <div className="bg-white p-6 rounded-[2rem] border border-nature-100 text-center text-xs text-nature-400">
            Ainda não há pacientes vinculados. Assim que houver agendamentos, eles aparecerão aqui automaticamente.
          </div>
        )}
      </div>

      {/* INTERNAL LINK INVITE (Guardian -> Buscador) */}
      <div className="px-2 mt-4 pb-32 space-y-4">
        <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-nature-900">Vincular Buscador</h4>
              <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest mt-1">
                Envia convite interno e aparece na Central do Buscador
              </p>
            </div>
            <button
              onClick={() => loadLinks().catch(() => undefined)}
              className="px-4 py-2 rounded-2xl bg-nature-50 border border-nature-100 text-nature-500 text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all"
            >
              {linksLoading ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-bold text-nature-400 uppercase tracking-widest px-2">E-mail do Buscador</label>
            <input
              value={linkEmail}
              onChange={(e) => setLinkEmail(e.target.value)}
              placeholder="buscador@exemplo.com"
              className="w-full p-4 bg-nature-50 rounded-2xl border border-nature-100 outline-none focus:ring-2 focus:ring-emerald-100 transition-all font-medium text-nature-900"
            />
          </div>

          {linkError && (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-3 text-[10px] font-bold text-rose-700 uppercase tracking-widest">
              {linkError}
            </div>
          )}
          {linkSuccess && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
              {linkSuccess}
            </div>
          )}

          <button
            onClick={async () => {
              setLinkError('');
              setLinkSuccess('');
              const email = String(linkEmail || '').trim().toLowerCase();
              if (!email.includes('@')) {
                setLinkError('Informe um e-mail valido.');
                return;
              }
              setLinkSending(true);
              try {
                const profile = await api.profiles.lookupByEmail(email);
                if (!profile?.id) {
                  setLinkError('Buscador nao encontrado.');
                  return;
                }
                await api.links.create(String(profile.id), 'paciente');
                setLinkSuccess('Convite interno enviado. Aguarde o aceite do Buscador.');
                setLinkEmail('');
                await loadLinks();
              } catch (e: any) {
                setLinkError(e?.message || 'Falha ao enviar convite.');
              } finally {
                setLinkSending(false);
              }
            }}
            disabled={linkSending}
            className="w-full bg-nature-900 text-white py-5 rounded-[2rem] shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all font-bold uppercase tracking-widest text-[10px] disabled:opacity-60 disabled:scale-100"
          >
            <MessageCircle size={18} /> {linkSending ? 'Enviando...' : 'Enviar Convite Interno'}
          </button>
        </div>

        {/* Linked + Pending snapshot */}
        {patientLinks.length > 0 && (
          <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm space-y-3">
            <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Vinculos</h4>
            {patientLinks.slice(0, 6).map((link) => {
              const source = (link as any)?.source || {};
              const target = (link as any)?.target || {};
              const other = String(source?.id || '') === myId ? target : source;
              const status = String((link as any)?.status || '').toUpperCase();
              return (
                <div key={String(link.id)} className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-nature-50 border border-nature-100">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-nature-900 truncate">{other?.name || 'Buscador'}</p>
                    <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest mt-1 truncate">
                      {status === 'PENDING' ? 'Pendente de aceite' : 'Vinculado'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-700'}`}>
                    {status || 'OK'}
                  </span>
                </div>
              );
            })}
            {patientLinks.length > 6 && (
              <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest">
                +{patientLinks.length - 6} outros vinculos
              </p>
            )}
          </div>
        )}
      </div>
    </PortalView>
  );
}
