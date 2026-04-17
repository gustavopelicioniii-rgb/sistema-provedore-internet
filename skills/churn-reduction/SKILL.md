---
name: churn-reduction
description: Sistema de redução de churn (cancelamento) para ISPs. Use quando: (1) Identificar clientes com sinais de cancelamento, (2) Criar automações de retenção, (3) Enviar ofertas personalizadas, (4) Analisar padrão de cancelamento, (5) Criar campanhas de satisfação, (6) Monitorar NPS. Aciona em frases como "churn", "cancelamento", "retenção", "cliente insatisfeito", "reduzir cancelamento", "NPS", "pesquisa satisfação".
---

# Churn Reduction

## Detecção de Churn

### Sinais de Alerta
- 3+ tickets em 30 dias
- Pagamento atrasado recorrente
- Queda de uso nos últimos 30 dias
- Reclamações no Reclame Aqui
- Neutro/Negativo no NPS

### Scripts

### `scripts/churn_detector.py`
Analisa clientes e calcula score de churn (0-100).

### `scripts/retention_campaign.py`
Cria automações de retenção baseadas em triggers.

## Fluxo de Retenção

1. **Detectar** → Score > 70 = cliente em risco
2. **Segmentar** → Basic/Medium/Premium por plano
3. **Personalizar** → Oferta baseada no histórico
4. **Executar** → WhatsApp/e-mail automático
5. **Acompanhar** → 7 dias para resposta

## Ofertas de Retenção

| Situação | Oferta |
|----------|--------|
| Pagamento | Desconto 10% + 3 meses |
| Velocidade | Upgrade grátis 30 dias |
| Suporte | VIP priority 60 dias |
| Geral | Sorteio internet grátis |

## Métricas

- **Churn Rate**: (Cancelamentos / Total) × 100
- **Target**: < 2% mensal
- **Custo Retenção**: < 50% do LTV
