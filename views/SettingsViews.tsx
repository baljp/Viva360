
import React, { useState, useRef } from 'react';
import { ViewState, User, UserRole, Professional } from '../types';
import { 
    ChevronLeft, ShieldCheck, User as UserIcon, Camera, ChevronRight, 
    Heart, Sparkles, Lock, Bell, LogOut, Check, Mail, MapPin, 
    Briefcase, Smartphone, Sun, DoorOpen, DollarSign, List, Activity,
    Building, CreditCard, Wallet, Shield, MessageSquare, Megaphone, Smartphone as PhoneIcon,
    Users, Eye, EyeOff, Globe, ShoppingBag, History, ArrowUpRight, ArrowDownRight, Save
} from 'lucide-react';
import { DynamicAvatar, ZenToast, Card, VerifiedBadge, WalletSplit } from '../components/Common';
import { api } from '../services/api';

interface SettingsProps { 
    user: User; 
    view: ViewState; 
    setView: (v: ViewState) => void; 
    updateUser: (u: User) => void;
    onLogout?: () => void;
}

// Layout Flexível para as telas de configuração
const SettingsLayout: React.FC<{ title: string, onBack: () => void, children: React.ReactNode }> = ({ title, onBack, children }) => (
    <div className="fixed inset-0 z-[200] flex flex-col bg-nature-50 animate-in slide-in-from-right duration-300 w-full h-full">
        <header className="flex-none flex items-center gap-4 px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-4 bg-white border-b border-nature-100 shadow-sm z-50">
            <button onClick={onBack} className="p-3 bg-nature-50 rounded-2xl text-nature-600 active:scale-90 transition-all shadow-sm"><ChevronLeft size={22}/></button>
            <h2 className="text-xl font-serif italic text-nature-900 leading-none">{title}</h2>
        </header>
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 pb-[calc(6rem+env(safe-area-inset-bottom))]">
            {children}
        </div>
    </div>
);

const Toggle: React.FC<{ active: boolean, onToggle: () => void }> = ({ active, onToggle }) => (
    <button onClick={onToggle} className={`w-12 h-6 rounded-full relative transition-colors ${active ? 'bg-primary-600' : 'bg-nature-200'}`}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${active ? 'left-7' : 'left-1'}`}></div>
    </button>
);

export const SettingsViews: React.FC<SettingsProps> = ({ user, view, setView, updateUser, onLogout }) => {
    const [toast, setToast] = useState<{title: string, message: string} | null>(null);
    const [showPass, setShowPass] = useState(false);
    const [privacyState, setPrivacyState] = useState({ tribe: true, patterns: false, history: true });
    const [editingUser, setEditingUser] = useState<Partial<User>>({
      name: user.name,
      bio: user.bio || '',
      intention: user.intention || ''
    });

    // Ref para o input de arquivo (foto de perfil)
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSaveProfile = async () => {
      const updated = { ...user, ...editingUser };
      await api.users.update(updated as User);
      updateUser(updated as User);
      setToast({ title: "Perfil Sincronizado", message: "Suas alterações foram ancoradas no fluxo." });
    };

    const handleProfilePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (ev) => {
                if (ev.target?.result) {
                    const newAvatar = ev.target.result as string;
                    // Atualiza localmente para feedback imediato
                    setEditingUser(prev => ({ ...prev, avatar: newAvatar })); 
                    // Em um app real, faríamos o upload para storage aqui. 
                    // Como é um update de user, vamos salvar no estado para o "Ancorar Alterações" persistir ou podemos persistir agora.
                    // Vamos atualizar o estado editingUser para que quando ele salvar, vá a nova foto.
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveSecurity = () => {
        // Simulação de salvamento de preferências
        setToast({ title: "Proteção Ativa", message: "Suas configurações de privacidade foram salvas." });
    };

    const handleSaveNotifications = () => {
        // Simulação de salvamento de notificações
        setToast({ title: "Sinais Sincronizados", message: "Preferências de alerta atualizadas com sucesso." });
    };

    if (view === ViewState.SETTINGS_PROFILE) {
      return (
        <SettingsLayout title="Manifesto Visual" onBack={() => setView(ViewState.SETTINGS)}>
            <div className="space-y-8">
                <div className="flex flex-col items-center gap-6">
                  <div className="relative group">
                    <DynamicAvatar user={{...user, ...editingUser}} size="xl" className="border-4 border-white shadow-xl" />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 p-3 bg-nature-900 text-white rounded-2xl shadow-lg active:scale-90 transition-all border-2 border-white hover:bg-black"
                    >
                      <Camera size={18} />
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleProfilePhotoUpload} 
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Sua Identidade</label>
                    <input 
                      type="text" 
                      value={editingUser.name} 
                      onChange={e => setEditingUser({...editingUser, name: e.target.value})}
                      className="w-full bg-white border border-nature-100 p-5 rounded-3xl text-sm focus:ring-4 focus:ring-primary-500/5 outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Manifesto (Bio)</label>
                    <textarea 
                      rows={4}
                      value={editingUser.bio} 
                      onChange={e => setEditingUser({...editingUser, bio: e.target.value})}
                      placeholder="Dedico minha jornada a..."
                      className="w-full bg-white border border-nature-100 p-5 rounded-3xl text-sm focus:ring-4 focus:ring-primary-500/5 outline-none resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Sua Intenção Atual</label>
                    <div className="bg-white p-5 rounded-3xl border border-nature-100 flex items-center gap-4">
                      <Sparkles size={20} className="text-amber-500" />
                      <input 
                        type="text" 
                        value={editingUser.intention} 
                        onChange={e => setEditingUser({...editingUser, intention: e.target.value})}
                        placeholder="Ex: Encontrar clareza mental"
                        className="flex-1 bg-transparent outline-none text-sm font-medium"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSaveProfile}
                  className="w-full py-5 bg-nature-900 text-white rounded-3xl font-bold uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={16} /> Ancorar Alterações
                </button>
            </div>
        </SettingsLayout>
      );
    }

    if (view === ViewState.SETTINGS_WALLET) {
      return (
        <SettingsLayout title="Minha Abundância" onBack={() => setView(ViewState.SETTINGS)}>
            <div className="space-y-10">
                <WalletSplit personal={user.personalBalance} corporate={user.corporateBalance} />
                
                <div className="bg-nature-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-primary-400 mb-4">Karma Acumulado</p>
                   <div className="flex items-end gap-3">
                     <h3 className="text-5xl font-serif italic">{user.karma}</h3>
                     <Sparkles size={24} className="text-amber-400 mb-2" />
                   </div>
                   <button className="mt-8 w-full py-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-[10px] font-bold uppercase tracking-widest hover:bg-white/20 transition-all">Trocar por Vouchers</button>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center px-2">
                    <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Movimentações do Fluxo</h4>
                    <button className="text-[10px] font-bold text-primary-600 uppercase">Ver Tudo</button>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Ritual de Reiki', date: 'Hoje', val: -150, type: 'expense' },
                      { label: 'Indicação de Buscador', date: 'Ontem', val: 50, type: 'income' },
                      { label: 'Cashback Bazar', date: '3 dias atrás', val: 12.5, type: 'income' }
                    ].map((tx, i) => (
                      <div key={i} className="bg-white p-5 rounded-[2rem] border border-nature-100 flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-4">
                           <div className={`p-3 rounded-xl ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                             {tx.type === 'income' ? <ArrowUpRight size={18}/> : <ArrowDownRight size={18}/>}
                           </div>
                           <div>
                             <p className="text-xs font-bold text-nature-900">{tx.label}</p>
                             <p className="text-[9px] text-nature-400 font-bold uppercase">{tx.date}</p>
                           </div>
                        </div>
                        <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {tx.type === 'income' ? '+' : '-'} R$ {Math.abs(tx.val).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
            </div>
        </SettingsLayout>
      );
    }

    if (view === ViewState.SETTINGS_SECURITY) {
        return (
            <SettingsLayout title="Selos de Proteção" onBack={() => setView(ViewState.SETTINGS)}>
                <div className="space-y-8">
                    <Card className="space-y-6">
                        <div className="flex items-center gap-4 border-b border-nature-50 pb-6">
                            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center"><Lock size={24}/></div>
                            <div><h4 className="font-bold text-nature-900 text-sm">Chave de Acesso</h4><p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest">Senha Criada em Julho</p></div>
                        </div>
                        <div className="relative">
                            <input type={showPass ? "text" : "password"} value="senha_protegida_viva" readOnly className="w-full bg-nature-50 border border-nature-100 p-4 rounded-xl text-sm font-mono" />
                            <button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-nature-300">{showPass ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
                        </div>
                        <button className="w-full py-4 bg-nature-900 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">Transmutar Senha</button>
                    </Card>

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Privacidade do Fluxo</h4>
                        {[
                            { key: 'tribe', label: 'Perfil Visível na Tribo', icon: Globe },
                            { key: 'patterns', label: 'Compartilhar Metamorfose', icon: Activity },
                            { key: 'history', label: 'Histórico de Rituais Privado', icon: Shield }
                        ].map((item) => (
                            <div key={item.key} className="bg-white p-5 rounded-2xl border border-nature-100 flex justify-between items-center shadow-sm">
                                <div className="flex items-center gap-4"><item.icon size={18} className="text-nature-400"/><span className="text-sm font-medium text-nature-700">{item.label}</span></div>
                                <Toggle active={(privacyState as any)[item.key]} onToggle={() => setPrivacyState(s => ({...s, [item.key]: !(s as any)[item.key]}))} />
                            </div>
                        ))}
                        
                        <button 
                            onClick={handleSaveSecurity}
                            className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all mt-4 flex items-center justify-center gap-2"
                        >
                            <Check size={16} /> Salvar Privacidade
                        </button>
                    </div>
                </div>
            </SettingsLayout>
        );
    }

    if (view === ViewState.SETTINGS_NOTIFICATIONS) {
        return (
            <SettingsLayout title="Sinais e Avisos" onBack={() => setView(ViewState.SETTINGS)}>
                <div className="space-y-4">
                    {[
                        { label: 'Alertas de Ritual', sub: 'Lembretes de sessões agendadas', icon: Sparkles, color: 'bg-amber-50 text-amber-500' },
                        { label: 'Mensagens da Tribo', sub: 'Novas conexões e vibes enviadas', icon: MessageSquare, color: 'bg-indigo-50 text-indigo-500' },
                        { label: 'Fluxo de Abundância', sub: 'Confirmações de trocas éticas', icon: DollarSign, color: 'bg-emerald-50 text-emerald-500' }
                    ].map((item, i) => (
                        <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-nature-100 flex justify-between items-center shadow-sm">
                            <div className="flex items-center gap-5">
                                <div className={`p-4 ${item.color} rounded-2xl`}><item.icon size={20}/></div>
                                <div><h4 className="font-bold text-nature-900 text-sm leading-tight">{item.label}</h4><p className="text-[9px] text-nature-400 font-bold uppercase mt-1 tracking-widest">{item.sub}</p></div>
                            </div>
                            <Toggle active={true} onToggle={() => {}} />
                        </div>
                    ))}

                    <button 
                        onClick={handleSaveNotifications}
                        className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all mt-4 flex items-center justify-center gap-2"
                    >
                        <Check size={16} /> Atualizar Alertas
                    </button>
                </div>
            </SettingsLayout>
        );
    }

    return (
        <div className="flex flex-col animate-in fade-in min-h-full w-full">
            {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}
            
            <header className="flex items-center gap-8 mb-10 mt-6 px-4 flex-none">
                <div className="relative group">
                    <div className="absolute inset-[-6px] bg-primary-300 blur-xl opacity-20 rounded-full"></div>
                    <DynamicAvatar user={user} size="lg" className="border-4 border-white shadow-2xl relative z-10" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-4xl font-serif italic text-nature-900 leading-tight">{user.name}</h2>
                    <VerifiedBadge label={user.role === UserRole.CLIENT ? "BUSCADOR" : user.role === UserRole.PROFESSIONAL ? "GUARDIÃO" : "SANTUÁRIO"} />
                </div>
            </header>

            <div className="space-y-4 px-2 flex-1">
                {[
                    { id: ViewState.SETTINGS_PROFILE, label: 'Manifesto Visual', sub: 'BIO, INTENÇÃO E IDENTIDADE', icon: UserIcon, color: 'bg-nature-50 text-nature-400' },
                    { id: ViewState.SETTINGS_WALLET, label: 'Minha Abundância', sub: 'CARTEIRA, KARMA E MOVIMENTAÇÕES', icon: Wallet, color: 'bg-amber-50 text-amber-500' },
                    { id: ViewState.SETTINGS_NOTIFICATIONS, label: 'Sinais e Avisos', sub: 'ALERTAS DO FLUXO', icon: Bell, color: 'bg-indigo-50 text-indigo-500' },
                    { id: ViewState.SETTINGS_SECURITY, label: 'Selos de Proteção', sub: 'SEGURANÇA E PRIVACIDADE', icon: Lock, color: 'bg-rose-50 text-rose-500' },
                    { id: ViewState.CLIENT_ORDERS, label: 'Meus Ativos', sub: 'RITUAIS E VOUCHERS', icon: ShoppingBag, color: 'bg-primary-50 text-primary-600' },
                ].map(item => (
                    <button key={item.id} onClick={() => setView(item.id)} className="w-full bg-white p-6 rounded-[2.5rem] border border-nature-100 flex items-center justify-between group active:scale-[0.98] transition-all hover:shadow-xl shadow-sm">
                        <div className="flex items-center gap-6">
                            <div className={`${item.color} p-5 rounded-2xl shadow-inner`}><item.icon size={22} /></div>
                            <div className="text-left space-y-1"><p className="font-bold text-nature-900 text-sm leading-tight">{item.label}</p><p className="text-[9px] text-nature-300 font-bold uppercase tracking-widest">{item.sub}</p></div>
                        </div>
                        <ChevronRight size={20} className="text-nature-100 group-hover:text-primary-500 transition-colors" />
                    </button>
                ))}
            </div>

            <div className="mt-8 px-2 flex-none pb-12">
                <button 
                  onClick={onLogout} 
                  className="w-full py-6 border-2 border-dashed border-rose-100 text-rose-400 rounded-[2rem] font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-rose-50"
                >
                    <LogOut size={18} /> Encerrar Sincronia
                </button>
            </div>
        </div>
    );
};
