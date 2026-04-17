# =============================================================================
# NetPulse Backend - Dockerfile
# =============================================================================

FROM node:20-bookworm AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Build
RUN npm run build

# ---------------------------------------------------------------------------
# Imagem de produção
# ---------------------------------------------------------------------------
FROM node:20-bookworm AS production

WORKDIR /app

# Copiar package e instalar apenas production deps
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copiar Prisma Schema e Client gerado
COPY prisma ./prisma
RUN npx prisma generate

# Copiar build
COPY --from=builder /app/dist ./dist

# Usuário não-root
RUN groupadd --gid 1001 nodejs && useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nodejs
USER nodejs

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Comando
CMD ["node", "dist/index.js"]
