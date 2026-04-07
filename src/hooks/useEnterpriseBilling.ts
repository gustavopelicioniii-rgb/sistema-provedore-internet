import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// ─── Invoice Installments ───
export function useInvoiceInstallments(invoiceId: string | null) {
  return useQuery({
    queryKey: ["invoice-installments", invoiceId],
    enabled: !!invoiceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoice_installments")
        .select("*")
        .eq("invoice_id", invoiceId!)
        .order("installment_number", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateInstallments() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      invoiceId,
      totalAmount,
      numInstallments,
      firstDueDate,
      organizationId,
    }: {
      invoiceId: string;
      totalAmount: number;
      numInstallments: number;
      firstDueDate: string;
      organizationId: string;
    }) => {
      const installmentAmount = Math.round((totalAmount / numInstallments) * 100) / 100;
      const remainder = Math.round((totalAmount - installmentAmount * numInstallments) * 100) / 100;

      const installments = Array.from({ length: numInstallments }, (_, i) => {
        const dueDate = new Date(firstDueDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        return {
          organization_id: organizationId,
          invoice_id: invoiceId,
          installment_number: i + 1,
          amount: i === 0 ? installmentAmount + remainder : installmentAmount,
          due_date: dueDate.toISOString().slice(0, 10),
          status: "pending",
        };
      });

      // Update invoice with installment count
      const { error: updateError } = await supabase
        .from("invoices")
        .update({ installment_count: numInstallments } as any)
        .eq("id", invoiceId);
      if (updateError) throw updateError;

      const { data, error } = await supabase.from("invoice_installments").insert(installments).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoice-installments"] });
      qc.invalidateQueries({ queryKey: ["financeiro-data"] });
      toast({ title: "Parcelas criadas com sucesso!" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao criar parcelas", description: err.message, variant: "destructive" });
    },
  });
}

// ─── Carnê Digital (Generate 12 months of invoices) ───
export function useGenerateCarne() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      customerId,
      contractId,
      amount,
      months,
      startDate,
      organizationId,
    }: {
      customerId: string;
      contractId?: string;
      amount: number;
      months: number;
      startDate: string;
      organizationId: string;
    }) => {
      const invoices = Array.from({ length: months }, (_, i) => {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        return {
          organization_id: organizationId,
          customer_id: customerId,
          contract_id: contractId || null,
          amount,
          due_date: dueDate.toISOString().slice(0, 10),
          status: "pending" as const,
        };
      });

      const { data, error } = await supabase.from("invoices").insert(invoices).select();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["financeiro-data"] });
      qc.invalidateQueries({ queryKey: ["dashboard-data"] });
      toast({ title: `Carnê gerado!`, description: `${data.length} faturas criadas com sucesso.` });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao gerar carnê", description: err.message, variant: "destructive" });
    },
  });
}

// ─── Credit Analysis ───
export function useCreditAnalyses(customerId?: string) {
  return useQuery({
    queryKey: ["credit-analyses", customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_analyses")
        .select("*")
        .eq("customer_id", customerId!)
        .order("analyzed_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateCreditAnalysis() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      customerId,
      cpfCnpj,
      organizationId,
    }: {
      customerId: string;
      cpfCnpj: string;
      organizationId: string;
    }) => {
      // Simulate credit analysis based on invoice history
      const { data: invoices } = await supabase
        .from("invoices")
        .select("status, due_date, paid_date, amount")
        .eq("customer_id", customerId);

      const totalInvoices = invoices?.length ?? 0;
      const paidOnTime = (invoices ?? []).filter(
        (inv) => inv.status === "paid" && inv.paid_date && inv.paid_date <= inv.due_date
      ).length;
      const overdue = (invoices ?? []).filter((inv) => inv.status === "overdue").length;

      let score = 5;
      if (totalInvoices > 0) {
        const onTimeRate = paidOnTime / totalInvoices;
        score = Math.round(onTimeRate * 10 * 10) / 10;
        if (overdue > 2) score = Math.max(score - 2, 0);
      }

      const result = score >= 7 ? "approved" : score >= 4 ? "review" : "rejected";

      const { data, error } = await supabase
        .from("credit_analyses")
        .insert({
          organization_id: organizationId,
          customer_id: customerId,
          cpf_cnpj: cpfCnpj,
          score,
          result,
          source: "internal",
          notes: `${totalInvoices} faturas analisadas. ${paidOnTime} pagas em dia. ${overdue} vencidas.`,
        })
        .select()
        .single();
      if (error) throw error;

      // Update customer financial_score
      await supabase.from("customers").update({ financial_score: score }).eq("id", customerId);

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["credit-analyses"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Análise de crédito concluída!" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro na análise de crédito", description: err.message, variant: "destructive" });
    },
  });
}

// ─── Financial Score Calculator ───
export function useRecalculateFinancialScore() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (customerId: string) => {
      const { data: invoices } = await supabase
        .from("invoices")
        .select("status, due_date, paid_date, amount")
        .eq("customer_id", customerId);

      const totalInvoices = invoices?.length ?? 0;
      if (totalInvoices === 0) return 5;

      const paidOnTime = (invoices ?? []).filter(
        (inv) => inv.status === "paid" && inv.paid_date && inv.paid_date <= inv.due_date
      ).length;
      const paid = (invoices ?? []).filter((inv) => inv.status === "paid").length;
      const overdue = (invoices ?? []).filter((inv) => inv.status === "overdue").length;

      // Weighted score: on-time payments (60%), total paid ratio (30%), penalty for overdue (10%)
      const onTimeRate = paidOnTime / totalInvoices;
      const paidRate = paid / totalInvoices;
      const overdueRate = overdue / totalInvoices;

      const score = Math.min(10, Math.max(0,
        Math.round((onTimeRate * 6 + paidRate * 3 - overdueRate * 3) * 10) / 10
      ));

      await supabase.from("customers").update({ financial_score: score }).eq("id", customerId);
      return score;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Score financeiro recalculado!" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao recalcular score", description: err.message, variant: "destructive" });
    },
  });
}

// ─── Early Payment Discount ───
export function calculateEarlyPaymentDiscount(
  amount: number,
  dueDate: string,
  discountPercent: number,
  daysEarly: number = 5
): { discountedAmount: number; deadline: string; savings: number } | null {
  if (!discountPercent || discountPercent <= 0) return null;

  const due = new Date(dueDate);
  const deadline = new Date(due);
  deadline.setDate(deadline.getDate() - daysEarly);

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (now > deadline) return null;

  const savings = Math.round(amount * (discountPercent / 100) * 100) / 100;
  const discountedAmount = Math.round((amount - savings) * 100) / 100;

  return {
    discountedAmount,
    deadline: deadline.toISOString().slice(0, 10),
    savings,
  };
}
