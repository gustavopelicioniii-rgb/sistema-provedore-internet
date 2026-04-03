import type { ContractWithRelations } from "@/hooks/useContracts";
import { STATUS_META } from "@/hooks/useContracts";
import { formatCurrency, formatDate } from "@/utils/finance";

export function generateContractPdf(contract: ContractWithRelations) {
  const status = STATUS_META[contract.status];
  const addr = contract.installation_address as Record<string, string> | null;
  const addrStr = addr
    ? [addr.street, addr.number, addr.neighborhood, addr.city, addr.state].filter(Boolean).join(", ")
    : "Não informado";

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Contrato ${contract.id.slice(0, 8)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a1a; font-size: 14px; line-height: 1.6; }
  .header { border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
  .header h1 { font-size: 22px; color: #2563eb; }
  .header p { color: #666; font-size: 12px; margin-top: 4px; }
  .section { margin-bottom: 24px; }
  .section h2 { font-size: 15px; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 12px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
  .field { }
  .field .label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
  .field .value { font-weight: 600; }
  .status { display: inline-block; padding: 2px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; background: #eef2ff; color: #2563eb; }
  .footer { margin-top: 60px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
  .sig-line { margin-top: 60px; display: flex; justify-content: space-between; }
  .sig-line div { text-align: center; width: 45%; border-top: 1px solid #333; padding-top: 6px; font-size: 12px; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <div class="header">
    <h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>
    <p>ID: ${contract.id} · Gerado em ${new Date().toLocaleDateString("pt-BR")}</p>
  </div>
  
  <div class="section">
    <h2>Dados do Cliente</h2>
    <div class="grid">
      <div class="field"><div class="label">Nome</div><div class="value">${contract.customers?.name ?? "—"}</div></div>
      <div class="field"><div class="label">Status</div><div class="value"><span class="status">${status.label}</span></div></div>
    </div>
  </div>

  <div class="section">
    <h2>Plano Contratado</h2>
    <div class="grid">
      <div class="field"><div class="label">Plano</div><div class="value">${contract.plans?.name ?? "—"}</div></div>
      <div class="field"><div class="label">Valor Mensal</div><div class="value">${contract.plans?.price ? formatCurrency(contract.plans.price) : "—"}</div></div>
    </div>
  </div>

  <div class="section">
    <h2>Vigência</h2>
    <div class="grid">
      <div class="field"><div class="label">Início</div><div class="value">${contract.start_date ? formatDate(contract.start_date) : "—"}</div></div>
      <div class="field"><div class="label">Fim</div><div class="value">${contract.end_date ? formatDate(contract.end_date) : "Indeterminado"}</div></div>
      <div class="field"><div class="label">Assinado em</div><div class="value">${contract.signed_at ? formatDate(contract.signed_at.slice(0, 10)) : "Pendente"}</div></div>
    </div>
  </div>

  <div class="section">
    <h2>Endereço de Instalação</h2>
    <p>${addrStr}</p>
  </div>

  <div class="footer">
    <div class="sig-line">
      <div>Contratante</div>
      <div>Contratada</div>
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.onload = () => {
      win.print();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    };
  }
}
