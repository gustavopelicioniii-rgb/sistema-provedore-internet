#!/usr/bin/env python3
"""
NOC Monitor - Monitora equipamentos de rede
"""

import json
import time
from datetime import datetime
from typing import List, Dict

class NOCMonitor:
    def __init__(self, equipment: List[dict]):
        self.equipment = equipment
    
    def check_equipment(self) -> Dict:
        """Verifica status de todos equipamentos"""
        results = {
            "timestamp": datetime.now().isoformat(),
            "total": len(self.equipment),
            "online": 0,
            "offline": 0,
            "degraded": 0,
            "alerts": []
        }
        
        for eq in self.equipment:
            status = self.simulate_check(eq)
            eq["last_check"] = datetime.now().isoformat()
            eq["status"] = status
            
            if status == "online":
                results["online"] += 1
            elif status == "offline":
                results["offline"] += 1
                results["alerts"].append({
                    "type": "critical",
                    "equipment": eq["name"],
                    "message": f"{eq['name']} está FORA DO AR!"
                })
            elif status == "degraded":
                results["degraded"] += 1
                results["alerts"].append({
                    "type": "warning",
                    "equipment": eq["name"],
                    "message": f"{eq['name']} com performance reduzida"
                })
        
        results["uptime"] = round((results["online"] / results["total"]) * 100, 2)
        return results
    
    def simulate_check(self, eq: dict) -> str:
        """Simula check - em produção usar SNMP/PING/API"""
        import random
        # Simular 90% online, 5% offline, 5% degraded
        r = random.random()
        if r < 0.90:
            return "online"
        elif r < 0.95:
            return "degraded"
        else:
            return "offline"
    
    def check_olt_status(self, olt: dict) -> Dict:
        """Verifica status específico de OLT"""
        return {
            "name": olt["name"],
            "ports_active": olt.get("ports_total", 16),
            "onus_online": olt.get("onus_total", 0),
            "temperature": "45°C",
            "power": "-5 dBm",
            "alarms": []
        }
    
    def generate_alert_message(self, alert: dict) -> str:
        """Gera mensagem de alerta formatada"""
        if alert["type"] == "critical":
            return f"🚨 ALERTA CRÍTICO: {alert['message']}"
        elif alert["type"] == "warning":
            return f"⚠️ ATENÇÃO: {alert['message']}"
        else:
            return f"ℹ️ INFO: {alert['message']}"


def main():
    # Exemplo de equipamentos
    equipment = [
        {"id": "e1", "name": "OLT Central", "type": "olt", "ip": "192.168.1.1"},
        {"id": "e2", "name": "OLT Filial", "type": "olt", "ip": "192.168.2.1"},
        {"id": "e3", "name": "SW-CORE-01", "type": "switch", "ip": "192.168.1.10"},
        {"id": "e4", "name": "Mikrotik Principal", "type": "router", "ip": "192.168.0.1"},
        {"id": "e5", "name": "AP-RESIDENCIAL-01", "type": "ap", "ip": "192.168.10.1"},
    ]
    
    monitor = NOCMonitor(equipment)
    results = monitor.check_equipment()
    
    print("=" * 60)
    print("NOC - MONITORAMENTO DE REDE")
    print("=" * 60)
    print(f"⏰ {results['timestamp']}")
    print(f"📊 Total: {results['total']} | 🟢 Online: {results['online']} | 🔴 Offline: {results['offline']} | 🟡 Degraded: {results['degraded']}")
    print(f"📈 Uptime: {results['uptime']}%")
    
    if results["alerts"]:
        print("\n" + "=" * 60)
        print("🚨 ALERTAS")
        print("=" * 60)
        for alert in results["alerts"]:
            print(monitor.generate_alert_message(alert))
    else:
        print("\n✅ Nenhum alerta no momento")


if __name__ == "__main__":
    main()
