---
name: financial-intelligence
description: Inteligência financeira para ISPs. Use quando: (1) Calcular MRR/ARR, (2) Análise de receita, (3) Previsão de churn financeiro, (4) Calcular LTV de clientes, (5) Dashboard financeiro, (6) Análise de inadimplência, (7) Relatórios financeiros. Aciona em frases como "mrr", "arr", "receita", "ltv", "churn financeiro", "inadimplência", "dashboard financeiro", "relatório receita".
---

# Financial Intelligence

## Métricas Principais

### MRR (Monthly Recurring Revenue)
```python
MRR = soma(plano.preco for cliente.ativo)
```

### ARR (Annual Recurring Revenue)
```python
ARR = MRR × 12
```

### LTV (Lifetime Value)
```python
LTV = (ARPU × gross_margin) / churn_rate
# Exemplo: (R$100 × 0.6) / 0.02 = R$ 3.000
```

### CAC (Customer Acquisition Cost)
```python
CAC = total_marketing / novos_clientes
```

### Churn Rate Mensal
```python
churn = (cancelamentos / total_inicio_mes) × 100
```

## Dashboard Components

### KPIs
- MRR atual vs meta
- Crescimento MRR (mês a mês)
- Inadimplência atual
- Ticket médio
- Nova MRR vs Churn MRR

### Gráficos
- Evolução MRR 12 meses
- Distribuição por plano
- Faturas por status (pizza)
- Top 10 clientes receita

## Previsão Churn Financeiro

Cliente em risco se:
- 2+ faturas vencidas
- Ticket médio caiu > 30%
- Plano downgraded nos últimos 90 dias

## Relatório Mensal

1. Resumo executivo
2. MRR/ARR atual
3. Análise de crescimento
4. Inadimplência
5. Top planos por receita
6. Projeções próximo mês
