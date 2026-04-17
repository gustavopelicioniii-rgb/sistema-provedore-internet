#!/bin/bash
# =============================================================================
# NETPULSE - Script de Setup para VPS (PostgreSQL + Backend)
# =============================================================================
# Uso: bash setup-vps.sh
# =============================================================================

set -e

echo "============================================"
echo "  NetPulse - Setup VPS"
echo "============================================"

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# =============================================================================
# 1. DETECTAR SISTEMA OPERACIONAL
# =============================================================================
echo -e "\n${YELLOW}[1/8] Detectando sistema operacional...${NC}"

if [ -f /etc/debian_version ]; then
    OS="debian"
    PKG_MANAGER="apt-get"
elif [ -f /etc/redhat-release ]; then
    OS="rhel"
    PKG_MANAGER="yum"
elif [ -f /etc/almalinux-release ]; then
    OS="almalinux"
    PKG_MANAGER="yum"
else
    echo -e "${RED}Sistema operacional não suportado${NC}"
    exit 1
fi

echo -e "${GREEN}Sistema: $OS${NC}"

# =============================================================================
# 2. ATUALIZAR SISTEMA
# =============================================================================
echo -e "\n${YELLOW}[2/8] Atualizando sistema...${NC}"
sudo $PKG_MANAGER update -y
echo -e "${GREEN}Sistema atualizado!${NC}"

# =============================================================================
# 3. INSTALAR POSTGRESQL
# =============================================================================
echo -e "\n${YELLOW}[3/8] Instalando PostgreSQL...${NC}"

if [ "$OS" == "debian" ]; then
    sudo $PKG_MANAGER install -y postgresql postgresql-contrib
elif [ "$OS" == "rhel" ] || [ "$OS" == "almalinux" ]; then
    sudo $PKG_MANAGER install -y postgresql-server postgresql-contrib
    sudo postgresql-setup --initdb || true
fi

echo -e "${GREEN}PostgreSQL instalado!${NC}"

# =============================================================================
# 4. INICIAR POSTGRESQL
# =============================================================================
echo -e "\n${YELLOW}[4/8] Iniciando PostgreSQL...${NC}"

sudo systemctl start postgresql
sudo systemctl enable postgresql

# Aguardar PostgreSQL iniciar
sleep 2

# Verificar status
if sudo systemctl is-active --quiet postgresql; then
    echo -e "${GREEN}PostgreSQL está rodando!${NC}"
else
    echo -e "${RED}Erro ao iniciar PostgreSQL${NC}"
    exit 1
fi

# =============================================================================
# 5. CRIAR BANCO E USUÁRIO
# =============================================================================
echo -e "\n${YELLOW}[5/8] Criando banco de dados...${NC}"

# Configurações
DB_NAME="netpulse"
DB_USER="netpulse"
DB_PASS="NetPulse2024!Secure"  # MUDE EM PRODUÇÃO!

# Trocar para usuário postgres
sudo -u postgres psql << EOF
-- Criar usuário
DO \$body\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
      CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
   END IF;
END\$body\$;

-- Criar banco
DO \$body\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME') THEN
      CREATE DATABASE $DB_NAME OWNER $DB_USER;
   END IF;
END\$body\$;

-- Permissões
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Habilitar extensão UUID
\c $DB_NAME
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EOF

echo -e "${GREEN}Banco '$DB_NAME' criado com usuário '$DB_USER'!${NC}"

# =============================================================================
# 6. CONFIGURAR ACESSO REMOTO (OPCIONAL)
# =============================================================================
echo -e "\n${YELLOW}[6/8] Configurando acesso...${NC}"

read -p "Deseja permitir acesso remoto ao PostgreSQL? (s/n): " ALLOW_REMOTE

if [ "$ALLOW_REMOTE" == "s" ] || [ "$ALLOW_REMOTE" == "S" ]; then
    # Editar pg_hba.conf para permitir conexões externas
    echo "host all all 0.0.0.0/0 md5" | sudo tee -a /etc/postgresql/*/main/pg_hba.conf 2>/dev/null || \
    echo "host all all 0.0.0.0/0 md5" | sudo tee -a /var/lib/pgsql/data/pg_hba.conf 2>/dev/null || true
    
    # Editar postgresql.conf para ouvir em todas as interfaces
    sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/*/main/postgresql.conf 2>/dev/null || \
    sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /var/lib/pgsql/data/postgresql.conf 2>/dev/null || true
    
    echo -e "${YELLOW}Atenção: Configure o firewall para permitir porta 5432!${NC}"
fi

# Reiniciar PostgreSQL
sudo systemctl restart postgresql

# =============================================================================
# 7. SETUP DO BACKEND
# =============================================================================
echo -e "\n${YELLOW}[7/8] Configurando Backend...${NC}"

# Criar arquivo .env
cat > backend/.env << EOF
# Database
DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME?schema=public"

# JWT Secret (MUITO IMPORTANTE: Mude em produção!)
JWT_SECRET="netpulse-jwt-secret-$(openssl rand -hex 32)"

# Server
PORT=3001

# CORS
CORS_ORIGIN="*"
EOF

echo -e "${GREEN}Arquivo .env criado!${NC}"

# =============================================================================
# 8. INSTALAR DEPENDÊNCIAS DO BACKEND
# =============================================================================
echo -e "\n${YELLOW}[8/8] Instalando dependências do Backend...${NC}"

cd backend
npm install
npm run db:generate
npm run db:push

echo -e "${GREEN}Backend configurado!${NC}"

# =============================================================================
# RESUMO
# =============================================================================
echo ""
echo "============================================"
echo "  ✅ SETUP CONCLUÍDO!"
echo "============================================"
echo ""
echo -e "${GREEN}Banco de Dados:${NC}"
echo "  Host: localhost"
echo "  Porta: 5432"
echo "  Database: $DB_NAME"
echo "  Usuário: $DB_USER"
echo "  Senha: $DB_PASS"
echo ""
echo -e "${GREEN}Backend:${NC}"
echo "  URL: http://localhost:3001"
echo "  Arquivo: backend/.env"
echo ""
echo -e "${YELLOW}Comandos úteis:${NC}"
echo "  cd backend"
echo "  npm run dev          # Rodar em desenvolvimento"
echo "  npm run build       # Compilar"
echo "  npm start           # Rodar em produção"
echo ""
echo -e "${YELLOW}Para rodar em produção com PM2:${NC}"
echo "  npm install -g pm2"
echo "  pm2 start dist/index.js --name netpulse"
echo ""
echo "============================================"
