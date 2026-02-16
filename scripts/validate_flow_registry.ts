import fs from 'fs';
import path from 'path';
import { flowRegistry, type FlowDefinition } from '../src/flow/registry';
import { transitions } from '../src/flow/types';
import { guardiaoTransitions } from '../src/flow/guardiaoTypes';
import { santuarioTransitions } from '../src/flow/santuarioTypes';

type TransitionMap = Record<string, string[]>;

type ValidationFinding = {
  level: 'ERROR' | 'WARN';
  flowId: string;
  message: string;
};

const transitionByProfile: Record<FlowDefinition['profile'], TransitionMap> = {
  BUSCADOR: transitions as unknown as TransitionMap,
  GUARDIAO: guardiaoTransitions as unknown as TransitionMap,
  SANTUARIO: santuarioTransitions as unknown as TransitionMap,
};

const findings: ValidationFinding[] = [];
const requiredButtons = ['Voltar', 'Fechar', 'Cancelar', 'Confirmar'];

const ids = new Set<string>();
for (const flow of flowRegistry) {
  if (ids.has(flow.id)) {
    findings.push({ level: 'ERROR', flowId: flow.id, message: 'Flow id duplicado.' });
  }
  ids.add(flow.id);
}

for (const flow of flowRegistry) {
  const transitionMap = transitionByProfile[flow.profile];
  if (!transitionMap) {
    findings.push({ level: 'ERROR', flowId: flow.id, message: `Mapa de transições ausente para perfil ${flow.profile}.` });
    continue;
  }

  if (!flow.screens.length) {
    findings.push({ level: 'ERROR', flowId: flow.id, message: 'Flow sem telas.' });
    continue;
  }

  if (!flow.endpoints.length) {
    findings.push({ level: 'ERROR', flowId: flow.id, message: 'Flow sem endpoints mapeados.' });
  }

  for (const button of requiredButtons) {
    if (!flow.requiredButtons.includes(button as any)) {
      findings.push({ level: 'ERROR', flowId: flow.id, message: `Botão obrigatório ausente no flow registry: ${button}.` });
    }
  }

  for (const screen of flow.screens) {
    if (!transitionMap[screen]) {
      findings.push({ level: 'ERROR', flowId: flow.id, message: `Tela não encontrada no mapa de transições: ${screen}.` });
    }
  }

  for (let i = 0; i < flow.screens.length - 1; i += 1) {
    const from = flow.screens[i];
    const to = flow.screens[i + 1];
    const possible = transitionMap[from] || [];
    if (!possible.includes(to)) {
      findings.push({ level: 'ERROR', flowId: flow.id, message: `Transição inválida no fluxo: ${from} -> ${to}.` });
    }
  }

  if (!flow.screens.includes(flow.expectedFinal)) {
    findings.push({ level: 'ERROR', flowId: flow.id, message: `expectedFinal fora da lista de telas: ${flow.expectedFinal}.` });
  }

  if (!transitionMap[flow.fallbackScreen]) {
    findings.push({ level: 'ERROR', flowId: flow.id, message: `fallbackScreen inválida: ${flow.fallbackScreen}.` });
  }

  const finalScreen = flow.screens[flow.screens.length - 1];
  if (finalScreen !== flow.expectedFinal) {
    findings.push({
      level: 'WARN',
      flowId: flow.id,
      message: `Última tela (${finalScreen}) difere de expectedFinal (${flow.expectedFinal}).`,
    });
  }
}

const ok = findings.filter((finding) => finding.level === 'ERROR').length === 0;
// Keep reports deterministic on PASS so the repo doesn't churn due to timestamps.
const payload: Record<string, unknown> = {
  totalFlows: flowRegistry.length,
  ok,
  findings,
};
if (!ok) {
  payload.generatedAt = new Date().toISOString();
}

const reportsDir = path.resolve(process.cwd(), 'reports');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

const outJson = path.join(reportsDir, 'flow_registry_validation.json');
const outMd = path.join(reportsDir, 'flow_registry_validation.md');

fs.writeFileSync(outJson, JSON.stringify(payload, null, 2), 'utf8');

const mdLines = [
  '# Flow Registry Validation',
  '',
  ...(ok ? [] : [`Generated at: ${String(payload.generatedAt)}`]),
  `Total flows: ${payload.totalFlows}`,
  `Status: ${ok ? 'PASS' : 'FAIL'}`,
  '',
  '| Level | Flow | Message |',
  '|---|---|---|',
  ...findings.map((finding) => `| ${finding.level} | ${finding.flowId} | ${finding.message} |`),
];
fs.writeFileSync(outMd, `${mdLines.join('\n')}\n`, 'utf8');

console.log(`flow-registry: ${ok ? 'PASS' : 'FAIL'}`);
console.log(`flow-registry: ${outJson}`);
console.log(`flow-registry: ${outMd}`);

if (!ok) {
  process.exit(1);
}
