---
name: auto-provisioning
description: Provisionamento automático de novos clientes para ISPs. Use quando: (1) Ativar novo cliente automaticamente, (2) Criar conta PPPoE via sistema, (3) Definir velocidade/plan, (4) Enviar credenciais, (5) Ativar/desativar contrato, (6) Workflow de instalação. Aciona em frases como "ativar cliente", "provisionar", "criar conta", "novo cliente", "credenciais", "workflow instalação", "ativar contrato".
---

# Auto-Provisioning

## Fluxo de Ativação

```
Novo Cliente → Aprovação → Provisionamento → Confirmação
     ↓            ↓              ↓              ↓
   Cadastro    Pagamento     Mikrotik       WhatsApp
               entrada       API            + Credenciais
```

## Etapas

### 1. Cadastro
```json
{
  "nome": "João Silva",
  "cpf": "123.456.789-00",
  "plano_id": "plan_100mbps",
  "endereco": "Rua X, 123",
  "equipamento": "ont"
}
```

### 2. Pagamento Entrada
- Primeira mensalidade
- Taxa instalação (se houver)
- Emissão NF-e

### 3. Provisionamento Mikrotik
```python
# Via API Mikrotik
ppp_secret = {
    "name": cpf,  # ou email
    "password": senha_temporaria,
    "profile": plano.speed_name,
    "remoteAddress": "10.0.0.x"
}
```

### 4. Envio Credenciais
```
📱 WhatsApp:
Olá João! Sua internet está pronta!

📧 E-mail:
- Usuário: cpf
- Senha: xxx
- IP: 191.36.x.x
- DNS: 191.36.x.x
```

## Suspensão/Reativação

### Suspensão (inadimplência)
1. Desabilitar PPP secret
2. Mover para profile "suspenso"
3. Notificar WhatsApp

### Reativação
1. Habilitar PPP secret
2. Voltar para profile original
3. Notificar + enviar nova fatura

## Equipamentos

| Tipo | Provisionamento |
|------|----------------|
| PPPoE | Mikrotik API |
| DHCP | Server DHCP |
| Hotspot | User Manager |
| FTTH | OLT/ONT VLAN |
