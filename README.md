# Viva360 - Plataforma Holística Full-Stack

## 🌟 Sobre

Viva360 é uma plataforma completa de bem-estar holístico conectando clientes, profissionais e espaços terapêuticos. Desenvolvida com tecnologias modernas e arquitetura profissional.

## 🚀 Stack Tecnológico

### Frontend

- **React 19** + TypeScript
- **Vite** (build tool)
- **TailwindCSS** (styling)
- **Framer Motion** (animations)
- **Lucide Icons**

### Backend

- **Node.js** + Express
- **TypeScript**
- **Prisma ORM** (PostgreSQL)
- **JWT** Authentication
- **Bcrypt** Password Hashing

### Database

- **PostgreSQL** (via Prisma)
- **11 Modelos** (User, Professional, Space, Appointment, etc.)

### Testing & Quality

- **Vitest** (unit tests)
- **Playwright** (E2E tests)
- **Artillery** (stress tests)

---

## 📦 Instalação Rápida

### Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn
- PostgreSQL (local ou remoto)
- Espaço em disco: ~500MB

### Passo a Passo

```bash
# 1. Clonar repositório
git clone <repo-url>
cd Viva360-1

# 2. Instalar dependências
npm install

# 3. Configurar environment
cp .env.example .env.local
# Editar .env.local com suas credenciais

# 4. Configurar banco de dados
npm run db:generate     # Gerar Prisma Client
npm run db:push         # Criar tabelas
npm run db:seed         # Popular com dados de teste

# 5. Rodar em desenvolvimento
npm run dev:all         # Frontend + Backend simultâneos
```

Acesse:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/api/health

---

## 🗄️ Configuração do Banco de Dados

### Opção 1: Prisma Local (Desenvolvimento)

```bash
npx prisma dev
# Prisma vai subir um PostgreSQL local automaticamente
```

### Opção 2: PostgreSQL Remoto (Recomendado)

**Supabase** (Grátis):

1. Criar conta em [supabase.com](https://supabase.com)
2. Criar novo projeto
3. Copiar `Connection String` (PostgreSQL)
4. Atualizar `DATABASE_URL` no `.env`

**Neon.tech** (Grátis):

1. Criar conta em [neon.tech](https://neon.tech)
2. Criar database
3. Copiar connection string
4. Atualizar `.env`

---

## 🔑 Usuários de Teste

Após rodar `npm run db:seed`:

| Role             | Email                   | Senha    |
| ---------------- | ----------------------- | -------- |
| **Cliente**      | ana@viva360.com         | senha123 |
| **Profissional** | luna@viva360.com        | senha123 |
| **Espaço**       | contato@sanctuarium.com | senha123 |

---

## 📚 Documentação da API

### Autenticação

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
GET /api/auth/me
```

### Endpoints Principais

```http
# Usuários
GET    /api/users/:id
PUT    /api/users/profile
POST   /api/users/checkin

# Profissionais
GET    /api/professionals
GET    /api/professionals/:id
GET    /api/professionals/me/patients

# Agendamentos
POST   /api/appointments
GET    /api/appointments
PUT    /api/appointments/:id/status
DELETE /api/appointments/:id

# Marketplace
GET    /api/marketplace
POST   /api/marketplace

# Notificações
GET    /api/notifications
PUT    /api/notifications/:id/read

# Espaços
GET    /api/spaces/rooms
GET    /api/spaces/team
POST   /api/spaces/vacancies
```

**Autenticação**: Adicionar header `Authorization: Bearer <token>`

---

## 🛠️ Scripts Disponíveis

### Development

```bash
npm run dev              # Frontend apenas
npm run dev:backend      # Backend apenas
npm run dev:all          # Frontend + Backend
```

### Database

```bash
npm run db:generate      # Gerar Prisma Client
npm run db:push          # Push schema (sem migrations)
npm run db:migrate       # Criar migration
npm run db:seed          # Popular banco
npm run db:studio        # UI visual do Prisma
npm run db:reset         # Reset completo
```

### Testing

```bash
npm run test             # Testes unitários
npm run test:ui          # Vitest UI
npm run test:e2e         # Testes E2E
npm run test:stress      # Load testing
```

### Production

```bash
npm run build            # Build frontend
npm run build:backend    # Build backend
npm start                # Start production server
```

---

## 🚀 Deploy para Hostinger

### 1. Preparar Projeto

```bash
# Build
npm run build
npm run build:backend

# Testar localmente
npm start
```

### 2. Configurar Database Remoto

Usar Supabase ou Neon.tech (grátis) e atualizar `DATABASE_URL` em produção.

### 3. Upload para Hostinger

**Via Git (Recomendado)**:

```bash
git add .
git commit -m "Deploy production"
git push origin main
```

No painel Hostinger:

- Conectar repositório GitHub
- Entry point: `server.js`
- Variáveis de ambiente: Adicionar todas do `.env`

**Via FTP**:

- Upload de `dist/`, `backend/dist/`, `server.js`, `package.json`

### 4. Variáveis de Ambiente (Hostinger)

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=<postgresql-connection-string>
JWT_SECRET=<gerar-chave-segura-256-bits>
JWT_REFRESH_SECRET=<outra-chave-segura>
CORS_ORIGIN=https://seudominio.com
```

**Importante**: Usar JWT secrets diferentes em produção!

### 5. Executar Migrations

SSH no Hostinger:

```bash
npm run db:migrate:prod
npm run db:seed  # Opcional
```

---

## 🏗️ Estrutura do Projeto

```
Viva360-1/
├── backend/
│   └── src/
│       ├── config/           # Database, configs
│       ├── controllers/      # Business logic
│       ├── routes/           # API routes
│       ├── middleware/       # Auth, error handling
│       ├── utils/            # Helpers
│       └── server.ts         # Express app
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Seed data
├── src/                      # Frontend React
│   ├── components/
│   ├── views/
│   ├── services/
│   └── App.tsx
├── dist/                     # Frontend build
├── .env                      # Environment variables
├── server.js                 # Production server
└── package.json
```

---

## 🔒 Segurança

- ✅ **Helmet**: Security headers
- ✅ **CORS**: Configurável por environment
- ✅ **Rate Limiting**: 100 req/15min
- ✅ **JWT**: Tokens expirando
- ✅ **Bcrypt**: Password hashing
- ✅ **SQL Injection**: Protegido via Prisma
- ✅ **XSS**: Sanitização automática

---

## 🧪 Testes

### Testes Unitários

```bash
npm test
```

### Testes E2E

```bash
# Instalar browsers
npx playwright install

# Rodar testes
npm run test:e2e

# UI Mode
npm run test:e2e:ui
```

### Stress Testing

```bash
npm run test:stress
```

---

## 🐛 Troubleshooting

### Erro: "Cannot find module '@prisma/client'"

```bash
npm run db:generate
```

### Erro: "ENOSPC: no space left on device"

Liberar espaço em disco:

```bash
# Limpar cache npm
npm cache clean --force

# Remover node_modules e reinstalar
rm -rf node_modules
npm install
```

### Banco de dados não conecta

1. Verificar `DATABASE_URL` no `.env`
2. Testar conexão: `npm run db:studio`
3. Verificar firewall/VPN

### Build falha

```bash
# Limpar cache
rm -rf dist backend/dist .vite
npm run build
```

---

## 📖 Recursos Adicionais

- [Walkthrough Técnico Completo](./brain/walkthrough.md)
- [Task List](./brain/task.md)
- [Implementation Plan](./brain/implementation_plan.md)

### Links Úteis

- [Prisma Docs](https://www.prisma.io/docs)
- [Express Guide](https://expressjs.com)
- [React Docs](https://react.dev)
- [Hostinger Node.js Deploy](https://www.hostinger.com/tutorials/how-to-deploy-nodejs-app)

---

## 🤝 Contribuindo

1. Fork o projeto
2. Criar branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit (`git commit -m 'Add: nova funcionalidade'`)
4. Push (`git push origin feature/nova-funcionalidade`)
5. Abrir Pull Request

---

## 📝 Licença

Este projeto é privado e proprietário.

---

## 👥 Time

Desenvolvido por engenheiros sêniores com foco em:

- Arquitetura escalável
- Código limpo e manutenível
- Segurança em primeiro lugar
- Performance otimizada

---

## 📞 Suporte

Em caso de dúvidas ou problemas:

1. Verificar [walkthrough.md](./brain/walkthrough.md)
2. Consultar issues do GitHub
3. Contato: contato@viva360.com

---

**Viva360** - _Transformando bem-estar em tecnologia_ 🌿✨
