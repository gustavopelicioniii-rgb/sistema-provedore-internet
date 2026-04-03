export type InvoiceStatus = "paid" | "pending" | "overdue" | "cancelled";

export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  paid: "Pago",
  pending: "Pendente",
  overdue: "Vencido",
  cancelled: "Cancelado",
};

export const invoiceStatusClasses: Record<InvoiceStatus, string> = {
  paid: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  overdue: "bg-destructive/10 text-destructive border-destructive/20",
  cancelled: "bg-muted text-muted-foreground border-muted",
};

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function parseDateValue(value: string) {
  if (value.includes("T")) {
    return new Date(value);
  }

  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR").format(parseDateValue(value));
}

export function isSameMonth(value: string | null | undefined, reference = new Date()) {
  if (!value) return false;
  const date = parseDateValue(value);
  return date.getMonth() === reference.getMonth() && date.getFullYear() === reference.getFullYear();
}

export function normalizeInvoiceStatus(invoice: {
  status: string;
  due_date: string;
  paid_date?: string | null;
}): InvoiceStatus {
  if (invoice.status === "cancelled") return "cancelled";
  if (invoice.status === "paid" || invoice.paid_date) return "paid";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (parseDateValue(invoice.due_date) < today) return "overdue";
  return "pending";
}

export function getLastMonths(count: number) {
  const now = new Date();

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1);
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      start,
      end,
    };
  });
}
