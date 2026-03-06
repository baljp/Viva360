import { useEffect, useRef } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { ViewState, type User } from '../../types';
import { api } from '../../services/api';
import { APP_MODE, validateOAuthRuntimeConfig } from '../../lib/supabase';
import { preloadRoleViews } from '../utils/loaderUtils';
import { isPublicPath, resolveHomePath } from './routing';
import { normalizeUserForApp } from './userSession';
import { captureFrontendError, captureFrontendMessage } from '../../lib/frontendLogger';

type ToastSetter = (toast: { title: string; message: string } | null) => void;

type InitSessionParams = {
  pathname: string;
  currentView: ViewState;
  navigate: NavigateFunction;
  setCurrentUser: (user: User | null) => void;
  setIsLoading: (v: boolean) => void;
};

export const useAppSessionBootstrap = ({
  pathname,
  currentView,
  navigate,
  setCurrentUser,
  setIsLoading,
}: InitSessionParams) => {
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const init = async () => {
      try {
        const user = await api.auth.getCurrentSession();
        if (user) {
          const normalizedUser = normalizeUserForApp(user);
          setCurrentUser(normalizedUser);
          preloadRoleViews(normalizedUser.role);

          const homePath = resolveHomePath(String(normalizedUser.role));
          if (pathname === '/' || pathname === '/login' || pathname === '/register' || currentView === ViewState.SPLASH) {
            navigate(homePath, { replace: true });
          }
        } else if (!isPublicPath(pathname)) {
          navigate('/login');
        }
      } catch (e) {
        captureFrontendError(e, { domain: 'bootstrap', op: 'initSession' });
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    void init();
  }, [currentView, navigate, pathname, setCurrentUser, setIsLoading]);
};

export const useOAuthConfigWarning = (setToast: ToastSetter) => {
  useEffect(() => {
    if (APP_MODE !== 'PROD') return;
    const { ok, issues } = validateOAuthRuntimeConfig();
    if (!ok) {
      captureFrontendMessage('oauth.runtime.invalid', { domain: 'auth', op: 'oauthRuntimeValidation', issues });
      setToast({
        title: 'OAuth Google',
        message: 'Configuração de redirect inválida. Verifique domínio e URL de callback no Supabase.',
      });
    }
  }, [setToast]);
};

export const useScrollResetOnPathChange = (pathname: string) => {
  useEffect(() => {
    const container = document.getElementById('viva360-main-scroll');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
};
