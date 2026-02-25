import React from 'react';
import { ChevronLeft, ChevronRight, Loader2, LogOut, Users } from 'lucide-react';
import { DynamicAvatar, VerifiedBadge } from '../../components/Common';
import { User, UserRole, ViewState } from '../../types';

export type SettingsMenuItem = {
  id: ViewState;
  label: string;
  sub: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
};

type RoleSwitcherProps = {
  user: User;
  availableRoles: UserRole[];
  activeRole: UserRole;
  roleBusy: boolean;
  onSelectRole: (role: UserRole) => void;
  onAddRole: (role: UserRole) => void;
  roleLabel: (role: UserRole) => string;
  onGoToRoleHome: () => void;
};

export const SettingsRoleSwitcherCard: React.FC<RoleSwitcherProps> = ({
  user,
  availableRoles,
  activeRole,
  roleBusy,
  onSelectRole,
  onAddRole,
  roleLabel,
  onGoToRoleHome,
}) => {
  return (
    <div className="w-full bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-nature-50 text-nature-500 p-4 rounded-2xl"><Users size={20} /></div>
          <div className="text-left space-y-1">
            <p className="font-bold text-nature-900 text-sm leading-tight">Perfis do mesmo e-mail</p>
            <p className="text-[9px] text-nature-300 font-bold uppercase tracking-widest">SELECIONAR PERFIL ATIVO</p>
          </div>
        </div>
        {roleBusy ? <Loader2 size={16} className="animate-spin text-nature-400" /> : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {availableRoles.map((role) => {
          const isActive = role === activeRole;
          return (
            <button
              key={`role-${role}`}
              onClick={() => onSelectRole(role)}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${isActive ? 'bg-nature-900 text-white' : 'bg-nature-100 text-nature-600 hover:bg-nature-200'}`}
            >
              {roleLabel(role)}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {[UserRole.CLIENT, UserRole.PROFESSIONAL, UserRole.SPACE]
          .filter((role) => !availableRoles.includes(role))
          .map((role) => (
            <button
              key={`add-${role}`}
              onClick={() => onAddRole(role)}
              className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-primary-50 text-primary-700 hover:bg-primary-100 transition-all"
            >
              Ativar {roleLabel(role)}
            </button>
          ))}
      </div>

      <button
        onClick={onGoToRoleHome}
        className="w-full mt-1 py-3 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
      >
        <ChevronRight size={14} /> Ir para home deste perfil
      </button>
    </div>
  );
};

export const SettingsMenuCards: React.FC<{
  items: SettingsMenuItem[];
  onSelect: (view: ViewState) => void;
}> = ({ items, onSelect }) => (
  <>
    {items.map((item) => (
      <button key={item.id} onClick={() => onSelect(item.id)} className="w-full bg-white p-6 rounded-[2.5rem] border border-nature-100 flex items-center justify-between group active:scale-[0.98] transition-all hover:shadow-xl shadow-sm">
        <div className="flex items-center gap-6">
          <div className={`${item.color} p-5 rounded-2xl shadow-inner`}><item.icon size={22} /></div>
          <div className="text-left space-y-1">
            <p className="font-bold text-nature-900 text-sm leading-tight">{item.label}</p>
            <p className="text-[9px] text-nature-300 font-bold uppercase tracking-widest">{item.sub}</p>
          </div>
        </div>
        <ChevronRight size={20} className="text-nature-100 group-hover:text-primary-500 transition-colors" />
      </button>
    ))}
  </>
);

export const SettingsHomeHeader: React.FC<{ user: User }> = ({ user }) => (
  <header className="flex items-center gap-8 mb-10 mt-6 px-4 flex-none">
    <div className="relative group">
      <div className="absolute inset-[-6px] bg-primary-300 blur-xl opacity-20 rounded-full"></div>
      <DynamicAvatar user={user} size="lg" className="border-4 border-white shadow-2xl relative z-10" />
    </div>
    <div className="space-y-2">
      <h2 className="text-4xl font-serif italic text-nature-900 leading-tight">{user.name}</h2>
      <VerifiedBadge label={user.role === UserRole.CLIENT ? 'BUSCADOR' : user.role === UserRole.PROFESSIONAL ? 'GUARDIÃO' : 'SANTUÁRIO'} />
    </div>
  </header>
);

export const SettingsHomeFooterActions: React.FC<{
  onLogout: () => void;
  onBackToHome: () => void;
}> = ({ onLogout, onBackToHome }) => (
  <div className="mt-8 px-2 flex-none pb-12">
    <button
      onClick={onLogout}
      className="w-full py-6 border-2 border-dashed border-rose-100 text-rose-400 rounded-[2rem] font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-rose-50"
    >
      <LogOut size={18} /> Encerrar Sincronia
    </button>
    <button
      onClick={onBackToHome}
      className="w-full mt-4 py-6 bg-nature-900 text-white rounded-[2rem] font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl"
    >
      <ChevronLeft size={18} /> Voltar ao Início
    </button>
  </div>
);
