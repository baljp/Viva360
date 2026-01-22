
import React, { useState } from 'react';
import { ViewState, UserRole, User, Professional } from '../types';
import { User as UserIcon, Briefcase, Building, ChevronRight, ArrowLeft, Mail, Lock, Sparkles, Heart, Activity, Brain, MapPin, DollarSign, List, Home, Check, Leaf } from 'lucide-react';
import { api } from '../services/api';

interface RegistrationProps {
    view: ViewState;
    setView: (view: ViewState) => void;
    onRegister: (userData: Partial<User | Professional>) => void;
}

// --- Componentes de UI Auxiliares ---
const InputField: React.FC<any> = ({ icon, ...props }) => (
    <div className="relative group">
        <div className="absolute top-1/2 -translate-y-1/2 left-5 text-nature-400 group-focus-within:text-primary-600 transition-colors">{icon}</div>
        <input {...props} className="w-full bg-white border border-nature-100 py-4 pl-14 pr-5 rounded-2xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none shadow-sm transition-all placeholder:text-nature-300" />
    </div>
);

const GoogleButton: React.FC<{ onClick: () => void, label?: string }> = ({ onClick, label = "Usar conta Google" }) => (
    <button onClick={onClick} className="w-full bg-white border border-nature-200 py-4 rounded-2xl font-bold text-nature-700 text-xs uppercase tracking-widest shadow-sm hover:bg-nature-50 active:scale-95 transition-all flex items-center justify-center gap-3">
        <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        {label}
    </button>
);

const Divider: React.FC = () => (
    <div className="flex items-center gap-4 my-2">
        <div className="h-px bg-nature-100 flex-1"></div>
        <span className="text-[10px] uppercase font-bold text-nature-300 tracking-widest">Ou preencha</span>
        <div className="h-px bg-nature-100 flex-1"></div>
    </div>
);

const CheckboxGroup: React.FC<{ options: string[], selected: string[], onChange: (val: string) => void, title: string }> = ({ options, selected, onChange, title }) => (
    <div className="space-y-4">
        <h4 className="font-bold text-nature-900 text-xs uppercase tracking-widest px-1 flex items-center gap-2"><Sparkles size={12} className="text-primary-500"/> {title}</h4>
        <div className="flex flex-wrap gap-2">
            {options.map(opt => {
                const isSelected = selected.includes(opt);
                return (
                    <button key={opt} onClick={() => onChange(opt)} className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all border shadow-sm ${isSelected ? 'bg-primary-900 text-white border-primary-900 translate-y-[-1px]' : 'bg-white text-nature-600 border-nature-100 hover:border-primary-200'}`}>
                        {opt}
                    </button>
                )
            })}
        </div>
    </div>
);

const RadioGroup: React.FC<{ options: string[], selected: string, onChange: (val: string) => void, title: string }> = ({ options, selected, onChange, title }) => (
    <div className="space-y-4">
        <h4 className="font-bold text-nature-900 text-xs uppercase tracking-widest px-1">{title}</h4>
        <div className="grid grid-cols-1 gap-3">
             {options.map(opt => {
                const isSelected = selected === opt;
                return (
                    <button key={opt} onClick={() => onChange(opt)} className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between shadow-sm ${isSelected ? 'bg-primary-50 border-primary-500 ring-1 ring-primary-500' : 'bg-white border-nature-100 hover:border-primary-200'}`}>
                       <span className={`font-medium text-sm ${isSelected ? 'text-primary-900' : 'text-nature-600'}`}>{opt}</span>
                       {isSelected && <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center"><Check size={12} className="text-white" /></div>}
                    </button>
                )
            })}
        </div>
    </div>
);

// --- Formulários ---
const ClientForm: React.FC<any> = ({ setView, onRegister }) => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', goals: [], therapyPreferences: '' });
    const handleRegister = () => onRegister({ ...formData, role: UserRole.CLIENT });
    const handleGoogleRegister = async () => {
        const googleUser = await api.auth.loginWithGoogle(UserRole.CLIENT);
        onRegister(googleUser);
    };
    
    const handleGoalChange = (goal: string) => {
        setFormData(prev => ({ ...prev, goals: prev.goals.includes(goal) ? prev.goals.filter(g => g !== goal) : [...prev.goals, goal] }));
    };

    return (
        <div className="min-h-full animate-in slide-in-from-right duration-500 pb-24 pt-4 px-6 bg-nature-50 selection:bg-primary-500 selection:text-white">
            <header className="flex items-center gap-4 mb-8">
                <button onClick={() => setView(ViewState.REGISTER)} className="p-3 bg-white rounded-full shadow-lg shadow-nature-900/5 border border-nature-100 hover:scale-105 transition-transform"><ArrowLeft size={20} className="text-nature-600" /></button>
                <div><h2 className="text-2xl font-serif italic font-medium text-nature-900">Sou Buscador</h2><p className="text-xs text-nature-500 font-medium tracking-wide">Inicie sua jornada de cura</p></div>
            </header>
            <div className="space-y-6">
                <div className="bg-nature-50/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/60 shadow-xl shadow-nature-900/5 space-y-4">
                     <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-1">Credenciais</p>
                    <GoogleButton onClick={handleGoogleRegister} />
                    <Divider />
                    <InputField icon={<UserIcon size={18}/>} type="text" placeholder="Nome Completo" value={formData.name} onChange={(e:any) => setFormData(p => ({...p, name: e.target.value}))} />
                    <InputField icon={<Mail size={18}/>} type="email" placeholder="Seu melhor e-mail" value={formData.email} onChange={(e:any) => setFormData(p => ({...p, email: e.target.value}))} />
                    <InputField icon={<Lock size={18}/>} type="password" placeholder="Crie uma senha segura" value={formData.password} onChange={(e:any) => setFormData(p => ({...p, password: e.target.value}))} />
                </div>
                
                <div className="bg-nature-50/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/60 shadow-xl shadow-nature-900/5 space-y-6">
                    <CheckboxGroup title="O que você busca curar?" options={['Reduzir estresse', 'Aliviar dores', 'Clareza mental', 'Mais energia', 'Autoconhecimento']} selected={formData.goals} onChange={handleGoalChange} />
                    <RadioGroup title="Abordagem preferida" options={['Corporal (Massagem, Yoga)', 'Energética (Reiki, Barras)', 'Mental (Terapia, Meditação)']} selected={formData.therapyPreferences} onChange={val => setFormData(p => ({...p, therapyPreferences: val}))} />
                </div>

                <button onClick={handleRegister} className="w-full bg-nature-900 text-white py-5 rounded-full font-medium tracking-widest text-xs shadow-xl shadow-nature-900/20 active:scale-95 transition-all hover:bg-nature-800 uppercase">Criar Perfil</button>
            </div>
        </div>
    );
};

const ProForm: React.FC<any> = ({ setView, onRegister }) => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', specialty: [], pricePerSession: 150, location: '', bio: '', approach: '' });
    const handleRegister = () => onRegister({ ...formData, role: UserRole.PROFESSIONAL, rating: 5, swapCredits: 100, isAvailableForSwap: true, needs: [], offers: [] });
    const handleGoogleRegister = async () => {
        const googleUser = await api.auth.loginWithGoogle(UserRole.PROFESSIONAL);
        onRegister(googleUser);
    };

    return (
         <div className="min-h-full animate-in slide-in-from-right duration-500 pb-24 pt-4 px-6 bg-nature-50 selection:bg-primary-500 selection:text-white">
            <header className="flex items-center gap-4 mb-8">
                <button onClick={() => setView(ViewState.REGISTER)} className="p-3 bg-white rounded-full shadow-lg shadow-nature-900/5 border border-nature-100 hover:scale-105 transition-transform"><ArrowLeft size={20} className="text-nature-600" /></button>
                <div><h2 className="text-2xl font-serif italic font-medium text-nature-900">Sou Guardião</h2><p className="text-xs text-nature-500 font-medium tracking-wide">Ofereça seus dons ao mundo</p></div>
            </header>
            <div className="space-y-6">
                 <div className="bg-nature-50/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/60 shadow-xl shadow-nature-900/5 space-y-4">
                    <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-1">Dados Profissionais</p>
                    <GoogleButton onClick={handleGoogleRegister} />
                    <Divider />
                    <InputField icon={<UserIcon size={18}/>} type="text" placeholder="Nome Profissional" value={formData.name} onChange={(e:any) => setFormData(p => ({...p, name: e.target.value}))} />
                    <InputField icon={<Mail size={18}/>} type="email" placeholder="E-mail de Contato" value={formData.email} onChange={(e:any) => setFormData(p => ({...p, email: e.target.value}))} />
                    <InputField icon={<Lock size={18}/>} type="password" placeholder="Senha de Acesso" value={formData.password} onChange={(e:any) => setFormData(p => ({...p, password: e.target.value}))} />
                </div>

                <div className="bg-nature-50/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/60 shadow-xl shadow-nature-900/5 space-y-6">
                    <InputField icon={<Sparkles size={18}/>} type="text" placeholder="Especialidades (Ex: Reiki, Yoga)" onChange={(e:any) => setFormData(p => ({...p, specialty: e.target.value.split(',')}))} />
                    <InputField icon={<MapPin size={18}/>} type="text" placeholder="Bairro de Atendimento" value={formData.location} onChange={(e:any) => setFormData(p => ({...p, location: e.target.value}))} />
                    <RadioGroup title="Sua abordagem principal" options={['Corporal', 'Energética', 'Mental/Emocional']} selected={formData.approach} onChange={val => setFormData(p => ({...p, approach: val}))} />
                </div>
                
                <button onClick={handleRegister} className="w-full bg-primary-600 text-white py-5 rounded-full font-medium tracking-widest text-xs shadow-xl shadow-primary-600/20 active:scale-95 transition-all hover:bg-primary-500 uppercase">Finalizar Cadastro</button>
            </div>
        </div>
    );
};

const SpaceForm: React.FC<any> = ({ setView, onRegister }) => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', address: '' });
    const handleRegister = () => onRegister({ ...formData, role: UserRole.SPACE });
    const handleGoogleRegister = async () => {
        const googleUser = await api.auth.loginWithGoogle(UserRole.SPACE);
        onRegister(googleUser);
    };

     return (
         <div className="min-h-full animate-in slide-in-from-right duration-500 pb-24 pt-4 px-6 bg-nature-50 selection:bg-primary-500 selection:text-white">
            <header className="flex items-center gap-4 mb-8">
                <button onClick={() => setView(ViewState.REGISTER)} className="p-3 bg-white rounded-full shadow-lg shadow-nature-900/5 border border-nature-100 hover:scale-105 transition-transform"><ArrowLeft size={20} className="text-nature-600" /></button>
                <div><h2 className="text-2xl font-serif italic font-medium text-nature-900">Sou Santuário</h2><p className="text-xs text-nature-500 font-medium tracking-wide">Cadastre seu espaço de cura</p></div>
            </header>
             <div className="space-y-6">
                <div className="bg-nature-50/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/60 shadow-xl shadow-nature-900/5 space-y-4">
                    <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-1">Gestão do Hub</p>
                    <GoogleButton onClick={handleGoogleRegister} />
                    <Divider />
                    <InputField icon={<Home size={18}/>} type="text" placeholder="Nome do Espaço" value={formData.name} onChange={(e:any) => setFormData(p => ({...p, name: e.target.value}))} />
                    <InputField icon={<Mail size={18}/>} type="email" placeholder="E-mail Administrativo" value={formData.email} onChange={(e:any) => setFormData(p => ({...p, email: e.target.value}))} />
                    <InputField icon={<Lock size={18}/>} type="password" placeholder="Senha Mestra" value={formData.password} onChange={(e:any) => setFormData(p => ({...p, password: e.target.value}))} />
                </div>
                <div className="bg-nature-50/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/60 shadow-xl shadow-nature-900/5 space-y-4">
                     <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-1">Localização</p>
                    <InputField icon={<MapPin size={18}/>} type="text" placeholder="Endereço Completo" value={formData.address} onChange={(e:any) => setFormData(p => ({...p, address: e.target.value}))} />
                </div>

                 <button onClick={handleRegister} className="w-full bg-nature-800 text-white py-5 rounded-full font-medium tracking-widest text-xs shadow-xl shadow-nature-900/20 active:scale-95 transition-all hover:bg-nature-700 uppercase">Cadastrar Santuário</button>
            </div>
        </div>
    );
};


// --- Tela de Seleção de Perfil ---
export const RegistrationViews: React.FC<RegistrationProps> = ({ view, setView, onRegister }) => {
    
    const renderRoleSelection = () => (
        <div className="min-h-full flex flex-col bg-nature-50/50 animate-in fade-in duration-500">
            <header className="px-8 pt-12 pb-6 flex-none">
                 <button onClick={() => setView(ViewState.LOGIN)} className="p-3 bg-white rounded-full shadow-lg shadow-nature-900/5 border border-nature-100 mb-8 hover:scale-105 transition-transform"><ArrowLeft size={20} className="text-nature-600" /></button>
                 <h1 className="text-4xl font-serif font-medium text-nature-900 leading-tight tracking-wide">Escolha sua<br/><span className="text-primary-600 italic">Frequência</span></h1>
                 <p className="text-nature-500 text-sm mt-3 tracking-wide">Como você deseja interagir com o ecossistema Viva360?</p>
            </header>
            
             <div className="flex-1 px-6 pb-12 space-y-4">
                {/* Card Buscador */}
                <button 
                    onClick={() => setView(ViewState.REGISTER_CLIENT)} 
                    className="w-full bg-white p-6 rounded-[2rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl hover:shadow-primary-500/10 transition-all group relative overflow-hidden text-left hover:border-primary-200"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-bl-[100px] transition-transform group-hover:scale-150 duration-700"></div>
                    <div className="relative z-10 flex gap-5 items-start">
                        <div className="w-14 h-14 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform">
                            <Leaf size={28} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-nature-900 group-hover:text-primary-700 transition-colors">Sou Buscador</h3>
                            <p className="text-xs text-nature-500 mt-1 leading-relaxed pr-4 font-medium">Desejo encontrar terapias, produtos e rituais para meu bem-estar.</p>
                        </div>
                    </div>
                </button>

                {/* Card Profissional */}
                <button 
                    onClick={() => setView(ViewState.REGISTER_PRO)} 
                    className="w-full bg-white p-6 rounded-[2rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl hover:shadow-amber-500/10 transition-all group relative overflow-hidden text-left hover:border-amber-200"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-[100px] transition-transform group-hover:scale-150 duration-700"></div>
                    <div className="relative z-10 flex gap-5 items-start">
                        <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform">
                            <Briefcase size={28} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-nature-900 group-hover:text-amber-700 transition-colors">Sou Guardião</h3>
                            <p className="text-xs text-nature-500 mt-1 leading-relaxed pr-4 font-medium">Sou terapeuta ou facilitador e quero oferecer meus serviços.</p>
                        </div>
                    </div>
                </button>

                {/* Card Santuário */}
                <button 
                    onClick={() => setView(ViewState.REGISTER_SPACE)} 
                    className="w-full bg-white p-6 rounded-[2rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl hover:shadow-indigo-500/10 transition-all group relative overflow-hidden text-left hover:border-indigo-200"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[100px] transition-transform group-hover:scale-150 duration-700"></div>
                    <div className="relative z-10 flex gap-5 items-start">
                        <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform">
                            <Building size={28} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-nature-900 group-hover:text-indigo-700 transition-colors">Sou Santuário</h3>
                            <p className="text-xs text-nature-500 mt-1 leading-relaxed pr-4 font-medium">Gerencio um espaço físico e quero conectar minha equipe.</p>
                        </div>
                    </div>
                </button>
            </div>
        </div>
    );

    switch (view) {
        case ViewState.REGISTER_CLIENT: return <ClientForm setView={setView} onRegister={onRegister} />;
        case ViewState.REGISTER_PRO: return <ProForm setView={setView} onRegister={onRegister} />;
        case ViewState.REGISTER_SPACE: return <SpaceForm setView={setView} onRegister={onRegister} />;
        default: return renderRoleSelection();
    }
};
