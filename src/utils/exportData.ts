import * as XLSX from "xlsx";

export function downloadXlsx(filename: string, headers: string[], rows: string[][], sheetName = "Dados") {
  const data = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);
  // Auto-fit column widths
  ws["!cols"] = headers.map((h, i) => {
    const maxLen = Math.max(h.length, ...rows.map((r) => (r[i] ?? "").length));
    return { wch: Math.min(maxLen + 2, 40) };
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  triggerDownload(blob, filename);
}

export function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const escape = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))];
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename);
}

export function downloadPdfTable(title: string, filename: string, headers: string[], rows: string[][]) {
  const pageW = 842; // A4 landscape
  const pageH = 595;
  const margin = 40;
  const colW = (pageW - 2 * margin) / headers.length;
  const rowH = 22;
  const headerH = 28;
  const maxRowsPerPage = Math.floor((pageH - margin * 2 - 50) / rowH);

  const pages: string[] = [];
  let pageIdx = 0;

  for (let i = 0; i < rows.length; i += maxRowsPerPage) {
    pageIdx++;
    const chunk = rows.slice(i, i + maxRowsPerPage);
    let content = "";

    // Title
    content += `BT /F1 14 Tf ${margin} ${pageH - margin} Td (${pdfEscape(title)}) Tj ET\n`;

    // Header row
    const headerY = pageH - margin - 30;
    content += `0.15 0.15 0.15 rg\n`;
    content += `${margin} ${headerY - headerH + 6} ${pageW - 2 * margin} ${headerH} re f\n`;
    content += `1 1 1 rg\n`;
    headers.forEach((h, ci) => {
      content += `BT /F1 9 Tf ${margin + ci * colW + 4} ${headerY - headerH + 14} Td (${pdfEscape(h)}) Tj ET\n`;
    });

    // Data rows
    content += `0 0 0 rg\n`;
    chunk.forEach((row, ri) => {
      const y = headerY - headerH - ri * rowH;
      if (ri % 2 === 0) {
        content += `0.95 0.95 0.95 rg\n${margin} ${y - rowH + 6} ${pageW - 2 * margin} ${rowH} re f\n0 0 0 rg\n`;
      }
      row.forEach((cell, ci) => {
        const truncated = String(cell ?? "").substring(0, 40);
        content += `BT /F1 8 Tf ${margin + ci * colW + 4} ${y - rowH + 12} Td (${pdfEscape(truncated)}) Tj ET\n`;
      });
    });

    // Footer
    content += `BT /F1 7 Tf ${pageW - margin - 60} ${margin - 10} Td (Pagina ${pageIdx}) Tj ET\n`;

    pages.push(content);
  }

  const pdf = buildPdf(pages, pageW, pageH);
  const blob = new Blob([pdf], { type: "application/pdf" });
  triggerDownload(blob, filename);
}

function pdfEscape(text: string) {
  return String(text ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, (c) => {
      // Replace non-ASCII with closest ASCII or ?
      const map: Record<string, string> = {
        á: "a", à: "a", ã: "a", â: "a", é: "e", ê: "e", í: "i", ó: "o", ô: "o", õ: "o", ú: "u", ü: "u",
        ç: "c", Á: "A", À: "A", Ã: "A", Â: "A", É: "E", Ê: "E", Í: "I", Ó: "O", Ô: "O", Õ: "O", Ú: "U",
        Ç: "C", ñ: "n", Ñ: "N",
      };
      return map[c] || "?";
    });
}

function buildPdf(pages: string[], w: number, h: number) {
  const objs: string[] = [];
  const addObj = (content: string) => { objs.push(content); return objs.length; };

  // 1: Catalog
  addObj("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj");

  // 2: Pages (placeholder, filled later)
  const pagesObjIdx = addObj("");

  // 3: Font
  addObj("3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj");

  const pageObjIds: number[] = [];
  pages.forEach((content) => {
    const streamBytes = new TextEncoder().encode(content);
    const streamId = addObj(
      `${objs.length + 1} 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n${content}endstream\nendobj`
    );
    const pageId = addObj(
      `${objs.length + 1} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Contents ${streamId} 0 R /Resources << /Font << /F1 3 0 R >> >> >>\nendobj`
    );
    pageObjIds.push(pageId);
  });

  // Fix pages object
  objs[pagesObjIdx - 1] = `2 0 obj\n<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>\nendobj`;

  // Build file
  let body = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((obj) => {
    offsets.push(body.length);
    body += obj + "\n";
  });

  const xrefOffset = body.length;
  body += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((off) => {
    body += `${String(off).padStart(10, "0")} 00000 n \n`;
  });
  body += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return body;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
