import { useEffect } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type { User } from '../../types';
import { api } from '../../services/api';
import { supabase, APP_MODE } from '../../lib/supabase';
import { telemetry, sessionTelemetry } from '../../lib/telemetry';
import { captureFrontendError, errorMessage } from '../../lib/frontendLogger';

type ToastSetter = (toast: { title: string; message: string } | null) => void;

type AuthListenerParams = {
  navigate: NavigateFunction;
  onLogin: (user: User) => void;
  setCurrentUser: (user: User | null) => void;
  setToast: ToastSetter;
};

export const useGlobalAuthStateListener = ({
  navigate,
  onLogin,
  setCurrentUser,
  setToast,
}: AuthListenerParams) => {
  useEffect(() => {
    if (APP_MODE === 'MOCK') return;

    // ── Supabase SIGNED_IN / SIGNED_OUT ───────────────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        try {
          const user = await api.auth.getCurrentSession();
          if (user) {
            telemetry.setUser(user.id);
            sessionTelemetry.record('login', { provider: 'supabase', userId: user.id });
            onLogin(user);
          }
        } catch (err) {
          captureFrontendError(err, { domain: 'auth', op: 'onAuthStateChange.SIGNED_IN' });
          setToast({
            title: 'Acesso não autorizado',
            message: errorMessage(err) || 'Sua conta não está autorizada para este login.',
          });
          await api.auth.logout();
          navigate('/login');
        }
      } else if (event === 'SIGNED_OUT') {
        telemetry.setUser(null);
        sessionTelemetry.record('logout');
        setCurrentUser(null);
        navigate('/login');
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Supabase auto-refresh funcionou — garante que localStorage está atualizado
        sessionTelemetry.record('token_refresh_ok', { source: 'supabase_auto' });
      }
    });

    // ── Evento viva360:session-expired (disparado pelo requestClient em 401) ─
    // Quando o silent refresh via supabase falha definitivamente, a request
    // lança SESSION_EXPIRED e o core.ts dispara este evento.
    const onSessionExpired = () => {
      const pathname = window.location.pathname;
      if (pathname === '/login' || pathname.startsWith('/register')) {
        return;
      }
      sessionTelemetry.record('session_expired');
      setCurrentUser(null);
      setToast({
        title: 'Sessão expirada',
        message: 'Sua sessão expirou. Faça login novamente.',
      });
      navigate('/login');
    };

    window.addEventListener('viva360:session-expired', onSessionExpired);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('viva360:session-expired', onSessionExpired);
    };
  }, [navigate, onLogin, setCurrentUser, setToast]);
};
