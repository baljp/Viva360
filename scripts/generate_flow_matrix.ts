import fs from 'fs';
import path from 'path';
import { transitions } from '../src/flow/types';
import { guardiaoTransitions } from '../src/flow/guardiaoTypes';
import { santuarioTransitions } from '../src/flow/santuarioTypes';
import { flowRegistry, type FlowDefinition } from '../src/flow/registry';

type TransitionMap = Record<string, string[]>;
type Profile = 'BUSCADOR' | 'GUARDIAO' | 'SANTUARIO';

type MatrixEntry = {
  profile: Profile;
  tela: string;
  rotaAproximada: string;
  botoesVisiveis: string[];
  acaoEsperada: string;
  proximaTelaEsperada: string;
  endpointsTocados: string[];
  navegacaoMinima: string[];
  flowIds: string[];
  persistenciaClassificacao: 'P0' | 'P1' | 'P2';
  persistenciaEscopo: 'client_only_intencional' | 'critico_validado' | 'backend_esperado_sem_evidencia_automatizada' | 'alto_risco_sem_mapeamento' | 'leitura_tolerante_fallback';
  persistenciaEvidencias: string[];
  persistenciaRacional: string;
};

const rolePrefix: Record<Profile, string> = {
  BUSCADOR: '/client',
  GUARDIAO: '/pro',
  SANTUARIO: '/space',
};

const transitionMaps: Array<{ profile: Profile; transitions: TransitionMap }> = [
  { profile: 'BUSCADOR', transitions: transitions as unknown as TransitionMap },
  { profile: 'GUARDIAO', transitions: guardiaoTransitions as unknown as TransitionMap },
  { profile: 'SANTUARIO', transitions: santuarioTransitions as unknown as TransitionMap },
];

const inferRoute = (profile: Profile, state: string) => {
  const normalized = state.toLowerCase();
  const known: Record<string, string> = {
    start: 'home',
    dashboard: 'home',
    booking_search: 'explore',
    tribe_dash: 'tribe',
    marketplace: 'marketplace',
    chat_list: 'chat',
    agenda_view: 'agenda',
    exec_dashboard: 'home',
    pros_list: 'team',
  };
  return `${rolePrefix[profile]}/${known[normalized] || normalized.replace(/_/g, '-')}`;
};

const inferButtons = (state: string, nextState: string) => {
  const current = state.toUpperCase();
  const next = nextState.toUpperCase();
  const buttons = new Set<string>(['Voltar', 'Fechar']);

  if (next.includes('CHECKOUT') || next.includes('CONFIRM') || next.includes('APPLY') || next.includes('CREATE')) {
    buttons.add('Confirmar');
    buttons.add('Cancelar');
  }
  if (current.includes('CHAT') || next.includes('CHAT')) {
    buttons.add('Enviar');
  }
  if (next.includes('INVITE') || next.includes('SUMMON')) {
    buttons.add('Convidar');
  }
  if (next.includes('PAYMENT') || next.includes('FINANCE')) {
    buttons.add('Continuar');
  }
  return Array.from(buttons);
};

const inferEndpoints = (profile: Profile, state: string, nextState: string) => {
  const key = `${state} ${nextState}`.toUpperCase();
  const endpoints = new Set<string>();

  if (key.includes('BOOKING') || key.includes('AGENDA')) endpoints.add('/api/appointments/*');
  if (key.includes('CHECKOUT') || key.includes('PAYMENT')) endpoints.add('/api/checkout/contextual');
  if (key.includes('MARKETPLACE') || key.includes('BAZAR')) endpoints.add('/api/marketplace/*');
  if (key.includes('TRIBE')) endpoints.add('/api/tribe/*');
  if (key.includes('CHAT')) endpoints.add('/api/chat/*');
  if (key.includes('RECORD') || key.includes('PATIENT')) endpoints.add('/api/records/*');
  if (key.includes('ESCAMBO') || key.includes('ALQUIMIA')) endpoints.add('/api/alchemy/offers/*');
  if (key.includes('VAGA') || key.includes('RECRUIT')) endpoints.add('/api/recruitment/*');
  if (key.includes('NOTIFICATION')) endpoints.add('/api/notifications/*');
  if (key.includes('ORACLE')) endpoints.add('/api/oracle/*');
  if (key.includes('METAMORPHOSIS') || key.includes('EVOLUTION') || key.includes('GARDEN')) endpoints.add('/api/soulgarden/*');
  if (endpoints.size === 0) endpoints.add('/api/*');

  if (profile === 'SANTUARIO' && key.includes('PRO')) endpoints.add('/api/spaces/*');
  if (profile === 'GUARDIAO' && key.includes('PATIENT')) endpoints.add('/api/professionals/*');

  return Array.from(endpoints);
};

const entries: MatrixEntry[] = [];
const flowByProfileAndScreen = new Map<string, string[]>();
const flowById = new Map<string, FlowDefinition>();

for (const flow of flowRegistry) {
  flowById.set(flow.id, flow);
}

const CRITICAL_VALIDATED_ENDPOINTS = [
  '/api/checkout/contextual',
  '/api/checkout/pay',
  '/api/alchemy/offers/*',
  '/api/recruitment/*',
  '/api/records/*',
  '/api/chat/*',
  '/api/oracle/*',
  '/api/tribe/*',
];

const READ_DEGRADED_ENDPOINTS = [
  '/api/notifications/*',
  '/api/marketplace/*',
  '/api/finance/*',
];

const matchesEndpoint = (endpoint: string, pattern: string) => {
  if (pattern.endsWith('/*')) return endpoint.startsWith(pattern.slice(0, -1));
  return endpoint === pattern;
};

const isMutatingAction = (entry: Pick<MatrixEntry, 'acaoEsperada' | 'botoesVisiveis' | 'proximaTelaEsperada'>) => {
  const text = `${entry.acaoEsperada} ${entry.proximaTelaEsperada} ${entry.botoesVisiveis.join(' ')}`.toUpperCase();
  return /(CONFIRM|CREATE|APPLY|SEND|PAY|CHECKOUT|INVITE|SUMMON|PROPOSE|DELETE|EDIT|SUBMIT)/.test(text);
};

const classifyPersistencia = (
  draft: Pick<MatrixEntry, 'flowIds' | 'endpointsTocados' | 'acaoEsperada' | 'botoesVisiveis' | 'proximaTelaEsperada'>,
): Pick<MatrixEntry, 'persistenciaClassificacao' | 'persistenciaEscopo' | 'persistenciaEvidencias' | 'persistenciaRacional'> => {
  const flows = draft.flowIds.map((id) => flowById.get(id)).filter(Boolean) as FlowDefinition[];
  const allClientOnly = flows.length > 0 && flows.every((flow) => flow.clientOnly);
  const hasSpecificEndpoint = draft.endpointsTocados.some((e) => e !== '/api/*');
  const hasCriticalValidatedEndpoint = draft.endpointsTocados.some((e) =>
    CRITICAL_VALIDATED_ENDPOINTS.some((pattern) => matchesEndpoint(e, pattern)),
  );
  const hasReadDegradedEndpoint = draft.endpointsTocados.some((e) =>
    READ_DEGRADED_ENDPOINTS.some((pattern) => matchesEndpoint(e, pattern)),
  );

  if (allClientOnly) {
    return {
      persistenciaClassificacao: 'P2',
      persistenciaEscopo: 'client_only_intencional',
      persistenciaEvidencias: [
        'src/flow/registry.ts (clientOnly=true)',
      ],
      persistenciaRacional: 'Fluxo sem persistência por design, documentado no flow registry.',
    };
  }

  if (hasCriticalValidatedEndpoint) {
    return {
      persistenciaClassificacao: 'P2',
      persistenciaEscopo: 'critico_validado',
      persistenciaEvidencias: [
        'qa/flows/interaction-contracts.spec.ts',
        'qa/flows/consent-records.spec.ts',
        'qa/flows/oracle-flow.spec.ts',
        'qa/flows/tribo-support-chat.spec.ts',
        'backend/src/tests/flows-integration.test.ts',
      ],
      persistenciaRacional: 'Ação mapeada para endpoint crítico com cobertura de contrato/E2E já validada.',
    };
  }

  if (hasReadDegradedEndpoint && !isMutatingAction(draft)) {
    return {
      persistenciaClassificacao: 'P1',
      persistenciaEscopo: 'leitura_tolerante_fallback',
      persistenciaEvidencias: [
        'backend/src/controllers/{notifications,marketplace,finance}.controller.ts',
      ],
      persistenciaRacional: 'Leitura com fallback/erro degradado padronizado; persistência depende do backend/DB.',
    };
  }

  if (hasSpecificEndpoint) {
    return {
      persistenciaClassificacao: 'P1',
      persistenciaEscopo: 'backend_esperado_sem_evidencia_automatizada',
      persistenciaEvidencias: [
        'screen_button_flow_matrix (inferência por transição + endpoint)',
      ],
      persistenciaRacional: 'Endpoint específico existe, mas ainda sem validação automática de persistência para esta transição.',
    };
  }

  if (isMutatingAction(draft)) {
    return {
      persistenciaClassificacao: 'P0',
      persistenciaEscopo: 'alto_risco_sem_mapeamento',
      persistenciaEvidencias: [
        'screen_button_flow_matrix (endpoint genérico /api/*)',
      ],
      persistenciaRacional: 'Ação potencialmente mutável sem endpoint específico mapeado; exige auditoria adicional.',
    };
  }

  return {
    persistenciaClassificacao: 'P1',
    persistenciaEscopo: 'backend_esperado_sem_evidencia_automatizada',
    persistenciaEvidencias: [
      'screen_button_flow_matrix (inferência estrutural)',
    ],
    persistenciaRacional: 'Transição mapeada estruturalmente, sem prova automática de persistência.',
  };
};

for (const flow of flowRegistry) {
  const profile = flow.profile as Profile;
  for (const screen of flow.screens) {
    const key = `${profile}:${screen}`;
    const current = flowByProfileAndScreen.get(key) || [];
    if (!current.includes(flow.id)) current.push(flow.id);
    flowByProfileAndScreen.set(key, current);
  }
}

for (const domain of transitionMaps) {
  Object.entries(domain.transitions).forEach(([state, nextStates]) => {
    nextStates.forEach((nextState) => {
      const endpointsTocados = inferEndpoints(domain.profile, state, nextState);
      const flowIds = flowByProfileAndScreen.get(`${domain.profile}:${state}`) || [];
      const botoesVisiveis = inferButtons(state, nextState);
      const persistencia = classifyPersistencia({
        flowIds,
        endpointsTocados,
        acaoEsperada: `go('${nextState}')`,
        botoesVisiveis,
        proximaTelaEsperada: nextState,
      });
      entries.push({
        profile: domain.profile,
        tela: state,
        rotaAproximada: inferRoute(domain.profile, state),
        botoesVisiveis,
        acaoEsperada: `go('${nextState}')`,
        proximaTelaEsperada: nextState,
        endpointsTocados,
        navegacaoMinima: ['Voltar', 'Fechar'],
        flowIds,
        ...persistencia,
      });
    });
  });
}

const uniqueScreens = new Set(entries.map((entry) => `${entry.profile}:${entry.tela}`));

const report = {
  generatedAt: new Date().toISOString(),
  totalEntries: entries.length,
  totalScreens: uniqueScreens.size,
  profiles: ['BUSCADOR', 'GUARDIAO', 'SANTUARIO'],
  persistenciaResumo: {
    P0: entries.filter((entry) => entry.persistenciaClassificacao === 'P0').length,
    P1: entries.filter((entry) => entry.persistenciaClassificacao === 'P1').length,
    P2: entries.filter((entry) => entry.persistenciaClassificacao === 'P2').length,
  },
  entries,
};

const reportsDir = path.resolve(process.cwd(), 'reports');
const outJson = path.join(reportsDir, 'screen_button_flow_matrix.json');
const outMd = path.join(reportsDir, 'screen_button_flow_matrix.md');

if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

fs.writeFileSync(outJson, JSON.stringify(report, null, 2), 'utf8');

const header = [
  '# Matriz Tela x Botao x Fluxo',
  '',
  `Gerado em: ${report.generatedAt}`,
  '',
  `Entradas: ${report.totalEntries}`,
  `Telas unicas: ${report.totalScreens}`,
  `Persistência (P0/P1/P2): ${report.persistenciaResumo.P0}/${report.persistenciaResumo.P1}/${report.persistenciaResumo.P2}`,
  '',
  '| Perfil | Tela | Botao(s) visivel(eis) | Acao esperada | Proxima tela | Endpoint(s) | Persistência | Escopo | Flow(s) |',
  '|---|---|---|---|---|---|---|---|---|',
];

const rows = entries.map((entry) =>
  `| ${entry.profile} | ${entry.tela} | ${entry.botoesVisiveis.join(', ')} | ${entry.acaoEsperada} | ${entry.proximaTelaEsperada} | ${entry.endpointsTocados.join(', ')} | ${entry.persistenciaClassificacao} | ${entry.persistenciaEscopo} | ${entry.flowIds.join(', ')} |`,
);

fs.writeFileSync(outMd, `${header.join('\n')}\n${rows.join('\n')}\n`, 'utf8');

console.log(`matrix: generated ${report.totalEntries} entries`);
console.log(`matrix: ${outJson}`);
console.log(`matrix: ${outMd}`);
