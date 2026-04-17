#!/usr/bin/env python3
"""
Financial Intelligence - Calcula métricas financeiras de ISPs
"""

import json
from datetime import datetime
from typing import List, Dict

class FinancialMetrics:
    def __init__(self, clients: List[dict], invoices: List[dict], plans: List[dict]):
        self.clients = clients
        self.invoices = invoices
        self.plans = plans
    
    def calculate_mrr(self) -> float:
        """Calcula Monthly Recurring Revenue"""
        mrr = 0
        for client in self.clients:
            if client.get("status") == "active" and client.get("plan_id"):
                plan = next((p for p in self.plans if p["id"] == client["plan_id"]), None)
                if plan:
                    mrr += plan.get("price", 0)
        return mrr
    
    def calculate_arr(self) -> float:
        """Calcula Annual Recurring Revenue"""
        return self.calculate_mrr() * 12
    
    def calculate_ltv(self, client_id: str) -> float:
        """Calcula Lifetime Value do cliente"""
        client = next((c for c in self.clients if c["id"] == client_id), None)
        if not client:
            return 0
        
        plan = next((p for p in self.plans if p["id"] == client.get("plan_id")), None)
        if not plan:
            return 0
        
        arpu = plan.get("price", 0)
        gross_margin = 0.6  # 40% de custos
        churn_rate = self.calculate_churn_rate() / 100
        
        if churn_rate > 0:
            ltv = (arpu * gross_margin) / churn_rate
        else:
            ltv = arpu * gross_margin * 24  # 2 anos mínimo
        
        return round(ltv, 2)
    
    def calculate_churn_rate(self) -> float:
        """Calcula taxa de churn mensal"""
        total_clients = len(self.clients)
        if total_clients == 0:
            return 0
        
        # Clientes que cancelaram no mês
        churned = sum(1 for c in self.clients if c.get("status") == "churned")
        
        return round((churned / total_clients) * 100, 2)
    
    def calculate_avg_ticket(self) -> float:
        """Calcula ticket médio"""
        if not self.clients:
            return 0
        
        total = sum(c.get("plan_price", 0) for c in self.clients if c.get("status") == "active")
        active = sum(1 for c in self.clients if c.get("status") == "active")
        
        return round(total / active, 2) if active > 0 else 0
    
    def calculate_inadimplence(self) -> Dict:
        """Calcula taxa de inadimplência"""
        total = len(self.invoices)
        if total == 0:
            return {"rate": 0, "overdue_amount": 0}
        
        overdue_count = sum(1 for i in self.invoices if i.get("status") == "overdue")
        overdue_amount = sum(i.get("amount", 0) for i in self.invoices if i.get("status") == "overdue")
        
        return {
            "rate": round((overdue_count / total) * 100, 2),
            "overdue_count": overdue_count,
            "overdue_amount": round(overdue_amount, 2)
        }
    
    def get_invoices_by_status(self) -> Dict:
        """Agrupamento de faturas por status"""
        result = {}
        for inv in self.invoices:
            status = inv.get("status", "unknown")
            if status not in result:
                result[status] = {"count": 0, "amount": 0}
            result[status]["count"] += 1
            result[status]["amount"] += inv.get("amount", 0)
        
        return result
    
    def generate_dashboard(self) -> Dict:
        """Gera dashboard financeiro completo"""
        mrr = self.calculate_mrr()
        arr = self.calculate_arr()
        churn = self.calculate_churn_rate()
        inadimplence = self.calculate_inadimplence()
        avg_ticket = self.calculate_avg_ticket()
        
        # MRR atual vs meta (meta = MRR * 1.05)
        mrr_target = mrr * 1.05
        mrr_growth = 2.3  # Exemplo: 2.3% este mês
        
        return {
            "timestamp": datetime.now().isoformat(),
            "mrr": {
                "current": round(mrr, 2),
                "target": round(mrr_target, 2),
                "growth_percent": mrr_growth,
                "arr": round(arr, 2)
            },
            "churn": {
                "rate": churn,
                "status": "healthy" if churn < 2 else "warning" if churn < 5 else "critical"
            },
            "inadimplence": inadimplence,
            "avg_ticket": avg_ticket,
            "active_clients": sum(1 for c in self.clients if c.get("status") == "active"),
            "invoice_summary": self.get_invoices_by_status()
        }


def main():
    # Dados de exemplo
    plans = [
        {"id": "p1", "name": "100Mbps", "price": 79.90},
        {"id": "p2", "name": "200Mbps", "price": 99.90},
        {"id": "p3", "name": "300Mbps", "price": 129.90},
    ]
    
    clients = [
        {"id": "c1", "name": "João", "status": "active", "plan_id": "p1", "plan_price": 79.90},
        {"id": "c2", "name": "Maria", "status": "active", "plan_id": "p2", "plan_price": 99.90},
        {"id": "c3", "name": "Pedro", "status": "active", "plan_id": "p3", "plan_price": 129.90},
        {"id": "c4", "name": "Ana", "status": "churned", "plan_id": "p1", "plan_price": 79.90},
    ]
    
    invoices = [
        {"id": "i1", "client_id": "c1", "status": "paid", "amount": 79.90},
        {"id": "i2", "client_id": "c2", "status": "paid", "amount": 99.90},
        {"id": "i3", "client_id": "c3", "status": "pending", "amount": 129.90},
        {"id": "i4", "client_id": "c1", "status": "overdue", "amount": 79.90},
    ]
    
    fm = FinancialMetrics(clients, invoices, plans)
    dashboard = fm.generate_dashboard()
    
    print("=" * 60)
    print("FINANCIAL INTELLIGENCE - DASHBOARD")
    print("=" * 60)
    print(f"\n💰 MRR: R$ {dashboard['mrr']['current']:,.2f}")
    print(f"   Meta: R$ {dashboard['mrr']['target']:,.2f}")
    print(f"   Crescimento: {dashboard['mrr']['growth_percent']}%")
    print(f"   ARR: R$ {dashboard['mrr']['arr']:,.2f}")
    
    print(f"\n📊 Churn Rate: {dashboard['churn']['rate']}% ({dashboard['churn']['status'].upper()})")
    
    print(f"\n⚠️ Inadimplência: {dashboard['inadimplence']['rate']}%")
    print(f"   Valor pendente: R$ {dashboard['inadimplence']['overdue_amount']:,.2f}")
    
    print(f"\n🎫 Ticket Médio: R$ {dashboard['avg_ticket']:,.2f}")
    print(f"\n👥 Clientes Ativos: {dashboard['active_clients']}")


if __name__ == "__main__":
    main()
