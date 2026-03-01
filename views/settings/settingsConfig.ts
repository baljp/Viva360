import { DollarSign, MessageSquare, Sparkles } from 'lucide-react';
import { ViewState, UserRole } from '../../types';

export type NotificationPrefKey = 'rituals' | 'tribe' | 'finance';

export type SettingsRoleConfig = {
  profile: {
    title: string;
    subtitle: string;
    identityLabel: string;
    bioLabel: string;
    bioPlaceholder: string;
    intentionLabel: string;
    intentionPlaceholder: string;
  };
  wallet: {
    title: string;
    subtitle: string;
    karmaLabel: string;
    movementsLabel: string;
    actionLabel: string;
    actionTarget: ViewState;
  };
  security: {
    title: string;
    subtitle: string;
    privacyLabel: string;
    saveLabel: string;
  };
  notifications: {
    title: string;
    subtitle: string;
    saveLabel: string;
    items: Array<{ key: NotificationPrefKey; label: string; sub: string; icon: React.ElementType; color: string }>;
  };
  assets: {
    route: ViewState;
    label: string;
    sub: string;
  };
};

export const getSettingsRoleConfig = (role: UserRole): SettingsRoleConfig => {
  if (role === UserRole.PROFESSIONAL) {
    return {
      profile: {
        title: 'Manifesto do Guardião',
        subtitle: 'IDENTIDADE PROFISSIONAL',
        identityLabel: 'Nome Profissional',
        bioLabel: 'Manifesto Terapêutico',
        bioPlaceholder: 'Descreva sua abordagem de cuidado e troca.',
        intentionLabel: 'Intenção de Atendimento',
        intentionPlaceholder: 'Ex: Acolher com presença e clareza.',
      },
      wallet: {
        title: 'Fluxo Profissional',
        subtitle: 'REPASSES & KARMA',
        karmaLabel: 'Karma de Cuidado',
        movementsLabel: 'Movimentações Profissionais',
        actionLabel: 'Ir para Finanças',
        actionTarget: ViewState.PRO_FINANCE,
      },
      security: {
        title: 'Selos Profissionais',
        subtitle: 'SEGURANÇA',
        privacyLabel: 'Privacidade Profissional',
        saveLabel: 'Salvar Privacidade',
      },
      notifications: {
        title: 'Chamados e Avisos',
        subtitle: 'NOTIFICAÇÕES',
        saveLabel: 'Atualizar Chamados',
        items: [
          { key: 'rituals', label: 'Chamados de Agenda', sub: 'Lembretes de sessões e preparação', icon: Sparkles, color: 'bg-amber-50 text-amber-500' },
          { key: 'tribe', label: 'Mensagens de Rede', sub: 'Conversas da tribo e pacientes', icon: MessageSquare, color: 'bg-indigo-50 text-indigo-500' },
          { key: 'finance', label: 'Repasses e Pagamentos', sub: 'Entradas e confirmações de troca', icon: DollarSign, color: 'bg-emerald-50 text-emerald-500' },
        ],
      },
      assets: {
        route: ViewState.PRO_MARKETPLACE,
        label: 'Ativos de Alquimia',
        sub: 'OFERTAS, RITUAIS E SERVIÇOS',
      },
    };
  }

  if (role === UserRole.SPACE) {
    return {
      profile: {
        title: 'Manifesto do Santuário',
        subtitle: 'IDENTIDADE INSTITUCIONAL',
        identityLabel: 'Nome do Santuário',
        bioLabel: 'Manifesto do Espaço',
        bioPlaceholder: 'Descreva propósito, estrutura e diferencial do seu hub.',
        intentionLabel: 'Intenção do Ciclo Atual',
        intentionPlaceholder: 'Ex: Fortalecer acolhimento e expansão da equipe.',
      },
      wallet: {
        title: 'Abundância do Santuário',
        subtitle: 'TESOURARIA & KARMA',
        karmaLabel: 'Karma Institucional',
        movementsLabel: 'Movimentações do Santuário',
        actionLabel: 'Abrir Financeiro',
        actionTarget: ViewState.SPACE_FINANCE,
      },
      security: {
        title: 'Selos Institucionais',
        subtitle: 'SEGURANÇA',
        privacyLabel: 'Privacidade Institucional',
        saveLabel: 'Salvar Política',
      },
      notifications: {
        title: 'Alertas Operacionais',
        subtitle: 'NOTIFICAÇÕES',
        saveLabel: 'Atualizar Alertas',
        items: [
          { key: 'rituals', label: 'Agenda e Salas', sub: 'Alterações de salas, eventos e operações', icon: Sparkles, color: 'bg-amber-50 text-amber-500' },
          { key: 'tribe', label: 'Equipe e Convites', sub: 'Novos guardiões e interações internas', icon: MessageSquare, color: 'bg-indigo-50 text-indigo-500' },
          { key: 'finance', label: 'Financeiro Global', sub: 'Repasses, fechamento e pendências', icon: DollarSign, color: 'bg-emerald-50 text-emerald-500' },
        ],
      },
      assets: {
        route: ViewState.SPACE_MARKETPLACE,
        label: 'Ativos do Santuário',
        sub: 'BAZAR, RETIROS E SERVIÇOS',
      },
    };
  }

  return {
    profile: {
      title: 'Manifesto Visual',
      subtitle: 'IDENTIDADE',
      identityLabel: 'Sua Identidade',
      bioLabel: 'Manifesto (Bio)',
      bioPlaceholder: 'Dedico minha jornada a...',
      intentionLabel: 'Sua Intenção Atual',
      intentionPlaceholder: 'Ex: Encontrar clareza mental',
    },
    wallet: {
      title: 'Minha Abundância',
      subtitle: 'KARMA & SALDO',
      karmaLabel: 'Karma Acumulado',
      movementsLabel: 'Movimentações do Fluxo',
      actionLabel: 'Trocar por Vouchers',
      actionTarget: ViewState.CLIENT_MARKETPLACE,
    },
    security: {
      title: 'Selos de Proteção',
      subtitle: 'SEGURANÇA',
      privacyLabel: 'Privacidade do Fluxo',
      saveLabel: 'Salvar Privacidade',
    },
    notifications: {
      title: 'Sinais e Avisos',
      subtitle: 'NOTIFICAÇÕES',
      saveLabel: 'Atualizar Alertas',
      items: [
        { key: 'rituals', label: 'Alertas de Ritual', sub: 'Lembretes de sessões agendadas', icon: Sparkles, color: 'bg-amber-50 text-amber-500' },
        { key: 'tribe', label: 'Mensagens da Tribo', sub: 'Novas conexões e vibes enviadas', icon: MessageSquare, color: 'bg-indigo-50 text-indigo-500' },
        { key: 'finance', label: 'Fluxo de Abundância', sub: 'Confirmações de trocas éticas', icon: DollarSign, color: 'bg-emerald-50 text-emerald-500' },
      ],
    },
    assets: {
      route: ViewState.CLIENT_ORDERS,
      label: 'Meus Ativos',
      sub: 'RITUAIS E VOUCHERS',
    },
  };
};

export const roleLabel = (role: UserRole) => {
  if (role === UserRole.CLIENT) return 'Buscador';
  if (role === UserRole.PROFESSIONAL) return 'Guardião';
  if (role === UserRole.SPACE) return 'Santuário';
  return 'Admin';
};

export const homeForRole = (role: UserRole) => {
  if (role === UserRole.PROFESSIONAL) return ViewState.PRO_HOME;
  if (role === UserRole.SPACE) return ViewState.SPACE_HOME;
  if (role === UserRole.ADMIN) return ViewState.ADMIN_DASHBOARD;
  return ViewState.CLIENT_HOME;
};

