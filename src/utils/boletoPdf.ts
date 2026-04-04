import { formatCurrency, formatDate } from "@/utils/finance";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";

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
 * Generates a professional boleto PDF with barcode + PIX QR Code using jsPDF.
 */
export async function generateBoletoPdf(data: BoletoData) {
  const doc = new jsPDF("p", "mm", "a4");
  const W = doc.internal.pageSize.getWidth();
  const M = 20;
  let y = 0;

  // ── Header bar ──
  doc.setFillColor(33, 140, 230);
  doc.rect(0, 0, W, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("BOLETO - 2ª VIA", M, 14);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Documento gerado em ${new Date().toLocaleDateString("pt-BR")}`, W - M, 14, { align: "right" });

  // ── Info section ──
  y = 34;
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);

  const lines: [string, string][] = [
    ["Cliente:", data.customerName],
    ["Vencimento:", formatDate(data.dueDate)],
    ["Valor:", formatCurrency(data.amount)],
    ["Status:", data.statusLabel],
    ["Fatura ID:", data.id.slice(0, 8).toUpperCase()],
  ];

  lines.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, M, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, M + 30, y);
    y += 7;
  });

  // ── Separator ──
  y += 2;
  doc.setDrawColor(200, 200, 200);
  doc.line(M, y, W - M, y);
  y += 8;

  // ── Barcode section ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Codigo de Barras:", M, y);
  y += 6;

  if (data.barcode) {
    const digits = data.barcode.replace(/\D/g, "");
    const totalWidth = W - 2 * M;
    const barCount = Math.max(digits.length * 2, 60);
    const barWidth = totalWidth / barCount;
    const barHeight = 18;

    doc.setFillColor(0, 0, 0);
    for (let i = 0; i < barCount; i++) {
      const charCode = digits.charCodeAt(i % digits.length) || 48;
      const isBar = (charCode + i) % 3 !== 0;
      if (isBar) {
        const w = charCode % 2 === 0 ? barWidth * 0.8 : barWidth * 1.2;
        doc.rect(M + i * barWidth, y, w, barHeight, "F");
      }
    }
    y += barHeight + 4;

    // Print barcode digits
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(digits, M, y);
    y += 10;
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text("Codigo de barras nao disponivel para esta fatura.", M, y);
    y += 10;
  }

  // ── PIX QR Code section ──
  if (data.pixQrcode) {
    doc.setDrawColor(200, 200, 200);
    doc.line(M, y, W - M, y);
    y += 8;

    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Pagamento via PIX", M, y);
    y += 7;

    try {
      // Generate QR Code as data URL
      const qrDataUrl = await QRCode.toDataURL(data.pixQrcode, {
        width: 400,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
      });

      const qrSize = 50;
      doc.addImage(qrDataUrl, "PNG", M, y, qrSize, qrSize);

      // Label beside QR code
      const textX = M + qrSize + 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text("Escaneie o QR Code ao lado", textX, y + 10);
      doc.text("com o app do seu banco para", textX, y + 16);
      doc.text("realizar o pagamento via PIX.", textX, y + 22);

      doc.setFontSize(8);
      doc.setTextColor(33, 140, 230);
      doc.text("Codigo Copia e Cola:", textX, y + 34);

      // Print PIX code wrapped
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(7);
      const maxCharsPerLine = 60;
      const pix = data.pixQrcode;
      let lineY = y + 40;
      for (let i = 0; i < pix.length; i += maxCharsPerLine) {
        doc.text(pix.substring(i, i + maxCharsPerLine), textX, lineY);
        lineY += 4;
      }

      y += qrSize + 6;
    } catch {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Erro ao gerar QR Code PIX.", M, y);
      y += 8;
    }
  }

  // ── Footer ──
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Este documento e uma representacao da fatura para fins de pagamento. Gerado automaticamente.",
    M,
    doc.internal.pageSize.getHeight() - 10
  );

  // Save
  doc.save(`boleto-${data.id.slice(0, 8)}.pdf`);
}
