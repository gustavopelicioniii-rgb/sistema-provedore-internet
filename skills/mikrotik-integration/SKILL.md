---
name: mikrotik-integration
description: Integração com Mikrotik via API para ISPs. Use quando precisar: (1) Gerenciar PPPoE de clientes, (2) Criar/editar/remover secret e profiles, (3) Monitorar bandwidth e queues, (4) Configurar hotspot, (5) Reboot ou监控 equipamentos Mikrotik, (6) Buscar informações de clientes conectados. Aciona em frases como "mikrotik", "PPPoE", "queue", "bandwidth", "hotspot", "API Mikrotik".
---

# Mikrotik Integration

## Configuração

### credentials.json
Criar arquivo `skills/mikrotik-integration/credentials.json`:
```json
{
  "router_ip": "192.168.1.1",
  "username": "admin",
  "password": "senha",
  "port": 8728
}
```

## Scripts Disponíveis

### `scripts/mikrotik_api.py`
Cliente Python para API Mikrotik REST.

### `scripts/ppp_provisioning.py`
Script para provisionar novo cliente PPPoE.

## Fluxo de Trabalho

1. Ler `references/mikrotik_api.md` para comandos disponíveis
2. Usar scripts para operações específicas
3. Formatar resposta para usuário

## Comandos Principais Mikrotik

- **PPPoE Secrets**: Criar, editar, remover usuarios PPPoE
- **Profiles**: Definir planos de velocidade
- **Queues**: Controlar banda por IP ou usuário
- **Hotspot**: Gerenciar usuários hotspot
- **Interface**: Monitorar status de portas

## Endpoints Úteis

```
/rest/interface
/rest/ppp/secret
/rest/ppp/profile
/rest/queue/simple
/rest/system/reboot
```
