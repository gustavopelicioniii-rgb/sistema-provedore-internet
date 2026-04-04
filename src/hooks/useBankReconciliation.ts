import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type ReconciliationStatus = "pending" | "processing" | "completed" | "error";
export type BankTransactionStatus = "unmatched" | "matched" | "ignored";

export interface BankReconciliation {
  id: string;
  organization_id: string;
  file_name: string;
  file_format: string;
  imported_at: string;
  status: ReconciliationStatus;
  matched_count: number;
  unmatched_count: number;
  total_amount: number;
  notes: string | null;
  created_at: string;
}

export interface BankTransaction {
  id: string;
  organization_id: string;
  reconciliation_id: string;
  transaction_date: string;
  amount: number;
  description: string | null;
  memo: string | null;
  fitid: string | null;
  matched_invoice_id: string | null;
  status: BankTransactionStatus;
  created_at: string;
  invoices?: { amount: number; due_date: string; customers: { name: string } | null } | null;
}

export interface ParsedOFXTransaction {
  fitid: string;
  date: string;
  amount: number;
  description: string;
  memo?: string;
}

async function getOrgId() {
  const { data, error } = await supabase.from("profiles").select("organization_id").maybeSingle();
  if (error) throw error;
  if (!data?.organization_id) throw new Error("Organização não encontrada.");
  return data.organization_id;
}

export function useBankReconciliations() {
  return useQuery({
    queryKey: ["bank_reconciliations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_reconciliations" as any)
        .select("*")
        .order("imported_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as BankReconciliation[];
    },
  });
}

export function useBankTransactions(reconciliationId?: string) {
  return useQuery({
    queryKey: ["bank_transactions", reconciliationId],
    enabled: !!reconciliationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_transactions" as any)
        .select("*, invoices:matched_invoice_id(amount, due_date, customers:customer_id(name))")
        .eq("reconciliation_id", reconciliationId!)
        .order("transaction_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as BankTransaction[];
    },
  });
}

export function useImportBankFile() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ fileName, transactions }: { fileName: string; transactions: ParsedOFXTransaction[] }) => {
      const orgId = await getOrgId();

      // Create reconciliation record
      const { data: recon, error: reconError } = await supabase
        .from("bank_reconciliations" as any)
        .insert({
          organization_id: orgId,
          file_name: fileName,
          file_format: "ofx",
          status: "processing",
          unmatched_count: transactions.length,
        })
        .select()
        .single();
      if (reconError) throw reconError;
      const reconId = (recon as any).id;

      // Insert transactions
      const txRows = transactions.map((tx) => ({
        organization_id: orgId,
        reconciliation_id: reconId,
        transaction_date: tx.date,
        amount: tx.amount,
        description: tx.description,
        memo: tx.memo || null,
        fitid: tx.fitid,
        status: "unmatched",
      }));

      const { error: txError } = await supabase.from("bank_transactions" as any).insert(txRows);
      if (txError) throw txError;

      return reconId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bank_reconciliations"] });
      qc.invalidateQueries({ queryKey: ["bank_transactions"] });
      toast({ title: "Arquivo importado com sucesso!" });
    },
    onError: (e: Error) => {
      toast({ title: "Erro na importação", description: e.message, variant: "destructive" });
    },
  });
}

export function useMatchTransaction() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ transactionId, invoiceId }: { transactionId: string; invoiceId: string }) => {
      const { error } = await supabase
        .from("bank_transactions" as any)
        .update({ matched_invoice_id: invoiceId, status: "matched" })
        .eq("id", transactionId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bank_transactions"] });
      toast({ title: "Transação conciliada!" });
    },
    onError: (e: Error) => {
      toast({ title: "Erro ao conciliar", description: e.message, variant: "destructive" });
    },
  });
}

// Simple OFX parser
export function parseOFXFile(content: string): ParsedOFXTransaction[] {
  const transactions: ParsedOFXTransaction[] = [];
  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;

  while ((match = stmtTrnRegex.exec(content)) !== null) {
    const block = match[1];
    const getValue = (tag: string) => {
      const m = new RegExp(`<${tag}>([^<\\n]+)`, "i").exec(block);
      return m ? m[1].trim() : "";
    };

    const dtPosted = getValue("DTPOSTED");
    const dateStr = dtPosted.length >= 8
      ? `${dtPosted.slice(0, 4)}-${dtPosted.slice(4, 6)}-${dtPosted.slice(6, 8)}`
      : "";

    transactions.push({
      fitid: getValue("FITID"),
      date: dateStr,
      amount: parseFloat(getValue("TRNAMT")) || 0,
      description: getValue("NAME") || getValue("MEMO"),
      memo: getValue("MEMO"),
    });
  }

  return transactions;
}
