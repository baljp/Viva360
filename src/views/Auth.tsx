import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { Leaf, User, Briefcase, Building, ChevronRight, Wind, Heart, Zap, Moon, Sun, ShieldCheck, Sprout, ArrowRight } from 'lucide-react';

interface AuthProps {
    onLogin: (form: any) => void;
    onRegister: (form: any) => void;
}

enum AuthStep {
    SPLASH = 0,
    WALKTHROUGH = 1, // New Step
    ROLE = 2,
    INTENT = 3,
    LOGIN = 4
}

const Auth: React.FC<AuthProps> = ({ onLogin, onRegister }) => {
    const [step, setStep] = useState<AuthStep>(AuthStep.SPLASH);
    const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.CLIENT);
    const [selectedIntents, setSelectedIntents] = useState<string[]>([]);
    const [walkthroughIndex, setWalkthroughIndex] = useState(0);

    const [isRegister, setIsRegister] = useState(false);
    const [form, setForm] = useState({ email: '', password: '', name: '' });

    // Splash Screen Timer
    useEffect(() => {
        if (step === AuthStep.SPLASH) {
            const timer = setTimeout(() => setStep(AuthStep.WALKTHROUGH), 3000);
            return () => clearTimeout(timer);
        }
    }, [step]);

    const intents = [
        { label: 'Ansiedade', icon: <Wind size={18} /> },
        { label: 'Foco', icon: <Zap size={18} /> },
        { label: 'Dores', icon: <ActivityIcon size={18} /> },
        { label: 'Sono', icon: <Moon size={18} /> },
        { label: 'Autoconhecimento', icon: <Sun size={18} /> },
        { label: 'Relacionamentos', icon: <Heart size={18} /> },
    ];

    const toggleIntent = (label: string) => {
        if (selectedIntents.includes(label)) {
            setSelectedIntents(selectedIntents.filter(i => i !== label));
        } else {
            setSelectedIntents([...selectedIntents, label]);
        }
    };

    // --- SUB-VIEWS ---

    const renderSplash = () => (
        <div className="flex flex-col items-center justify-center h-full animate-in fade-in duration-1000">
            <div className="relative">
                <div className="w-24 h-24 bg-primary-500 rounded-full flex items-center justify-center text-white shadow-2xl z-10 relative animate-pulse">
                    <Leaf size={40} />
                </div>
                {/* Breathing Rings */}
                <div className="absolute inset-0 rounded-full border-2 border-primary-200 animate-ping opacity-50" style={{ animationDuration: '3s' }}></div>
                <div className="absolute -inset-4 rounded-full border border-primary-100 animate-ping opacity-30" style={{ animationDuration: '3s', animationDelay: '0.5s' }}></div>
            </div>
            <h1 className="mt-8 text-4xl font-light text-nature-800 tracking-tight">Viva360</h1>
            <p className="text-nature-500 mt-2 text-sm tracking-widest uppercase">Conexão Holística</p>
        </div>
    );

    const renderWalkthrough = () => {
        const slides = [
            {
                title: "Conexão",
                text: "Encontre terapeutas e espaços que vibram na sua frequência.",
                icon: <Leaf size={64} className="text-primary-500" />,
                bg: "bg-primary-50"
            },
            {
                title: "Evolução",
                text: "Acompanhe seu jardim interior florescer a cada dia.",
                icon: <Sprout size={64} className="text-amber-500" />,
                bg: "bg-amber-50"
            },
            {
                title: "Segurança",
                text: "Um santuário seguro, com profissionais verificados e acolhedores.",
                icon: <ShieldCheck size={64} className="text-blue-500" />,
                bg: "bg-blue-50"
            }
        ];

        const handleNext = () => {
            if (walkthroughIndex < slides.length - 1) {
                setWalkthroughIndex(walkthroughIndex + 1);
            } else {
                setStep(AuthStep.ROLE);
            }
        };

        const slide = slides[walkthroughIndex];

        return (
            <div className="h-full flex flex-col justify-between p-8 animate-in fade-in duration-500">
                <div className="flex justify-end">
                    <button onClick={() => setStep(AuthStep.ROLE)} className="text-xs text-nature-400 font-bold uppercase tracking-wider">Pular</button>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className={`w-40 h-40 rounded-full ${slide.bg} flex items-center justify-center mb-8 animate-in zoom-in duration-500 transition-colors`}>
                        {slide.icon}
                    </div>
                    <h2 className="text-3xl font-light text-nature-800 mb-4">{slide.title}</h2>
                    <p className="text-nature-500 leading-relaxed max-w-xs">{slide.text}</p>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        {slides.map((_, i) => (
                            <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === walkthroughIndex ? 'w-8 bg-nature-800' : 'w-2 bg-nature-200'}`}></div>
                        ))}
                    </div>
                    <button onClick={handleNext} className="w-14 h-14 rounded-full bg-nature-900 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                        <ArrowRight size={24} />
                    </button>
                </div>
            </div>
        );
    };

    const renderRoleSelection = () => (
        <div className="px-6 py-10 h-full flex flex-col animate-in slide-in-from-right duration-500">
            <h2 className="text-3xl font-light text-nature-800 mb-2">Quem é <span className="font-semibold">você?</span></h2>
            <p className="text-nature-500 mb-8">Escolha como deseja se conectar.</p>

            <div className="space-y-4 flex-1">
                {[
                    { role: UserRole.CLIENT, label: 'Buscador', sub: 'Quero cuidar de mim', icon: <User size={24} /> },
                    { role: UserRole.PROFESSIONAL, label: 'Terapeuta', sub: 'Quero oferecer meus serviços', icon: <Briefcase size={24} /> },
                    { role: UserRole.SPACE, label: 'Espaço / Hub', sub: 'Gestão de clínica e salas', icon: <Building size={24} /> }
                ].map((item) => (
                    <button
                        key={item.role}
                        onClick={() => { setSelectedRole(item.role); setStep(item.role === UserRole.CLIENT ? AuthStep.INTENT : AuthStep.LOGIN); }}
                        className="w-full bg-white p-6 rounded-[2rem] border border-nature-100 shadow-sm hover:border-primary-300 hover:bg-primary-50 transition-all group text-left flex items-center gap-5"
                    >
                        <div className="w-14 h-14 rounded-full bg-nature-50 flex items-center justify-center text-nature-600 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                            {item.icon}
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-nature-800 group-hover:text-primary-800">{item.label}</h3>
                            <p className="text-sm text-nature-400 group-hover:text-primary-600">{item.sub}</p>
                        </div>
                        <ChevronRight className="ml-auto text-nature-300 group-hover:text-primary-500" />
                    </button>
                ))}
            </div>
        </div>
    );

    const renderIntent = () => (
        <div className="px-6 py-10 h-full flex flex-col animate-in slide-in-from-right duration-500">
            <h2 className="text-3xl font-light text-nature-800 mb-2">O que você <span className="font-semibold">busca?</span></h2>
            <p className="text-nature-500 mb-8">Personalizaremos sua jornada.</p>

            <div className="grid grid-cols-2 gap-4 mb-8">
                {intents.map((item) => {
                    const active = selectedIntents.includes(item.label);
                    return (
                        <button
                            key={item.label}
                            onClick={() => toggleIntent(item.label)}
                            className={`p-4 rounded-[2rem] border flex flex-col items-center justify-center gap-3 transition-all aspect-square ${active ? 'bg-primary-600 border-primary-600 text-white shadow-lg transform scale-105' : 'bg-white border-nature-100 text-nature-500 hover:border-primary-200'}`}
                        >
                            {item.icon}
                            <span className="text-sm font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </div>

            <button
                onClick={() => setStep(AuthStep.LOGIN)}
                disabled={selectedIntents.length === 0}
                className="mt-auto w-full bg-nature-900 text-white font-bold py-4 rounded-2xl hover:bg-black transition-all shadow-xl disabled:opacity-50 disabled:shadow-none"
            >
                Continuar
            </button>
        </div>
    );

    const renderLogin = () => {
        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (isRegister) {
                onRegister({ ...form, role: selectedRole });
            } else {
                onLogin(form);
            }
        };

        return (
            <div className="px-6 py-10 h-full flex flex-col justify-center animate-in slide-in-from-bottom duration-500">
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 mx-auto mb-4">
                        <Leaf size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-nature-800">{isRegister ? 'Criar Conta' : 'Acessar Conta'}</h2>
                    <p className="text-nature-500 text-sm">Acesse sua jornada como {selectedRole === UserRole.CLIENT ? 'Buscador' : 'Profissional'}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isRegister && (
                        <input
                            type="text"
                            placeholder="Seu nome completo"
                            className="w-full px-5 py-4 rounded-xl bg-white border border-nature-200 focus:outline-none focus:border-primary-500 transition-all text-nature-800"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            required
                        />
                    )}
                    <input
                        type="email"
                        placeholder="seu@email.com"
                        className="w-full px-5 py-4 rounded-xl bg-white border border-nature-200 focus:outline-none focus:border-primary-500 transition-all text-nature-800"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        required
                    />
                    <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full px-5 py-4 rounded-xl bg-white border border-nature-200 focus:outline-none focus:border-primary-500 transition-all text-nature-800"
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        required
                    />

                    <button type="submit" className="w-full bg-primary-600 text-white font-bold py-4 rounded-xl hover:bg-primary-700 transition-all shadow-lg">
                        {isRegister ? 'Cadastrar' : 'Entrar'}
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsRegister(!isRegister)}
                        className="w-full text-center text-sm text-nature-500 mt-4 hover:text-primary-600"
                    >
                        {isRegister ? 'Já tem conta? Faça login' : 'Ainda não tem conta? Cadastre-se'}
                    </button>
                </form>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-nature-50 relative overflow-hidden flex items-center justify-center">
            {/* Background Atmosphere */}
            <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[50%] bg-primary-100 rounded-full blur-[100px] opacity-40"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-calm rounded-full blur-[80px] opacity-40"></div>

            <div className="w-full max-w-md h-full min-h-[600px] md:h-auto md:bg-white/60 md:backdrop-blur-xl md:rounded-[3rem] md:shadow-2xl md:border md:border-white relative z-10 overflow-hidden">
                {step === AuthStep.SPLASH && renderSplash()}
                {step === AuthStep.WALKTHROUGH && renderWalkthrough()}
                {step === AuthStep.ROLE && renderRoleSelection()}
                {step === AuthStep.INTENT && renderIntent()}
                {step === AuthStep.LOGIN && renderLogin()}
            </div>
        </div>
    );
};

// Helper Icon for simplicity
const ActivityIcon: React.FC<{ size?: number }> = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
);

export default Auth;