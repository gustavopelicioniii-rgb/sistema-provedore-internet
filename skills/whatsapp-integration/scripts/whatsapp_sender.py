#!/usr/bin/env python3
"""
WhatsApp Message Sender - Envia mensagens via WhatsApp Business API
"""

import requests
import json
from datetime import datetime, timedelta

class WhatsAppSender:
    def __init__(self, phone_number_id: str, access_token: str):
        self.phone_number_id = phone_number_id
        self.access_token = access_token
        self.api_url = f"https://graph.facebook.com/v18.0/{phone_number_id}/messages"
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
    
    def send_text(self, to: str, message: str) -> dict:
        """Envia mensagem de texto"""
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "text",
            "text": {"body": message}
        }
        resp = requests.post(self.api_url, headers=self.headers, json=payload)
        return resp.json()
    
    def send_template(self, to: str, template_name: str, components: list) -> dict:
        """Envia template pré-aprovado"""
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {"code": "pt_BR"},
                "components": components
            }
        }
        resp = requests.post(self.api_url, headers=self.headers, json=payload)
        return resp.json()
    
    def send_invoice(self, to: str, cliente: dict, fatura: dict) -> dict:
        """Envia fatura por WhatsApp"""
        message = f"""
Olá {cliente['nome']}! 📄

Sua fatura está disponível!

📋 Fatura: #{fatura['id']}
💰 Valor: R$ {fatura['valor']:.2f}
📅 Vencimento: {fatura['data_vencimento']}

Para pagar: {fatura['link_pagamento']}

Qualquer dúvida, responda esta mensagem."""
        
        return self.send_text(to, message)
    
    def send_welcome(self, to: str, cliente: dict) -> dict:
        """Envia mensagem de boas-vindas"""
        message = f"""
Olá {cliente['nome']}! 🎉

Bem-vindo(a) à nossa família!

📶 Plano: {cliente['plano']}
⚡ Velocidade: {cliente['velocidade']}
📍 Endereço: {cliente['endereco']}

📞 Suporte: {cliente['telefone_suporte']}

Sua internet estará ativa em breve!
Equipe NetPulse"""
        
        return self.send_text(to, message)
    
    def send_reminder(self, to: str, cliente: dict, fatura: dict) -> dict:
        """Envia lembrete de vencimento"""
        dias = fatura['dias_vencimento']
        
        message = f"""
Olá {cliente['nome']}! 🔔

Lembrando que sua fatura vence em {dias} dia(s)!

📋 Fatura: #{fatura['id']}
💰 Valor: R$ {fatura['valor']:.2f}
📅 Vencimento: {fatura['data_vencimento']}

Evite a suspensão! Pague agora:
{fatura['link_pagamento']}"""
        
        return self.send_text(to, message)
    
    def send_os_update(self, to: str, cliente: dict, os_data: dict) -> dict:
        """Envia atualização de OS"""
        status_emoji = {
            "pending": "⏳",
            "in_progress": "🔧",
            "completed": "✅",
            "cancelled": "❌"
        }
        
        emoji = status_emoji.get(os_data['status'], "📋")
        
        message = f"""
Olá {cliente['nome']}! {emoji}

Atualização da sua OS #{os_data['id']}

📝 {os_data['tipo']}: {os_data['descricao']}
📊 Status: {os_data['status_display']}
👨‍🔧 Técnico: {os_data['tecnico']}
📅 Agendado: {os_data['data_agendada']}

{os_data.get('observacao', '')}"""
        
        return self.send_text(to, message)


def main():
    # Exemplo de uso
    sender = WhatsAppSender(
        phone_number_id="SEU_PHONE_ID",
        access_token="SEU_ACCESS_TOKEN"
    )
    
    # Enviar fatura
    cliente = {"nome": "João Silva", "telefone": "5511999999999"}
    fatura = {
        "id": "FAT-2024-001",
        "valor": 99.90,
        "data_vencimento": "10/01/2024",
        "link_pagamento": "https://pagamento.exemplo.com/123"
    }
    
    result = sender.send_invoice(cliente["telefone"], cliente, fatura)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
