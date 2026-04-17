# =============================================================================
# NetPulse Backend - Dockerfile
# =============================================================================

FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Build
RUN npm run build

# ---------------------------------------------------------------------------
# Imagem de produção
# ---------------------------------------------------------------------------
FROM node:20-alpine AS production

WORKDIR /app

# Copiar package e instalar apenas production deps
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar Prisma Schema e Client gerado
COPY prisma ./prisma
RUN npx prisma generate

# Copiar build
COPY --from=builder /app/dist ./dist

# Usuário não-root
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Comando
CMD ["node", "dist/index.js"]
