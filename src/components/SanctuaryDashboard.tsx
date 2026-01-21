import React, { useState } from 'react';
import { ChevronLeft, TrendingUp, Users, DollarSign, Calendar, Star, Clock, ChevronDown, ArrowUp, ArrowDown, BarChart3, PieChart, Download } from 'lucide-react';
import { Card } from './Common';

interface DashboardStats {
  occupancy: number;
  occupancyChange: number;
  revenue: number;
  revenueChange: number;
  sessions: number;
  sessionsChange: number;
  nps: number;
  npsChange: number;
}

interface TopPerformer {
  id: string;
  name: string;
  sessions: number;
  revenue: number;
  rating: number;
}

interface SanctuaryDashboardProps {
  spaceName: string;
  onClose: () => void;
}

export const SanctuaryDashboard: React.FC<SanctuaryDashboardProps> = ({ spaceName, onClose }) => {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  // Mock stats
  const stats: DashboardStats = {
    occupancy: 78,
    occupancyChange: 12,
    revenue: 45680,
    revenueChange: 8.5,
    sessions: 342,
    sessionsChange: -3,
    nps: 92,
    npsChange: 5,
  };

  const topPerformers: TopPerformer[] = [
    { id: '1', name: 'Luna Chen', sessions: 45, revenue: 8900, rating: 4.9 },
    { id: '2', name: 'Marco Silva', sessions: 38, revenue: 7600, rating: 4.8 },
    { id: '3', name: 'Ana Ramalho', sessions: 32, revenue: 6400, rating: 4.7 },
  ];

  // Mock hourly data for heatmap
  const hourlyData = [
    { hour: '08h', mon: 2, tue: 3, wed: 4, thu: 3, fri: 5, sat: 6 },
    { hour: '10h', mon: 4, tue: 5, wed: 6, thu: 5, fri: 6, sat: 8 },
    { hour: '12h', mon: 3, tue: 4, wed: 5, thu: 4, fri: 5, sat: 4 },
    { hour: '14h', mon: 5, tue: 6, wed: 7, thu: 6, fri: 7, sat: 9 },
    { hour: '16h', mon: 6, tue: 7, wed: 8, thu: 7, fri: 8, sat: 10 },
    { hour: '18h', mon: 7, tue: 8, wed: 9, thu: 8, fri: 9, sat: 7 },
    { hour: '20h', mon: 4, tue: 5, wed: 6, thu: 5, fri: 6, sat: 3 },
  ];

  const getHeatColor = (value: number) => {
    if (value >= 8) return 'bg-emerald-500';
    if (value >= 6) return 'bg-emerald-400';
    if (value >= 4) return 'bg-emerald-300';
    if (value >= 2) return 'bg-emerald-200';
    return 'bg-emerald-100';
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="fixed inset-0 z-[200] bg-nature-50 flex flex-col animate-in slide-in-from-right">
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-6 bg-white border-b border-nature-100 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-3 bg-nature-50 rounded-2xl text-nature-600 active:scale-90 transition-all">
            <ChevronLeft size={22} />
          </button>
          <div>
            <h2 className="text-xl font-serif italic text-nature-900">Dashboard</h2>
            <p className="text-[10px] text-nature-400 uppercase tracking-[0.3em] font-bold">{spaceName}</p>
          </div>
        </div>
        
        {/* Period selector */}
        <div className="flex bg-nature-100 rounded-xl p-1">
          {['week', 'month', 'year'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p as any)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                period === p ? 'bg-white text-nature-900 shadow-sm' : 'text-nature-500'
              }`}
            >
              {p === 'week' ? 'Semana' : p === 'month' ? 'Mês' : 'Ano'}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 pb-24">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { label: 'Taxa de Ocupação', value: `${stats.occupancy}%`, change: stats.occupancyChange, icon: Calendar, color: 'bg-blue-500' },
            { label: 'Receita', value: formatCurrency(stats.revenue), change: stats.revenueChange, icon: DollarSign, color: 'bg-emerald-500' },
            { label: 'Sessões', value: stats.sessions.toString(), change: stats.sessionsChange, icon: Users, color: 'bg-purple-500' },
            { label: 'NPS', value: `${stats.nps}`, change: stats.npsChange, icon: Star, color: 'bg-amber-500' },
          ].map((kpi, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 ${kpi.color} rounded-xl flex items-center justify-center`}>
                  <kpi.icon size={20} className="text-white" />
                </div>
                <div className={`flex items-center gap-1 text-xs ${kpi.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {kpi.change >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                  {Math.abs(kpi.change)}%
                </div>
              </div>
              <p className="text-xl font-bold text-nature-900">{kpi.value}</p>
              <p className="text-[10px] text-nature-400 uppercase tracking-widest">{kpi.label}</p>
            </Card>
          ))}
        </div>

        {/* Occupancy Heatmap */}
        <Card className="p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-nature-900 flex items-center gap-2">
              <BarChart3 size={18} className="text-primary-500" />
              Mapa de Ocupação
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left text-nature-400 pb-2"></th>
                  {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                    <th key={day} className="text-center text-nature-400 pb-2">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hourlyData.map(row => (
                  <tr key={row.hour}>
                    <td className="text-nature-400 py-1 pr-2">{row.hour}</td>
                    {['mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map(day => (
                      <td key={day} className="p-0.5">
                        <div className={`w-8 h-6 rounded ${getHeatColor((row as any)[day])} mx-auto`} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex items-center justify-center gap-2 mt-4 text-[10px] text-nature-400">
            <span>Baixo</span>
            <div className="flex gap-1">
              {['bg-emerald-100', 'bg-emerald-200', 'bg-emerald-300', 'bg-emerald-400', 'bg-emerald-500'].map((c, i) => (
                <div key={i} className={`w-4 h-3 rounded ${c}`} />
              ))}
            </div>
            <span>Alto</span>
          </div>
        </Card>

        {/* Top Performers */}
        <Card className="p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-nature-900 flex items-center gap-2">
              <TrendingUp size={18} className="text-primary-500" />
              Top Performers
            </h3>
          </div>
          
          <div className="space-y-4">
            {topPerformers.map((pro, i) => (
              <div key={pro.id} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                  i === 0 ? 'bg-amber-100 text-amber-600' :
                  i === 1 ? 'bg-gray-100 text-gray-600' :
                  'bg-orange-100 text-orange-600'
                }`}>
                  {i + 1}º
                </div>
                <div className="flex-1">
                  <p className="font-bold text-nature-900">{pro.name}</p>
                  <div className="flex items-center gap-3 text-xs text-nature-400">
                    <span>{pro.sessions} sessões</span>
                    <span>•</span>
                    <span>{formatCurrency(pro.revenue)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-amber-500 text-sm">
                  <Star size={14} fill="currentColor" />
                  <span className="font-bold">{pro.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Revenue Breakdown */}
        <Card className="p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-nature-900 flex items-center gap-2">
              <PieChart size={18} className="text-primary-500" />
              Receita por Categoria
            </h3>
          </div>
          
          <div className="space-y-3">
            {[
              { label: 'Sessões Individuais', value: 28500, percent: 62, color: 'bg-primary-500' },
              { label: 'Grupos/Workshops', value: 12000, percent: 26, color: 'bg-purple-500' },
              { label: 'Aluguel de Salas', value: 5180, percent: 12, color: 'bg-amber-500' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-nature-600">{item.label}</span>
                  <span className="font-bold text-nature-900">{formatCurrency(item.value)}</span>
                </div>
                <div className="h-2 bg-nature-100 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Export Button */}
        <button className="w-full py-4 bg-white border border-nature-200 rounded-2xl flex items-center justify-center gap-2 text-nature-600 font-bold">
          <Download size={18} />
          Exportar Relatório (PDF)
        </button>
      </div>
    </div>
  );
};

export default SanctuaryDashboard;
