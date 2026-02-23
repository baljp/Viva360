import fs from 'fs';
import path from 'path';
import { flowRegistry } from '../src/flow/registry';
import { transitions } from '../src/flow/types';
import { guardiaoTransitions } from '../src/flow/guardiaoTypes';
import { santuarioTransitions } from '../src/flow/santuarioTypes';

type Profile = 'BUSCADOR' | 'GUARDIAO' | 'SANTUARIO';
type TransitionMap = Record<string, string[]>;

type Finding = {
  level: 'ERROR' | 'WARN' | 'INFO';
  profile: Profile;
  code:
    | 'TRANSITION_STATE_NOT_IN_FLOW_REGISTRY'
    | 'FLOW_SCREEN_NOT_IN_ROUTE_MAP'
    | 'ROUTE_MAPPED_STATE_NOT_IN_TRANSITIONS'
    | 'ROUTE_MAPPED_STATE_NOT_IN_FLOW_REGISTRY';
  state: string;
  message: string;
};

const ROOT = process.cwd();

const transitionByProfile: Record<Profile, TransitionMap> = {
  BUSCADOR: transitions as unknown as TransitionMap,
  GUARDIAO: guardiaoTransitions as unknown as TransitionMap,
  SANTUARIO: santuarioTransitions as unknown as TransitionMap,
};

const routeMapFiles: Record<Profile, { file: string; constName: string }> = {
  BUSCADOR: { file: 'views/ClientViews.tsx', constName: 'clientStateRoutes' },
  GUARDIAO: { file: 'views/ProViews.tsx', constName: 'proStateRoutes' },
  SANTUARIO: { file: 'views/SpaceViews.tsx', constName: 'spaceStateRoutes' },
};

function readText(relPath: string): string {
  return fs.readFileSync(path.resolve(ROOT, relPath), 'utf8');
}

function extractObjectKeysFromConst(fileText: string, constName: string): string[] {
  const anchor = `const ${constName}`;
  const start = fileText.indexOf(anchor);
  if (start < 0) return [];
  const braceStart = fileText.indexOf('{', start);
  if (braceStart < 0) return [];

  let depth = 0;
  let end = -1;
  for (let i = braceStart; i < fileText.length; i += 1) {
    const ch = fileText[i];
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end < 0) return [];

  const body = fileText.slice(braceStart + 1, end);
  const keys = new Set<string>();
  const keyRegex = /^\s*([A-Z0-9_]+)\s*:/gm;
  let match: RegExpExecArray | null = null;
  while ((match = keyRegex.exec(body)) !== null) {
    keys.add(match[1]);
  }
  return Array.from(keys);
}

const routeMapStatesByProfile: Record<Profile, Set<string>> = {
  BUSCADOR: new Set<string>(),
  GUARDIAO: new Set<string>(),
  SANTUARIO: new Set<string>(),
};

for (const [profile, config] of Object.entries(routeMapFiles) as Array<[Profile, { file: string; constName: string }]>) {
  const text = readText(config.file);
  extractObjectKeysFromConst(text, config.constName).forEach((key) => routeMapStatesByProfile[profile].add(key));
}

const flowScreensByProfile: Record<Profile, Set<string>> = {
  BUSCADOR: new Set<string>(),
  GUARDIAO: new Set<string>(),
  SANTUARIO: new Set<string>(),
};
for (const flow of flowRegistry) {
  const profile = flow.profile as Profile;
  flow.screens.forEach((screen) => flowScreensByProfile[profile].add(screen));
}

const transitionStatesByProfile: Record<Profile, Set<string>> = {
  BUSCADOR: new Set(Object.keys(transitionByProfile.BUSCADOR || {})),
  GUARDIAO: new Set(Object.keys(transitionByProfile.GUARDIAO || {})),
  SANTUARIO: new Set(Object.keys(transitionByProfile.SANTUARIO || {})),
};

const findings: Finding[] = [];

const addFinding = (finding: Finding) => findings.push(finding);

for (const profile of ['BUSCADOR', 'GUARDIAO', 'SANTUARIO'] as const) {
  const transitionStates = transitionStatesByProfile[profile];
  const flowStates = flowScreensByProfile[profile];
  const routeStates = routeMapStatesByProfile[profile];

  for (const state of Array.from(transitionStates).sort()) {
    if (!flowStates.has(state)) {
      addFinding({
        level: 'WARN',
        profile,
        code: 'TRANSITION_STATE_NOT_IN_FLOW_REGISTRY',
        state,
        message: `Estado existe nas transições (${profile}), mas não aparece no flowRegistry.`,
      });
    }
  }

  for (const state of Array.from(flowStates).sort()) {
    if (!routeStates.has(state)) {
      addFinding({
        level: 'WARN',
        profile,
        code: 'FLOW_SCREEN_NOT_IN_ROUTE_MAP',
        state,
        message: `Tela do flowRegistry (${profile}) não possui mapeamento explícito no stateRoutes da view.`,
      });
    }
  }

  for (const state of Array.from(routeStates).sort()) {
    if (!transitionStates.has(state)) {
      addFinding({
        level: 'ERROR',
        profile,
        code: 'ROUTE_MAPPED_STATE_NOT_IN_TRANSITIONS',
        state,
        message: `Estado mapeado para rota (${profile}) não existe no mapa de transições.`,
      });
    }
    if (!flowStates.has(state)) {
      addFinding({
        level: 'INFO',
        profile,
        code: 'ROUTE_MAPPED_STATE_NOT_IN_FLOW_REGISTRY',
        state,
        message: `Estado mapeado para rota (${profile}) não está coberto por nenhum flowRegistry (potencial tela fora da governança de fluxo).`,
      });
    }
  }
}

const summaryByProfile = (profile: Profile) => {
  const profileFindings = findings.filter((f) => f.profile === profile);
  return {
    transitionStates: transitionStatesByProfile[profile].size,
    flowRegistryScreens: flowScreensByProfile[profile].size,
    routeMappedStates: routeMapStatesByProfile[profile].size,
    errors: profileFindings.filter((f) => f.level === 'ERROR').length,
    warns: profileFindings.filter((f) => f.level === 'WARN').length,
    infos: profileFindings.filter((f) => f.level === 'INFO').length,
  };
};

const ok = findings.filter((f) => f.level === 'ERROR').length === 0;
const report = {
  generatedAt: new Date().toISOString(),
  ok,
  profiles: {
    BUSCADOR: summaryByProfile('BUSCADOR'),
    GUARDIAO: summaryByProfile('GUARDIAO'),
    SANTUARIO: summaryByProfile('SANTUARIO'),
  },
  findings,
};

const reportsDir = path.resolve(ROOT, 'reports');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

const outJson = path.join(reportsDir, 'orphan_screen_audit.json');
const outMd = path.join(reportsDir, 'orphan_screen_audit.md');

fs.writeFileSync(outJson, JSON.stringify(report, null, 2), 'utf8');

const md = [
  '# Auditoria de Telas Órfãs / Cobertura de Fluxo',
  '',
  `Gerado em: ${report.generatedAt}`,
  `Status: ${ok ? 'PASS (sem erros estruturais)' : 'FAIL (há inconsistências estruturais)'}`,
  '',
  '## Resumo por perfil',
  '',
  '| Perfil | Estados (transições) | Telas no flowRegistry | Estados com rota | Errors | Warnings | Info |',
  '|---|---:|---:|---:|---:|---:|---:|',
  ...(['BUSCADOR', 'GUARDIAO', 'SANTUARIO'] as const).map((profile) => {
    const s = report.profiles[profile];
    return `| ${profile} | ${s.transitionStates} | ${s.flowRegistryScreens} | ${s.routeMappedStates} | ${s.errors} | ${s.warns} | ${s.infos} |`;
  }),
  '',
  '## Findings',
  '',
  '| Level | Perfil | Código | Estado | Mensagem |',
  '|---|---|---|---|---|',
  ...findings.map((f) => `| ${f.level} | ${f.profile} | ${f.code} | ${f.state} | ${f.message} |`),
  '',
];

fs.writeFileSync(outMd, `${md.join('\n')}\n`, 'utf8');

console.log(`orphan-screen-audit: ${ok ? 'PASS' : 'FAIL'}`);
console.log(`orphan-screen-audit: ${outJson}`);
console.log(`orphan-screen-audit: ${outMd}`);

if (!ok) process.exit(1);
