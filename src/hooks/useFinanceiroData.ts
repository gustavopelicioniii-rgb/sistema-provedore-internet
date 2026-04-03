import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isSameMonth, normalizeInvoiceStatus, getLastMonths, type InvoiceStatus } from "@/utils/finance";

export interface FinanceInvoiceItem {
  id: string;
  customerName: string;
  amount: number;
  dueDate: string;
  status: InvoiceStatus;
}

export interface FinanceiroData {
  monthlyBilling: number;
  receivedThisMonth: number;
  receivable: number;
  defaultingCustomers: number;
  recentInvoices: FinanceInvoiceItem[];
  statusBreakdown: Array<{ category: string; count: number; total: number }>;
  monthlyTrend: Array<{ month: string; faturado: number; recebido: number }>;
}

export function useFinanceiroData() {
  return useQuery({
    queryKey: ["financeiro-data"],
    queryFn: async (): Promise<FinanceiroData> => {
      const [{ data: invoices, error: invoicesError }, { data: customers, error: customersError }] = await Promise.all([
        supabase
          .from("invoices")
          .select("id, customer_id, amount, due_date, paid_date, status, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("customers").select("id, name"),
      ]);

      if (invoicesError) throw invoicesError;
      if (customersError) throw customersError;

      const customerNames = new Map((customers ?? []).map((c) => [c.id, c.name]));
      const normalizedInvoices = (invoices ?? []).map((inv) => ({
        ...inv,
        normalizedStatus: normalizeInvoiceStatus(inv),
      }));

      const monthlyBilling = normalizedInvoices
        .filter((inv) => isSameMonth(inv.due_date))
        .reduce((t, inv) => t + inv.amount, 0);

      const receivedThisMonth = normalizedInvoices
        .filter((inv) => inv.normalizedStatus === "paid" && isSameMonth(inv.paid_date))
        .reduce((t, inv) => t + inv.amount, 0);

      const receivable = normalizedInvoices
        .filter((inv) => inv.normalizedStatus === "pending" || inv.normalizedStatus === "overdue")
        .reduce((t, inv) => t + inv.amount, 0);

      const defaultingCustomers = new Set(
        normalizedInvoices.filter((inv) => inv.normalizedStatus === "overdue").map((inv) => inv.customer_id),
      ).size;

      const statusMap: Record<InvoiceStatus, { count: number; total: number }> = {
        paid: { count: 0, total: 0 },
        pending: { count: 0, total: 0 },
        overdue: { count: 0, total: 0 },
        cancelled: { count: 0, total: 0 },
      };
      normalizedInvoices.forEach((inv) => {
        statusMap[inv.normalizedStatus].count += 1;
        statusMap[inv.normalizedStatus].total += inv.amount;
      });
      const labels: Record<string, string> = { paid: "Pagas", pending: "Pendentes", overdue: "Vencidas", cancelled: "Canceladas" };
      const statusBreakdown = (Object.keys(statusMap) as InvoiceStatus[]).map((s) => ({
        category: labels[s],
        count: statusMap[s].count,
        total: statusMap[s].total,
      }));

      const months = getLastMonths(6);
      const monthlyTrend = months.map((m) => {
        const inMonth = normalizedInvoices.filter((inv) => {
          const d = new Date(`${inv.due_date}T00:00:00`);
          return d >= m.start && d <= m.end;
        });
        return {
          month: m.label,
          faturado: inMonth.reduce((t, inv) => t + inv.amount, 0),
          recebido: inMonth.filter((inv) => inv.normalizedStatus === "paid").reduce((t, inv) => t + inv.amount, 0),
        };
      });

      const recentInvoices = normalizedInvoices.map((inv) => ({
        id: inv.id,
        customerName: customerNames.get(inv.customer_id) ?? "Cliente removido",
        amount: inv.amount,
        dueDate: inv.due_date,
        status: inv.normalizedStatus,
      }));

      return { monthlyBilling, receivedThisMonth, receivable, defaultingCustomers, recentInvoices, statusBreakdown, monthlyTrend };
    },
  });
}
