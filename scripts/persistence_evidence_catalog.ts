export type FlowPersistenceEvidence = {
  rationale: string;
  evidence: string[];
};

export const FLOW_PERSISTENCE_EVIDENCE: Record<string, FlowPersistenceEvidence> = {
  buscador_marketplace_checkout: {
    rationale: 'Fluxo de receita combina leitura de catálogo + checkout, com contratos de checkout/contexto e marketplace validados em QA.',
    evidence: ['qa/flows/interaction-contracts.spec.ts', 'qa/flows/critical_fixes.spec.ts'],
  },
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
  guardiao_alquimia_criar_oferta: {
    rationale: 'Criação de oferta de escambo validada em integração backend e contratos de ciclo de escambo.',
    evidence: ['backend/src/tests/flows-integration.test.ts', 'qa/flows/interaction-contracts.spec.ts'],
  },
  santuario_time_e_avaliacao_servico: {
    rationale: 'Criação de review (avaliação de serviço) validada em integração backend, com contrato de erro/autenticação.',
    evidence: ['backend/src/tests/flows-integration.test.ts'],
  },
  santuario_analytics_reputacao_chat: {
    rationale: 'Canal de chat do fluxo é persistente e validado em E2E/integração; analytics segue complementar ao fluxo.',
    evidence: ['qa/flows/tribo-support-chat.spec.ts', 'backend/src/tests/flows-integration.test.ts'],
  },
  santuario_pacientes_operacao: {
    rationale: 'Camada de prontuário/consentimento do fluxo é validada por E2E LGPD e integração de records.',
    evidence: ['qa/flows/consent-records.spec.ts', 'backend/src/tests/flows-integration.test.ts'],
  },
  buscador_ritual_diario: {
    rationale: 'Roundtrip API-only (POST→GET) de registro diário foi coberto com evidência explícita de persistência.',
    evidence: ['qa/flows/roundtrip-evidence.spec.ts'],
  },
  buscador_metamorfose_karma_timelapse: {
    rationale: 'Checkpoint de jornada/metamorfose validado por roundtrip API-only com recarga de estado derivado.',
    evidence: ['qa/flows/roundtrip-evidence.spec.ts'],
  },
  buscador_busca_agenda_confirmacao: {
    rationale: 'Ciclo de criação e recarga de item de agenda/oportunidade validado via roundtrip API-only.',
    evidence: ['qa/flows/roundtrip-evidence.spec.ts'],
  },
  buscador_retiro_offline: {
    rationale: 'Ação ligada a retiro offline tem persistência confirmada por create/list em endpoint de suporte ao fluxo.',
    evidence: ['qa/flows/roundtrip-evidence.spec.ts'],
  },
  buscador_pacto_de_alma: {
    rationale: 'Fluxo social/escambo (pacto) validado por roundtrip de criação e reconsulta de oferta.',
    evidence: ['qa/flows/roundtrip-evidence.spec.ts'],
  },
  buscador_jornada_analitica_e_journal: {
    rationale: 'Jornada analítica e journal agora têm evidência explícita de roundtrip API-only.',
    evidence: ['qa/flows/roundtrip-evidence.spec.ts'],
  },
  buscador_metamorfose_ritual_retorno: {
    rationale: 'Retorno ritualizado/memória de jornada validado por roundtrip API-only com recarga.',
    evidence: ['qa/flows/roundtrip-evidence.spec.ts'],
  },
  guardiao_intervencao_clinica: {
    rationale: 'Intervenção clínica validada por roundtrip API-only (salvar→listar).',
    evidence: ['qa/flows/roundtrip-evidence.spec.ts'],
  },
  guardiao_agenda_video: {
    rationale: 'Fluxo de agenda vídeo (convite/resposta) validado por roundtrip de recrutamento e reconsulta de status.',
    evidence: ['qa/flows/roundtrip-evidence.spec.ts'],
  },
  guardiao_financeiro_expandido: {
    rationale: 'Operação monetizável auxiliar do Guardião validada por roundtrip API-only em catálogo persistido.',
    evidence: ['qa/flows/roundtrip-evidence.spec.ts'],
  },
  guardiao_santuarios_parceria: {
    rationale: 'Fluxo de parceria com santuários tem roundtrip explícito via persistência e recarga de avaliações/summary.',
    evidence: ['qa/flows/roundtrip-evidence.spec.ts'],
  },
  santuario_operacao_completa: {
    rationale: 'Operação completa do Santuário validada por roundtrip de recrutamento (apply→interview→response→decision→list).',
    evidence: ['qa/flows/roundtrip-evidence.spec.ts'],
  },
  santuario_salaseestrutura_expandida: {
    rationale: 'Salas/estrutura expandida possui evidência explícita de roundtrip em persistência de catálogo do espaço.',
    evidence: ['qa/flows/roundtrip-evidence.spec.ts'],
  },
  santuario_financeiro_expandido: {
    rationale: 'Financeiro expandido do Santuário possui roundtrip API-only com criação e recarga filtrada.',
    evidence: ['qa/flows/roundtrip-evidence.spec.ts'],
  },
  santuario_marketplace_eventos_retiros: {
    rationale: 'Marketplace de eventos/retiros do Santuário validado por roundtrip explícito em endpoints de marketplace.',
    evidence: ['qa/flows/roundtrip-evidence.spec.ts'],
  },
};
