---
name: ftth-network
description: Planejamento e gestão de rede FTTH (Fiber To The Home) para ISPs. Use quando: (1) Planejar rede fibra, (2) Gerenciar splitters, (3) Calcular ODN, (4) Mapa de cobertura, (5) Cadastrar clientes fibra, (6) Gerenciar OLT/Portas, (7) Ativar ONTs. Aciona em frases como "fibra", "ftth", "splitter", "olt", "odn", "rede óptica", "cobertura", "cliente fibra", "ont", "vlan".
---

# FTTH Network Planning

## Topologia FTTH

```
OLT (Central)
    │
    ├── Port 1 ─── Splitter 1:8 ──── Clientes
    │
    ├── Port 2 ─── Splitter 1:16 ──── Clientes
    │
    └── Port 3 ─── Splitter 1:32 ──── Clientes
```

## Componentes

### OLT (Optical Line Terminal)
- Porta PON → 16-32 ONUs
- VLAN por cliente
- Distância máx: 20km

### Splitter
| Tipo | Ratio | Perda |
|------|-------|-------|
| 1:2 | 50/50 | 3.5dB |
| 1:4 | 25/25 | 7dB |
| 1:8 | 12.5/12.5 | 10.5dB |
| 1:16 | 6.25/6.25 | 14dB |
| 1:32 | 3.125/3.125 | 17dB |

### Orçamento Óptico
```
Potência TX OLT: -3 dBm
Perda Splitter 1:8: -10.5 dB
Perda Splitter 1:4: -7 dB
Perda Conectores: -1 dB (×4)
Perda Fusão: -0.1 dB (×8)
Margem: -3 dB
─────────────────────────
Total perda: ~24.6 dB
Receivers OLT: -27 dBm
✅ Dentro do budget!
```

## Cadastro Cliente FTTH

```json
{
  "cliente_id": "cli_123",
  "ont_serial": "HWTC-XXXXXX",
  "ont_model": "Huawei HG8245H",
  "olt_name": "OLT_CENTRAL",
  "olt_port": "Pon 1/1",
  "pon": 5,
  "vlan": 100,
  "splitter_path": "1:8 → 1:4 → Cliente",
  "potencia_recebida": -18.5
}
```

## Validações

- Potência ONT: -8 a -27 dBm ✅
- Potência OLT: -3 a -28 dBm ✅
- Distância: 0-20km ✅
- VLAN disponível: 100-1000

## Mapa Cobertura

Formato GeoJSON para exibir no mapa:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [-46.6, -23.5] },
      "properties": { "status": "active", "cliente": "João" }
    }
  ]
}
```
