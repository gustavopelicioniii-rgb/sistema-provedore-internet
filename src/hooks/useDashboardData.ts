import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, getLastMonths, isSameMonth, normalizeInvoiceStatus, type InvoiceStatus } from "@/utils/finance";

export interface AlertItem {
  type: "overdue" | "low_stock" | "pending_os";
  title: string;
  detail: string;
  severity: "destructive" | "warning";
}

export interface DashboardMetricData {
  activeCustomers: number;
  totalCustomers: number;
  activeContracts: number;
  activePlans: number;
  estimatedMRR: number;
  monthlyBilling: number;
  receivedThisMonth: number;
  defaultingCustomers: number;
  overdueRate: number;
  churnRate: number;
  openTickets: number;
  pendingServiceOrders: number;
  revenueData: Array<{ month: string; clientes: number; receita: number }>;
  invoiceStatusData: Array<{ category: string; count: number }>;
  recentActivities: Array<{ text: string; time: string; type: "success" | "warning" | "destructive" }>;
  alerts: AlertItem[];
  customerSparkline: number[];
  revenueSparkline: number[];
  customerTrend: number;
  revenueTrend: number;
  hasData: boolean;
}

export function useDashboardData() {
  return useQuery({
    queryKey: ["dashboard-data"],
    queryFn: async (): Promise<DashboardMetricData> => {
      const [customersResult, contractsResult, plansResult, invoicesResult, inventoryResult, serviceOrdersResult, ticketsResult] = await Promise.all([
        supabase.from("customers").select("id, name, created_at, status"),
        supabase.from("contracts").select("id, customer_id, plan_id, created_at, status"),
        supabase.from("plans").select("id, name, price, active"),
        supabase.from("invoices").select("id, customer_id, amount, due_date, paid_date, status, created_at"),
        supabase.from("inventory_items").select("id, name, quantity, min_quantity"),
        supabase.from("service_orders").select("id, status, type, created_at").in("status", ["open", "in_progress"]),
        supabase.from("tickets").select("id, status").in("status", ["open", "in_progress", "waiting"]),
      ]);

      if (customersResult.error) throw customersResult.error;
      if (contractsResult.error) throw contractsResult.error;
      if (plansResult.error) throw plansResult.error;
      if (invoicesResult.error) throw invoicesResult.error;

      const inventoryItems = inventoryResult.data ?? [];
      const openTickets = ticketsResult.data?.length ?? 0;
      const pendingOrders = serviceOrdersResult.data ?? [];

      const customers = customersResult.data ?? [];
      const contracts = contractsResult.data ?? [];
      const plans = plansResult.data ?? [];
      const invoices = (invoicesResult.data ?? []).map((invoice) => ({
        ...invoice,
        normalizedStatus: normalizeInvoiceStatus(invoice),
      }));

      const activeCustomers = customers.filter((customer) => customer.status === "active").length;
      const totalCustomers = customers.length;
      const activeContracts = contracts.filter((contract) => contract.status === "active").length;
      const activePlans = plans.filter((plan) => plan.active).length;

      const planPriceById = new Map(plans.map((plan) => [plan.id, plan.price]));
      const planNameById = new Map(plans.map((plan) => [plan.id, plan.name]));
      const customerNameById = new Map(customers.map((customer) => [customer.id, customer.name]));

      const estimatedMRR = contracts
        .filter((contract) => contract.status === "active")
        .reduce((total, contract) => total + (planPriceById.get(contract.plan_id) ?? 0), 0);

      const monthlyBilling = invoices
        .filter((invoice) => isSameMonth(invoice.due_date))
        .reduce((total, invoice) => total + invoice.amount, 0);

      const receivedThisMonth = invoices
        .filter((invoice) => invoice.normalizedStatus === "paid" && isSameMonth(invoice.paid_date))
        .reduce((total, invoice) => total + invoice.amount, 0);

      const overdueInvoices = invoices.filter((invoice) => invoice.normalizedStatus === "overdue");
      const defaultingCustomers = new Set(overdueInvoices.map((invoice) => invoice.customer_id)).size;
      const overdueRate = invoices.length ? (overdueInvoices.length / invoices.length) * 100 : 0;

      // Churn rate: cancelled contracts / total contracts (%)
      const cancelledContracts = contracts.filter((c) => c.status === "cancelled").length;
      const churnRate = contracts.length > 0 ? (cancelledContracts / contracts.length) * 100 : 0;

      const months = getLastMonths(6);
      const customerBaseline = customers.filter((customer) => new Date(customer.created_at) < months[0].start).length;
      let runningCustomers = customerBaseline;

      const revenueData = months.map((month) => {
        const newCustomers = customers.filter((customer) => {
          const createdAt = new Date(customer.created_at);
          return createdAt >= month.start && createdAt <= month.end;
        }).length;

        runningCustomers += newCustomers;

        const receita = invoices
          .filter((invoice) => {
            const dueDate = new Date(`${invoice.due_date}T00:00:00`);
            return dueDate >= month.start && dueDate <= month.end;
          })
          .reduce((total, invoice) => total + invoice.amount, 0);

        return {
          month: month.label,
          clientes: runningCustomers,
          receita,
        };
      });

      const statusCounts: Record<InvoiceStatus, number> = {
        paid: 0,
        pending: 0,
        overdue: 0,
        cancelled: 0,
      };

      invoices.forEach((invoice) => {
        statusCounts[invoice.normalizedStatus] += 1;
      });

      const invoiceStatusData = [
        { category: "Pagas", count: statusCounts.paid },
        { category: "Pendentes", count: statusCounts.pending },
        { category: "Vencidas", count: statusCounts.overdue },
        { category: "Canceladas", count: statusCounts.cancelled },
      ];

      const recentActivities = [
        ...customers.slice(0, 3).map((customer) => ({
          created_at: customer.created_at,
          text: `Novo cliente: ${customer.name}`,
          type: "success" as const,
        })),
        ...contracts.slice(0, 3).map((contract) => ({
          created_at: contract.created_at,
          text: `Contrato ${contract.status === "active" ? "ativo" : contract.status === "cancelled" ? "cancelado" : "atualizado"}: ${customerNameById.get(contract.customer_id) ?? "Cliente"}${planNameById.get(contract.plan_id) ? ` — ${planNameById.get(contract.plan_id)}` : ""}`,
          type: contract.status === "cancelled" ? ("destructive" as const) : ("warning" as const),
        })),
        ...invoices.slice(0, 3).map((invoice) => ({
          created_at: invoice.created_at,
          text:
            invoice.normalizedStatus === "paid"
              ? `Pagamento recebido: ${customerNameById.get(invoice.customer_id) ?? "Cliente"}`
              : invoice.normalizedStatus === "overdue"
                ? `Fatura vencida: ${customerNameById.get(invoice.customer_id) ?? "Cliente"}`
                : `Fatura gerada: ${customerNameById.get(invoice.customer_id) ?? "Cliente"}`,
          type:
            invoice.normalizedStatus === "paid"
              ? ("success" as const)
              : invoice.normalizedStatus === "overdue"
                ? ("destructive" as const)
                : ("warning" as const),
        })),
      ]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 6)
        .map((activity) => ({
          text: activity.text,
          time: formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: ptBR }),
          type: activity.type,
        }));

      // Sparklines from revenueData
      const customerSparkline = revenueData.map((d) => d.clientes);
      const revenueSparkline = revenueData.map((d) => d.receita);

      // Trend: compare last two months
      const customerTrend = customerSparkline.length >= 2 && customerSparkline[customerSparkline.length - 2] > 0
        ? ((customerSparkline[customerSparkline.length - 1] - customerSparkline[customerSparkline.length - 2]) / customerSparkline[customerSparkline.length - 2]) * 100
        : 0;
      const revenueTrend = revenueSparkline.length >= 2 && revenueSparkline[revenueSparkline.length - 2] > 0
        ? ((revenueSparkline[revenueSparkline.length - 1] - revenueSparkline[revenueSparkline.length - 2]) / revenueSparkline[revenueSparkline.length - 2]) * 100
        : 0;

      // Alerts
      const alerts: AlertItem[] = [];

      // Overdue invoices alert
      if (overdueInvoices.length > 0) {
        alerts.push({
          type: "overdue",
          title: `${overdueInvoices.length} fatura(s) vencida(s)`,
          detail: `Total: ${formatCurrency(overdueInvoices.reduce((s, i) => s + i.amount, 0))}`,
          severity: "destructive",
        });
      }

      // Low stock alerts
      inventoryItems
        .filter((item) => item.quantity <= item.min_quantity)
        .slice(0, 5)
        .forEach((item) => {
          alerts.push({
            type: "low_stock",
            title: `Estoque baixo: ${item.name}`,
            detail: `${item.quantity} un. (mín: ${item.min_quantity})`,
            severity: "warning",
          });
        });

      // Pending service orders
      if (pendingOrders.length > 0) {
        alerts.push({
          type: "pending_os",
          title: `${pendingOrders.length} OS pendente(s)`,
          detail: `${pendingOrders.filter((o) => o.status === "open").length} abertas, ${pendingOrders.filter((o) => o.status === "in_progress").length} em andamento`,
          severity: "warning",
        });
      }

      return {
        activeCustomers,
        totalCustomers,
        activeContracts,
        activePlans,
        estimatedMRR,
        monthlyBilling,
        receivedThisMonth,
        defaultingCustomers,
        overdueRate,
        churnRate,
        openTickets,
        pendingServiceOrders: pendingOrders.length,
        revenueData,
        invoiceStatusData,
        recentActivities,
        alerts,
        customerSparkline,
        revenueSparkline,
        customerTrend,
        revenueTrend,
        hasData: customers.length > 0 || contracts.length > 0 || plans.length > 0 || invoices.length > 0,
      };
    },
  });
}
