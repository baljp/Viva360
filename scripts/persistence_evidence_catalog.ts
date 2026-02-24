export type FlowPersistenceEvidence = {
  rationale: string;
  evidence: string[];
};

export const FLOW_PERSISTENCE_EVIDENCE: Record<string, FlowPersistenceEvidence> = {
  buscador_oraculo_completo: {
    rationale: 'Fluxo do Oráculo validado por E2E (abertura/revelação) e integração backend.',
    evidence: ['qa/flows/oracle-flow.spec.ts', 'backend/src/tests/flows-integration.test.ts'],
  },
  buscador_chat_social: {
    rationale: 'Fluxo social/chat usa endpoints /api/chat com persistência validada em E2E e integração.',
    evidence: ['qa/flows/tribo-support-chat.spec.ts', 'backend/src/tests/flows-integration.test.ts'],
  },
  guardiao_tribo_chat: {
    rationale: 'Fluxo de chat do Guardião compartilha endpoints /api/chat cobertos por E2E e integração.',
    evidence: ['qa/flows/tribo-support-chat.spec.ts', 'backend/src/tests/flows-integration.test.ts'],
  },
  guardiao_vagas_completas: {
    rationale: 'Ciclo de recrutamento (candidatura/entrevista/decisão) validado por contratos + integração.',
    evidence: ['qa/flows/interaction-contracts.spec.ts', 'backend/src/tests/flows-integration.test.ts'],
  },
  santuario_vagas_entrevista: {
    rationale: 'Fluxo de vagas/entrevista do Santuário usa /api/recruitment/* validado por contratos + integração.',
    evidence: ['qa/flows/interaction-contracts.spec.ts', 'backend/src/tests/flows-integration.test.ts'],
  },
  santuario_recrutamento_completo: {
    rationale: 'Fluxo completo de recrutamento do Santuário mapeado para endpoints com ciclo validado.',
    evidence: ['qa/flows/interaction-contracts.spec.ts', 'backend/src/tests/flows-integration.test.ts'],
  },
  santuario_avaliacao_servico: {
    rationale: 'Persistência de avaliação de serviço validada em integração backend (criação e contratos de erro).',
    evidence: ['backend/src/tests/flows-integration.test.ts'],
  },
  buscador_circulo_de_cura_checkout: {
    rationale: 'Fluxo de círculo com troca energética depende de checkout/contexto já validado em contratos/QA crítico.',
    evidence: ['qa/flows/interaction-contracts.spec.ts', 'qa/flows/tribo-support-chat.spec.ts'],
  },
};

