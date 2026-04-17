# Referência API REST Mikrotik

## Autenticação

```
Método: HTTP Basic Auth
Usuário: admin
Senha: (sua senha)
Porta: 8728 (HTTP) ou 8729 (HTTPS)
```

## Endpoints REST

### /rest/interface
Lista todas as interfaces.

```json
GET /rest/interface
[
  {"name": "ether1", "type": "ether", "running": true},
  {"name": "bridge-lan", "type": "bridge", "running": true}
]
```

### /rest/ppp/secret
Gerencia usuários PPPoE.

```json
# Listar
GET /rest/ppp/secret

# Criar
PUT /rest/ppp/secret
{
  "name": "12345678900",
  "password": "senha123",
  "profile": "profile_100m",
  "service": "pppoe",
  "remote-address": "10.0.0.50"
}

# Habilitar
PUT /rest/ppp/secret/12345678900
{"disabled": "false"}

# Desabilitar
PUT /rest/ppp/secret/12345678900
{"disabled": "true"}

# Remover
DELETE /rest/ppp/secret/12345678900
```

### /rest/ppp/profile
Gerencia profiles de velocidade.

```json
# Listar
GET /rest/ppp/profile

# Criar profile 100Mbps
PUT /rest/ppp/profile
{
  "name": "profile_100m",
  "local-address": "10.0.0.1",
  "remote-address": "poolppoe",
  "rate-limit": "100M/100M",
  "bridge": "bridge-lan"
}
```

### /rest/queue/simple
Gerencia filas de bandwidth.

```json
# Listar
GET /rest/queue/simple

# Criar queue
PUT /rest/queue/simple
{
  "name": "queue-joao",
  "target": "192.168.1.100",
  "rate": "50M/50M",
  "priority": "8/8",
  "burst-limit": "100M/100M",
  "burst-threshold": "80M/80M",
  "burst-time": "10s/10s"
}
```

### /rest/system/resource
Informações do sistema.

```json
GET /rest/system/resource
{
  "uptime": "3w4d5h6m7s",
  "version": "7.13.5",
  "cpu-load": 15,
  "memory-total": 4096,
  "memory-used": 2048,
  "board-name": "CCR1009-7G-1C-1S+"
}
```

### /rest/ip/pool
Gerencia pools de IP.

```json
GET /rest/ip/pool
[
  {"name": "poolppoe", "ranges": "10.0.0.2-10.0.0.254"}
]
```

## Comandos via /tool/traseh

```bash
# Ping
/tool/traseh/trace address=8.8.8.8

# Netwatch
/tool/netwatch
add host=8.8.8.8 interval=10s type=icmp
```

## Scripts Úteis

### Desabilitar cliente inadimplente
```python
def suspend_client(api, username):
    api.put(f"/ppp/secret/{username}", {"disabled": "true"})
    api.put(f"/ppp/secret/{username}", {"profile": "suspended"})
```

### Reset senha cliente
```python
def reset_password(api, username, new_password):
    api.put(f"/ppp/secret/{username}", {"password": new_password})
```
