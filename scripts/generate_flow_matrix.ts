import fs from 'fs';
import path from 'path';
import { transitions } from '../src/flow/types';
import { guardiaoTransitions } from '../src/flow/guardiaoTypes';
import { santuarioTransitions } from '../src/flow/santuarioTypes';

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

for (const domain of transitionMaps) {
  Object.entries(domain.transitions).forEach(([state, nextStates]) => {
    nextStates.forEach((nextState) => {
      entries.push({
        profile: domain.profile,
        tela: state,
        rotaAproximada: inferRoute(domain.profile, state),
        botoesVisiveis: inferButtons(state, nextState),
        acaoEsperada: `go('${nextState}')`,
        proximaTelaEsperada: nextState,
        endpointsTocados: inferEndpoints(domain.profile, state, nextState),
        navegacaoMinima: ['Voltar', 'Fechar'],
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
  '',
  '| Perfil | Tela | Botao(s) visivel(eis) | Acao esperada | Proxima tela | Endpoint(s) |',
  '|---|---|---|---|---|---|',
];

const rows = entries.map((entry) =>
  `| ${entry.profile} | ${entry.tela} | ${entry.botoesVisiveis.join(', ')} | ${entry.acaoEsperada} | ${entry.proximaTelaEsperada} | ${entry.endpointsTocados.join(', ')} |`,
);

fs.writeFileSync(outMd, `${header.join('\n')}\n${rows.join('\n')}\n`, 'utf8');

console.log(`matrix: generated ${report.totalEntries} entries`);
console.log(`matrix: ${outJson}`);
console.log(`matrix: ${outMd}`);
