
import React, { useState, useEffect } from 'react';
import { ViewState, User } from '../types';
import { Sparkles, ArrowRight, Mail, X, LogIn, Lock, Check, AlertCircle, FileWarning, Zap, Briefcase, Building, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import { api, request } from '../services/api';
import { supabase, isMockMode, isDemoMode } from '../lib/supabase';
// Logo import removed

interface AuthProps {
    onLogin: (user?: User) => void;
    setView: (view: ViewState) => void;
}

const OnboardingCarousel: React.FC = () => {
    const slides = [
        {
            image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1200&auto=format&fit=crop',
            subtitle: 'Sincronia',
            title: 'Uma jornada de dentro para fora.',
            text: 'Conecte-se com sua essência e encontre o equilíbrio entre corpo, mente e energia.'
        },
        {
            image: 'https://images.unsplash.com/photo-1600618528240-fb9fc964b853?q=80&w=1200&auto=format&fit=crop', 
            subtitle: 'Santuários',
            title: 'Espaços que curam e acolhem.',
            text: 'Descubra refúgios seguros e guardiões preparados para guiar sua evolução.'
        },
        {
            image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1200&auto=format&fit=crop', 
            subtitle: 'Ecos',
            title: 'A cura acontece em comunidade.',
            text: 'Troque experiências, envie boas vibrações e cresça junto com o ecossistema.'
        }
    ];

    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 6000); 
        return () => clearTimeout(timer);
    }, [currentSlide, slides.length]);

    return (
        <div className="absolute inset-0 w-full h-full bg-[#1a211d]"> 
            {slides.map((slide, index) => (
                <div key={index} className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                    <div className="absolute inset-0 overflow-hidden">
                        <img 
                            src={slide.image} 
                            crossOrigin="anonymous"
                            onError={(e) => { e.currentTarget.src = 'https://placehold.co/1200x800/1a211d/FFF?text=Viva360'; }}
                            className={`w-full h-full object-cover transition-transform duration-[10000ms] ease-out ${index === currentSlide ? 'scale-110' : 'scale-100'}`} 
                            alt="Onboarding" 
                        />
                    </div>
                    {/* Gradiente mais escuro no topo para garantir contraste do texto */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-[#1a211d] opacity-90"></div>
                    
                    {/* Texto reposicionado e aumentado */}
                    <div className="absolute top-[12%] left-0 p-8 w-full text-left z-20">
                        <div className="inline-block px-4 py-1.5 mb-5 rounded-full border border-white/30 bg-white/10 backdrop-blur-md shadow-lg">
                            <span className="text-xs font-black text-white uppercase tracking-[0.25em] drop-shadow-md">{slide.subtitle}</span>
                        </div>
                        {/* Título muito maior e mais grosso */}
                        <h2 className="text-5xl font-serif italic text-white mb-5 leading-none animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100 drop-shadow-2xl max-w-md font-bold">
                            {slide.title}
                        </h2>
                        {/* Texto de corpo maior e com peso maior */}
                        <p className="text-base text-white leading-relaxed max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200 font-bold drop-shadow-lg opacity-95">
                            {slide.text}
                        </p>
                    </div>
                </div>
            ))}

            <div className="absolute top-16 right-8 flex gap-2 z-20">
                {slides.map((_, index) => (
                    <div key={index} className="h-1.5 rounded-full bg-white/20 w-10 overflow-hidden backdrop-blur-sm">
                        <div className={`h-full bg-white transition-all duration-[6000ms] ease-linear shadow-[0_0_10px_rgba(255,255,255,0.5)] ${index === currentSlide ? 'w-full' : index < currentSlide ? 'w-full' : 'w-0'}`} />
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- FORGOT PASSWORD FORM ---
const ForgotPasswordForm: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || "Erro ao conectar com o santuário.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#f4f7f5] rounded-t-[3rem] w-full relative z-50 animate-in slide-in-from-bottom duration-300 shadow-2xl flex flex-col h-[60vh]">
            <div className="p-8">
                <div className="w-12 h-1.5 bg-nature-200 rounded-full mx-auto opacity-50 mb-6"></div>
                
                <header className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-serif italic text-nature-900">Recuperar Acesso</h3>
                    <button onClick={onBack} className="p-2 bg-nature-100 rounded-full text-nature-500 hover:bg-nature-200"><X size={20}/></button>
                </header>

                {!success ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <p className="text-nature-600 text-sm leading-relaxed">
                            Digite seu e-mail para recebermos um elo de recuperação.
                        </p>
                        <div className="space-y-2">
                             <div className="bg-white p-4 rounded-2xl border border-nature-200 flex items-center gap-3 focus-within:border-primary-500 transition-all">
                                <Mail size={18} className="text-nature-400 shrink-0"/>
                                <input 
                                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-transparent outline-none text-nature-900 font-medium text-sm" 
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>
                        {error && <p className="text-rose-500 text-xs font-bold">{error}</p>}
                        <button type="submit" disabled={loading} className="w-full bg-nature-900 text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">
                            {loading ? 'Enviando Elo...' : 'Enviar Elo de Recuperação'}
                        </button>
                    </form>
                ) : (
                    <div className="text-center space-y-4 animate-in fade-in">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check size={32} />
                        </div>
                        <h4 className="text-xl font-bold text-nature-900">Elo Enviado!</h4>
                        <p className="text-nature-600 text-sm">Verifique sua caixa de entrada (e spam) para redefinir sua harmonia.</p>
                        <button onClick={onBack} className="text-primary-600 font-bold hover:underline mt-4">Voltar ao Login</button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- LOGIN FORM COMPONENT ---
const LoginForm: React.FC<{ onBack: () => void, onSubmit: (u: User) => void }> = ({ onBack, onSubmit }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showForgot, setShowForgot] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const user = await api.auth.loginWithPassword(email, password);
            onSubmit(user);
        } catch (err: any) {
            console.error(err);
            let msg = err.message || 'Erro ao sintonizar.';
            
            // Detect specific error types
            if (msg.includes('Invalid login') || msg.includes('Invalid credentials')) {
                msg = '🔐 A harmonia falhou. Verifique seu e-mail e senha.';
            } else if (msg.includes('DNS') || msg.includes('NXDOMAIN') || msg.includes('network') || msg.includes('fetch')) {
                msg = '⚠️ Erro de conexão. Verifique sua internet e as configurações do Supabase.';
            } else if (msg.includes('not confirmed')) {
                msg = '📧 Email não confirmado. Verifique sua caixa de entrada.';
            }
            
            setError(msg);
            setLoading(false);
        }
    };

    const setDemoCredentials = (role: 'client' | 'pro' | 'space') => {
        if (role === 'client') setEmail('client0@viva360.com');
        if (role === 'pro') setEmail('pro0@viva360.com');
        if (role === 'space') setEmail('contato.hub0@viva360.com');
        setPassword('123456');
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            await api.auth.loginWithGoogle();
        } catch (err: any) {
            if (err.message !== 'REDIRECTING_TO_GOOGLE') {
               console.error(err);
               
               // Detect DNS/network errors
               if (err.message?.includes('DNS') || 
                   err.message?.includes('NXDOMAIN') || 
                   err.message?.includes('network') ||
                   err.message?.includes('fetch')) {
                   setError('⚠️ Erro de rede detectado. Verifique se as URLs de redirect estão configuradas no painel do Supabase (Authentication → URL Configuration). Desenvolvimento: http://localhost:5173');
               } else if (err.message?.includes('redirect')) {
                   setError('🔒 Erro de redirect. Certifique-se de que sua URL está autorizada no Supabase Dashboard.');
               } else {
                   setError('Falha na conexão com Google. Tente novamente ou use e-mail/senha.');
               }
               setLoading(false);
            }
        }
    };

    if (showForgot) return <ForgotPasswordForm onBack={() => setShowForgot(false)} />;

    return (
        <div className="bg-[#f4f7f5] rounded-t-[3rem] w-full relative z-50 animate-in slide-in-from-bottom duration-300 shadow-2xl flex flex-col h-[85dvh] max-h-[85dvh]">
            
            <div className="flex-none p-8 pb-4">
                <div className="w-12 h-1.5 bg-nature-200 rounded-full mx-auto opacity-50 mb-6"></div>
                
                <header className="flex justify-between items-center mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-2xl font-serif italic text-nature-900">Entrar no Fluxo</h3>
                        </div>
                        {/* Mock mode indicator removed */}
                    </div>
                    <button onClick={onBack} className="p-2 bg-nature-100 rounded-full text-nature-500 hover:bg-nature-200 active:scale-95 transition-all"><X size={20}/></button>
                </header>


                {/* Demo mode interactive section removed */}
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-12 no-scrollbar">
                <form onSubmit={handleSubmit} className="space-y-6 pt-2">
                    
                        <button 
                            type="button"
                            onClick={handleGoogleLogin}
                            className="w-full bg-white border border-nature-200 text-nature-900 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-sm active:scale-95 transition-all hover:bg-nature-50 flex items-center justify-center gap-3"
                        >
                            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                            Continuar com Google
                        </button>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-nature-100"></div>
                        <span className="flex-shrink-0 mx-4 text-nature-300 text-[10px] font-bold uppercase">Ou com e-mail</span>
                        <div className="flex-grow border-t border-nature-100"></div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-nature-500 uppercase tracking-wider ml-2">E-mail</label>
                        <div className="bg-white p-4 rounded-2xl border border-nature-200 flex items-center gap-3 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
                            <Mail size={18} className="text-nature-400 shrink-0"/>
                            <input 
                                type="email" 
                                required={true}
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-transparent outline-none text-nature-900 font-medium text-sm" 
                                placeholder="seu@email.com"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-nature-500 uppercase tracking-wider ml-2">Senha</label>
                        <div className="bg-white p-4 rounded-2xl border border-nature-200 flex items-center gap-3 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
                            <Lock size={18} className="text-nature-400 shrink-0"/>
                            <input 
                                type={showPassword ? "text" : "password"} 
                                required={true}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-transparent outline-none text-nature-900 font-medium text-sm" 
                                placeholder="••••••••"
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-nature-400 hover:text-nature-600 transition-colors p-1"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in">
                            <FileWarning size={20} className="text-rose-500 mt-0.5 shrink-0" />
                            <p className="text-rose-600 text-xs font-medium leading-relaxed">{error}</p>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-nature-900 text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all hover:bg-black disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? <span className="animate-pulse">Sintonizando...</span> : <>Entrar no Fluxo <LogIn size={16}/></>}
                    </button>
                    
                        <div className="text-center pt-2">
                            <button type="button" onClick={() => setShowForgot(true)} className="text-xs text-primary-600 font-bold hover:underline">
                                Perdeu o elo de acesso? Recuperar Harmonia
                            </button>
                        </div>
                    
                    <div className="h-12"></div>
                </form>
            </div>
        </div>
    );
};

const Auth: React.FC<AuthProps> = ({ onLogin, setView }) => {
    const [showLogin, setShowLogin] = useState(false);

    // OAuth Callback Check
    useEffect(() => {
                const checkSession = async () => {
                    const { data } = await supabase.auth.getSession();
                    if (data.session) {
                        const user = await api.auth.getCurrentSession();
                        if (user) onLogin(user);
                    }
                };
        checkSession();
    }, []);

    return (
        <div className="relative h-screen w-full bg-[#1a211d] overflow-hidden flex flex-col justify-end">
            <OnboardingCarousel />
            
            <div className="absolute top-[calc(1rem+env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-30 animate-in fade-in zoom-in duration-1000">
                {/* Logo Removed */}
            </div>
            
            <div className="relative z-30 p-8 pb-[calc(2rem+env(safe-area-inset-bottom))] w-full bg-gradient-to-t from-[#1a211d] via-[#1a211d] to-transparent pt-32">
                 <div className="flex flex-col gap-4">
                    <button 
                        onClick={() => setShowLogin(true)}
                        className="w-full bg-white text-nature-900 py-5 rounded-[2rem] font-bold uppercase tracking-widest text-xs shadow-[0_0_40px_rgba(255,255,255,0.1)] active:scale-95 transition-all hover:bg-nature-50 flex items-center justify-center gap-3"
                    >
                        Já Iniciei a Jornada <ArrowRight size={16} />
                    </button>
                    
                    <button 
                        onClick={() => setView(ViewState.REGISTER)}
                        className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white py-5 rounded-[2rem] font-bold uppercase tracking-widest text-xs hover:bg-white/20 active:scale-95 transition-all"
                    >
                        Dar o Primeiro Passo (Cadastro)
                    </button>
                </div>
                
                <p className="text-center text-[10px] text-nature-400 mt-8 opacity-60">
                    Ao entrar, você concorda com nossos Termos de Harmonia e Política de Privacidade.
                </p>
            </div>

            {showLogin && (
                <div className="absolute inset-0 z-50 flex items-end">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLogin(false)}></div>
                    <LoginForm onBack={() => setShowLogin(false)} onSubmit={onLogin} />
                </div>
            )}
        </div>
    );
};

export default Auth;
