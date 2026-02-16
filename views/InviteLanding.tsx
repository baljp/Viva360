import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, LogIn, UserPlus, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

type InviteMeta = {
  ok?: boolean;
  kind?: 'tribo' | 'guardian' | 'space';
  targetRole?: 'CLIENT' | 'PROFESSIONAL' | 'SPACE';
  inviter?: { id: string; name: string; avatar?: string; role?: string } | null;
  contextRef?: string | null;
};

const PENDING_TOKEN_KEY = 'viva360.pendingInviteToken';
const PENDING_DEST_KEY = 'viva360.pendingInviteDestination';

function extractToken(location: ReturnType<typeof useLocation>): string | null {
  const path = String(location.pathname || '');
  const idx = path.indexOf('/invite/');
  if (idx >= 0) {
    const raw = path.slice(idx + '/invite/'.length);
    const token = decodeURIComponent(raw.split('/')[0] || '').trim();
    if (token) return token;
  }
  const params = new URLSearchParams(location.search || '');
  const q = params.get('token');
  return q ? String(q).trim() : null;
}

function defaultRegisterPath(targetRole?: InviteMeta['targetRole']): string {
  if (targetRole === 'PROFESSIONAL') return '/register/pro';
  if (targetRole === 'SPACE') return '/register/space';
  return '/register/client';
}

function defaultDestination(kind?: InviteMeta['kind']): string {
  if (kind === 'space') return '/pro/home';
  return '/client/tribe';
}

export default function InviteLanding() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = useMemo(() => extractToken(location), [location.pathname, location.search]);

  const [meta, setMeta] = useState<InviteMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!token) {
        setError('Convite inválido.');
        setLoading(false);
        return;
      }
      try {
        const resolved = (await api.invites.resolve(token)) as InviteMeta;
        if (!mounted) return;
        setMeta(resolved);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Não foi possível validar este convite.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [token]);

  const savePending = () => {
    if (!token) return;
    try {
      localStorage.setItem(PENDING_TOKEN_KEY, token);
      localStorage.setItem(PENDING_DEST_KEY, defaultDestination(meta?.kind));
    } catch {
      // ignore
    }
  };

  const handleLogin = async () => {
    savePending();
    navigate('/login');
  };

  const handleRegister = async () => {
    savePending();
    navigate(defaultRegisterPath(meta?.targetRole));
  };

  const handleAcceptIfLoggedIn = async () => {
    if (!token) return;
    try {
      const user = await api.auth.getCurrentSession();
      if (!user) return;
      await api.invites.accept(token);
      try {
        localStorage.removeItem(PENDING_TOKEN_KEY);
        localStorage.removeItem(PENDING_DEST_KEY);
      } catch {
        // ignore
      }
      navigate(defaultDestination(meta?.kind), { replace: true });
    } catch {
      // ignore, user can continue via login/register
    }
  };

  useEffect(() => {
    handleAcceptIfLoggedIn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen bg-[#f8faf9] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[2.5rem] border border-nature-100 shadow-elegant p-8 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-200/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-200/30 rounded-full blur-3xl" />

          <div className="relative space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-nature-900 text-white flex items-center justify-center shadow-xl">
              <Sparkles size={22} />
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-nature-400">Convite Viva360</p>
              <h1 className="text-3xl font-serif italic text-nature-900 leading-tight">
                {loading ? 'Validando chamado...' : error ? 'Chamado indisponível' : 'Você foi convidado.'}
              </h1>
              {!loading && !error && (
                <p className="text-sm text-nature-500 leading-relaxed">
                  {meta?.inviter?.name ? (
                    <>Um chamado de <span className="font-semibold text-nature-800">{meta.inviter.name}</span> está te aguardando. Entre ou crie sua conta para se vincular automaticamente.</>
                  ) : (
                    <>Entre ou crie sua conta para concluir o vínculo automaticamente.</>
                  )}
                </p>
              )}
              {!loading && error && (
                <p className="text-sm text-rose-600 flex items-start gap-2">
                  <AlertTriangle size={16} className="mt-0.5" />
                  <span>{error}</span>
                </p>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={handleLogin}
                disabled={!token || !!error}
                className="w-full py-4 bg-nature-900 text-white rounded-[1.75rem] font-bold uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-60"
              >
                <LogIn size={18} /> Entrar <ArrowRight size={18} />
              </button>
              <button
                onClick={handleRegister}
                disabled={!token || !!error}
                className="w-full py-4 bg-white border border-nature-200 text-nature-900 rounded-[1.75rem] font-bold uppercase tracking-widest text-[10px] shadow-sm active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-60"
              >
                <UserPlus size={18} /> Criar conta
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-nature-400 uppercase tracking-widest font-bold mt-6">
          Ao entrar, o vínculo é concluído automaticamente.
        </p>
      </div>
    </div>
  );
}

