
import React, { useState, useEffect } from 'react';
import { useGuardiaoFlow } from '../../../src/flow/useGuardiaoFlow';
import { ChevronLeft, Briefcase, MapPin, Building, Search, X, CheckCircle, Clock, DollarSign, Loader2 } from 'lucide-react';
import { PortalView, DegradedRetryNotice } from '../../../components/Common';
import { hubApi } from '../../../services/api/hubClient';
import { roundTripTelemetry } from '../../../lib/telemetry';
import { buildReadFailureCopy, isDegradedReadError } from '../../../src/utils/readDegradedUX';

type Vacancy = {
  id: string;
  title: string;
  space?: string;
  space_name?: string;
  location?: string;
  type?: string;
  salary?: string;
  description?: string;
  specialties?: string[];
};

type VacancyApiRow = {
  id?: string | number;
  title?: string | null;
  space_name?: string | null;
  space?: string | null;
  location?: string | null;
  type?: string | null;
  modality?: string | null;
  salary?: string | null;
  compensation?: string | null;
  description?: string | null;
  specialties?: string[];
};

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

export default function VagasList() {
  const { go, back, notify } = useGuardiaoFlow();
  const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null);
  const [applying, setApplying] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // FLOW-01: Real data from GET /rooms/vacancies
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [readIssue, setReadIssue] = useState<{ title: string; message: string } | null>(null);

  const mapVacancies = (data: unknown): Vacancy[] => {
    const list = Array.isArray(data) ? (data as VacancyApiRow[]) : [];
    return list.map((v) => ({
      id: String(v.id),
      title: v.title || 'Sem título',
      space: v.space_name || v.space || '',
      location: v.location || 'Não informado',
      type: v.type || v.modality || 'Presencial',
      salary: v.salary || v.compensation || 'A combinar',
      description: v.description || '',
      specialties: v.specialties || [],
    }));
  };

  const loadVacancies = async () => {
    setLoading(true);
    setReadIssue(null);
    try {
      const data = await hubApi.spaces.getVacancies({ strict: true });
      setVacancies(mapVacancies(data));
    } catch (err: unknown) {
      console.warn('[VagasList] Failed to load vacancies:', errorMessage(err));
      setVacancies([]);
      setReadIssue(buildReadFailureCopy(['vacancies'], isDegradedReadError(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await hubApi.spaces.getVacancies({ strict: true });
        if (!cancelled) {
          setVacancies(mapVacancies(data));
          setReadIssue(null);
        }
      } catch (err: unknown) {
        console.warn('[VagasList] Failed to load vacancies:', errorMessage(err));
        if (!cancelled) {
          setVacancies([]);
          setReadIssue(buildReadFailureCopy(['vacancies'], isDegradedReadError(err)));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // FLOW-01: Real application via POST /recruitment/applications
  const handleApply = async () => {
    if (!selectedVacancy || applying) return;
    setApplying(true);
    const rt = roundTripTelemetry.start('vagas', 'apply');
    try {
      await hubApi.recruitment.apply(selectedVacancy.id);
      roundTripTelemetry.success('vagas', 'apply', rt.correlationId, rt.startMs);
      setSelectedVacancy(null);
      notify?.('Aplicação Enviada', 'O Espaço receberá sua intenção. Acompanhe pelo painel.', 'success');
    } catch (err: unknown) {
      const msg = errorMessage(err) || 'Não foi possível enviar sua candidatura.';
      roundTripTelemetry.error('vagas', 'apply', rt.correlationId, rt.startMs, msg);
      notify?.('Erro na Aplicação', msg, 'error');
    } finally {
      setApplying(false);
    }
  };

  const filtered = searchTerm
    ? vacancies.filter(v =>
      v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.space || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.location || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    : vacancies;

  return (
    <PortalView title="Mural de Oportunidades" subtitle="EXPANDA SEU DOM" onBack={() => go('DASHBOARD')} heroImage="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800">

      <div className="px-2 mb-6">
        <div className="bg-white p-4 rounded-3xl border border-nature-100 flex items-center gap-3 shadow-sm">
          <Search size={20} className="text-nature-300" />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Cargo, cidade ou terapia..." className="flex-1 bg-transparent border-none outline-none text-nature-900 placeholder:text-nature-300" />
          {searchTerm && <button onClick={() => setSearchTerm('')} className="p-1 text-nature-300 hover:text-nature-600"><X size={16} /></button>}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 size={28} className="text-nature-300 animate-spin" />
          <p className="text-xs text-nature-400">Carregando oportunidades...</p>
        </div>
      ) : readIssue ? (
        <div className="py-6">
          <DegradedRetryNotice title={readIssue.title} message={readIssue.message} onRetry={loadVacancies} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 opacity-50">
          <Briefcase size={32} className="mx-auto mb-3 text-nature-300" />
          <p className="text-xs text-nature-400 italic">{searchTerm ? 'Nenhuma vaga encontrada para esta busca.' : 'Nenhuma oportunidade disponível no momento.'}</p>
        </div>
      ) : (
        <div className="space-y-4 pb-24 px-2">
          {filtered.map(v => (
            <div key={v.id} onClick={() => setSelectedVacancy(v)} className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm hover:shadow-md transition-all cursor-pointer group space-y-4 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><Building size={18} /></div>
                  <div>
                    <h4 className="font-bold text-nature-900 text-sm">{v.space}</h4>
                    <p className="text-[9px] text-nature-400 font-bold uppercase flex items-center gap-1"><MapPin size={10} /> {v.location}</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-bold uppercase">{v.type}</span>
              </div>

              <div>
                <h3 className="font-bold text-lg text-nature-900">{v.title}</h3>
                <p className="text-sm text-nature-500 mt-1">Estimativa: <span className="text-nature-900 font-bold">{v.salary}</span></p>
              </div>

              <button onClick={(event) => { event.stopPropagation(); setSelectedVacancy(v); }} className="w-full py-3 border border-nature-200 rounded-xl text-nature-400 text-[10px] font-bold uppercase tracking-widest group-hover:bg-nature-900 group-hover:text-white group-hover:border-nature-900 transition-all">Ver Detalhes</button>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selectedVacancy && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-nature-900/60 backdrop-blur-sm" onClick={() => setSelectedVacancy(null)} />
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 relative animate-in slide-in-from-bottom duration-300 shadow-2xl">
            <button onClick={() => setSelectedVacancy(null)} className="absolute top-6 right-6 p-2 bg-nature-50 rounded-full text-nature-400 hover:bg-nature-100 transition-colors"><X size={20} /></button>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner"><Building size={32} /></div>
                <div>
                  <h3 className="text-xl font-serif italic text-nature-900">{selectedVacancy.title}</h3>
                  <p className="text-xs font-bold uppercase text-nature-400 tracking-widest">{selectedVacancy.space}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-nature-50 rounded-2xl flex items-center gap-3">
                  <MapPin size={20} className="text-nature-400" />
                  <div><p className="text-[9px] uppercase font-bold text-nature-400">Local</p><p className="text-xs font-bold text-nature-700">{selectedVacancy.location}</p></div>
                </div>
                <div className="p-4 bg-nature-50 rounded-2xl flex items-center gap-3">
                  <DollarSign size={20} className="text-emerald-500" />
                  <div><p className="text-[9px] uppercase font-bold text-nature-400">Valor</p><p className="text-xs font-bold text-nature-700">{selectedVacancy.salary}</p></div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-nature-900 text-sm mb-2">Sobre a Oportunidade</h4>
                <p className="text-nature-600 text-sm leading-relaxed">{selectedVacancy.description}</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setSelectedVacancy(null)} className="flex-1 py-4 border border-nature-100 rounded-2xl font-bold uppercase tracking-widest text-xs text-nature-500">Voltar</button>
                <button onClick={handleApply} disabled={applying} className="flex-[2] py-4 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50">
                  {applying ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />} {applying ? 'Enviando...' : 'Aplicar Agora'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PortalView>
  );
}
