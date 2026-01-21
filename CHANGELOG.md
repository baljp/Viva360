# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.0.0] - 2026-01-21

### Adicionado

- **Plataforma Viva360** - Lançamento inicial
- Autenticação com e-mail e login social (Google)
- Três perfis de usuário: Buscador, Guardião, Santuário
- Sistema de agendamentos com profissionais
- Marketplace de produtos e serviços holísticos
- Sistema de karma e gamificação
- PWA completo com suporte offline
- Notificações push (Web Push API)
- Integração com Stripe para pagamentos
- Dashboard financeiro para profissionais
- Chat em tempo real (WebSocket)

### Segurança

- Helmet para headers de segurança
- Rate limiting por IP e rota
- Sanitização de inputs (XSS protection)
- JWT com refresh tokens

### Compliance

- Página de Política de Privacidade (LGPD)
- Página de Termos de Uso
- Sentry para monitoramento de erros

### Infraestrutura

- Deploy em Vercel (frontend + serverless)
- Compatibilidade com Hostinger (Apache)
- Service Worker com Workbox
- Cache otimizado para assets

---

## Próximas Versões (Roadmap)

### [1.1.0] - Planejado

- SSO corporativo
- Relatórios avançados
- Integração com calendários externos

### [2.0.0] - Futuro

- Multi-tenancy
- White-label
- API pública
