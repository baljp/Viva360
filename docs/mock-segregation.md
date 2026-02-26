# Arquitetura de Segregação Mock/Produção

## Estrutura após a segregação

```
src/data/
├── soulCards.ts          ← PRODUÇÃO
├── journeys.ts           ← PRODUÇÃO
├── mockSoulCards.ts      ← LEGADO: re-export @deprecated
├── mockJourneys.ts       ← LEGADO: re-export @deprecated
└── test/
    ├── README.md
    ├── index.ts              ← Ponto único de entrada para dados de teste
    ├── soulCards.test-data.ts
    └── journeys.test-data.ts
```

## Regra de ouro

Imports de `src/data/test/*` em views/ só com guard:

```ts
// ✅ Correto
const fallback = import.meta.env.VITE_MOCK_ENABLED === 'true' ? TEST_ROOMS : [];

// ❌ Proibido
const rooms = TEST_ROOMS;
```

Dados de fallback em dev têm sufixo **[Demo]** para identificação visual.
