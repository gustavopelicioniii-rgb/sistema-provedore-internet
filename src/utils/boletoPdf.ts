import { formatCurrency, formatDate } from "@/utils/finance";

interface BoletoData {
  id: string;
  customerName: string;
  amount: number;
  dueDate: string;
  status: string;
  statusLabel: string;
  barcode?: string | null;
  pixQrcode?: string | null;
}

/**
 * Generates a professional-looking PDF boleto with barcode representation.
 * Uses raw PDF construction (no external lib needed).
 */
export function generateBoletoPdf(data: BoletoData) {
  const W = 595; // A4 portrait
  const H = 842;
  const M = 40;

  let content = "";

  // ── Header bar ──
  content += `0.13 0.55 0.90 rg\n`;
  content += `0 ${H - 60} ${W} 60 re f\n`;
  content += `1 1 1 rg\n`;
  content += `BT /F1 18 Tf ${M} ${H - 38} Td (BOLETO - 2a VIA) Tj ET\n`;
  content += `BT /F1 10 Tf ${W - M - 180} ${H - 38} Td (Documento gerado em ${new Date().toLocaleDateString("pt-BR")}) Tj ET\n`;

  // ── Info section ──
  const infoY = H - 100;
  content += `0 0 0 rg\n`;

  const lines = [
    [`Cliente:`, data.customerName],
    [`Vencimento:`, formatDate(data.dueDate)],
    [`Valor:`, formatCurrency(data.amount)],
    [`Status:`, data.statusLabel],
    [`Fatura ID:`, data.id.slice(0, 8).toUpperCase()],
  ];

  lines.forEach(([label, value], i) => {
    const y = infoY - i * 22;
    content += `BT /F1 10 Tf ${M} ${y} Td (${pdfEscape(label)}) Tj ET\n`;
    content += `BT /F1 10 Tf ${M + 100} ${y} Td (${pdfEscape(value)}) Tj ET\n`;
  });

  // ── Separator line ──
  const sepY = infoY - lines.length * 22 - 10;
  content += `0.8 0.8 0.8 rg\n`;
  content += `${M} ${sepY} ${W - 2 * M} 1 re f\n`;

  // ── Barcode section ──
  const bcY = sepY - 30;
  content += `0 0 0 rg\n`;
  content += `BT /F1 10 Tf ${M} ${bcY} Td (Codigo de Barras:) Tj ET\n`;

  if (data.barcode) {
    // Draw barcode representation (ITF-style bars)
    const barStartY = bcY - 20;
    const barHeight = 50;
    const totalWidth = W - 2 * M;
    const digits = data.barcode.replace(/\D/g, "");
    const barCount = Math.max(digits.length * 2, 60);
    const barWidth = totalWidth / barCount;

    for (let i = 0; i < barCount; i++) {
      const charCode = digits.charCodeAt(i % digits.length) || 48;
      const isBar = (charCode + i) % 3 !== 0;
      if (isBar) {
        const w = (charCode % 2 === 0) ? barWidth * 0.8 : barWidth * 1.2;
        content += `0 0 0 rg\n`;
        content += `${M + i * barWidth} ${barStartY - barHeight} ${w} ${barHeight} re f\n`;
      }
    }

    // Print barcode number below bars
    const codeY = barStartY - barHeight - 18;
    content += `BT /F1 9 Tf ${M} ${codeY} Td (${pdfEscape(digits)}) Tj ET\n`;

    // ── PIX section ──
    if (data.pixQrcode) {
      const pixY = codeY - 30;
      content += `BT /F1 10 Tf ${M} ${pixY} Td (Codigo PIX Copia e Cola:) Tj ET\n`;
      // Split long PIX code into lines
      const pix = data.pixQrcode;
      const chunkSize = 80;
      for (let i = 0; i < pix.length; i += chunkSize) {
        const chunk = pix.substring(i, i + chunkSize);
        const lineY = pixY - 16 - (i / chunkSize) * 14;
        content += `BT /F1 7 Tf ${M} ${lineY} Td (${pdfEscape(chunk)}) Tj ET\n`;
      }
    }
  } else {
    content += `BT /F1 9 Tf ${M} ${bcY - 20} Td (Codigo de barras nao disponivel para esta fatura.) Tj ET\n`;
  }

  // ── Footer ──
  content += `0.5 0.5 0.5 rg\n`;
  content += `BT /F1 7 Tf ${M} ${M - 10} Td (Este documento e uma representacao da fatura para fins de pagamento. Gerado automaticamente.) Tj ET\n`;

  // Build PDF
  const pdf = buildSimplePdf(content, W, H);
  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `boleto-${data.id.slice(0, 8)}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function pdfEscape(text: string) {
  return String(text ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, (c) => {
      const map: Record<string, string> = {
        á: "a", à: "a", ã: "a", â: "a", é: "e", ê: "e", í: "i",
        ó: "o", ô: "o", õ: "o", ú: "u", ü: "u", ç: "c",
        Á: "A", À: "A", Ã: "A", Â: "A", É: "E", Ê: "E", Í: "I",
        Ó: "O", Ô: "O", Õ: "O", Ú: "U", Ç: "C", ñ: "n", Ñ: "N",
      };
      return map[c] || "?";
    });
}

function buildSimplePdf(content: string, w: number, h: number): string {
  const objs: string[] = [];
  const addObj = (c: string) => { objs.push(c); return objs.length; };

  addObj("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj");
  addObj(""); // placeholder for Pages
  addObj("3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj");

  const streamBytes = new TextEncoder().encode(content);
  const streamId = addObj(
    `4 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n${content}endstream\nendobj`
  );
  const pageId = addObj(
    `5 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Contents ${streamId} 0 R /Resources << /Font << /F1 3 0 R >> >> >>\nendobj`
  );

  objs[1] = `2 0 obj\n<< /Type /Pages /Kids [${pageId} 0 R] /Count 1 >>\nendobj`;

  let body = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((obj) => { offsets.push(body.length); body += obj + "\n"; });

  const xrefOffset = body.length;
  body += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((off) => { body += `${String(off).padStart(10, "0")} 00000 n \n`; });
  body += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return body;
}
