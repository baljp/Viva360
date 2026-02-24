import React, { useEffect, useState } from 'react';
import { Sparkles, Wallet, AlertCircle, MessageSquare, Bell, X, Check } from 'lucide-react';
import { Notification } from '../../types';
import { communityApi } from '../../services/api/communityClient';
import { DegradedRetryNotice } from './DegradedRetryNotice';

export const NotificationDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  readIssue?: { title: string; message: string } | null;
  onRetryNotifications?: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllRead: () => void;
}> = ({ isOpen, onClose, notifications, readIssue, onRetryNotifications, onMarkAsRead, onMarkAllRead }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'ritual' | 'finance' | 'alert'>('all');
  const [pendingLinks, setPendingLinks] = useState<any[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [linksError, setLinksError] = useState<string>('');

  const filteredNotifications = notifications.filter(n => activeFilter === 'all' || n.type === activeFilter);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    const load = async () => {
      setLoadingLinks(true);
      setLinksError('');
      try {
        const raw = await communityApi.links.getPendingRequests();
        const list = Array.isArray(raw) ? raw : [];
        // Only show link requests that can be actioned here.
        const normalized = list.filter((l) => l && l.id && l.status === 'pending');
        if (mounted) setPendingLinks(normalized);
      } catch (e: any) {
        if (mounted) setLinksError(e?.message || 'Falha ao carregar convites.');
      } finally {
        if (mounted) setLoadingLinks(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Configurações visuais por tipo de notificação
  const typeConfig: Record<string, { icon: any, color: string, bg: string }> = {
      ritual: { icon: Sparkles, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      finance: { icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      alert: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
      message: { icon: MessageSquare, color: 'text-primary-600', bg: 'bg-primary-50' }
  };

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      <div className="absolute inset-0 bg-nature-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative w-full max-w-sm bg-white h-full shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col rounded-l-[3.5rem] border-l border-white/20">
        
        {/* Header Elegante */}
        <header className="p-8 pb-4 flex justify-between items-center bg-white/95 backdrop-blur-md rounded-tl-[3.5rem] z-10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-nature-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                 <Bell size={20} />
             </div>
             <div>
                 <h3 className="text-xl font-serif italic text-nature-900 leading-none">Central</h3>
                 <p className="text-[10px] text-nature-400 font-bold uppercase tracking-[0.2em] mt-1">Notificações</p>
             </div>
          </div>
          <button onClick={onClose} aria-label="Fechar notificações" className="p-3 bg-nature-50 rounded-2xl text-nature-400 hover:text-nature-900 transition-colors"><X size={20}/></button>
        </header>

        {/* Filtros / Abas */}
        <div className="px-8 pb-6 border-b border-nature-50">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {[
                    { id: 'all', label: 'Tudo' },
                    { id: 'ritual', label: 'Rituais' },
                    { id: 'finance', label: 'Finanças' },
                    { id: 'alert', label: 'Avisos' }
                ].map(f => (
                    <button 
                        key={f.id} 
                        onClick={() => setActiveFilter(f.id as any)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${activeFilter === f.id ? 'bg-nature-900 text-white border-nature-900' : 'bg-white text-nature-400 border-nature-100 hover:border-nature-300'}`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Lista de Notificações */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar bg-primary-50/30">
          {readIssue && (
            <DegradedRetryNotice
              title={readIssue.title}
              message={readIssue.message}
              onRetry={onRetryNotifications}
              compact
              className="mb-2"
            />
          )}
          {/* Pending Link Requests (actionable) */}
          <div className="space-y-3">
            <div className="px-1 flex items-center justify-between">
              <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Convites Pendentes</h4>
              {loadingLinks && <span className="text-[10px] text-nature-300 font-bold uppercase tracking-widest">Carregando...</span>}
            </div>
            {linksError && (
              <DegradedRetryNotice
                title="Convites temporariamente indisponíveis"
                message={linksError}
                onRetry={() => {
                  setLinksError('');
                  setLoadingLinks(true);
                  setPendingLinks([]);
                  // re-run effect by toggling open state is controlled externally; do an inline fetch here
                  communityApi.links.getPendingRequests()
                    .then((raw) => {
                      const list = Array.isArray(raw) ? raw : [];
                      setPendingLinks(list.filter((l) => l && l.id && l.status === 'pending'));
                    })
                    .catch((e: any) => setLinksError(e?.message || 'Falha ao carregar convites.'))
                    .finally(() => setLoadingLinks(false));
                }}
                compact
              />
            )}
            {!loadingLinks && !linksError && pendingLinks.length === 0 && (
              <div className="bg-white border border-nature-100 rounded-2xl p-4 text-[10px] text-nature-400 font-bold uppercase tracking-widest">
                Nenhum convite aguardando aceite.
              </div>
            )}
            {pendingLinks.map((link) => {
              const source = (link as any)?.source || {};
              const linkType = String((link as any)?.type || '').toLowerCase();
              const label =
                linkType === 'paciente'
                  ? 'Vinculo com Guardiao'
                  : linkType === 'tribo'
                    ? 'Convite de Tribo'
                    : 'Convite de Conexao';
              return (
                <div key={String(link.id)} className="bg-white border border-primary-200 rounded-3xl p-5 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Bell size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-xs text-nature-900 truncate">{label}</h5>
                      <p className="text-[11px] text-nature-500 mt-1 leading-relaxed line-clamp-2">
                        {source?.name ? `${source.name} quer se vincular com voce.` : 'Uma conexao foi solicitada.'}
                      </p>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            try {
                              await communityApi.links.accept(String(link.id));
                              setPendingLinks((prev) => prev.filter((x) => String((x as any)?.id) !== String(link.id)));
                            } catch (err: any) {
                              setLinksError(err?.message || 'Falha ao aceitar convite.');
                            }
                          }}
                          className="flex-1 py-3 rounded-2xl bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all"
                        >
                          Aceitar
                        </button>
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            try {
                              await communityApi.links.reject(String(link.id));
                              setPendingLinks((prev) => prev.filter((x) => String((x as any)?.id) !== String(link.id)));
                            } catch (err: any) {
                              setLinksError(err?.message || 'Falha ao recusar convite.');
                            }
                          }}
                          className="flex-1 py-3 rounded-2xl bg-white text-nature-500 border border-nature-200 text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all"
                        >
                          Recusar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center space-y-4 opacity-50">
                  <Bell size={40} className="text-nature-300" />
                  <p className="text-xs text-nature-400 font-medium italic">O universo aguarda em silêncio.<br/>Nenhuma notificação por aqui.</p>
              </div>
          ) : (
             filteredNotifications.map(n => {
                const config = typeConfig[n.type] || typeConfig['alert'];
                const Icon = config.icon;
                return (
                    <div 
                        key={n.id} 
                        onClick={() => onMarkAsRead(n.id)} 
                        className={`p-5 rounded-3xl border transition-all relative overflow-hidden group cursor-pointer ${n.read ? 'bg-white border-nature-100 opacity-60' : 'bg-white border-primary-200 shadow-sm ring-1 ring-primary-50 scale-[1.02]'}`}
                    >
                        <div className="flex items-start gap-4 relative z-10">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${config.bg} ${config.color}`}>
                                <Icon size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h4 className={`font-bold text-xs truncate pr-2 ${n.read ? 'text-nature-600' : 'text-nature-900'}`}>{n.title}</h4>
                                    {!n.read && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>}
                                </div>
                                <p className="text-[11px] text-nature-500 mt-1 leading-relaxed line-clamp-2">{n.message}</p>
                                <p className="text-[9px] text-nature-300 mt-2 font-medium">{new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {new Date(n.timestamp).toLocaleDateString()}</p>
                            </div>
                        </div>
                        {/* Efeito Hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none translate-x-[-100%] group-hover:translate-x-[100%] duration-1000"></div>
                    </div>
                );
             })
          )}
        </div>

        {/* Footer com Ação em Lote */}
        {notifications.some(n => !n.read) && (
            <div className="p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] bg-white border-t border-nature-100 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                <button 
                    onClick={onMarkAllRead} 
                    className="w-full py-4 border border-dashed border-primary-300 text-primary-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary-50 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                    <Check size={14} /> Marcar todas como lidas
                </button>
            </div>
        )}
      </div>
    </div>
  );
};
