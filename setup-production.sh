#!/bin/bash
# =============================================================================
# NetPulse - Setup Produção
# =============================================================================
# Este script configura o sistema em produção com Docker + NGINX
# =============================================================================

set -e

echo "============================================"
echo "  NetPulse - Setup Produção"
echo "============================================"

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Perguntar domínio (opcional)
read -p "Digite o domínio (ex: api.seuisp.com.br) ou pressione ENTER para usar IP: " DOMAIN

if [ -z "$DOMAIN" ]; then
    DOMAIN=$(curl -s ifconfig.me 2>/dev/null || echo "SEU_IP_AQUI")
    echo -e "${YELLOW}Usando IP: $DOMAIN${NC}"
else
    echo -e "${GREEN}Domínio: $DOMAIN${NC}"
fi

# Gerar JWT Secret
JWT_SECRET="netpulse-jwt-$(openssl rand -hex 32)"
echo -e "${GREEN}JWT Secret gerado!${NC}"

# Criar arquivo .env.production
cat > backend/.env.production << EOF
DATABASE_URL="postgresql://netpulse:NetPulse2024!Secure@postgres:5432/netpulse?schema=public"
JWT_SECRET="$JWT_SECRET"
PORT=3001
CORS_ORIGIN="*"
EOF

echo -e "${GREEN}Arquivo .env.production criado!${NC}"

# Gerar SSL auto-assinado (para testes)
echo -e "\n${YELLOW}Gerando SSL auto-assinado...${NC}"
mkdir -p nginx/ssl

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout nginx/ssl/privkey.pem \
    -out nginx/ssl/fullchain.pem \
    -subj "/C=BR/ST=SP/L=Sao Paulo/O=NetPulse/CN=$DOMAIN" 2>/dev/null

echo -e "${GREEN}SSL gerado!${NC}"

# Parar containers existentes
echo -e "\n${YELLOW}Parando containers existentes...${NC}"
cd /root/.openclaw/workspace/sistema-provedore-internet
docker compose -f docker-compose.prod.yml down 2>/dev/null || true

# Iniciar em produção
echo -e "\n${YELLOW}Iniciando containers...${NC}"
docker compose -f docker-compose.prod.yml up -d

# Aguardar backend iniciar
echo -e "\n${YELLOW}Aguardando backend iniciar...${NC}"
sleep 15

# Verificar status
echo -e "\n${YELLOW}Verificando serviços...${NC}"

# Testar API
if curl -s http://localhost/api/health | grep -q "ok"; then
    echo -e "${GREEN}✅ Backend API: OK${NC}"
else
    echo -e "${RED}❌ Backend API: FALHOU${NC}"
    docker compose -f docker-compose.prod.yml logs backend --tail=20
fi

# Testar NGINX
if curl -s http://localhost/health | grep -q "OK"; then
    echo -e "${GREEN}✅ NGINX: OK${NC}"
else
    echo -e "${RED}❌ NGINX: FALHOU${NC}"
fi

echo ""
echo "============================================"
echo "  ✅ PRODUÇÃO CONFIGURADA!"
echo "============================================"
echo ""
echo -e "${GREEN}API Backend:${NC} http://$DOMAIN/api"
echo -e "${GREEN}Health Check:${NC} http://$DOMAIN/health"
echo ""
echo -e "${YELLOW}PRÓXIMOS PASSOS:${NC}"
echo "1. Configure o DNS do seu domínio para apontar para este servidor"
echo "2. (Opcional) Obtenha um certificado SSL válido (Let's Encrypt)"
echo "3. Configure o frontend no Vercel com: VITE_API_URL=https://$DOMAIN"
echo ""
