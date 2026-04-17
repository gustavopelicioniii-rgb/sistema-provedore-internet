# NetPulse Backend API

Backend em Node.js/Express com Prisma ORM e PostgreSQL.

## Stack

- **Runtime**: Node.js
- **Framework**: Express
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Auth**: JWT

## Quick Start

```bash
# 1. Instalar dependências
npm install

# 2. Copiar .env.example para .env e configurar
cp .env.example .env

# 3. Gerar Prisma Client
npm run db:generate

# 4. Criar tabelas no banco
npm run db:push

# 5. (Opcional) Popular banco com dados de exemplo
npm run db:seed

# 6. Rodar em desenvolvimento
npm run dev
```

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Rodar em desenvolvimento (hot reload) |
| `npm run build` | Compilar TypeScript |
| `npm run start` | Rodar produção |
| `npm run db:generate` | Gerar Prisma Client |
| `npm run db:push` | Sincronizar schema com banco |
| `npm run db:migrate` | Rodar migrations |
| `npm run db:seed` | Popular com dados de exemplo |

## API Endpoints

### Auth
- `POST /api/auth/register` - Registrar organização + admin
- `POST /api/auth/login` - Login

### Clients
- `GET /api/clients` - Listar clientes
- `POST /api/clients` - Criar cliente
- `PUT /api/clients/:id` - Atualizar cliente
- `DELETE /api/clients/:id` - Deletar cliente

### Contracts
- `GET /api/contracts` - Listar contratos
- `POST /api/contracts` - Criar contrato
- `PUT /api/contracts/:id` - Atualizar contrato
- `POST /api/contracts/:id/suspend` - Suspender
- `POST /api/contracts/:id/reactivate` - Reativar

### Plans
- `GET /api/plans` - Listar planos
- `POST /api/plans` - Criar plano
- `PUT /api/plans/:id` - Atualizar plano
- `DELETE /api/plans/:id` - Deletar plano
- `POST /api/plans/:id/toggle` - Ativar/Desativar

### Invoices
- `GET /api/invoices` - Listar faturas
- `POST /api/invoices` - Criar fatura
- `POST /api/invoices/generate` - Gerar faturas do mês
- `POST /api/invoices/:id/pay` - Marcar como paga
- `GET /api/invoices/stats` - Estatísticas

### Equipment
- `GET /api/equipment` - Listar equipamentos
- `POST /api/equipment` - Cadastrar equipamento
- `POST /api/equipment/:id/test` - Testar conexão

### Dashboard
- `GET /api/dashboard` - Métricas do dashboard

## Auth

Todas as rotas (exceto `/api/auth/*`) requerem token JWT no header:

```
Authorization: Bearer <token>
```

## Database Schema

O schema do Prisma está em `prisma/schema.prisma`. Atualize e rode:

```bash
npm run db:push
```

## Deploy

### Railway (Recomendado)

1. Conectar repo ao Railway
2. Adicionar variável `DATABASE_URL`
3. Deploy automático

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```
