
import React, { useState, useEffect } from 'react';
import { ViewState, User } from '../types';
import { Sparkles, ArrowRight, Mail, X, LogIn, Lock, Check } from 'lucide-react';
import { api } from '../services/api';

interface AuthProps {
    onLogin: (user?: User) => void;
    setView: (view: ViewState) => void;
}

const OnboardingCarousel: React.FC = () => {
    const slides = [
        {
            image: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?q=80&w=1920&auto=format&fit=crop', // Nature meditation
            subtitle: 'Sincronia',
            title: 'Uma jornada de dentro para fora.',
            text: 'Conecte-se com sua essência e encontre o equilíbrio entre corpo, mente e energia.'
        },
        {
            image: 'https://images.unsplash.com/photo-1528756514091-e85694a8d0e5?q=80&w=1920&auto=format&fit=crop', // Temple/Space
            subtitle: 'Santuários',
            title: 'Espaços que curam e acolhem.',
            text: 'Descubra refúgios seguros e guardiões preparados para guiar sua evolução.'
        },
        {
            image: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=1920&auto=format&fit=crop', // Community
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
                            className={`w-full h-full object-cover transition-transform duration-[10000ms] ease-out ${index === currentSlide ? 'scale-110' : 'scale-100'}`} 
                            alt="Onboarding" 
                        />
                    </div>
                    {/* Gradiente mais forte na base para garantir leitura do texto */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a211d] via-[#1a211d]/40 to-transparent opacity-90"></div>
                    
                    <div className="absolute bottom-32 left-0 p-8 w-full text-left z-20">
                        <div className="inline-block px-3 py-1 mb-4 rounded-full border border-white/20 bg-white/10 backdrop-blur-md">
                            <span className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">{slide.subtitle}</span>
                        </div>
                        <h2 className="text-4xl font-serif italic text-white mb-4 leading-tight animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100 drop-shadow-lg">
                            {slide.title}
                        </h2>
                        <p className="text-sm text-nature-100 leading-relaxed max-w-xs animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200 opacity-90">
                            {slide.text}
                        </p>
                    </div>
                </div>
            ))}

            <div className="absolute top-28 right-8 flex gap-2 z-20">
                {slides.map((_, index) => (
                    <div key={index} className="h-1 rounded-full bg-white/20 w-8 overflow-hidden">
                        <div className={`h-full bg-white transition-all duration-[6000ms] ease-linear ${index === currentSlide ? 'w-full' : index < currentSlide ? 'w-full' : 'w-0'}`} />
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- LOGIN FORM COMPONENT ---
const LoginForm: React.FC<{ onBack: () => void, onSubmit: (u: User) => void }> = ({ onBack, onSubmit }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // Em uma app real validaria a senha. Aqui, focamos no email para achar o user do seed/memória
            const user = await api.auth.loginByEmail(email);
            onSubmit(user);
        } catch (err) {
            setError('E-mail não encontrado no ecossistema.');
            setLoading(false);
        }
    };

    // Atalhos para testar
    const fillMock = (type: 'client' | 'pro' | 'space') => {
        if (type === 'client') setEmail('client0@viva360.com');
        if (type === 'pro') setEmail('pro0@viva360.com');
        if (type === 'space') setEmail('contato.hub0@viva360.com');
        setPassword('123456');
    };

    return (
        <div className="bg-[#f4f7f5] rounded-t-[3rem] p-8 w-full relative z-50 animate-in slide-in-from-bottom duration-300 shadow-2xl flex flex-col gap-6 pb-12 h-[85vh] overflow-y-auto no-scrollbar">
            <div className="w-12 h-1.5 bg-nature-200 rounded-full mx-auto opacity-50 flex-none"></div>
            
            <header className="flex justify-between items-center">
                <h3 className="text-2xl font-serif italic text-nature-900">Login</h3>
                <button onClick={onBack} className="p-2 bg-nature-100 rounded-full text-nature-500 hover:bg-nature-200"><X size={20}/></button>
            </header>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                <div className="space-y-2">
                    <label className="text-xs font-bold text-nature-500 uppercase tracking-wider ml-2">Senha</label>
                    <div className="bg-white p-4 rounded-2xl border border-nature-200 flex items-center gap-3 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
                        <Lock size={18} className="text-nature-400"/>
                        <input 
                            type="password" 
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-transparent outline-none text-nature-900 font-medium" 
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                {error && <p className="text-rose-500 text-xs font-medium text-center bg-rose-50 p-3 rounded-xl">{error}</p>}

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-nature-900 text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-black mt-4 disabled:opacity-70"
                >
                    {loading ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span> : <LogIn size={16} />}
                    Entrar no Fluxo
                </button>
            </form>

            <div className="mt-4 pt-6 border-t border-nature-200">
                <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest text-center mb-4">Atalhos de Desenvolvedor</p>
                <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => fillMock('client')} className="p-2 bg-white border border-nature-200 rounded-xl text-[10px] font-bold text-nature-600 hover:bg-primary-50 hover:border-primary-200 transition-colors">Buscador</button>
                    <button onClick={() => fillMock('pro')} className="p-2 bg-white border border-nature-200 rounded-xl text-[10px] font-bold text-nature-600 hover:bg-amber-50 hover:border-amber-200 transition-colors">Guardião</button>
                    <button onClick={() => fillMock('space')} className="p-2 bg-white border border-nature-200 rounded-xl text-[10px] font-bold text-nature-600 hover:bg-indigo-50 hover:border-indigo-200 transition-colors">Santuário</button>
                </div>
            </div>
        </div>
    );
};

const Auth: React.FC<AuthProps> = ({ onLogin, setView }) => {
    const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [showLoginForm, setShowLoginForm] = useState(false);

    const handleGoogleLogin = async () => {
        setIsLoadingGoogle(true);
        try {
            // Login rápido padrão (Client)
            const user = await api.auth.loginWithGoogle();
            onLogin(user);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingGoogle(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#1a211d] relative overflow-hidden">
            {/* Header Fixo */}
            <header className="absolute top-0 left-0 w-full p-8 z-30 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center text-white font-serif italic text-xl shadow-lg">V</div>
                     <span className="font-serif italic font-bold text-xl tracking-tight text-white drop-shadow-md">Viva360</span>
                </div>
            </header>
            
            <OnboardingCarousel />
            
            {/* --- STATE 1: LANDING --- */}
            <div className={`absolute bottom-0 left-0 w-full z-20 p-6 pb-12 transition-transform duration-500 ${showOptions ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
                 <button 
                    onClick={() => setShowOptions(true)} 
                    className="w-full bg-[#f4f7f5] text-[#1a211d] py-5 rounded-[2rem] font-bold uppercase tracking-widest text-xs shadow-[0_20px_50px_rgba(0,0,0,0.5)] active:scale-95 transition-all flex items-center justify-between px-8 group hover:bg-white border border-white/10"
                >
                    <span>Entrar no Viva360</span>
                    <div className="w-10 h-10 rounded-full bg-[#1a211d] text-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
                        <ArrowRight size={16} />
                    </div>
                </button>
            </div>

            {/* --- STATE 2: OPTIONS OVERLAY --- */}
            {showOptions && !showLoginForm && (
                <div className="absolute inset-0 z-40 flex flex-col justify-end">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowOptions(false)}></div>
                    
                    <div className="bg-[#f4f7f5] rounded-t-[3rem] p-8 w-full relative z-50 animate-in slide-in-from-bottom duration-300 shadow-2xl flex flex-col gap-4 pb-12 max-h-[85vh] overflow-y-auto no-scrollbar">
                        
                        <div className="w-12 h-1.5 bg-nature-200 rounded-full mx-auto mb-4 opacity-50 flex-none"></div>
                        
                        <div className="flex justify-between items-center mb-2 flex-none">
                            <h3 className="text-2xl font-serif italic text-nature-900">Acesse sua conta</h3>
                            <button onClick={() => setShowOptions(false)} className="p-2 bg-nature-100 rounded-full text-nature-500 hover:bg-nature-200"><X size={20}/></button>
                        </div>
                        <p className="text-xs text-nature-500 mb-4 flex-none">Escolha como deseja se conectar ao ecossistema.</p>

                        {/* 1. Google (Buscador Rápido) */}
                        <button 
                            onClick={handleGoogleLogin} 
                            disabled={isLoadingGoogle}
                            className="w-full bg-white text-nature-900 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-md border border-nature-100 active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-gray-50 disabled:opacity-70 disabled:cursor-not-allowed shrink-0"
                        >
                            {isLoadingGoogle ? (
                                <span className="w-4 h-4 border-2 border-nature-900 border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                            )}
                            Continuar com Google
                        </button>

                        {/* 2. Login Clássico (Abre formulário) */}
                        <button 
                            onClick={() => setShowLoginForm(true)} 
                            className="w-full bg-nature-900 text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-black shrink-0"
                        >
                            <Mail size={16} />
                            Entrar com E-mail
                        </button>

                        <div className="flex items-center gap-4 text-nature-300 text-[10px] font-bold uppercase tracking-widest my-1 flex-none">
                            <div className="h-px bg-nature-200 flex-1"></div>
                            <span>Novo por aqui?</span>
                            <div className="h-px bg-nature-200 flex-1"></div>
                        </div>

                        {/* 3. Cadastro */}
                        <button 
                            onClick={() => setView(ViewState.REGISTER)} 
                            className="w-full bg-transparent border-2 border-nature-200 text-nature-600 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs active:scale-95 transition-all hover:bg-nature-50 hover:border-nature-300 flex items-center justify-center gap-2 shrink-0"
                        >
                            <Sparkles size={16} className="text-primary-500" />
                            Criar Nova Conta
                        </button>
                    </div>
                </div>
            )}

            {/* --- STATE 3: LOGIN FORM --- */}
            {showLoginForm && (
                <div className="absolute inset-0 z-50 flex flex-col justify-end">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLoginForm(false)}></div>
                    <LoginForm onBack={() => setShowLoginForm(false)} onSubmit={onLogin} />
                </div>
            )}
        </div>
    );
};

export default Auth;
