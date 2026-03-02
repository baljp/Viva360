/**
 * appMode.ts — Feature flag central para modo de execução
 *
 * ÚNICA fonte de verdade para saber se o backend está em MOCK / DEMO / PROD.
 * Todos os controllers e services devem importar daqui em vez de verificar
 * process.env diretamente ou importar de supabase.service.
 *
 * Hierarquia de decisão (da mais específica para a mais geral):
 *   1. process.env.NODE_ENV = 'test'  → MOCK (ambientes de CI)
 *   2. process.env.APP_MODE = 'mock' + ENABLE_TEST_MODE=true → MOCK (somente harness de teste, nunca runtime real)
 *   3. Qualquer outro caso            → PROD
 *
 * Semântica:
 *   isMock()  — dados em memória, sem banco, sem autenticação real
 *   isDemo()  — banco real com dados de demonstração prefixados "[Demo]"
 *   isProd()  — produção normal
 */

const raw = String(process.env.APP_MODE || '').trim().toUpperCase();
const explicitTestMode = String(process.env.ENABLE_TEST_MODE || '').trim().toLowerCase() === 'true';
const isNonProd = process.env.NODE_ENV !== 'production';
const isTestEnv = process.env.NODE_ENV === 'test';
const isExplicitMock = raw === 'MOCK' && isNonProd && explicitTestMode;
const isExplicitDemo = raw === 'DEMO';

export type AppMode = 'MOCK' | 'DEMO' | 'PROD';

export const APP_MODE: AppMode =
  isExplicitMock || isTestEnv ? 'MOCK'
  : isExplicitDemo ? 'DEMO'
  : 'PROD';

/** Backend está usando dados em memória — sem banco, sem Supabase real */
export const isMock = (): boolean => APP_MODE === 'MOCK';

/** Backend usa banco real mas dados marcados como [Demo] */
export const isDemo = (): boolean => APP_MODE === 'DEMO';

/** Produção normal */
export const isProd = (): boolean => APP_MODE === 'PROD';

/** Alias mantido para compatibilidade com imports existentes */
export const isMockMode = isMock;
