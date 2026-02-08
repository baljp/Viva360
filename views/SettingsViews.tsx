
import React, { useState, useRef, useEffect } from 'react';
import { ViewState, User, UserRole, Professional, Transaction } from '../types';
import { 
    ChevronLeft, ShieldCheck, User as UserIcon, Camera, ChevronRight, 
    Heart, Sparkles, Lock, Bell, LogOut, Check, Mail, MapPin, 
    Briefcase, Smartphone, Sun, DoorOpen, DollarSign, List, Activity,
    Building, CreditCard, Wallet, Shield, MessageSquare, Megaphone, Smartphone as PhoneIcon,
    Users, Eye, EyeOff, Globe, ShoppingBag, History, ArrowUpRight, ArrowDownRight, Save, Moon, Loader2
} from 'lucide-react';
import { DynamicAvatar, ZenToast, Card, VerifiedBadge, WalletSplit, PortalView } from '../components/Common';
import { api } from '../services/api';
import { supabase } from '../lib/supabase';

    interface SettingsProps { 
        user: User; 
        view: ViewState; 
        setView: (v: ViewState) => void; 
        updateUser: (u: User) => void;
        onLogout?: () => void;
    }
    
    const Toggle: React.FC<{ active: boolean, onToggle: () => void }> = ({ active, onToggle }) => (
        <button onClick={onToggle} className={`w-12 h-6 rounded-full relative transition-colors ${active ? 'bg-primary-600' : 'bg-nature-200'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${active ? 'left-7' : 'left-1'}`}></div>
        </button>
    );
    
    export const SettingsViews: React.FC<SettingsProps & { flow?: any }> = ({ 
        user, view, setView, updateUser, onLogout, flow 
    }) => {
        const [toast, setToast] = useState<{title: string, message: string} | null>(null);
        const [showPass, setShowPass] = useState(false);
        const [privacyState, setPrivacyState] = useState({ tribe: true, patterns: false, history: true });
        const [notifPrefs, setNotifPrefs] = useState({ rituals: true, tribe: true, finance: true });
        const [editingUser, setEditingUser] = useState<Partial<User>>({
          name: user.name,
          bio: user.bio || '',
          intention: user.intention || ''
        });
        const [transactions, setTransactions] = useState<Transaction[]>([]);
        const [txLoading, setTxLoading] = useState(false);
        const [newPassword, setNewPassword] = useState('');
        const [passwordLoading, setPasswordLoading] = useState(false);
    
        // Ref para o input de arquivo (foto de perfil)
        const fileInputRef = useRef<HTMLInputElement>(null);

        // Fetch real transactions on mount
        useEffect(() => {
            if (view === ViewState.SETTINGS_WALLET) {
                setTxLoading(true);
                api.professionals.getFinanceSummary(user.id).then(summary => {
                    setTransactions(summary.transactions || []);
                }).catch(() => {
                    setTransactions([]);
                }).finally(() => setTxLoading(false));
            }
        }, [view, user.id]);
    
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
                        setEditingUser(prev => ({ ...prev, avatar: newAvatar })); 
                    }
                };
                reader.readAsDataURL(file);
            }
        };
    
        const handleSaveSecurity = async () => {
            // Save privacy preferences to user profile
            try {
                await api.users.update({ ...user, privacySettings: privacyState } as any);
                setToast({ title: "Proteção Ativa", message: "Suas configurações de privacidade foram salvas." });
            } catch {
                setToast({ title: "Erro", message: "Não foi possível salvar as preferências." });
            }
        };

        const handlePasswordChange = async () => {
            if (!newPassword || newPassword.length < 6) {
                setToast({ title: "Senha Inválida", message: "A senha deve ter pelo menos 6 caracteres." });
                return;
            }
            setPasswordLoading(true);
            try {
                const { error } = await supabase.auth.updateUser({ password: newPassword });
                if (error) throw error;
                setNewPassword('');
                setToast({ title: "Senha Transmutada", message: "Sua nova chave de acesso foi configurada." });
            } catch (err: any) {
                setToast({ title: "Erro", message: err?.message || "Não foi possível alterar a senha." });
            } finally {
                setPasswordLoading(false);
            }
        };
    
        const handleSaveNotifications = async () => {
            // Persist notification preferences to user profile
            try {
                await api.users.update({ ...user, notificationPrefs: notifPrefs } as any);
                setToast({ title: "Sinais Sincronizados", message: "Preferências de alerta atualizadas com sucesso." });
            } catch {
                setToast({ title: "Erro", message: "Não foi possível salvar as preferências." });
            }
        };
    
        if (view === ViewState.SETTINGS_PROFILE) {
          return (
            <PortalView title="Manifesto Visual" subtitle="IDENTIDADE" onBack={() => setView(ViewState.SETTINGS)}>
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
            </PortalView>
          );
        }
    
        if (view === ViewState.SETTINGS_WALLET) {
          return (
            <PortalView title="Minha Abundância" subtitle="KARMA & SALDO" onBack={() => setView(ViewState.SETTINGS)}>
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
                        {txLoading ? (
                          <div className="p-8 text-center text-nature-400 flex items-center justify-center gap-2">
                            <Loader2 size={16} className="animate-spin" /> Carregando...
                          </div>
                        ) : transactions.length === 0 ? (
                          <div className="p-8 text-center text-nature-400 italic">Nenhuma movimentação registrada.</div>
                        ) : (
                          transactions.slice(0, 5).map((tx, i) => (
                            <div key={tx.id || i} className="bg-white p-5 rounded-[2rem] border border-nature-100 flex justify-between items-center shadow-sm">
                              <div className="flex items-center gap-4">
                                 <div className={`p-3 rounded-xl ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                                   {tx.type === 'income' ? <ArrowUpRight size={18}/> : <ArrowDownRight size={18}/>}
                                 </div>
                                 <div>
                                   <p className="text-xs font-bold text-nature-900">{tx.description}</p>
                                   <p className="text-[9px] text-nature-400 font-bold uppercase">{new Date(tx.date).toLocaleDateString()}</p>
                                 </div>
                              </div>
                              <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {tx.type === 'income' ? '+' : '-'} R$ {Math.abs(tx.amount).toFixed(2)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                </div>
            </PortalView>
          );
        }
    
        if (view === ViewState.SETTINGS_SECURITY) {
            return (
                <PortalView title="Selos de Proteção" subtitle="SEGURANÇA" onBack={() => setView(ViewState.SETTINGS)}>
                    <div className="space-y-8">
                        <Card className="space-y-6">
                            <div className="flex items-center gap-4 border-b border-nature-50 pb-6">
                                <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center"><Lock size={24}/></div>
                                <div><h4 className="font-bold text-nature-900 text-sm">Chave de Acesso</h4><p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest">Alterar senha</p></div>
                            </div>
                            <div className="relative">
                                <input 
                                    type={showPass ? "text" : "password"} 
                                    value={newPassword} 
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Digite a nova senha"
                                    className="w-full bg-nature-50 border border-nature-100 p-4 rounded-xl text-sm" 
                                />
                                <button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-nature-300">{showPass ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
                            </div>
                            <button 
                                onClick={handlePasswordChange}
                                disabled={passwordLoading || !newPassword}
                                className="w-full py-4 bg-nature-900 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {passwordLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                                Transmutar Senha
                            </button>
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
                </PortalView>
            );
        }

        if (view === ViewState.SETTINGS_NOTIFICATIONS) {
            return (
                <PortalView title="Sinais e Avisos" subtitle="NOTIFICAÇÕES" onBack={() => setView(ViewState.SETTINGS)}>
                    <div className="space-y-4">
                        {[
                            { key: 'rituals', label: 'Alertas de Ritual', sub: 'Lembretes de sessões agendadas', icon: Sparkles, color: 'bg-amber-50 text-amber-500' },
                            { key: 'tribe', label: 'Mensagens da Tribo', sub: 'Novas conexões e vibes enviadas', icon: MessageSquare, color: 'bg-indigo-50 text-indigo-500' },
                            { key: 'finance', label: 'Fluxo de Abundância', sub: 'Confirmações de trocas éticas', icon: DollarSign, color: 'bg-emerald-50 text-emerald-500' }
                        ].map((item) => (
                            <div key={item.key} className="bg-white p-6 rounded-[2.5rem] border border-nature-100 flex justify-between items-center shadow-sm">
                                <div className="flex items-center gap-5">
                                    <div className={`p-4 ${item.color} rounded-2xl`}><item.icon size={20}/></div>
                                    <div><h4 className="font-bold text-nature-900 text-sm leading-tight">{item.label}</h4><p className="text-[9px] text-nature-400 font-bold uppercase mt-1 tracking-widest">{item.sub}</p></div>
                                </div>
                                <Toggle active={(notifPrefs as any)[item.key]} onToggle={() => setNotifPrefs(s => ({...s, [item.key]: !(s as any)[item.key]}))} />
                            </div>
                        ))}
    
                        <button 
                            onClick={handleSaveNotifications}
                            className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all mt-4 flex items-center justify-center gap-2"
                        >
                            <Check size={16} /> Atualizar Alertas
                        </button>
                    </div>
                </PortalView>
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
                  onClick={() => {
                      if (onLogout) onLogout();
                      else {
                          // Fail-safe
                          console.warn("Logout handler missing, forcing redirect");
                          localStorage.removeItem('viva360.auth.token'); // Clear explicitly
                          window.location.href = '/login';
                      }
                  }} 
                  className="w-full py-6 border-2 border-dashed border-rose-100 text-rose-400 rounded-[2rem] font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-rose-50"
                >
                    <LogOut size={18} /> Encerrar Sincronia
                </button>
                <button 
                  onClick={() => {
                        if (flow) {
                            flow.go('DASHBOARD');
                        } else {
                            const home = user.role === UserRole.CLIENT ? ViewState.CLIENT_HOME : (user.role === UserRole.PROFESSIONAL ? ViewState.PRO_HOME : ViewState.SPACE_HOME);
                            setView(home);
                        }
                  }} 
                  className="w-full mt-4 py-6 bg-nature-900 text-white rounded-[2rem] font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl"
                >
                    <ChevronLeft size={18} /> Voltar ao Início
                </button>
            </div>
        </div>
    );
};
