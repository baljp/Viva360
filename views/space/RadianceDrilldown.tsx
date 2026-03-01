import React, { useEffect, useState } from 'react';
import { Award, Heart, Users, BarChart3, ArrowUpRight, Zap, Target, Loader } from 'lucide-react';
import { PortalView } from '../../components/Common';
import { useSantuarioFlow } from '../../src/flow/useSantuarioFlow';
import { accountApi } from '../../services/api/accountClient';

interface RadianceMetric {
  label: string;
  score: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  desc: string;
}

interface ProfMetrics {
  nps: number;
  retentionRate: number;
  averageRating: number;
}

export const RadianceDrilldown: React.FC<{ flow?: { go: (s: string) => void } }> = ({ flow }) => {
  const santuarioFlow = useSantuarioFlow();
  const activeFlow = flow ?? santuarioFlow;

  const adminStats = santuarioFlow?.state?.adminStats ?? {
    activePros: 0, totalPatients: 0, occupancyRate: 0, monthlyRevenue: 0, radianceScore: 0,
  };

  const [profMetrics, setProfMetrics] = useState<ProfMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  // space.id may be present when the flow data is pre-populated
  const spaceId = (santuarioFlow?.state?.data as Record<string, unknown> & { space?: { id?: string } })?.space?.id ?? '';

  useEffect(() => {
    if (!spaceId) { setLoading(false); return; }
    let cancelled = false;
    accountApi.profiles.getMetrics(spaceId)
      .then((data: unknown) => { if (!cancelled) setProfMetrics(data as ProfMetrics); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [spaceId]);

  const npsScore   = Math.min(100, Math.max(0, profMetrics?.nps ?? adminStats.radianceScore));
  const occupancy  = Math.min(100, adminStats.occupancyRate);
  const retention  = Math.min(100, profMetrics?.retentionRate ?? 0);
  const teamHarmony = adminStats.activePros > 0
    ? Math.min(100, Math.round(retention * 0.6 + Math.min(adminStats.activePros, 10) * 4))
    : 0;
  const communityImpact = adminStats.totalPatients > 0
    ? Math.min(100, Math.round(Math.min(adminStats.totalPatients, 50) * 1.5 + (adminStats.monthlyRevenue > 0 ? 25 : 0)))
    : 0;

  const metrics: RadianceMetric[] = [
    { label: 'Harmonia da Equipe', score: teamHarmony, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50',
      desc: `${adminStats.activePros} guardiões ativos · Sincronia de rituais.` },
    { label: 'Ocupação de Altares', score: occupancy, icon: BarChart3, color: 'text-emerald-500', bg: 'bg-emerald-50',
      desc: `${occupancy}% de uso eficiente dos espaços.` },
    { label: 'Satisfação das Almas', score: npsScore, icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50',
      desc: `NPS: ${npsScore}% · Feedback pós-atendimento.` },
    { label: 'Impacto Comunitário', score: communityImpact, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50',
      desc: `${adminStats.totalPatients} almas atendidas · Círculos e trocas.` },
  ];

  const globalScore = metrics.length > 0
    ? Math.round(metrics.reduce((acc, m) => acc + m.score, 0) / metrics.length)
    : adminStats.radianceScore;

  const targetScore = 98;
  const daysToTarget = globalScore < targetScore ? Math.ceil((targetScore - globalScore) / 2) : 0;

  const handleExport = () => {
    const rows = metrics.map(m => `${m.label.toLowerCase().replace(/\s+/g, '_')},${m.score}`).join('\n');
    const csv = `metrica,score\n${rows}\nglobal_score,${globalScore}\n`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `radiance-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <PortalView title="Mestria de Radiância" subtitle="INDICADORES DE SAÚDE DO ESPAÇO" onBack={() => activeFlow?.go?.('EXEC_DASHBOARD')}>
      <div className="space-y-8 pb-32">
        {/* Hero Score */}
        <div className="bg-nature-900 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden text-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] -translate-y-12 translate-x-12 animate-pulse" />
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-widest text-indigo-200">
              Nível de Vibração Global
            </div>
            {loading ? (
              <div className="flex justify-center py-4"><Loader size={32} className="animate-spin text-white/40" /></div>
            ) : (
              <>
                <h3 className="text-7xl font-serif italic tracking-tighter">
                  {globalScore} <span className="text-2xl not-italic opacity-40">/100</span>
                </h3>
                <div className="flex justify-center items-center gap-2 text-emerald-400">
                  <ArrowUpRight size={18} />
                  <span className="text-sm font-bold">Dados reais do espaço</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Metric Cards */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Dimensões de Luz</h4>
          {metrics.map((m, i) => (
            <div key={i} className="bg-white p-6 rounded-[3rem] border border-nature-100 shadow-sm flex items-center gap-6 animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
              <div className={`w-16 h-16 ${m.bg} ${m.color} rounded-[1.5rem] flex items-center justify-center shrink-0`}>
                <m.icon size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h5 className="font-bold text-nature-900 text-sm">{m.label}</h5>
                  <span className={`font-black text-lg ${m.color}`}>{loading ? '—' : `${m.score}%`}</span>
                </div>
                <p className="text-[10px] text-nature-400 leading-tight mb-3">{m.desc}</p>
                <div className="h-1.5 w-full bg-nature-50 rounded-full overflow-hidden">
                  <div className={`h-full ${m.color.replace('text-', 'bg-')} rounded-full transition-all duration-[2000ms]`} style={{ width: loading ? '0%' : `${m.score}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Predictive Target */}
        <div className="bg-gradient-to-br from-indigo-50 to-white p-8 rounded-[3.5rem] border border-indigo-100/50 flex flex-col items-center text-center gap-4 relative overflow-hidden">
          <Target size={120} className="absolute -left-10 -bottom-10 opacity-5" />
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl"><Award size={24} /></div>
          <div>
            <h4 className="font-bold text-nature-900">Meta: Nível Phoenix ({targetScore})</h4>
            {globalScore >= targetScore
              ? <p className="text-[11px] text-emerald-600 font-bold mt-1">🎉 Meta atingida! Parabéns ao Santuário.</p>
              : <p className="text-[10px] text-nature-500 max-w-[220px] mx-auto mt-1 leading-relaxed">Mantenha a ocupação acima de 85% por mais {daysToTarget} dias para atingir a graduação máxima.</p>
            }
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => activeFlow?.go?.('AUDIT_LOG')} className="py-4 bg-white border border-nature-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-nature-400 hover:bg-nature-50 transition-colors">Ver Histórico</button>
          <button onClick={handleExport} className="py-4 bg-nature-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl active:scale-95 transition-all">Relatório Completo</button>
        </div>
      </div>
    </PortalView>
  );
};
