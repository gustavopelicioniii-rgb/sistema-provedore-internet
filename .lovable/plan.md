
## Plano: Backend Completo para Provedor de Internet

### 1. Tabelas Novas no Banco (migração)
- **network_devices** — Equipamentos de rede (OLTs, roteadores, switches) com IP, tipo, fabricante, credenciais, status
- **vehicles** — Veículos da frota com placa, modelo, km, status
- **fuel_logs** — Abastecimentos vinculados a veículos
- **fiscal_invoices** — Notas fiscais (NF-e/NFCom) com chave de acesso, XML, status SEFAZ

### 2. Edge Functions — Equipamentos de Rede
- **mikrotik-api** — Integração com RouterOS API para:
  - Listar clientes PPPoE ativos
  - Criar/remover perfil de cliente
  - Bloquear/desbloquear assinante
  - Alterar velocidade (queue)
  - Consultar tráfego em tempo real
- **huawei-olt** — Integração SNMP/TL1 para:
  - Listar ONUs registradas
  - Consultar sinal óptico (Rx/Tx)
  - Provisionar/remover ONU
- **intelbras-api** — Integração com equipamentos Intelbras
- **fiberhome-zte-api** — Integração com OLTs FiberHome/ZTE

### 3. Edge Functions — Pagamentos
- **payment-gateway** — Integração com Asaas ou Gerencianet:
  - Gerar boleto/PIX para fatura
  - Webhook de confirmação de pagamento
  - Consultar status de cobranças
  - Baixa automática de faturas

### 4. Edge Functions — Comunicação
- **whatsapp-api** — Integração com Evolution API:
  - Enviar mensagem de cobrança
  - Enviar 2ª via de boleto
  - Notificação de corte/reativação
  - Templates de mensagem

### 5. Edge Functions — Fiscal
- **fiscal-nfe** — Integração com SEFAZ/Integrador:
  - Emitir NF-e (Mod. 21/22)
  - Emitir NFCom (Mod. 62)
  - Consultar status da nota
  - Download de XML/DANFE

### 6. Secrets Necessários
Cada integração precisará de chaves de API que serão solicitadas ao usuário:
- MIKROTIK_HOST, MIKROTIK_USER, MIKROTIK_PASSWORD
- HUAWEI_OLT_HOST, HUAWEI_OLT_COMMUNITY
- ASAAS_API_KEY (ou GERENCIANET_CLIENT_ID + SECRET)
- EVOLUTION_API_URL, EVOLUTION_API_KEY
- SEFAZ_CERTIFICATE (ou integrador como eNotas/Focus NFe)

### Ordem de Execução
1. ✅ Migração de banco (tabelas novas)
2. ✅ Edge Functions de equipamentos (MikroTik primeiro)
3. ✅ Edge Function de pagamentos
4. ✅ Edge Function de WhatsApp
5. ✅ Edge Function fiscal
6. ✅ Atualizar frontend para consumir as novas APIs
