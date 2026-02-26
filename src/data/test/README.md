# 🧪 Test Data — `src/data/test/`

Este diretório contém **exclusivamente dados de demonstração e teste**,
separados do código de produção.

## Regra fundamental

```
NÃO importar nenhum arquivo deste diretório em código de produção
sem antes verificar a flag VITE_MOCK_ENABLED.
```

## Quando usar

```ts
// ✅ Correto — protegido por flag de ambiente
const fallback = import.meta.env.VITE_MOCK_ENABLED === 'true'
  ? TEST_PATIENTS
  : [];

// ❌ Errado — importação direta em views de produção
import { TEST_PATIENTS } from 'src/data/test';
const patients = TEST_PATIENTS;
```

## Arquivos

| Arquivo | Conteúdo |
|---|---|
| `soulCards.test-data.ts` | Soul cards extras para QA/preview |
| `journeys.test-data.ts` | Jornadas extras para QA/preview |
| `index.ts` | Re-exports centralizados + dados de usuários demo |

## Dados de usuários (TEST_USERS)

| Email | Senha | Perfil |
|---|---|---|
| `client0@viva360.com` | `123456` | Buscador Teste |
| `pro0@viva360.com` | `123456` | Guardião Teste |
| `contato.hub0@viva360.com` | `123456` | Santuário Teste |
| `admin@viva360.com` | `123456` | Admin Viva360 |

## Ativar modo test localmente

`.env.local`:
```
VITE_MOCK_ENABLED=true
```
