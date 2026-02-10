# 🔧 VIVA360 - Relatório de Bugs & Gaps

## Data: 2026-02-09

---

## 🐛 BUGS CRÍTICOS IDENTIFICADOS

### 1. Jardim da Alma - Foto não salva na Evolução
- **Arquivo**: `views/client/garden/DailyRitualWizard.tsx`
- **Problema**: Após tirar foto, o snap só é salvo se o usuário clicar "Nutrir Jardim" no step SHARE. Se fechar antes, perde tudo.
- **Fix**: Auto-save snap ao entrar no step CARD, antes de compartilhar.

### 2. Tribo - Links duplicados e botão + sem ação
- **Arquivo**: `views/client/TribeView.tsx`
- **Problema**: 2 botões diferentes abrem convite (+ e "Convidar Externo"). O botão + no ClientDashboard abre modal mas não navega ao TRIBE_INVITE.
- **Fix**: Unificar fluxo de convite, remover duplicata.

### 3. Toasts desconfigurados no mobile
- **Arquivo**: `components/Common/ZenToast.tsx`
- **Problema**: `top-[max(env(safe-area-inset-top),0.75rem)]` não funciona em todos browsers mobile.
- **Fix**: Usar padding-top fixo com safe-area-inset como fallback.

### 4. Layout mobile - textos quebrando/fora da tela
- **Arquivos**: Múltiplos componentes
- **Problema**: Font sizes muito pequenos (7px, 8px), textos sem truncate/wrap, containers sem max-width.
- **Fix**: Ajustar breakpoints, adicionar overflow handling.

### 5. Qualidade das fotos nos cards
- **Arquivos**: `CameraWidget.tsx`, `SoulCard.tsx`
- **Problema**: Fotos em base64 ficam pesadas e perdem qualidade em compressão.
- **Fix**: Pipeline de qualidade Instagram-like com melhor compressão e filtros.

### 6. Botões sem ação no Guardião/Santuário
- **Arquivos**: `views/pro/`, `views/space/`
- **Problema**: Vários states no screenMap apontam para o mesmo componente (ex: SANTUARIO_LIST → ProDashboard). Botões mostram "Sintonização Necessária".
- **Fix**: Criar views reais ou redirecionar para views funcionais.

---
