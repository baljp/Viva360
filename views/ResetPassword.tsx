
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, Check, X, AlertCircle } from 'lucide-react';
import { api, request } from '../services/api';

export const ResetPasswordView: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirm) {
            setError("As senhas não coincidem.");
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            await request('/auth/reset-password', {
                method: 'POST',
                body: JSON.stringify({ token, newPassword: password })
            });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setError(err.message || "Erro ao redefinir a senha. O link pode ter expirado.");
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-[#1a211d] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center">
                    <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-nature-900 mb-2">Link Inválido</h2>
                    <p className="text-nature-600 text-sm mb-6">Não encontramos um token de recuperação válido na URL.</p>
                    <button onClick={() => navigate('/login')} className="bg-nature-900 text-white px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wider w-full">Voltar</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#1a211d] flex items-center justify-center p-4 relative overflow-hidden">
             {/* Background Effects */}
             <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 blur-[120px] rounded-full"></div>
             <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/20 blur-[120px] rounded-full"></div>

            <div className="bg-white/95 backdrop-blur-md rounded-[3rem] p-8 max-w-md w-full relative z-10 shadow-2xl animate-in fade-in zoom-in duration-500">
                <div className="w-12 h-1.5 bg-nature-200/50 rounded-full mx-auto mb-8"></div>
                
                <header className="text-center mb-8">
                    <h2 className="text-3xl font-serif italic text-nature-900 mb-2">Renovação</h2>
                    <p className="text-nature-500 text-sm">Crie sua nova chave de acesso ao santuário.</p>
                </header>

                {!success ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-nature-500 uppercase tracking-wider ml-2">Nova Senha</label>
                            <div className="bg-white p-4 rounded-2xl border border-nature-200 flex items-center gap-3 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
                                <Lock size={18} className="text-nature-400 shrink-0"/>
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-transparent outline-none text-nature-900 font-medium text-sm" 
                                    placeholder="No mínimo 6 caracteres"
                                    minLength={6}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-nature-400 p-1">
                                    {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-nature-500 uppercase tracking-wider ml-2">Confirmar Senha</label>
                            <div className="bg-white p-4 rounded-2xl border border-nature-200 flex items-center gap-3 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
                                <Lock size={18} className="text-nature-400 shrink-0"/>
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    required
                                    value={confirm}
                                    onChange={e => setConfirm(e.target.value)}
                                    className="w-full bg-transparent outline-none text-nature-900 font-medium text-sm" 
                                    placeholder="Repita a senha"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex gap-2">
                                <AlertCircle className="text-rose-500 shrink-0" size={16}/>
                                <p className="text-rose-600 text-xs font-medium">{error}</p>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-nature-900 text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all hover:bg-black disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {loading ? 'Redefinindo...' : 'Renovar Acesso'}
                        </button>
                    </form>
                ) : (
                    <div className="text-center py-8">
                         <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                            <Check size={40} />
                        </div>
                        <h3 className="text-2xl font-bold text-nature-900 mb-2">Sucesso!</h3>
                        <p className="text-nature-600 text-sm mb-8">Sua senha foi redefinida com harmonia. Você será redirecionado para o login.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
