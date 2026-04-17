---
name: whatsapp-integration
description: Integração WhatsApp Business API para ISPs. Use quando: (1) Enviar faturas por WhatsApp, (2) Notificar vencimento de faturas, (3) Confirmar pagamentos, (4) Enviar avisos de manutenção, (5) Criar chatbot de suporte, (6) Notificações de nova OS. Aciona em frases como "whatsapp", "mensagem cliente", "notificação whatsapp", "chatbot", "fatura whatsapp", "webhook whatsapp".
---

# WhatsApp Integration

## Configuração

### credentials.json
```json
{
  "phone_number_id": "SEU_PHONE_ID",
  "access_token": "SEU_TOKEN",
  "business_account_id": "SEU_BUSINESS_ID"
}
```

## Templates de Mensagem

### Fatura
```
Olá {nome}! Sua fatura de R$ {valor} vence em {data}.
Para pagar: {link_pagamento}
```

### Lembrete Vencimento
```
{nome}, sua fatura de R$ {valor} venceu em {data}.
Após 5 dias, seu serviço será suspenso.
Pague agora: {link}
```

### Boas-vindas
```
Bem-vindo, {nome}! 🎉
Seu plano {plano} está ativo.
Velocidade: {velocidade}
Suporte: {telefone}
```

### OS Concluída
```
{nome}, sua OS #{os} foi concluída!
Téc: {tecnico}
{observacao}
```

## Fluxo chatbot

1. Cliente envia mensagem
2. Classificar intent (pagamento/suporte/geral)
3. Responder com botão de ação
4. Escalonar se necessário

## webhooks

- `messages.upsert` → Nova mensagem
- `messages.update` → Status entrega
