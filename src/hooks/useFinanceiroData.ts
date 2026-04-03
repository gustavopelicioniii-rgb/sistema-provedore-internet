import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isSameMonth, normalizeInvoiceStatus, type InvoiceStatus } from "@/utils/finance";

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

      const customerNames = new Map((customers ?? []).map((customer) => [customer.id, customer.name]));
      const normalizedInvoices = (invoices ?? []).map((invoice) => ({
        ...invoice,
        normalizedStatus: normalizeInvoiceStatus(invoice),
      }));

      const monthlyBilling = normalizedInvoices
        .filter((invoice) => isSameMonth(invoice.due_date))
        .reduce((total, invoice) => total + invoice.amount, 0);

      const receivedThisMonth = normalizedInvoices
        .filter((invoice) => invoice.normalizedStatus === "paid" && isSameMonth(invoice.paid_date))
        .reduce((total, invoice) => total + invoice.amount, 0);

      const receivable = normalizedInvoices
        .filter((invoice) => invoice.normalizedStatus === "pending" || invoice.normalizedStatus === "overdue")
        .reduce((total, invoice) => total + invoice.amount, 0);

      const defaultingCustomers = new Set(
        normalizedInvoices
          .filter((invoice) => invoice.normalizedStatus === "overdue")
          .map((invoice) => invoice.customer_id),
      ).size;

      const recentInvoices = normalizedInvoices.slice(0, 8).map((invoice) => ({
        id: invoice.id,
        customerName: customerNames.get(invoice.customer_id) ?? "Cliente removido",
        amount: invoice.amount,
        dueDate: invoice.due_date,
        status: invoice.normalizedStatus,
      }));

      return {
        monthlyBilling,
        receivedThisMonth,
        receivable,
        defaultingCustomers,
        recentInvoices,
      };
    },
  });
}
