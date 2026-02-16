export type FlowProfile = 'BUSCADOR' | 'GUARDIAO' | 'SANTUARIO';

export type FlowDefinition = {
  id: string;
  profile: FlowProfile;
  title: string;
  screens: string[];
  prerequisites: string[];
  expectedFinal: string;
  fallbackScreen: string;
  requiredButtons: Array<'Voltar' | 'Fechar' | 'Cancelar' | 'Confirmar'>;
  endpoints: string[];
};

const baseButtons: Array<'Voltar' | 'Fechar' | 'Cancelar' | 'Confirmar'> = [
  'Voltar',
  'Fechar',
  'Cancelar',
  'Confirmar',
];

export const flowRegistry: FlowDefinition[] = [
  {
    id: 'buscador_ritual_diario',
    profile: 'BUSCADOR',
    title: 'Ritual diário com check-in e retorno ao histórico',
    screens: ['DASHBOARD', 'METAMORPHOSIS_CHECKIN', 'METAMORPHOSIS_CAMERA', 'METAMORPHOSIS_MESSAGE', 'METAMORPHOSIS_FEEDBACK', 'HISTORY'],
    prerequisites: ['authenticated', 'role=CLIENT'],
    expectedFinal: 'HISTORY',
    fallbackScreen: 'DASHBOARD',
    requiredButtons: baseButtons,
    endpoints: ['/api/metamorphosis/checkin', '/api/users/checkin'],
  },
  {
    id: 'buscador_metamorfose_karma_timelapse',
    profile: 'BUSCADOR',
    title: 'Metamorfose + karma + time-lapse',
    screens: ['DASHBOARD', 'EVOLUTION', 'EVOLUTION_TIMELAPSE', 'TIME_LAPSE_EXPERIENCE'],
    prerequisites: ['authenticated', 'role=CLIENT'],
    expectedFinal: 'TIME_LAPSE_EXPERIENCE',
    fallbackScreen: 'DASHBOARD',
    requiredButtons: baseButtons,
    endpoints: ['/api/metamorphosis/evolution', '/api/oracle/history'],
  },
  {
    id: 'buscador_busca_agenda_confirmacao',
    profile: 'BUSCADOR',
    title: 'Busca + agendamento + confirmação + notificação',
    screens: ['BOOKING_SEARCH', 'BOOKING_SELECT', 'BOOKING_CONFIRM', 'CHECKOUT', 'PAYMENT_SUCCESS'],
    prerequisites: ['authenticated', 'role=CLIENT'],
    expectedFinal: 'PAYMENT_SUCCESS',
    fallbackScreen: 'DASHBOARD',
    requiredButtons: baseButtons,
    endpoints: ['/api/appointments/*', '/api/checkout/pay', '/api/notifications/*'],
  },
  {
    id: 'buscador_marketplace_checkout',
    profile: 'BUSCADOR',
    title: 'Marketplace + carrinho + checkout + recibo',
    screens: ['MARKETPLACE', 'CHECKOUT', 'PAYMENT_SUCCESS', 'PAYMENT_HISTORY'],
    prerequisites: ['authenticated', 'role=CLIENT'],
    expectedFinal: 'PAYMENT_HISTORY',
    fallbackScreen: 'DASHBOARD',
    requiredButtons: baseButtons,
    endpoints: ['/api/marketplace/products', '/api/checkout/pay'],
  },
  {
    id: 'buscador_tribo_convite',
    profile: 'BUSCADOR',
    title: 'Tribo convite e interação',
    screens: ['TRIBE_DASH', 'TRIBE_INVITE', 'TRIBE_DASH', 'TRIBE_INTERACTION', 'CHAT_ROOM'],
    prerequisites: ['authenticated', 'role=CLIENT'],
    expectedFinal: 'CHAT_ROOM',
    fallbackScreen: 'DASHBOARD',
    requiredButtons: baseButtons,
    endpoints: ['/api/tribe/*', '/api/chat/*'],
  },
  {
    id: 'guardiao_escambo',
    profile: 'GUARDIAO',
    title: 'Escambo guardião↔guardião',
    screens: ['ESCAMBO_MARKET', 'ESCAMBO_PROPOSE', 'ESCAMBO_CONFIRM'],
    prerequisites: ['authenticated', 'role=PROFESSIONAL'],
    expectedFinal: 'ESCAMBO_CONFIRM',
    fallbackScreen: 'DASHBOARD',
    requiredButtons: baseButtons,
    endpoints: ['/api/alchemy/offers/*', '/api/chat/*'],
  },
  {
    id: 'guardiao_prontuario_consentido',
    profile: 'GUARDIAO',
    title: 'Acesso a prontuário consentido',
    screens: ['PATIENTS_LIST', 'PATIENT_PROFILE', 'PATIENT_RECORDS'],
    prerequisites: ['authenticated', 'role=PROFESSIONAL', 'consent=ACTIVE'],
    expectedFinal: 'PATIENT_RECORDS',
    fallbackScreen: 'PATIENTS_LIST',
    requiredButtons: baseButtons,
    endpoints: ['/api/records/*'],
  },
  {
    id: 'santuario_vagas_entrevista',
    profile: 'SANTUARIO',
    title: 'Vaga santuário -> candidatos/entrevista',
    screens: ['EXEC_DASHBOARD', 'VAGAS_LIST', 'VAGA_CANDIDATES'],
    prerequisites: ['authenticated', 'role=SPACE'],
    expectedFinal: 'VAGA_CANDIDATES',
    fallbackScreen: 'EXEC_DASHBOARD',
    requiredButtons: baseButtons,
    endpoints: ['/api/recruitment/*'],
  },
  {
    id: 'santuario_operacao_completa',
    profile: 'SANTUARIO',
    title: 'Operação do hub: equipe, salas, agenda, financeiro',
    screens: ['EXEC_DASHBOARD', 'PROS_LIST', 'EXEC_DASHBOARD', 'ROOMS_STATUS', 'EXEC_DASHBOARD', 'AGENDA_OVERVIEW', 'EXEC_DASHBOARD', 'FINANCE_OVERVIEW'],
    prerequisites: ['authenticated', 'role=SPACE'],
    expectedFinal: 'FINANCE_OVERVIEW',
    fallbackScreen: 'EXEC_DASHBOARD',
    requiredButtons: baseButtons,
    endpoints: ['/api/spaces/*', '/api/rooms/*', '/api/finance/*'],
  },
];

export const flowRegistryByProfile: Record<FlowProfile, FlowDefinition[]> = {
  BUSCADOR: flowRegistry.filter((flow) => flow.profile === 'BUSCADOR'),
  GUARDIAO: flowRegistry.filter((flow) => flow.profile === 'GUARDIAO'),
  SANTUARIO: flowRegistry.filter((flow) => flow.profile === 'SANTUARIO'),
};
