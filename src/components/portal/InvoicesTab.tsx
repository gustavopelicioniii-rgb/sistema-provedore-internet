import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { usePortalApi } from "@/hooks/usePortalApi";
import { formatCurrency, formatDate } from "@/utils/finance";
import { FileText, Copy, CreditCard, Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { generateBoletoPdf } from "@/utils/boletoPdf";
import { useSubscriberAuth } from "@/hooks/useSubscriberAuth";

const INVOICE_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  paid: { label: "Pago", variant: "default" },
  pending: { label: "Pendente", variant: "secondary" },
  overdue: { label: "Vencido", variant: "destructive" },
  cancelled: { label: "Cancelado", variant: "outline" },
};

interface PortalInvoice {
  id: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: string;
  barcode: string | null;
  pix_qrcode: string | null;
  payment_method: string | null;
}

export function InvoicesTab() {
  const { portalFetch } = usePortalApi();
  const { customer } = useSubscriberAuth();
  const { toast } = useToast();
  const [payingId, setPayingId] = useState<string | null>(null);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["portal-invoices"],
    queryFn: () => portalFetch<PortalInvoice[]>("invoices"),
  });

  const handleCopyBarcode = (barcode: string) => {
    navigator.clipboard.writeText(barcode);
    toast({ title: "Código de barras copiado!" });
  };

  const handleCopyPix = (pix: string) => {
    navigator.clipboard.writeText(pix);
    toast({ title: "Código PIX copiado!" });
  };

  const handleDownloadPdf = async (inv: PortalInvoice) => {
    const st = INVOICE_STATUS[inv.status] ?? { label: inv.status, variant: "outline" as const };
    try {
      await generateBoletoPdf({
        id: inv.id,
        customerName: customer?.name ?? "—",
        amount: inv.amount,
        dueDate: inv.due_date,
        status: inv.status,
        statusLabel: st.label,
        barcode: inv.barcode,
        pixQrcode: inv.pix_qrcode,
      });
      toast({ title: "Boleto PDF baixado!" });
    } catch {
      toast({ title: "Erro ao gerar PDF", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="size-4" /> Minhas Faturas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!invoices?.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma fatura encontrada.</p>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => {
                  const st = INVOICE_STATUS[inv.status] ?? { label: inv.status, variant: "outline" as const };
                  const canPay = inv.status === "pending" || inv.status === "overdue";
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="text-sm">{formatDate(inv.due_date)}</TableCell>
                      <TableCell className="text-sm font-semibold">{formatCurrency(inv.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {inv.barcode && (
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleCopyBarcode(inv.barcode!)}>
                              <Copy className="size-3" /> Boleto
                            </Button>
                          )}
                          {inv.pix_qrcode && (
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleCopyPix(inv.pix_qrcode!)}>
                              <CreditCard className="size-3" /> PIX
                            </Button>
                          )}
                          {canPay && !inv.pix_qrcode && (
                            <Button
                              size="sm"
                              variant="default"
                              className="h-7 text-xs gap-1"
                              disabled={payingId === inv.id}
                              onClick={() => {
                                setPayingId(inv.id);
                                toast({ title: "Função de pagamento será implementada via gateway" });
                                setPayingId(null);
                              }}
                            >
                              {payingId === inv.id ? <Loader2 className="size-3 animate-spin" /> : <CreditCard className="size-3" />}
                              Pagar PIX
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => handleDownloadPdf(inv)}>
                            <Download className="size-3" /> 2ª Via
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
