# 🔧 VIVA360 - Relatório de Bugs & Gaps

## Data: 2026-02-09
## Última atualização: 2026-02-10

---

## 🐛 BUGS CRÍTICOS IDENTIFICADOS

### 1. ✅ Jardim da Alma - Foto não salva na Evolução
- **Arquivo**: `views/client/garden/DailyRitualWizard.tsx`
- **Problema**: Após tirar foto, o snap só é salvo se o usuário clicar "Nutrir Jardim" no step SHARE. Se fechar antes, perde tudo.
- **Fix**: Auto-save snap ao entrar no step CARD, antes de compartilhar.
- **Commit**: `ebf8e3da` - auto-save snap on card confirm, evolution link on close

### 2. ✅ Tribo - Links duplicados e botão + sem ação
- **Arquivo**: `views/client/TribeView.tsx`
- **Problema**: 2 botões diferentes abrem convite (+ e "Convidar Externo"). O botão + no ClientDashboard abre modal mas não navega ao TRIBE_INVITE.
- **Fix**: Unificar fluxo de convite, remover duplicata do Dashboard.
- **Commit**: `42fbd707` - dashboard cleanup, removed unused invite modal

### 3. ✅ Toasts desconfigurados no mobile
- **Arquivo**: `components/Common/ZenToast.tsx`
- **Problema**: `top-[max(env(safe-area-inset-top),0.75rem)]` não funciona em todos browsers mobile.
- **Fix**: Usar padding-top fixo com safe-area-inset como fallback inline style.
- **Commit**: `42fbd707` - toast fix with inline style fallback

### 4. ✅ Layout mobile - textos quebrando/fora da tela
- **Arquivos**: Múltiplos componentes
- **Problema**: Font sizes muito pequenos (7px, 8px), textos sem truncate/wrap.
- **Fix**: Bumped mínimo de text-[7-8px] para text-[9px] em 13 arquivos.
- **Commit**: `f583d8b7` - bump minimum text size across all client components

### 5. ✅ Qualidade das fotos nos cards
- **Arquivos**: `CameraWidget.tsx`, `SoulCard.tsx`
- **Problema**: Fotos em base64 ficam pesadas e perdem qualidade em compressão.
- **Fix**: Resize para 1080px max, JPEG 0.82, filtro Instagram-like, compressão em uploads.
- **Commit**: `42fbd707` - camera compression pipeline

### 6. ✅ Botões sem ação no Guardião/Santuário
- **Arquivos**: `views/pro/`, `views/space/`, `src/navigation/screenMap.tsx`
- **Problema**: Vários states no screenMap apontam para o mesmo componente.
- **Fix**: Criadas views reais: SantuarioListView, SantuarioProfileView, SantuarioContractView, SpaceAnalyticsDash, SpaceEventsManager.
- **Commit**: `42fbd707` - santuario views and screenMap routes

---

## ✅ TODOS OS 6 BUGS RESOLVIDOS
