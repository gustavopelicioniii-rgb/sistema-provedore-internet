---
name: noc-monitoring
description: Network Operations Center (NOC) para monitoramento de ISPs. Use quando: (1) Monitorar equipamentos de rede, (2) Alertas de queda, (3) Ver status OLT/ONU, (4) Monitorar links, (5) Ver disponibilidade de rede, (6) Criar alertas automáticos. Aciona em frases como "noc", "monitoramento", "equipamento offline", "queda", "alerta", "olt", "onu", "status rede", "disponibilidade".
---

# NOC Monitoring

## Equipment Types

- **OLT** → Optical Line Terminal (fibra)
- **ONU/ONT** → Equipamento cliente fibra
- **Router** → Mikrotik, Ubiquiti
- **Switch** → Gerenciável
- **AP** → Access Point WiFi

## Status Codes

| Status | Significado |
|--------|-------------|
| online | Equipimento respondendo |
| offline | Sem comunicação > 5min |
| degraded | Performance reduzida |
| maintenance | Em manutenção programada |

## Scripts

### `scripts/noc_monitor.py`
Monitora todos equipamentos e gera alertas.

### `scripts/olt_status.py`
Busca status de OLTs via SNMP ou API.

## Alertas Automáticos

1. **Uptime < 99.5%** → Alerta crítico
2. **CPU > 80%** → Alerta warning
3. **Memória > 90%** → Alerta warning
4. **Interface down** → Alerta crítico
5. **Latência > 100ms** → Alerta warning

## Dashboard NOC

```
┌─────────────────────────────────────┐
│  NOC - NetPulse                     │
├─────────────────────────────────────┤
│  Total: 45  Online: 42  Offline: 3  │
├─────────────────────────────────────┤
│  🟢 OLT Central     Uptime: 99.9%   │
│  🔴 SW-CORE-02     OFFLINE          │
│  🟢 AP-RESID-05    Online          │
└─────────────────────────────────────┘
```

## Integrações

- **Supabase** → Salvar status histórico
- **WhatsApp** → Notificar equipe
- **Ticket** → Criar OS automaticamente
