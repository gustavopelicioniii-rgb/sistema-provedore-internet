# Especificações FTTH - Referência Técnica

## Tipos de Fibra

| Tipo | Core | Aplicação | Atenuação |
|------|------|-----------|-----------|
| G.652.D | Singlemode | Padrão EPON/GPON | 0.35 dB/km |
| G.657.A | Singlemode | FTTH internal | 0.35 dB/km |

## Classes de Splitter

### PLC Splitter (Planar Lightwave Circuit)
- Maior uniformidade
- Mais caro
- Indicado para FTTH

### FBT Splitter (Fused Bi-Conic)
- Mais barato
- Maior perda
- Uso em redes antiguas

## Especificações OLT

### GPON (Gigabit PON)
- Downstream: 2.5 Gbps
- Upstream: 1.25 Gbps
- Split ratio: 1:64 ou 1:128
- Distância máx: 20 km

### EPON (Ethernet PON)
- Downstream: 1.25 Gbps
- Upstream: 1.25 Gbps
- Split ratio: 1:32 ou 1:64
- Distância máx: 20 km

### 10G GPON (XGS-PON)
- Downstream: 10 Gbps
- Upstream: 10 Gbps
- Backward compatible com GPON

## Cálculo de Potência

### Exemplo Prático

```
OLT TX: -3 dBm
Splitter 1:8: -10.5 dB
Splitter 1:4: -7 dB
Fusões (6x): -0.1 × 6 = -0.6 dB
Conectores (4x): -0.25 × 4 = -1.0 dB
Distância (5km): -0.35 × 5 = -1.75 dB
Margem segurança: -3 dB
─────────────────────────
TOTAL PERDA: -23.85 dB

Potência na ONU: -3 - 23.85 = -26.85 dBm
Limite mínimo: -28 dBm
✅ DENTRO DO BUDGET (−2.15 dB margin)
```

## VLANs FTTH

### Plano de VLANs Recomendado

| VLAN | Uso | Range |
|------|-----|-------|
| 100 | Internet PPPoE | Clientes |
| 200 | VoIP | Telefonia |
| 300 | IPTV | TV |
| 400 | Gestão OLT | Admin |
| 500 | Monitoramento | NOC |

## Mapa de Cobertura (GeoJSON)

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-46.6333, -23.5505]
      },
      "properties": {
        "type": "olt",
        "name": "OLT Central",
        "status": "online"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [-46.6333, -23.5505],
          [-46.6340, -23.5510],
          [-46.6345, -23.5515]
        ]
      },
      "properties": {
        "type": "fiber",
        "capacity": "10Gbps",
        "status": "active"
      }
    }
  ]
}
```

## Checklist Ativação Cliente FTTH

- [ ] Cliente cadastrado no sistema
- [ ] Endereço com coordenadas GPS
- [ ] OLT e porta designada
- [ ] Splitter path definido
- [ ] VLAN atribuída
- [ ] ONT serial registrado
- [ ] Potência medida > -27 dBm
- [ ] Ping gateway OK
- [ ] Speedtest > 80% da velocidade contratada
- [ ] Credenciais enviadas ao cliente
