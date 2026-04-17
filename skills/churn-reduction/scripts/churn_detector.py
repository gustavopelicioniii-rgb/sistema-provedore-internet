#!/usr/bin/env python3
"""
Churn Detector - Identifica clientes em risco de cancelamento
"""

import json
from datetime import datetime, timedelta
from typing import List, Dict

class ChurnDetector:
    def __init__(self, clients: List[dict], invoices: List[dict], tickets: List[dict]):
        self.clients = clients
        self.invoices = invoices
        self.tickets = tickets
    
    def calculate_risk_score(self, client_id: str) -> Dict:
        """Calcula score de risco (0-100). >70 = risco alto"""
        score = 0
        reasons = []
        
        # Buscar dados do cliente
        client = next((c for c in self.clients if c["id"] == client_id), None)
        if not client:
            return {"score": 0, "reasons": [], "level": "unknown"}
        
        # 1. Análise de pagamento (até 40 pontos)
        late_count = 0
        for inv in self.invoices:
            if inv["client_id"] == client_id and inv["status"] == "overdue":
                late_count += 1
        
        if late_count == 1:
            score += 15
            reasons.append("1 fatura atrasada")
        elif late_count == 2:
            score += 25
            reasons.append("2 faturas atrasadas")
        elif late_count >= 3:
            score += 40
            reasons.append(f"{late_count} faturas atrasadas - CRÍTICO")
        
        # 2. Análise de tickets (até 30 pontos)
        ticket_count = 0
        for t in self.tickets:
            if t["client_id"] == client_id:
                ticket_count += 1
        
        if ticket_count == 2:
            score += 10
            reasons.append("2 tickets recentes")
        elif ticket_count == 3:
            score += 20
            reasons.append("3 tickets recentes - ATENÇÃO")
        elif ticket_count > 3:
            score += 30
            reasons.append(f"{ticket_count} tickets - MUITO INSATISFEITO")
        
        # 3. Tempo como cliente (até 15 pontos) - novos têm mais churn
        tenure_days = (datetime.now() - datetime.fromisoformat(client["created_at"])).days
        if tenure_days < 90:
            score += 15
            reasons.append("Cliente novo (<90 dias) - instável")
        elif tenure_days < 180:
            score += 8
            reasons.append("Cliente recentes (<6 meses)")
        
        # 4. Plano (até 15 pontos) - básicos têm mais churn
        plan_price = client.get("plan_price", 0)
        if plan_price < 50:
            score += 15
            reasons.append("Plano básico - alto risco")
        elif plan_price < 80:
            score += 8
            reasons.append("Plano médio")
        
        # Classificação
        if score >= 70:
            level = "critical"
        elif score >= 50:
            level = "high"
        elif score >= 30:
            level = "medium"
        else:
            level = "low"
        
        return {
            "client_id": client_id,
            "client_name": client["name"],
            "score": min(score, 100),
            "level": level,
            "reasons": reasons,
            "recommended_action": self.get_action(level)
        }
    
    def get_action(self, level: str) -> str:
        actions = {
            "critical": "OFERECER RETENÇÃO URGENTE - Desconto 20% + upgrade grátis 30 dias",
            "high": "CONTATO PROATIVO - Pesquisar satisfação + oferta personalizada",
            "medium": "MONITORAR - Acompanhar próximos 15 dias",
            "low": "OK - Nenhuma ação necessária"
        }
        return actions.get(level, "Unknown")
    
    def get_all_risks(self) -> List[Dict]:
        """Retorna todos os clientes com score"""
        results = []
        for client in self.clients:
            if client.get("status") == "active":
                risk = self.calculate_risk_score(client["id"])
                results.append(risk)
        
        # Ordenar por score decrescente
        return sorted(results, key=lambda x: x["score"], reverse=True)


def main():
    # Exemplo de uso
    clients = [
        {"id": "c1", "name": "João Silva", "status": "active", "plan_price": 99.90, "created_at": "2024-01-01"},
        {"id": "c2", "name": "Maria Santos", "status": "active", "plan_price": 149.90, "created_at": "2024-06-15"},
        {"id": "c3", "name": "Pedro Costa", "status": "active", "plan_price": 49.90, "created_at": "2024-09-01"},
    ]
    
    invoices = [
        {"client_id": "c1", "status": "paid"},
        {"client_id": "c2", "status": "overdue"},
        {"client_id": "c3", "status": "overdue"},
        {"client_id": "c3", "status": "overdue"},
    ]
    
    tickets = [
        {"client_id": "c1", "subject": " Lentidão"},
        {"client_id": "c3", "subject": " Sem conexão"},
        {"client_id": "c3", "subject": " Cobrança indevida"},
        {"client_id": "c3", "subject": " Cancelar"},
    ]
    
    detector = ChurnDetector(clients, invoices, tickets)
    results = detector.get_all_risks()
    
    print("=" * 60)
    print("RELATÓRIO DE CHURN - CLIENTES EM RISCO")
    print("=" * 60)
    
    for r in results:
        emoji = "🔴" if r["level"] == "critical" else "🟠" if r["level"] == "high" else "🟡" if r["level"] == "medium" else "🟢"
        print(f"\n{emoji} {r['client_name']} (Score: {r['score']}/100)")
        print(f"   Nível: {r['level'].upper()}")
        for reason in r["reasons"]:
            print(f"   - {reason}")
        print(f"   → {r['recommended_action']}")


if __name__ == "__main__":
    main()
