import React, { useState, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, Settings, ChevronRight, Sparkles, Calendar, MessageCircle, Heart, ShoppingBag, AlertCircle, Flame } from 'lucide-react';
import { Card } from './Common';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onNavigate: (url: string) => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'APPOINTMENT': return Calendar;
    case 'MESSAGE': return MessageCircle;
    case 'GAMIFICATION': return Flame;
    case 'RITUAL': return Sparkles;
    case 'TRIBE': return Heart;
    case 'MARKETPLACE': return ShoppingBag;
    default: return Bell;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'APPOINTMENT': return 'bg-blue-100 text-blue-600';
    case 'MESSAGE': return 'bg-purple-100 text-purple-600';
    case 'GAMIFICATION': return 'bg-amber-100 text-amber-600';
    case 'RITUAL': return 'bg-emerald-100 text-emerald-600';
    case 'TRIBE': return 'bg-rose-100 text-rose-600';
    case 'MARKETPLACE': return 'bg-indigo-100 text-indigo-600';
    default: return 'bg-nature-100 text-nature-600';
  }
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onNavigate,
}) => {
  if (!isOpen) return null;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Agora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="fixed inset-0 z-[300] animate-in fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      
      {/* Panel */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl animate-in slide-in-from-right">
        {/* Header */}
        <header className="flex items-center justify-between px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-4 border-b border-nature-100">
          <div>
            <h2 className="text-xl font-serif italic text-nature-900">Notificações</h2>
            {unreadCount > 0 && (
              <p className="text-[10px] text-primary-600 font-bold uppercase tracking-widest">
                {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="p-2 text-nature-400 hover:text-nature-600 transition-colors"
                title="Marcar todas como lidas"
              >
                <CheckCheck size={20} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 bg-nature-50 rounded-xl text-nature-600"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Notifications List */}
        <div className="overflow-y-auto h-[calc(100vh-120px)] p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-nature-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell size={28} className="text-nature-400" />
              </div>
              <h3 className="text-lg font-serif italic text-nature-900">Tudo em dia!</h3>
              <p className="text-sm text-nature-400 mt-2">Nenhuma notificação por enquanto.</p>
            </div>
          ) : (
            notifications.map(notif => {
              const Icon = getNotificationIcon(notif.type);
              const colorClass = getNotificationColor(notif.type);
              
              return (
                <div
                  key={notif.id}
                  className={`p-4 rounded-[1.5rem] border transition-all ${
                    notif.read 
                      ? 'bg-white border-nature-100' 
                      : 'bg-primary-50/30 border-primary-100'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`font-bold text-sm ${notif.read ? 'text-nature-600' : 'text-nature-900'}`}>
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-nature-400 flex-shrink-0">
                          {formatTime(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-nature-500 mt-1 line-clamp-2">{notif.message}</p>
                      
                      <div className="flex gap-2 mt-3">
                        {notif.actionUrl && (
                          <button
                            onClick={() => {
                              if (!notif.read) onMarkAsRead(notif.id);
                              onNavigate(notif.actionUrl!);
                              onClose();
                            }}
                            className="text-[10px] font-bold text-primary-600 uppercase tracking-widest flex items-center gap-1"
                          >
                            Ver <ChevronRight size={12} />
                          </button>
                        )}
                        {!notif.read && (
                          <button
                            onClick={() => onMarkAsRead(notif.id)}
                            className="text-[10px] font-bold text-nature-400 uppercase tracking-widest flex items-center gap-1"
                          >
                            <Check size={12} /> Lida
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(notif.id)}
                          className="text-[10px] font-bold text-nature-300 uppercase tracking-widest flex items-center gap-1 ml-auto"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

// Notification Badge
export const NotificationBadge: React.FC<{
  count: number;
  onClick: () => void;
}> = ({ count, onClick }) => (
  <button
    onClick={onClick}
    className="relative p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-nature-100"
  >
    <Bell size={20} className="text-nature-600" />
    {count > 0 && (
      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
        {count > 99 ? '99+' : count}
      </span>
    )}
  </button>
);

export default NotificationCenter;
