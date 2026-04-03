import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') { inQuotes = !inQuotes; continue; }
    if ((char === "," || char === ";") && !inQuotes) { result.push(current.trim()); current = ""; continue; }
    current += char;
  }
  result.push(current.trim());
  return result;
}

export default function CsvImportDialog({ open, onOpenChange }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const reset = () => { setFile(null); setResult(null); };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setResult(null);

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) throw new Error("CSV deve ter cabeçalho e ao menos 1 linha de dados.");

      const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_"));

      const { data: profile } = await supabase.from("profiles").select("organization_id").maybeSingle();
      if (!profile?.organization_id) throw new Error("Organização não encontrada.");

      const nameIdx = headers.findIndex((h) => h.includes("nome") || h === "name");
      const cpfIdx = headers.findIndex((h) => h.includes("cpf") || h.includes("cnpj") || h === "documento");
      if (nameIdx === -1 || cpfIdx === -1) throw new Error("CSV deve conter colunas 'nome' e 'cpf_cnpj' (ou 'documento').");

      const emailIdx = headers.findIndex((h) => h === "email");
      const phoneIdx = headers.findIndex((h) => h.includes("telefone") || h === "phone");
      const whatsIdx = headers.findIndex((h) => h.includes("whatsapp") || h === "whats");
      const cityIdx = headers.findIndex((h) => h.includes("cidade") || h === "city");
      const stateIdx = headers.findIndex((h) => h.includes("estado") || h === "state" || h === "uf");

      const rows = lines.slice(1).map((line) => parseCsvLine(line));
      let success = 0;
      const errors: string[] = [];

      const batchSize = 50;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const inserts = batch
          .map((cols, idx) => {
            const name = cols[nameIdx]?.trim();
            const cpf = cols[cpfIdx]?.replace(/\D/g, "").trim();
            if (!name || !cpf) { errors.push(`Linha ${i + idx + 2}: nome ou CPF vazio`); return null; }
            const address: Record<string, string> = {};
            if (cityIdx >= 0 && cols[cityIdx]) address.city = cols[cityIdx];
            if (stateIdx >= 0 && cols[stateIdx]) address.state = cols[stateIdx];
            return {
              organization_id: profile.organization_id,
              name,
              cpf_cnpj: cpf,
              email: emailIdx >= 0 ? cols[emailIdx] || null : null,
              phone: phoneIdx >= 0 ? cols[phoneIdx] || null : null,
              whatsapp: whatsIdx >= 0 ? cols[whatsIdx] || null : null,
              address: (Object.keys(address).length ? address : {}) as Json,
            };
          })
          .filter(Boolean);

        if (inserts.length) {
          const { error } = await supabase.from("customers").insert(inserts as any);
          if (error) errors.push(`Lote ${Math.floor(i / batchSize) + 1}: ${error.message}`);
          else success += inserts.length;
        }
      }

      setResult({ success, errors });
      if (success > 0) {
        qc.invalidateQueries({ queryKey: ["customers"] });
        qc.invalidateQueries({ queryKey: ["dashboard-data"] });
        toast({ title: `${success} clientes importados!` });
      }
    } catch (err: any) {
      setResult({ success: 0, errors: [err.message] });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Clientes via CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            O CSV deve conter ao menos as colunas <strong>nome</strong> e <strong>cpf_cnpj</strong> (ou documento).
            Colunas opcionais: email, telefone, whatsapp, cidade, estado/uf.
          </p>

          <div
            className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">{file ? file.name : "Clique para selecionar o arquivo CSV"}</p>
            <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>

          {result && (
            <div className="space-y-2 rounded-lg border p-3 text-sm">
              {result.success > 0 && (
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle className="size-4" /> {result.success} clientes importados
                </div>
              )}
              {result.errors.map((err, i) => (
                <div key={i} className="flex items-start gap-2 text-destructive">
                  <AlertTriangle className="size-4 mt-0.5 shrink-0" /> {err}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button onClick={handleImport} disabled={!file || importing}>
            {importing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Upload className="mr-2 size-4" />}
            Importar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
