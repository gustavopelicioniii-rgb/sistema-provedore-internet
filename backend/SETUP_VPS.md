# NetPulse - Setup VPS (Ubuntu/Debian)

## Opção 1: Script Automático (Recomendado)

```bash
# Clone o repositório
git clone https://github.com/gustavopelicioniii-rgb/sistema-provedore-internet.git
cd sistema-provedore-internet

# Dê permissão ao script
chmod +x backend/setup-vps.sh

# Rode como root
sudo bash backend/setup-vps.sh
```

O script vai:
1. Instalar PostgreSQL
2. Criar banco `netpulse`
3. Criar usuário `netpulse`
4. Configurar backend
5. Instalar dependências
6. Gerar Prisma Client

---

## Opção 2: Manual

### 1. Instalar PostgreSQL

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib

# Iniciar
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Criar Banco

```bash
# Login como postgres
sudo -u postgres psql

# No psql:
CREATE USER netpulse WITH PASSWORD 'SuaSenhaForte2024!';
CREATE DATABASE netpulse OWNER netpulse;
ALTER USER netpulse WITH SUPERUSER;
\q
```

### 3. Configurar Backend

```bash
cd backend

# Instalar dependências
npm install

# Criar .env
cat > .env << EOF
DATABASE_URL="postgresql://netpulse:SuaSenhaForte2024!@localhost:5432/netpulse?schema=public"
JWT_SECRET="uma-chave-secreta-muito-longa-aqui"
PORT=3001
CORS_ORIGIN="*"
EOF

# Gerar Prisma Client e criar tabelas
npm run db:generate
npm run db:push
```

### 4. Rodar

```bash
# Desenvolvimento
npm run dev

# Produção (produção recomendada: PM2)
npm install -g pm2
pm2 start dist/index.js --name netpulse
pm2 save
pm2 startup
```

---

## Opção 3: Docker Compose (Mais Fácil!)

```bash
# Na raiz do projeto
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar
docker-compose down
```

O Docker Compose vai iniciar:
- PostgreSQL na porta 5432
- Backend API na porta 3001

---

## Acesso à API

Após instalar, a API estará em:
- **Desenvolvimento**: `http://localhost:3001`
- **Produção**: `http://SEU_IP:3001`

### Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/register` | Registrar org + admin |
| POST | `/api/auth/login` | Login |
| GET | `/api/clients` | Listar clientes |
| POST | `/api/clients` | Criar cliente |
| GET | `/api/plans` | Listar planos |
| POST | `/api/plans` | Criar plano |
| GET | `/api/invoices` | Listar faturas |
| POST | `/api/invoices/generate` | Gerar faturas do mês |
| GET | `/api/dashboard` | Dashboard |
| GET | `/api/health` | Health check |

### Exemplo de Registro

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@seuisp.com.br",
    "password": "SenhaForte123!",
    "fullName": "Administrador",
    "organizationName": "Minha ISP",
    "organizationSlug": "minha-isp"
  }'
```

### Exemplo de Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@seuisp.com.br",
    "password": "SenhaForte123!"
  }'
```

---

## Produção com Systemd

```bash
# Copiar service
sudo cp backend/netpulse.service /etc/systemd/system/

# Recarregar
sudo systemctl daemon-reload

# Habilitar e iniciar
sudo systemctl enable netpulse
sudo systemctl start netpulse

# Ver status
sudo systemctl status netpulse
```

---

## Configurar Firewall

```bash
# UFW (Ubuntu/Debian)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3001/tcp  # Backend API
sudo ufw enable
```

---

## NGINX (Reverse Proxy + SSL)

```bash
sudo apt-get install -y nginx

sudo cat > /etc/nginx/sites-available/netpulse << 'EOF'
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/netpulse /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Depois configure SSL com Certbot:
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com
```
