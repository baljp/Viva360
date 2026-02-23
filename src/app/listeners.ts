import { useEffect } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type { User } from '../../types';
import { api } from '../../services/api';
import { supabase, APP_MODE } from '../../lib/supabase';

type ToastSetter = (toast: { title: string; message: string } | null) => void;

type AuthListenerParams = {
  navigate: NavigateFunction;
  onLogin: (user: any) => void;
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
    if (APP_MODE === 'MOCK') {
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth State Changed:', event);
      if (event === 'SIGNED_IN' && session) {
        try {
          const user = await api.auth.getCurrentSession();
          if (user) onLogin(user);
        } catch (err: any) {
          console.error('OAuth callback error:', err);
          setToast({
            title: 'Acesso não autorizado',
            message: err?.message || 'Sua conta não está autorizada para este login.',
          });
          await api.auth.logout();
          navigate('/login');
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, onLogin, setCurrentUser, setToast]);
};

