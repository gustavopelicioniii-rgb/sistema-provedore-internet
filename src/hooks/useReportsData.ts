import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getLastMonths, normalizeInvoiceStatus, formatCurrency } from "@/utils/finance";

export interface MonthlyRevenue {
  month: string;
  faturado: number;
  recebido: number;
  inadimplente: number;
}

export interface TechnicianProductivity {
  name: string;
  completed: number;
  pending: number;
  avgDays: number;
}

export interface PlanDistribution {
  name: string;
  count: number;
}

export interface AgingBucket {
  label: string;
  count: number;
  amount: number;
}

export interface ReportsData {
  monthlyRevenue: MonthlyRevenue[];
  overdueByMonth: Array<{ month: string; rate: number; count: number }>;
  techProductivity: TechnicianProductivity[];
  planDistribution: PlanDistribution[];
  agingReport: AgingBucket[];
  customerExport: Array<{ name: string; cpf_cnpj: string; status: string; phone: string; email: string }>;
}

export function useReportsData() {
  return useQuery({
    queryKey: ["reports-data"],
    queryFn: async (): Promise<ReportsData> => {
      const [invoicesRes, customersRes, contractsRes, plansRes, techsRes, osRes] = await Promise.all([
        supabase.from("invoices").select("id, customer_id, amount, due_date, paid_date, status, created_at"),
        supabase.from("customers").select("id, name, cpf_cnpj, status, phone, email"),
        supabase.from("contracts").select("id, customer_id, plan_id, status"),
        supabase.from("plans").select("id, name, price, active"),
        supabase.from("technicians").select("id, name, status"),
        supabase.from("service_orders").select("id, technician_id, status, type, scheduled_date, completed_date, created_at"),
      ]);

      const invoices = (invoicesRes.data ?? []).map((inv) => ({
        ...inv,
        normalizedStatus: normalizeInvoiceStatus(inv),
      }));
      const customers = customersRes.data ?? [];
      const contracts = contractsRes.data ?? [];
      const plans = plansRes.data ?? [];
      const technicians = techsRes.data ?? [];
      const serviceOrders = osRes.data ?? [];

      // Monthly revenue (last 6 months)
      const months = getLastMonths(6);
      const monthlyRevenue: MonthlyRevenue[] = months.map((m) => {
        const monthInvoices = invoices.filter((inv) => {
          const d = new Date(`${inv.due_date}T00:00:00`);
          return d >= m.start && d <= m.end;
        });
        const faturado = monthInvoices.reduce((s, i) => s + i.amount, 0);
        const recebido = monthInvoices.filter((i) => i.normalizedStatus === "paid").reduce((s, i) => s + i.amount, 0);
        const inadimplente = monthInvoices.filter((i) => i.normalizedStatus === "overdue").reduce((s, i) => s + i.amount, 0);
        return { month: m.label, faturado, recebido, inadimplente };
      });

      // Overdue rate by month
      const overdueByMonth = months.map((m) => {
        const monthInvoices = invoices.filter((inv) => {
          const d = new Date(`${inv.due_date}T00:00:00`);
          return d >= m.start && d <= m.end;
        });
        const overdueCount = monthInvoices.filter((i) => i.normalizedStatus === "overdue").length;
        const rate = monthInvoices.length > 0 ? (overdueCount / monthInvoices.length) * 100 : 0;
        return { month: m.label, rate: Math.round(rate * 10) / 10, count: overdueCount };
      });

      // Technician productivity
      const techNameById = new Map(technicians.map((t) => [t.id, t.name]));
      const techStats = new Map<string, { completed: number; pending: number; totalDays: number; completedWithDates: number }>();

      technicians.forEach((t) => {
        techStats.set(t.id, { completed: 0, pending: 0, totalDays: 0, completedWithDates: 0 });
      });

      serviceOrders.forEach((os) => {
        if (!os.technician_id || !techStats.has(os.technician_id)) return;
        const stat = techStats.get(os.technician_id)!;
        if (os.status === "completed") {
          stat.completed++;
          if (os.scheduled_date && os.completed_date) {
            const days = Math.max(0, (new Date(os.completed_date).getTime() - new Date(os.scheduled_date).getTime()) / 86400000);
            stat.totalDays += days;
            stat.completedWithDates++;
          }
        } else if (os.status === "open" || os.status === "in_progress") {
          stat.pending++;
        }
      });

      const techProductivity: TechnicianProductivity[] = technicians
        .filter((t) => t.status === "active")
        .map((t) => {
          const stat = techStats.get(t.id)!;
          return {
            name: t.name,
            completed: stat.completed,
            pending: stat.pending,
            avgDays: stat.completedWithDates > 0 ? Math.round((stat.totalDays / stat.completedWithDates) * 10) / 10 : 0,
          };
        })
        .sort((a, b) => b.completed - a.completed);

      // Plan distribution
      const planNameById = new Map(plans.map((p) => [p.id, p.name]));
      const planCounts = new Map<string, number>();
      contracts.filter((c) => c.status === "active").forEach((c) => {
        const name = planNameById.get(c.plan_id) || "Desconhecido";
        planCounts.set(name, (planCounts.get(name) || 0) + 1);
      });
      const planDistribution: PlanDistribution[] = Array.from(planCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      // Aging report - overdue invoices by days overdue
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const overdueInvoices = invoices.filter((i) => i.normalizedStatus === "overdue");
      
      const buckets: AgingBucket[] = [
        { label: "0-30 dias", count: 0, amount: 0 },
        { label: "31-60 dias", count: 0, amount: 0 },
        { label: "61-90 dias", count: 0, amount: 0 },
        { label: "90+ dias", count: 0, amount: 0 },
      ];

      overdueInvoices.forEach((inv) => {
        const dueDate = new Date(`${inv.due_date}T00:00:00`);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / 86400000);
        if (daysOverdue <= 30) {
          buckets[0].count++;
          buckets[0].amount += inv.amount;
        } else if (daysOverdue <= 60) {
          buckets[1].count++;
          buckets[1].amount += inv.amount;
        } else if (daysOverdue <= 90) {
          buckets[2].count++;
          buckets[2].amount += inv.amount;
        } else {
          buckets[3].count++;
          buckets[3].amount += inv.amount;
        }
      });

      const agingReport = buckets;

      // Customer export data
      const statusLabels: Record<string, string> = { active: "Ativo", suspended: "Suspenso", defaulting: "Inadimplente", cancelled: "Cancelado" };
      const customerExport = customers.map((c) => ({
        name: c.name,
        cpf_cnpj: c.cpf_cnpj,
        status: statusLabels[c.status] || c.status,
        phone: c.phone || "",
        email: c.email || "",
      }));

      return { monthlyRevenue, overdueByMonth, techProductivity, planDistribution, agingReport, customerExport };
    },
  });
}
