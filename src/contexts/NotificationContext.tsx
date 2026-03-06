/**
 * NotificationContext — in-app + Web Push coordination
 *
 * On user login:
 *   1. Loads in-app notifications from Supabase
 *   2. Subscribes to Supabase Realtime for live updates
 *   3. Checks push permission — if already granted, auto-subscribes (silently)
 *
 * Exposes requestPush() / disablePush() for the Settings screen.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, isMockMode }          from '../../lib/supabase';
import { api }                           from '../../services/api';
import { Notification }                  from '../../types';
import { isInAppMuted, onInAppMuteChange } from '../utils/inAppMute';
import { NotificationContextStore }      from './NotificationContextStore';
import {
  subscribePush, unsubscribePush,
  getPushSubscriptionState, getPushPermissionState,
  PushPermissionState,
} from '../../lib/notifications';
import type { User } from '../../types';

export interface NotificationContextType {
  notifications:  Notification[];
  unreadCount:    number;
  markAsRead:     (id: string) => Promise<void>;
  markAllRead:    () => Promise<void>;
  // Push
  pushPermission: PushPermissionState;
  pushSubscribed: boolean;
  requestPush:    () => Promise<boolean>;
  disablePush:    () => Promise<void>;
}
// NotificationContextType is exported via the interface declaration above

const Ctx = NotificationContextStore as React.Context<NotificationContextType>;

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications,  setNotifications]  = useState<Notification[]>([]);
  const [user,           setUser]           = useState<User | null>(null);
  const [muteNonce,      setMuteNonce]      = useState(0);
  const [pushPermission, setPushPermission] = useState<PushPermissionState>(getPushPermissionState);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const pushChecked = useRef(false);

  // ── Auth ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => { setUser(await api.auth.getCurrentSession()); };
    load();
    if (isMockMode) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(load);
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => onInAppMuteChange(() => setMuteNonce(n => n + 1)), []);

  // ── Auto-subscribe push after login ─────────────────────────────────────────
  useEffect(() => {
    if (!user || isMockMode || pushChecked.current) return;
    pushChecked.current = true;
    (async () => {
      const state = await getPushSubscriptionState();
      setPushPermission(state.permission);
      setPushSubscribed(state.subscribed);
      // If user already granted permission before (e.g., new device, cleared sub)
      if (state.permission === 'granted' && !state.subscribed) {
        const res = await subscribePush();
        if (res.success) setPushSubscribed(true);
      }
    })();
  }, [user]);

  // ── Realtime in-app notifications ────────────────────────────────────────────
  useEffect(() => {
    if (!user || isMockMode || isInAppMuted()) return;

    const fetch = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(30);
      if (data) setNotifications(data as Notification[]);
    };
    fetch();

    const ch = supabase
      .channel(`notif:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}`,
      }, p => setNotifications(prev => [p.new as Notification, ...prev]))
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}`,
      }, p => setNotifications(prev => prev.map(n => n.id === (p.new as Notification).id ? p.new as Notification : n)))
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [user, muteNonce]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (!isMockMode) await supabase.from('notifications').update({ read: true }).eq('id', id);
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (!isMockMode && user)
      await supabase.from('notifications').update({ read: true }).eq('user_id', user.id);
  }, [user]);

  const requestPush = useCallback(async (): Promise<boolean> => {
    const res = await subscribePush();
    setPushPermission(getPushPermissionState());
    if (res.success) setPushSubscribed(true);
    return res.success;
  }, []);

  const disablePush = useCallback(async () => {
    const ok = await unsubscribePush();
    if (ok) setPushSubscribed(false);
  }, []);

  return (
    <Ctx.Provider value={{
      notifications, unreadCount: notifications.filter(n => !n.read).length,
      markAsRead, markAllRead,
      pushPermission, pushSubscribed, requestPush, disablePush,
    }}>
      {children}
    </Ctx.Provider>
  );
};
