type DomainKey =
  | 'marketplace'
  | 'finance'
  | 'notifications'
  | 'vacancies'
  | 'appointments'
  | 'spaces'
  | 'team'
  | 'products'
  | 'professionals'
  | 'chat'
  | string;

const domainLabels: Record<string, string> = {
  marketplace: 'Marketplace',
  finance: 'Financeiro',
  notifications: 'Notificações',
  vacancies: 'Vagas',
  appointments: 'Agenda',
  spaces: 'Salas',
  team: 'Equipe',
  products: 'Produtos',
  professionals: 'Guardiões',
  chat: 'Conversas',
};

export const readDomainLabel = (domain: DomainKey) => domainLabels[domain] || domain;

interface ApiError {
  code?: string;
  status?: number;
  details?: {
    code?: string;
    status?: number;
  };
}

export const getReadErrorMeta = (error: unknown) => {
  const err = error as ApiError;
  const code = String(err?.code || err?.details?.code || '').toUpperCase();
  const status = Number(err?.status || err?.details?.status || 0);
  return { code, status };
};

export const isDegradedReadError = (error: unknown) => {
  const { code, status } = getReadErrorMeta(error);
  return code === 'DATA_SOURCE_UNAVAILABLE' || status === 503;
};

export const buildDegradedRetryCopy = (domains: DomainKey[], partial: boolean) => {
  const names = Array.from(new Set(domains.map(readDomainLabel)));
  const list = names.length <= 1
    ? (names[0] || 'dados')
    : `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;

  return {
    title: partial ? 'Dados parcialmente indisponíveis' : 'Dados temporariamente indisponíveis',
    message: partial
      ? `${list} estão em modo degradado. Alguns dados foram mantidos localmente. Toque em Atualizar para tentar novamente.`
      : `${list} estão temporariamente indisponíveis. Toque em Atualizar para tentar novamente.`,
  };
};

export const buildReadFailureCopy = (domains: DomainKey[], partial: boolean) => {
  if (domains.length === 0) {
    return {
      title: 'Falha ao atualizar',
      message: partial
        ? 'Alguns dados não puderam ser atualizados. Toque em Atualizar para tentar novamente.'
        : 'Não foi possível carregar os dados agora. Toque em Atualizar para tentar novamente.',
    };
  }
  return buildDegradedRetryCopy(domains, partial);
};
