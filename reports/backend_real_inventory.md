# Backend Real Inventory

Gerado em: 2026-03-06T01:51:25.695Z

## Resumo

- Endpoints mapeados: 184
- Contratos frontend -> backend mapeados: 134
- Telas únicas mapeadas: 113
- Telas com backend envolvido: 104
- Telas client-only intencionais: 9
- Telas com evidência crítica validada: 104
- Telas com backend esperado sem evidência automatizada: 0
- Placeholder residual nos hotspots auditados: 0

## Endpoints

| Método | Path | Arquivo |
|---|---|---|
| GET | `/admin/dashboard` | `backend/src/routes/admin.routes.ts` |
| GET | `/admin/executive/metrics` | `backend/src/routes/executive.routes.ts` |
| GET | `/admin/finance/global` | `backend/src/routes/admin.routes.ts` |
| GET | `/admin/lgpd/audit` | `backend/src/routes/admin.routes.ts` |
| GET | `/admin/marketplace/offers` | `backend/src/routes/admin.routes.ts` |
| GET | `/admin/metrics` | `backend/src/routes/admin.routes.ts` |
| GET | `/admin/metrics/guardians` | `backend/src/routes/admin.routes.ts` |
| GET | `/admin/metrics/sanctuaries` | `backend/src/routes/admin.routes.ts` |
| GET | `/admin/metrics/seekers` | `backend/src/routes/admin.routes.ts` |
| GET | `/admin/system/health` | `backend/src/routes/admin.routes.ts` |
| GET | `/admin/users` | `backend/src/routes/admin.routes.ts` |
| POST | `/admin/users/:id/block` | `backend/src/routes/admin.routes.ts` |
| GET | `/alchemy/offers` | `backend/src/routes/alchemy.routes.ts` |
| POST | `/alchemy/offers` | `backend/src/routes/alchemy.routes.ts` |
| POST | `/alchemy/offers/:id/accept` | `backend/src/routes/alchemy.routes.ts` |
| POST | `/alchemy/offers/:id/complete` | `backend/src/routes/alchemy.routes.ts` |
| POST | `/alchemy/offers/:id/counter` | `backend/src/routes/alchemy.routes.ts` |
| POST | `/alchemy/offers/:id/reject` | `backend/src/routes/alchemy.routes.ts` |
| GET | `/appointments/` | `backend/src/routes/appointments.routes.ts` |
| POST | `/appointments/` | `backend/src/routes/appointments.routes.ts` |
| PATCH | `/appointments/:id` | `backend/src/routes/appointments.routes.ts` |
| PATCH | `/appointments/:id/cancel` | `backend/src/routes/appointments.routes.ts` |
| PATCH | `/appointments/:id/reschedule` | `backend/src/routes/appointments.routes.ts` |
| GET | `/appointments/me` | `backend/src/routes/appointments.routes.ts` |
| POST | `/appointments/series/` | `backend/src/routes/series.routes.ts` |
| DELETE | `/appointments/series/:id` | `backend/src/routes/series.routes.ts` |
| GET | `/appointments/series/:id` | `backend/src/routes/series.routes.ts` |
| PATCH | `/appointments/series/:id` | `backend/src/routes/series.routes.ts` |
| POST | `/appointments/series/preview` | `backend/src/routes/series.routes.ts` |
| GET | `/audit/logs` | `backend/src/routes/audit.routes.ts` |
| DELETE | `/auth/account` | `backend/src/routes/auth.routes.ts` |
| POST | `/auth/add-role` | `backend/src/routes/auth.routes.ts` |
| POST | `/auth/forgot-password` | `backend/src/routes/auth.routes.ts` |
| POST | `/auth/login` | `backend/src/routes/auth.routes.ts` |
| POST | `/auth/logout` | `backend/src/routes/auth.routes.ts` |
| POST | `/auth/oauth/ensure-profile` | `backend/src/routes/auth.routes.ts` |
| POST | `/auth/precheck-login` | `backend/src/routes/auth.routes.ts` |
| POST | `/auth/register` | `backend/src/routes/auth.routes.ts` |
| POST | `/auth/reset-password` | `backend/src/routes/auth.routes.ts` |
| GET | `/auth/roles` | `backend/src/routes/auth.routes.ts` |
| POST | `/auth/select-role` | `backend/src/routes/auth.routes.ts` |
| GET | `/auth/session` | `backend/src/routes/auth.routes.ts` |
| POST | `/auth/session/cookie` | `backend/src/routes/auth.routes.ts` |
| GET | `/calendar/` | `backend/src/routes/calendar.routes.ts` |
| POST | `/calendar/` | `backend/src/routes/calendar.routes.ts` |
| DELETE | `/calendar/:id` | `backend/src/routes/calendar.routes.ts` |
| GET | `/calendar/:id` | `backend/src/routes/calendar.routes.ts` |
| PATCH | `/calendar/:id` | `backend/src/routes/calendar.routes.ts` |
| GET | `/calendar/sync` | `backend/src/routes/calendar.routes.ts` |
| GET | `/chat/history` | `backend/src/routes/chat.routes.ts` |
| GET | `/chat/rooms` | `backend/src/routes/chat.routes.ts` |
| DELETE | `/chat/rooms/:roomId/leave` | `backend/src/routes/chat.routes.ts` |
| GET | `/chat/rooms/:roomId/messages` | `backend/src/routes/chat.routes.ts` |
| POST | `/chat/rooms/:roomId/messages` | `backend/src/routes/chat.routes.ts` |
| POST | `/chat/rooms/:roomId/mute` | `backend/src/routes/chat.routes.ts` |
| GET | `/chat/rooms/:roomId/settings` | `backend/src/routes/chat.routes.ts` |
| POST | `/chat/rooms/join` | `backend/src/routes/chat.routes.ts` |
| POST | `/chat/send` | `backend/src/routes/chat.routes.ts` |
| POST | `/chat/start` | `backend/src/routes/chat.routes.ts` |
| POST | `/checkout/contextual` | `backend/src/routes/checkout.routes.ts` |
| POST | `/checkout/pay` | `backend/src/routes/checkout.routes.ts` |
| POST | `/checkout/providers/stripe/webhook` | `backend/src/routes/index.ts` |
| GET | `/checkout/transactions/:transactionId/status` | `backend/src/routes/checkout.routes.ts` |
| GET | `/clinical/interventions` | `backend/src/routes/clinical.routes.ts` |
| POST | `/clinical/interventions` | `backend/src/routes/clinical.routes.ts` |
| GET | `/finance/client/summary` | `backend/src/routes/finance.routes.ts` |
| POST | `/finance/donate` | `backend/src/routes/finance.routes.ts` |
| GET | `/finance/export` | `backend/src/routes/finance.routes.ts` |
| POST | `/finance/reinvest` | `backend/src/routes/finance.routes.ts` |
| GET | `/finance/summary` | `backend/src/routes/finance.routes.ts` |
| GET | `/finance/transactions` | `backend/src/routes/finance.routes.ts` |
| POST | `/finance/withdraw` | `backend/src/routes/finance.routes.ts` |
| POST | `/gamification/achievements/sync` | `backend/src/routes/gamification.routes.ts` |
| GET | `/gamification/history` | `backend/src/routes/gamification.routes.ts` |
| GET | `/gamification/leaderboard` | `backend/src/routes/gamification.routes.ts` |
| GET | `/gamification/leaderboard/seasonal` | `backend/src/routes/gamification.routes.ts` |
| POST | `/gamification/quests/:questId/complete` | `backend/src/routes/gamification.routes.ts` |
| GET | `/gamification/state` | `backend/src/routes/gamification.routes.ts` |
| POST | `/invites/accept` | `backend/src/routes/invites.routes.ts` |
| POST | `/invites/create` | `backend/src/routes/invites.routes.ts` |
| GET | `/invites/resolve/:token` | `backend/src/routes/invites.routes.ts` |
| GET | `/journal/` | `backend/src/routes/journal.routes.ts` |
| POST | `/journal/` | `backend/src/routes/journal.routes.ts` |
| GET | `/journal/stats` | `backend/src/routes/journal.routes.ts` |
| GET | `/marketplace/` | `backend/src/routes/marketplace.routes.ts` |
| POST | `/marketplace/` | `backend/src/routes/marketplace.routes.ts` |
| DELETE | `/marketplace/:id` | `backend/src/routes/marketplace.routes.ts` |
| GET | `/marketplace/products` | `backend/src/routes/marketplace.routes.ts` |
| POST | `/marketplace/products` | `backend/src/routes/marketplace.routes.ts` |
| DELETE | `/marketplace/products/:id` | `backend/src/routes/marketplace.routes.ts` |
| POST | `/marketplace/purchase` | `backend/src/routes/marketplace.routes.ts` |
| POST | `/metamorphosis/checkin` | `backend/src/routes/metamorphosis.routes.ts` |
| GET | `/metamorphosis/evolution` | `backend/src/routes/metamorphosis.routes.ts` |
| GET | `/notifications/` | `backend/src/routes/notifications.routes.ts` |
| POST | `/notifications/:id/read` | `backend/src/routes/notifications.routes.ts` |
| DELETE | `/notifications/push/subscribe` | `backend/src/routes/notifications.routes.ts` |
| POST | `/notifications/push/subscribe` | `backend/src/routes/notifications.routes.ts` |
| GET | `/notifications/push/vapid-key` | `backend/src/routes/notifications.routes.ts` |
| POST | `/notifications/read-all` | `backend/src/routes/notifications.routes.ts` |
| POST | `/oracle/draw` | `backend/src/routes/oracle.routes.ts` |
| GET | `/oracle/history` | `backend/src/routes/oracle.routes.ts` |
| GET | `/oracle/today` | `backend/src/routes/oracle.routes.ts` |
| GET | `/ping` | `backend/src/routes/index.ts` |
| GET | `/presence/` | `backend/src/routes/presence.routes.ts` |
| GET | `/presence/:guardianId` | `backend/src/routes/presence.routes.ts` |
| POST | `/presence/batch` | `backend/src/routes/presence.routes.ts` |
| GET | `/presence/me` | `backend/src/routes/presence.routes.ts` |
| POST | `/presence/offline` | `backend/src/routes/presence.routes.ts` |
| POST | `/presence/online` | `backend/src/routes/presence.routes.ts` |
| POST | `/presence/ping` | `backend/src/routes/presence.routes.ts` |
| POST | `/profileLinks/` | `backend/src/routes/profileLinks.routes.ts` |
| DELETE | `/profileLinks/:id` | `backend/src/routes/profileLinks.routes.ts` |
| POST | `/profileLinks/:id/accept` | `backend/src/routes/profileLinks.routes.ts` |
| POST | `/profileLinks/:id/reject` | `backend/src/routes/profileLinks.routes.ts` |
| GET | `/profileLinks/check/:targetId` | `backend/src/routes/profileLinks.routes.ts` |
| GET | `/profileLinks/me` | `backend/src/routes/profileLinks.routes.ts` |
| GET | `/profileLinks/pending` | `backend/src/routes/profileLinks.routes.ts` |
| GET | `/profiles/` | `backend/src/routes/profile.routes.ts` |
| POST | `/profiles/:id/boost` | `backend/src/routes/profile.routes.ts` |
| GET | `/profiles/:id/metrics` | `backend/src/routes/profile.routes.ts` |
| GET | `/profiles/:id/space-patients` | `backend/src/routes/profile.routes.ts` |
| GET | `/profiles/lookup` | `backend/src/routes/profile.routes.ts` |
| GET | `/profiles/me` | `backend/src/routes/profile.routes.ts` |
| PATCH | `/profiles/me` | `backend/src/routes/profile.routes.ts` |
| GET | `/profiles/search` | `backend/src/routes/profile.routes.ts` |
| GET | `/records/` | `backend/src/routes/records.routes.ts` |
| POST | `/records/` | `backend/src/routes/records.routes.ts` |
| GET | `/records/:patientId` | `backend/src/routes/records.routes.ts` |
| PATCH | `/records/:recordId` | `backend/src/routes/records.routes.ts` |
| GET | `/records/access` | `backend/src/routes/records.routes.ts` |
| GET | `/records/export` | `backend/src/routes/records.routes.ts` |
| POST | `/records/grant` | `backend/src/routes/records.routes.ts` |
| POST | `/records/revoke` | `backend/src/routes/records.routes.ts` |
| GET | `/recruitment/applications` | `backend/src/routes/recruitment.routes.ts` |
| POST | `/recruitment/applications` | `backend/src/routes/recruitment.routes.ts` |
| POST | `/recruitment/applications/:id/decision` | `backend/src/routes/recruitment.routes.ts` |
| POST | `/recruitment/applications/:id/interview` | `backend/src/routes/recruitment.routes.ts` |
| POST | `/recruitment/interviews/:id/respond` | `backend/src/routes/recruitment.routes.ts` |
| POST | `/reviews/` | `backend/src/routes/reviews.routes.ts` |
| GET | `/reviews/:spaceId` | `backend/src/routes/reviews.routes.ts` |
| GET | `/reviews/:spaceId/summary` | `backend/src/routes/reviews.routes.ts` |
| GET | `/rituals/` | `backend/src/routes/rituals.routes.ts` |
| POST | `/rituals/` | `backend/src/routes/rituals.routes.ts` |
| GET | `/rituals/:period` | `backend/src/routes/rituals.routes.ts` |
| POST | `/rituals/:period/:id/toggle` | `backend/src/routes/rituals.routes.ts` |
| GET | `/rooms/` | `backend/src/routes/rooms.routes.ts` |
| PATCH | `/rooms/:id` | `backend/src/routes/rooms.routes.ts` |
| PATCH | `/rooms/:id/status` | `backend/src/routes/rooms.routes.ts` |
| GET | `/rooms/analytics` | `backend/src/routes/rooms.routes.ts` |
| GET | `/rooms/real-time` | `backend/src/routes/rooms.routes.ts` |
| GET | `/rooms/vacancies` | `backend/src/routes/rooms.routes.ts` |
| POST | `/rooms/vacancies` | `backend/src/routes/rooms.routes.ts` |
| GET | `/soulCards/collection` | `backend/src/routes/soulCards.routes.ts` |
| POST | `/soulCards/draw` | `backend/src/routes/soulCards.routes.ts` |
| GET | `/spaces/` | `backend/src/routes/space.routes.ts` |
| GET | `/spaces/analytics` | `backend/src/routes/space.routes.ts` |
| GET | `/spaces/contract` | `backend/src/routes/space.routes.ts` |
| POST | `/spaces/invites` | `backend/src/routes/space.routes.ts` |
| GET | `/spaces/patients` | `backend/src/routes/space.routes.ts` |
| GET | `/spaces/patients/:id` | `backend/src/routes/space.routes.ts` |
| GET | `/spaces/retreats` | `backend/src/routes/space.routes.ts` |
| POST | `/spaces/retreats` | `backend/src/routes/space.routes.ts` |
| GET | `/spaces/reviews` | `backend/src/routes/space.routes.ts` |
| POST | `/spaces/rooms` | `backend/src/routes/space.routes.ts` |
| GET | `/spaces/rooms/:roomId/agenda` | `backend/src/routes/space.routes.ts` |
| GET | `/spaces/team` | `backend/src/routes/space.routes.ts` |
| POST | `/tribe/invite` | `backend/src/routes/tribe.routes.ts` |
| GET | `/tribe/invites` | `backend/src/routes/tribe.routes.ts` |
| POST | `/tribe/invites/:id/respond` | `backend/src/routes/tribe.routes.ts` |
| POST | `/tribe/join` | `backend/src/routes/tribe.routes.ts` |
| GET | `/tribe/members` | `backend/src/routes/tribe.routes.ts` |
| GET | `/tribe/pacts/active` | `backend/src/routes/tribe.routes.ts` |
| GET | `/tribe/posts` | `backend/src/routes/tribe.routes.ts` |
| POST | `/tribe/posts` | `backend/src/routes/tribe.routes.ts` |
| POST | `/tribe/posts/:id/like` | `backend/src/routes/tribe.routes.ts` |
| GET | `/tribe/presence` | `backend/src/routes/tribe.routes.ts` |
| POST | `/tribe/sync` | `backend/src/routes/tribe.routes.ts` |
| GET | `/users/:id` | `backend/src/routes/users.routes.ts` |
| PUT | `/users/:id` | `backend/src/routes/users.routes.ts` |
| GET | `/users/:id/evolution/metrics` | `backend/src/routes/users.routes.ts` |
| POST | `/users/:id/water` | `backend/src/routes/users.routes.ts` |
| POST | `/users/bless` | `backend/src/routes/users.routes.ts` |
| GET | `/users/me/export` | `backend/src/routes/users.routes.ts` |
| POST | `/video/token` | `backend/src/routes/video.routes.ts` |

## Telas Com Backend

| Perfil | Tela | Persistência | Escopo | Endpoints |
|---|---|---|---|---|
| BUSCADOR | START | P2 | critico_validado | `/api/*`, `/api/appointments/*`, `/api/auth/roles`, `/api/auth/select-role`, `/api/checkout/contextual`, `/api/finance/*`, `/api/marketplace/*`, `/api/oracle/*`, `/api/soulgarden/*`, `/api/tribe/*`, `/api/users/:id` |
| BUSCADOR | DASHBOARD | P2 | critico_validado | `/api/*`, `/api/appointments/*`, `/api/auth/roles`, `/api/auth/select-role`, `/api/chat/*`, `/api/checkout/contextual`, `/api/finance/*`, `/api/marketplace/*`, `/api/metamorphosis/*`, `/api/metamorphosis/checkin`, `/api/metamorphosis/evolution`, `/api/oracle/*`, `/api/oracle/history`, `/api/soulgarden/*`, `/api/tribe/*`, `/api/users/:id` |
| BUSCADOR | ORACLE_PORTAL | P2 | critico_validado | `/api/oracle/*` |
| BUSCADOR | ORACLE_SHUFFLE | P2 | critico_validado | `/api/oracle/*` |
| BUSCADOR | ORACLE_REVEAL | P2 | critico_validado | `/api/oracle/*` |
| BUSCADOR | ORACLE_HISTORY | P2 | critico_validado | `/api/oracle/*` |
| BUSCADOR | METAMORPHOSIS_CHECKIN | P2 | critico_validado | `/api/metamorphosis/*`, `/api/metamorphosis/checkin`, `/api/soulgarden/*` |
| BUSCADOR | METAMORPHOSIS_CAMERA | P2 | critico_validado | `/api/metamorphosis/checkin`, `/api/soulgarden/*` |
| BUSCADOR | METAMORPHOSIS_MESSAGE | P2 | critico_validado | `/api/metamorphosis/checkin`, `/api/soulgarden/*` |
| BUSCADOR | METAMORPHOSIS_RITUAL | P2 | critico_validado | `/api/metamorphosis/*`, `/api/soulgarden/*` |
| BUSCADOR | METAMORPHOSIS_FEEDBACK | P2 | critico_validado | `/api/metamorphosis/checkin`, `/api/soulgarden/*` |
| BUSCADOR | TRIBE_DASH | P2 | critico_validado | `/api/calendar`, `/api/chat/*`, `/api/checkout/pay`, `/api/invites/create`, `/api/notifications/*`, `/api/tribe/*`, `/api/tribe/sync` |
| BUSCADOR | TRIBE_INVITE | P2 | critico_validado | `/api/chat/*`, `/api/tribe/*` |
| BUSCADOR | TRIBE_INTERACTION | P2 | critico_validado | `/api/chat/*`, `/api/tribe/*` |
| BUSCADOR | BOOKING_SEARCH | P2 | critico_validado | `/api/appointments/*`, `/api/checkout/pay`, `/api/notifications/*` |
| BUSCADOR | BOOKING_SELECT | P2 | critico_validado | `/api/appointments/*`, `/api/checkout/pay`, `/api/notifications/*` |
| BUSCADOR | BOOKING_CONFIRM | P2 | critico_validado | `/api/appointments/*`, `/api/checkout/contextual`, `/api/checkout/pay`, `/api/notifications/*` |
| BUSCADOR | CHECKOUT | P2 | critico_validado | `/api/appointments/*`, `/api/calendar`, `/api/checkout/contextual`, `/api/checkout/pay`, `/api/marketplace/products`, `/api/notifications/*` |
| BUSCADOR | PAYMENT_SUCCESS | P2 | critico_validado | `/api/appointments/*`, `/api/calendar`, `/api/checkout/contextual`, `/api/checkout/pay`, `/api/marketplace/products`, `/api/notifications/*` |
| BUSCADOR | HISTORY | P2 | critico_validado | `/api/*`, `/api/metamorphosis/*`, `/api/metamorphosis/checkin`, `/api/oracle/*`, `/api/oracle/history`, `/api/soulgarden/*` |
| BUSCADOR | PAYMENT_HISTORY | P2 | critico_validado | `/api/checkout/contextual`, `/api/checkout/pay`, `/api/marketplace/products` |
| BUSCADOR | CHAT_LIST | P2 | critico_validado | `/api/chat/*`, `/api/tribe/*` |
| BUSCADOR | CHAT_ROOM | P2 | critico_validado | `/api/chat/*`, `/api/tribe/*` |
| BUSCADOR | CHAT_SETTINGS | P2 | critico_validado | `/api/chat/*`, `/api/tribe/*` |
| BUSCADOR | CHAT_NEW | P2 | critico_validado | `/api/chat/*`, `/api/tribe/*` |
| BUSCADOR | EVOLUTION | P2 | critico_validado | `/api/appointments/*`, `/api/metamorphosis/*`, `/api/metamorphosis/evolution`, `/api/oracle/history`, `/api/soulgarden/*`, `/api/tribe/*` |
| BUSCADOR | EVOLUTION_ANALYTICS | P2 | critico_validado | `/api/metamorphosis/*`, `/api/oracle/history`, `/api/soulgarden/*` |
| BUSCADOR | EVOLUTION_ACHIEVEMENTS | P2 | critico_validado | `/api/metamorphosis/*`, `/api/oracle/history`, `/api/soulgarden/*` |
| BUSCADOR | EVOLUTION_HISTORY | P2 | critico_validado | `/api/metamorphosis/*`, `/api/oracle/history`, `/api/soulgarden/*` |
| BUSCADOR | EVOLUTION_TIMELAPSE | P2 | critico_validado | `/api/metamorphosis/evolution`, `/api/oracle/history`, `/api/soulgarden/*` |
| BUSCADOR | TIME_LAPSE_EXPERIENCE | P2 | critico_validado | `/api/metamorphosis/evolution`, `/api/oracle/history`, `/api/soulgarden/*` |
| BUSCADOR | SETTINGS | P2 | critico_validado | `/api/*`, `/api/auth/roles`, `/api/auth/select-role`, `/api/finance/*`, `/api/users/:id` |
| BUSCADOR | MARKETPLACE | P2 | critico_validado | `/api/checkout/contextual`, `/api/checkout/pay`, `/api/marketplace/*`, `/api/marketplace/products` |
| BUSCADOR | CLIENT_JOURNAL | P2 | critico_validado | `/api/*`, `/api/appointments/*`, `/api/metamorphosis/*`, `/api/oracle/history`, `/api/soulgarden/*`, `/api/tribe/*` |
| BUSCADOR | HEALING_CIRCLE | P2 | critico_validado | `/api/*`, `/api/calendar`, `/api/checkout/contextual`, `/api/checkout/pay`, `/api/tribe/*` |
| BUSCADOR | VIDEO_SESSION | P2 | critico_validado | `/api/*`, `/api/appointments/*`, `/api/checkout/pay`, `/api/notifications/*` |
| BUSCADOR | SOUL_PACT | P2 | critico_validado | `/api/*`, `/api/invites/create`, `/api/tribe/*` |
| BUSCADOR | OFFLINE_RETREAT | P2 | critico_validado | `/api/*`, `/api/notifications/*`, `/api/tribe/*`, `/api/tribe/sync` |
| BUSCADOR | END | P2 | critico_validado | `/api/*`, `/api/auth/roles`, `/api/auth/select-role`, `/api/finance/*`, `/api/users/:id` |
| GUARDIAO | START | P2 | critico_validado | `/api/*`, `/api/alchemy/offers/*`, `/api/appointments/*`, `/api/auth/roles`, `/api/auth/select-role`, `/api/chat/*`, `/api/finance/*`, `/api/professionals/*`, `/api/records/*`, `/api/recruitment/*`, `/api/tribe/*`, `/api/users/:id` |
| GUARDIAO | DASHBOARD | P2 | critico_validado | `/api/*`, `/api/alchemy/offers/*`, `/api/appointments/*`, `/api/auth/roles`, `/api/auth/select-role`, `/api/chat/*`, `/api/clinical/interventions`, `/api/finance/*`, `/api/marketplace/products`, `/api/professionals/*`, `/api/records/*`, `/api/recruitment/*`, `/api/spaces/*`, `/api/tribe/*`, `/api/users/:id` |
| GUARDIAO | AGENDA_VIEW | P2 | critico_validado | `/api/appointments/*` |
| GUARDIAO | AGENDA_CONFIRM | P2 | critico_validado | `/api/appointments/*` |
| GUARDIAO | AGENDA_EDIT | P2 | critico_validado | `/api/appointments/*` |
| GUARDIAO | VIDEO_SESSION | P2 | critico_validado | `/api/*`, `/api/appointments/*` |
| GUARDIAO | PATIENTS_LIST | P2 | critico_validado | `/api/alchemy/*`, `/api/professionals/*`, `/api/records/*` |
| GUARDIAO | PATIENT_PROFILE | P2 | critico_validado | `/api/professionals/*`, `/api/records/*` |
| GUARDIAO | PATIENT_RECORDS | P2 | critico_validado | `/api/professionals/*`, `/api/records/*` |
| GUARDIAO | FINANCE_OVERVIEW | P2 | critico_validado | `/api/*`, `/api/finance/*` |
| GUARDIAO | FINANCE_DETAILS | P2 | critico_validado | `/api/*`, `/api/finance/*` |
| GUARDIAO | FINANCIAL_DASHBOARD | P2 | critico_validado | `/api/*`, `/api/finance/*` |
| GUARDIAO | TRIBE_PRO | P2 | critico_validado | `/api/alchemy/offers/*`, `/api/chat/*`, `/api/tribe/*` |
| GUARDIAO | TRIBE_CHAT | P2 | critico_validado | `/api/chat/*`, `/api/tribe/*` |
| GUARDIAO | CHAT_LIST | P2 | critico_validado | `/api/chat/*`, `/api/tribe/*` |
| GUARDIAO | CHAT_ROOM | P2 | critico_validado | `/api/chat/*`, `/api/tribe/*` |
| GUARDIAO | ESCAMBO_MARKET | P2 | critico_validado | `/api/alchemy/*`, `/api/alchemy/offers/*`, `/api/chat/*`, `/api/marketplace/products`, `/api/records/*` |
| GUARDIAO | ALQUIMIA_CREATE | P2 | critico_validado | `/api/alchemy/offers/*`, `/api/marketplace/products`, `/api/tribe/*` |
| GUARDIAO | ESCAMBO_PROPOSE | P2 | critico_validado | `/api/alchemy/offers/*`, `/api/chat/*`, `/api/tribe/*` |
| GUARDIAO | ESCAMBO_CONFIRM | P2 | critico_validado | `/api/alchemy/*`, `/api/alchemy/offers/*`, `/api/chat/*`, `/api/records/*` |
| GUARDIAO | VAGAS_LIST | P2 | critico_validado | `/api/recruitment/*` |
| GUARDIAO | VAGA_DETAILS | P2 | critico_validado | `/api/recruitment/*` |
| GUARDIAO | VAGA_APPLY | P2 | critico_validado | `/api/recruitment/*` |
| GUARDIAO | SANTUARIO_LIST | P2 | critico_validado | `/api/*`, `/api/spaces/*` |
| GUARDIAO | SANTUARIO_PROFILE | P2 | critico_validado | `/api/*`, `/api/spaces/*` |
| GUARDIAO | SANTUARIO_CONTRACT | P2 | critico_validado | `/api/*`, `/api/spaces/*` |
| GUARDIAO | SETTINGS | P2 | critico_validado | `/api/*`, `/api/auth/roles`, `/api/auth/select-role`, `/api/finance/*`, `/api/users/:id` |
| GUARDIAO | PATIENT_PLAN | P2 | critico_validado | `/api/alchemy/*`, `/api/professionals/*`, `/api/records/*` |
| GUARDIAO | ESCAMBO_TRADE | P2 | critico_validado | `/api/alchemy/*`, `/api/alchemy/offers/*`, `/api/records/*` |
| GUARDIAO | VIDEO_PREP | P2 | critico_validado | `/api/*`, `/api/appointments/*` |
| GUARDIAO | CUSTOM_INTERVENTION | P2 | critico_validado | `/api/*`, `/api/clinical/interventions` |
| GUARDIAO | END | P2 | critico_validado | `/api/*`, `/api/auth/roles`, `/api/auth/select-role`, `/api/finance/*`, `/api/users/:id` |
| SANTUARIO | START | P2 | critico_validado | `/api/*`, `/api/appointments/*`, `/api/chat/*`, `/api/marketplace/*`, `/api/records/*`, `/api/recruitment/*`, `/api/spaces/*` |
| SANTUARIO | EXEC_DASHBOARD | P2 | critico_validado | `/api/*`, `/api/analytics/*`, `/api/appointments/*`, `/api/chat/*`, `/api/events/*`, `/api/finance/*`, `/api/marketplace/*`, `/api/records/*`, `/api/recruitment/*`, `/api/reviews/*`, `/api/rooms/*`, `/api/spaces/*` |
| SANTUARIO | PROS_LIST | P2 | critico_validado | `/api/*`, `/api/finance/*`, `/api/reviews/*`, `/api/rooms/*`, `/api/spaces/*` |
| SANTUARIO | PRO_PROFILE | P2 | critico_validado | `/api/*`, `/api/reviews/*`, `/api/spaces/*` |
| SANTUARIO | PRO_PERFORMANCE | P2 | critico_validado | `/api/*`, `/api/reviews/*`, `/api/spaces/*` |
| SANTUARIO | PATIENTS_LIST | P2 | critico_validado | `/api/appointments/*`, `/api/records/*`, `/api/spaces/*` |
| SANTUARIO | PATIENT_PROFILE | P2 | critico_validado | `/api/appointments/*`, `/api/records/*`, `/api/spaces/*` |
| SANTUARIO | PATIENT_RECORDS | P2 | critico_validado | `/api/appointments/*`, `/api/records/*`, `/api/spaces/*` |
| SANTUARIO | AGENDA_OVERVIEW | P2 | critico_validado | `/api/appointments/*`, `/api/finance/*`, `/api/rooms/*`, `/api/spaces/*` |
| SANTUARIO | AGENDA_EDIT | P2 | critico_validado | `/api/appointments/*`, `/api/records/*` |
| SANTUARIO | ROOMS_STATUS | P2 | critico_validado | `/api/*`, `/api/appointments/*`, `/api/finance/*`, `/api/rooms/*`, `/api/spaces/*` |
| SANTUARIO | ROOM_CREATE | P2 | critico_validado | `/api/*`, `/api/rooms/*` |
| SANTUARIO | ROOM_DETAILS | P2 | critico_validado | `/api/*`, `/api/appointments/*`, `/api/rooms/*` |
| SANTUARIO | FINANCE_OVERVIEW | P2 | critico_validado | `/api/*`, `/api/finance/*`, `/api/rooms/*`, `/api/spaces/*` |
| SANTUARIO | FINANCE_REPASSES | P2 | critico_validado | `/api/*`, `/api/finance/*` |
| SANTUARIO | FINANCE_FORECAST | P2 | critico_validado | `/api/*`, `/api/finance/*` |
| SANTUARIO | MARKETPLACE_MANAGE | P2 | critico_validado | `/api/events/*`, `/api/marketplace/*` |
| SANTUARIO | MARKETPLACE_CREATE | P2 | critico_validado | `/api/events/*`, `/api/marketplace/*` |
| SANTUARIO | EVENTS_MANAGE | P2 | critico_validado | `/api/*`, `/api/events/*`, `/api/marketplace/*` |
| SANTUARIO | EVENT_CREATE | P2 | critico_validado | `/api/*`, `/api/events/*`, `/api/marketplace/*` |
| SANTUARIO | RETREATS_MANAGE | P2 | critico_validado | `/api/*`, `/api/events/*`, `/api/marketplace/*` |
| SANTUARIO | VAGAS_LIST | P2 | critico_validado | `/api/recruitment/*` |
| SANTUARIO | VAGA_CREATE | P2 | critico_validado | `/api/recruitment/*` |
| SANTUARIO | VAGA_CANDIDATES | P2 | critico_validado | `/api/recruitment/*` |
| SANTUARIO | REPUTATION_OVERVIEW | P2 | critico_validado | `/api/*`, `/api/analytics/*`, `/api/chat/*` |
| SANTUARIO | ANALYTICS_DASH | P2 | critico_validado | `/api/*`, `/api/analytics/*`, `/api/chat/*` |
| SANTUARIO | CHAT_LIST | P2 | critico_validado | `/api/analytics/*`, `/api/chat/*` |
| SANTUARIO | CHAT_ROOM | P2 | critico_validado | `/api/analytics/*`, `/api/chat/*` |
| SANTUARIO | TEAM_SUMMON | P2 | critico_validado | `/api/*`, `/api/reviews/*`, `/api/spaces/*` |
| SANTUARIO | TEAM_INVITE | P2 | critico_validado | `/api/*`, `/api/reviews/*`, `/api/spaces/*` |
| SANTUARIO | ROOM_EDIT | P2 | critico_validado | `/api/*`, `/api/rooms/*` |
| SANTUARIO | ROOM_AGENDA | P2 | critico_validado | `/api/appointments/*`, `/api/rooms/*` |
| SANTUARIO | SERVICE_EVALUATION | P2 | critico_validado | `/api/*`, `/api/reviews/*`, `/api/spaces/*` |

## Contratos Frontend

| Path | Arquivo |
|---|---|
| `/admin/dashboard` | `services/api/domains/commerce.ts` |
| `/admin/finance/global` | `services/api/domains/commerce.ts` |
| `/admin/lgpd/audit` | `services/api/domains/commerce.ts` |
| `/admin/marketplace/offers` | `services/api/domains/commerce.ts` |
| `/admin/metrics` | `services/api/domains/commerce.ts` |
| `/admin/system/health` | `services/api/domains/commerce.ts` |
| `/admin/users` | `services/api/domains/commerce.ts` |
| `/admin/users/${id}/block` | `services/api/domains/commerce.ts` |
| `/alchemy/offers` | `services/api/domains/hub.ts` |
| `/alchemy/offers/${offerId}/accept` | `services/api/domains/hub.ts` |
| `/alchemy/offers/${offerId}/complete` | `services/api/domains/hub.ts` |
| `/alchemy/offers/${offerId}/counter` | `services/api/domains/hub.ts` |
| `/alchemy/offers/${offerId}/reject` | `services/api/domains/hub.ts` |
| `/appointments` | `services/api/domains/account.ts` |
| `/appointments/${appointmentId}` | `services/api/domains/account.ts` |
| `/appointments/${appointmentId}/cancel` | `services/api/domains/account.ts` |
| `/appointments/${appointmentId}/reschedule` | `services/api/domains/account.ts` |
| `/appointments/series` | `services/api/domains/account.ts` |
| `/appointments/series/${seriesId}` | `services/api/domains/account.ts` |
| `/appointments/series/preview` | `services/api/domains/account.ts` |
| `/audit/logs` | `services/api/domains/wellness.ts` |
| `/calendar` | `services/api/domains/hub.ts` |
| `/calendar/${eventId}` | `services/api/domains/hub.ts` |
| `/calendar/sync` | `services/api/domains/hub.ts` |
| `/chat/rooms/${roomId}/leave` | `services/api/domains/community.ts` |
| `/chat/rooms/${roomId}/messages` | `services/api/domains/community.ts` |
| `/chat/rooms/${roomId}/mute` | `services/api/domains/community.ts` |
| `/chat/rooms/${roomId}/settings` | `services/api/domains/community.ts` |
| `/chat/rooms/join` | `services/api/domains/community.ts` |
| `/chat/start` | `services/api/domains/community.ts` |
| `/checkout/pay` | `services/api/domains/commerce.ts` |
| `/checkout/transactions/${encodeURIComponent(transactionId)}/status` | `services/api/domains/commerce.ts` |
| `/clinical/interventions` | `services/api/domains/wellness.ts` |
| `/finance/client/summary` | `services/api/domains/finance.ts` |
| `/finance/donate` | `services/api/domains/finance.ts` |
| `/finance/export` | `services/api/domains/finance.ts` |
| `/finance/reinvest` | `services/api/domains/finance.ts` |
| `/finance/summary` | `services/api/domains/account.ts` |
| `/finance/summary` | `services/api/domains/finance.ts` |
| `/finance/transactions` | `services/api/domains/account.ts` |
| `/finance/transactions` | `services/api/domains/finance.ts` |
| `/finance/transactions` | `services/api/domains/hub.ts` |
| `/finance/withdraw` | `services/api/domains/finance.ts` |
| `/gamification/achievements/sync` | `services/api/domains/gamification.ts` |
| `/gamification/history?limit=${limit}` | `services/api/domains/gamification.ts` |
| `/gamification/leaderboard` | `services/api/domains/gamification.ts` |
| `/gamification/leaderboard/seasonal` | `services/api/domains/gamification.ts` |
| `/gamification/quests/${encodeURIComponent(quest.id)}/complete` | `services/api/domains/gamification.ts` |
| `/gamification/state${query}` | `services/api/domains/gamification.ts` |
| `/invites/accept` | `services/api/domains/community.ts` |
| `/invites/create` | `services/api/domains/community.ts` |
| `/invites/resolve/${encodeURIComponent(token)}` | `services/api/domains/community.ts` |
| `/journal` | `services/api/domains/wellness.ts` |
| `/journal/stats` | `services/api/domains/wellness.ts` |
| `/links` | `services/api/domains/community.ts` |
| `/links/${linkId}/accept` | `services/api/domains/community.ts` |
| `/links/${linkId}/reject` | `services/api/domains/community.ts` |
| `/links/check/${targetId}${params}` | `services/api/domains/community.ts` |
| `/links/me` | `services/api/domains/community.ts` |
| `/links/pending` | `services/api/domains/community.ts` |
| `/marketplace/products` | `services/api/domains/commerce.ts` |
| `/marketplace/products?ownerId=${encodeURIComponent(String(oid))}` | `services/api/domains/commerce.ts` |
| `/marketplace/products/${id}` | `services/api/domains/commerce.ts` |
| `/marketplace/products${qs ? ` | `services/api/domains/commerce.ts` |
| `/marketplace/purchase` | `services/api/domains/commerce.ts` |
| `/metamorphosis/checkin` | `services/api/domains/account.ts` |
| `/metamorphosis/checkin` | `services/api/domains/wellness.ts` |
| `/metamorphosis/evolution` | `services/api/domains/wellness.ts` |
| `/notifications` | `services/api/domains/community.ts` |
| `/notifications/${id}/read` | `services/api/domains/community.ts` |
| `/notifications/push/subscribe` | `services/api/domains/community.ts` |
| `/notifications/read-all` | `services/api/domains/community.ts` |
| `/oracle/draw` | `services/api/domains/wellness.ts` |
| `/oracle/history` | `services/api/domains/wellness.ts` |
| `/oracle/today` | `services/api/domains/wellness.ts` |
| `/presence` | `services/api/domains/community.ts` |
| `/presence/${guardianId}` | `services/api/domains/community.ts` |
| `/presence/batch` | `services/api/domains/community.ts` |
| `/presence/offline` | `services/api/domains/community.ts` |
| `/presence/online` | `services/api/domains/community.ts` |
| `/presence/ping` | `services/api/domains/community.ts` |
| `/profiles?role=PROFESSIONAL` | `services/api/domains/account.ts` |
| `/profiles?role=PROFESSIONAL` | `services/api/domains/hub.ts` |
| `/profiles/${id}/metrics` | `services/api/domains/account.ts` |
| `/profiles/${id}/space-patients` | `services/api/domains/account.ts` |
| `/profiles/lookup?email=${encodeURIComponent(normalized)}` | `services/api/domains/account.ts` |
| `/profiles/search?q=${encodeURIComponent(q)}` | `services/api/domains/community.ts` |
| `/records` | `services/api/domains/account.ts` |
| `/records/${patientId}` | `services/api/domains/account.ts` |
| `/records/${pid}` | `services/api/domains/account.ts` |
| `/records/${recordId}` | `services/api/domains/account.ts` |
| `/records/access` | `services/api/domains/account.ts` |
| `/records/grant` | `services/api/domains/account.ts` |
| `/records/revoke` | `services/api/domains/account.ts` |
| `/recruitment/applications` | `services/api/domains/account.ts` |
| `/recruitment/applications` | `services/api/domains/hub.ts` |
| `/recruitment/applications?scope=${scope}` | `services/api/domains/hub.ts` |
| `/recruitment/applications/${applicationId}/decision` | `services/api/domains/hub.ts` |
| `/recruitment/applications/${applicationId}/interview` | `services/api/domains/hub.ts` |
| `/recruitment/interviews/${interviewId}/respond` | `services/api/domains/hub.ts` |
| `/reviews` | `services/api/domains/account.ts` |
| `/rituals` | `services/api/domains/wellness.ts` |
| `/rituals/${period}` | `services/api/domains/wellness.ts` |
| `/rituals/${period}/${id}/toggle` | `services/api/domains/wellness.ts` |
| `/rooms/${roomId}` | `services/api/domains/hub.ts` |
| `/rooms/real-time` | `services/api/domains/hub.ts` |
| `/rooms/vacancies` | `services/api/domains/hub.ts` |
| `/soul-cards/collection` | `services/api/domains/wellness.ts` |
| `/soul-cards/draw` | `services/api/domains/wellness.ts` |
| `/spaces` | `services/api/domains/hub.ts` |
| `/spaces/analytics` | `services/api/domains/hub.ts` |
| `/spaces/contract` | `services/api/domains/hub.ts` |
| `/spaces/invites` | `services/api/domains/hub.ts` |
| `/spaces/patients` | `services/api/domains/hub.ts` |
| `/spaces/patients/${patientId}` | `services/api/domains/hub.ts` |
| `/spaces/retreats` | `services/api/domains/hub.ts` |
| `/spaces/reviews` | `services/api/domains/hub.ts` |
| `/spaces/rooms` | `services/api/domains/hub.ts` |
| `/spaces/rooms/${roomId}/agenda` | `services/api/domains/hub.ts` |
| `/spaces/team` | `services/api/domains/hub.ts` |
| `/tribe/invite` | `services/api/domains/community.ts` |
| `/tribe/invites/${inviteId}/respond` | `services/api/domains/community.ts` |
| `/tribe/members` | `services/api/domains/community.ts` |
| `/tribe/pacts/active` | `services/api/domains/community.ts` |
| `/tribe/posts` | `services/api/domains/community.ts` |
| `/tribe/posts/${id}/like` | `services/api/domains/community.ts` |
| `/tribe/presence` | `services/api/domains/community.ts` |
| `/tribe/sync` | `services/api/domains/community.ts` |
| `/users/${id}` | `services/api/domains/account.ts` |
| `/users/${id}/evolution/metrics` | `services/api/domains/account.ts` |
| `/users/${id}/water` | `services/api/domains/account.ts` |
| `/users/${user.id}` | `services/api/domains/account.ts` |
| `/users/bless` | `services/api/domains/account.ts` |
| `/users/me/export` | `services/api/domains/account.ts` |
