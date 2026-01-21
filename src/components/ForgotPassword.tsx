import React, { useState } from 'react';
import { Mail, Lock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface ForgotPasswordProps {
  onBack: () => void;
}

type Step = 'email' | 'code' | 'success';

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack }) => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        setStep('code');
      } else {
        const data = await response.json();
        setError(data.message || 'Erro ao enviar código');
      }
    } catch (err) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: code, newPassword }),
      });
      
      if (response.ok) {
        setStep('success');
      } else {
        const data = await response.json();
        setError(data.message || 'Erro ao redefinir senha');
      }
    } catch (err) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f4f7f5] rounded-t-[3rem] p-8 w-full relative z-50 animate-in slide-in-from-bottom duration-300 shadow-2xl flex flex-col gap-6 pb-12 h-[85vh] overflow-y-auto no-scrollbar">
      <div className="w-12 h-1.5 bg-nature-200 rounded-full mx-auto opacity-50 flex-none"></div>
      
      {step === 'email' && (
        <>
          <header className="flex justify-between items-center">
            <h3 className="text-2xl font-serif italic text-nature-900">Recuperar Senha</h3>
            <button onClick={onBack} className="p-2 bg-nature-100 rounded-full text-nature-500 hover:bg-nature-200">
              <ArrowLeft size={20}/>
            </button>
          </header>
          
          <p className="text-sm text-nature-500">Digite seu email para receber um código de recuperação.</p>
          
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-nature-500 uppercase tracking-wider ml-2">E-mail</label>
              <div className="bg-white p-4 rounded-2xl border border-nature-200 flex items-center gap-3 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
                <Mail size={18} className="text-nature-400"/>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-transparent outline-none text-nature-900 font-medium" 
                  placeholder="seu@email.com"
                />
              </div>
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-rose-500 text-xs font-medium bg-rose-50 p-3 rounded-xl">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-nature-900 text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-black mt-4 disabled:opacity-70"
            >
              {loading ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span> : null}
              Enviar Código
            </button>
          </form>
        </>
      )}
      
      {step === 'code' && (
        <>
          <header className="flex justify-between items-center">
            <h3 className="text-2xl font-serif italic text-nature-900">Nova Senha</h3>
            <button onClick={() => setStep('email')} className="p-2 bg-nature-100 rounded-full text-nature-500 hover:bg-nature-200">
              <ArrowLeft size={20}/>
            </button>
          </header>
          
          <p className="text-sm text-nature-500">Digite o código recebido por email e sua nova senha.</p>
          
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-nature-500 uppercase tracking-wider ml-2">Código</label>
              <div className="bg-white p-4 rounded-2xl border border-nature-200 flex items-center gap-3 focus-within:border-primary-500">
                <input 
                  type="text" 
                  required
                  maxLength={6}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-transparent outline-none text-nature-900 font-bold text-center text-xl tracking-[0.5em]" 
                  placeholder="000000"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-nature-500 uppercase tracking-wider ml-2">Nova Senha</label>
              <div className="bg-white p-4 rounded-2xl border border-nature-200 flex items-center gap-3 focus-within:border-primary-500">
                <Lock size={18} className="text-nature-400"/>
                <input 
                  type="password" 
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-transparent outline-none text-nature-900 font-medium" 
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-nature-500 uppercase tracking-wider ml-2">Confirmar Senha</label>
              <div className="bg-white p-4 rounded-2xl border border-nature-200 flex items-center gap-3 focus-within:border-primary-500">
                <Lock size={18} className="text-nature-400"/>
                <input 
                  type="password" 
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-transparent outline-none text-nature-900 font-medium" 
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-rose-500 text-xs font-medium bg-rose-50 p-3 rounded-xl">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-nature-900 text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-black mt-4 disabled:opacity-70"
            >
              {loading ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span> : null}
              Redefinir Senha
            </button>
          </form>
        </>
      )}
      
      {step === 'success' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
            <CheckCircle size={40} />
          </div>
          <h3 className="text-2xl font-serif italic text-nature-900">Senha Alterada!</h3>
          <p className="text-sm text-nature-500">Sua senha foi redefinida com sucesso. Agora você pode fazer login com sua nova senha.</p>
          <button 
            onClick={onBack}
            className="w-full bg-nature-900 text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all"
          >
            Voltar para Login
          </button>
        </div>
      )}
    </div>
  );
};

export default ForgotPassword;
