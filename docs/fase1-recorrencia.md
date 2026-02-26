# Fase 1 — Recorrência de Agendamentos (Appointment Series)

## Env Vars

### Backend (Vercel / `.env`)
```
VIVA360_RECURRENCE_ENABLED=true    # default false — habilita os endpoints /appointments/series/*
DATABASE_URL=...                   # já existente
DIRECT_URL=...                     # já existente
```

### Frontend (Vite / `.env.local`)
```
VITE_RECURRENCE_ENABLED=true       # default false — mostra o toggle "Repetir" no BookingConfirm
```

> Ambas as flags precisam estar `true` para o fluxo completo funcionar.  
> Com apenas `VITE_RECURRENCE_ENABLED=true` e backend desabilitado, o toggle aparece mas a chamada retorna 501.

---

## Migration

Arquivo: `backend/prisma/migrations/20260226000000_add_appointment_series/migration.sql`

**O que faz:**
- Cria tabela `appointment_series`
- Adiciona colunas nullable em `appointments`: `series_id`, `occurrence_index`, `is_exception`, `original_start_at`
- Cria índice único `(series_id, occurrence_index)` para idempotência (previne duplicatas em retry)
- Cria trigger `set_updated_at` em `appointment_series`

**Rodar em produção (Supabase):**
```sql
-- Cole o conteúdo de migration.sql no SQL Editor do Supabase
-- ou use: npx prisma db execute --file backend/prisma/migrations/20260226000000_add_appointment_series/migration.sql
```

**Regenerar o Prisma Client após a migration:**
```bash
cd backend
DATABASE_URL=... DIRECT_URL=... npx prisma generate
```

---

## Endpoints

Todos protegidos por `authenticateUser`. Base path: `/api/appointments/series`

| Método | Path | Descrição |
|--------|------|-----------|
| `POST` | `/appointments/series/preview` | Pré-visualiza datas + conflitos (sem DB write) |
| `POST` | `/appointments/series` | Cria série + ocorrências |
| `GET`  | `/appointments/series/:id` | Busca série com appointments |
| `PATCH`| `/appointments/series/:id` | 501 em v1 (ver TODO) |
| `DELETE`| `/appointments/series/:id` | Cancela série (soft-cancel) |

Reagendar ocorrência individual: `PATCH /appointments/:id/reschedule` (endpoint já existente, agora marca `is_exception=true` automaticamente para appointments de série).

---

## Como testar localmente

### 1. Gerar o Prisma client
```bash
cd backend
DATABASE_URL=<sua-url> DIRECT_URL=<sua-url> npx prisma generate
```

### 2. Rodar a migration
```bash
cd backend
DATABASE_URL=<sua-url> DIRECT_URL=<sua-url> npx prisma db push
# ou: npx prisma migrate dev
```

### 3. Habilitar as flags
```bash
# backend/.env
VIVA360_RECURRENCE_ENABLED=true

# .env.local (raiz do projeto)
VITE_RECURRENCE_ENABLED=true
```

### 4. Rodar testes unitários
```bash
# Da raiz do projeto
npx vitest run backend/src/services/recurrence.service.spec.ts --reporter=verbose
# 14 testes passam
```

### 5. Smoke test manual (Buscador)
1. Login como Buscador
2. Ir em `Buscar Guardião` → selecionar um pro → `BookingConfirm`
3. Toggle "Repetir esta sessão" deve aparecer
4. Selecionar Semanal / 4x → "Ver próximas datas" → preview com datas e conflitos
5. Confirmar → chama `POST /appointments/series`
6. Refresh → appointments aparecem na agenda (round-trip garantido via `refreshData()`)

### 6. Teste de exceção
```bash
# Reagendar uma ocorrência individual
PATCH /api/appointments/:occurrence_id/reschedule
{ "date": "2026-04-10", "time": "16:00" }
# Resposta deve ter is_exception=true e original_start_at preenchido
```

---

## Arquivos alterados

### Backend
| Arquivo | Ação |
|---------|------|
| `backend/prisma/schema.prisma` | Modelo `AppointmentSeries` + campos em `Appointment` |
| `backend/prisma/migrations/20260226000000_add_appointment_series/migration.sql` | SQL idempotente |
| `backend/src/services/recurrence.service.ts` | **NOVO** — gerador de ocorrências, detectConflicts, createSeries, cancelSeries, previewSeries |
| `backend/src/controllers/series.controller.ts` | **NOVO** — CRUD de série com feature flag |
| `backend/src/routes/series.routes.ts` | **NOVO** — rotas registradas |
| `backend/src/routes/index.ts` | Registra `/appointments/series` |
| `backend/src/services/interaction.service.ts` | `emitSeriesCreated`, `emitSeriesCanceled` |
| `backend/src/services/notificationEngine.service.ts` | Templates `series.created`, `series.canceled` |
| `backend/src/controllers/appointments.controller.ts` | Reschedule agora marca `is_exception=true` para série |

### Frontend
| Arquivo | Ação |
|---------|------|
| `components/RecurrenceToggle.tsx` | **NOVO** — widget completo com toggle, freq, count, preview |
| `views/client/generated/BookingConfirm.tsx` | Integra `RecurrenceToggle` + cria série quando habilitado |
| `services/api.ts` → `api.series.*` | **NOVO** — preview, create, get, cancel |
| `.env.example` | `VITE_RECURRENCE_ENABLED`, `VIVA360_RECURRENCE_ENABLED` |

### Testes
| Arquivo | Cobertura |
|---------|-----------|
| `backend/src/services/recurrence.service.spec.ts` | 14 testes: WEEKLY/BIWEEKLY/MONTHLY, until, count, idempotência de índices, wall-clock, detectConflicts |

---

## Decisões de design

- **Feature flag dupla**: backend retorna 501 quando desabilitado (não quebra FE); FE esconde o toggle completamente.
- **Idempotência**: índice único `(series_id, occurrence_index)` no DB — retry não duplica ocorrências (P2002 é silencioso).
- **`conflictStrategy: 'skip'`**: quando há conflitos e o usuário já viu o preview, conflitos são pulados automaticamente. Sem preview, `fail` retorna lista de conflitos para o FE tratar.
- **`is_exception`**: ao reagendar qualquer ocorrência de série, ela vira exceção preservando `original_start_at`. A série permanece intacta.
- **Timezone**: helper interno sem deps externas. Suporta todos os fusos brasileiros. IANA completo pode ser adicionado via `luxon` depois sem breaking change.
- **PATCH série (v1)**: retorna 501 com mensagem clara. Reagendamento de série "a partir de data X" é complexo e foi deixado como TODO documentado.
