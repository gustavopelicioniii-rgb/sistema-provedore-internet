import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/utils/finance";
import { FileText, ClipboardList, LifeBuoy, Copy, CreditCard, Wifi, Calendar, AlertCircle } from "lucide-react";

const INVOICE_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  paid: { label: "Pago", variant: "default" },
  pending: { label: "Pendente", variant: "secondary" },
  overdue: { label: "Vencido", variant: "destructive" },
  cancelled: { label: "Cancelado", variant: "outline" },
};

const CONTRACT_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Ativo", variant: "default" },
  suspended: { label: "Suspenso", variant: "destructive" },
  cancelled: { label: "Cancelado", variant: "outline" },
  awaiting_installation: { label: "Aguardando Instalação", variant: "secondary" },
  awaiting_signature: { label: "Aguardando Assinatura", variant: "secondary" },
};

const TICKET_STATUS: Record<string, string> = {
  open: "Aberto",
  in_progress: "Em Andamento",
  waiting: "Aguardando",
  resolved: "Resolvido",
  closed: "Fechado",
};

function usePortalInvoices() {
  return useQuery({
    queryKey: ["portal-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, amount, due_date, paid_date, status, barcode, pix_qrcode, customer_id, customers(name)")
        .order("due_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

function usePortalContracts() {
  return useQuery({
    queryKey: ["portal-contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("id, status, start_date, end_date, signed_at, installation_address, customers(name), plans(name, price, download_speed, upload_speed)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

function usePortalTickets() {
  return useQuery({
    queryKey: ["portal-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("id, subject, description, priority, status, created_at, resolved_at, customers(name)")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });
}

function InvoicesTab() {
  const { data: invoices, isLoading } = usePortalInvoices();
  const { toast } = useToast();

  const handleCopyBarcode = (barcode: string) => {
    navigator.clipboard.writeText(barcode);
    toast({ title: "Código de barras copiado!" });
  };

  const handleCopyPix = (pix: string) => {
    navigator.clipboard.writeText(pix);
    toast({ title: "Código PIX copiado!" });
  };

  if (isLoading) return <TableSkeleton />;

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>2ª Via</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => {
                const st = INVOICE_STATUS[inv.status] ?? { label: inv.status, variant: "outline" as const };
                return (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium text-sm">
                      {(inv.customers as any)?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(inv.due_date)}</TableCell>
                    <TableCell className="text-sm font-semibold">{formatCurrency(inv.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
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
                        {!inv.barcode && !inv.pix_qrcode && (
                          <span className="text-xs text-muted-foreground">Indisponível</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function ContractsTab() {
  const { data: contracts, isLoading } = usePortalContracts();

  if (isLoading) return <TableSkeleton />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardList className="size-4" /> Meus Contratos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!contracts?.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum contrato encontrado.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {contracts.map((c) => {
              const plan = c.plans as any;
              const customer = c.customers as any;
              const st = CONTRACT_STATUS[c.status] ?? { label: c.status, variant: "outline" as const };
              const addr = c.installation_address as Record<string, string> | null;
              const addrStr = addr
                ? [addr.street, addr.number, addr.neighborhood, addr.city].filter(Boolean).join(", ")
                : null;

              return (
                <Card key={c.id} className="border">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{customer?.name ?? "—"}</span>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>

                    {plan && (
                      <div className="flex items-center gap-2 text-sm">
                        <Wifi className="size-4 text-primary" />
                        <span className="font-medium">{plan.name}</span>
                        <span className="text-muted-foreground">
                          {plan.download_speed}↓ / {plan.upload_speed}↑ Mbps
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        Início: {c.start_date ? formatDate(c.start_date) : "—"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        Fim: {c.end_date ? formatDate(c.end_date) : "Indeterminado"}
                      </div>
                    </div>

                    {plan?.price && (
                      <p className="text-sm font-semibold text-primary">
                        {formatCurrency(plan.price)}/mês
                      </p>
                    )}

                    {addrStr && (
                      <p className="text-xs text-muted-foreground">📍 {addrStr}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SupportTab() {
  const { data: tickets, isLoading } = usePortalTickets();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  const createTicket = useMutation({
    mutationFn: async () => {
      const { data: profile } = await supabase.from("profiles").select("organization_id").maybeSingle();
      if (!profile?.organization_id) throw new Error("Organização não encontrada.");

      const { error } = await supabase.from("tickets").insert([{
        organization_id: profile.organization_id,
        subject,
        description: description || null,
        priority: "medium" as const,
        status: "open" as const,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal-tickets"] });
      toast({ title: "Chamado aberto com sucesso!" });
      setSubject("");
      setDescription("");
      setShowForm(false);
    },
    onError: (e: Error) => {
      toast({ title: "Erro ao abrir chamado", description: e.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <LifeBuoy className="size-4" /> Chamados de Suporte
          </CardTitle>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancelar" : "Abrir Chamado"}
          </Button>
        </CardHeader>
        <CardContent>
          {showForm && (
            <div className="space-y-3 mb-6 p-4 rounded-lg border bg-muted/30">
              <Input
                placeholder="Assunto do chamado"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <Textarea
                placeholder="Descreva o problema..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
              <Button
                size="sm"
                disabled={!subject.trim() || createTicket.isPending}
                onClick={() => createTicket.mutate()}
              >
                {createTicket.isPending ? "Enviando..." : "Enviar Chamado"}
              </Button>
            </div>
          )}

          {isLoading ? (
            <TableSkeleton />
          ) : !tickets?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum chamado encontrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Aberto em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-sm font-medium">{t.subject}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{TICKET_STATUS[t.status] ?? t.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.priority === "urgent" || t.priority === "high" ? "destructive" : "secondary"}>
                        {t.priority === "low" ? "Baixa" : t.priority === "medium" ? "Média" : t.priority === "high" ? "Alta" : "Urgente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(t.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TableSkeleton() {
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

export default function PortalAssinante() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Portal do Assinante</h1>
        <p className="text-muted-foreground text-sm">Consulte faturas, contratos e abra chamados de suporte</p>
      </div>

      <Tabs defaultValue="faturas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="faturas" className="gap-1.5">
            <FileText className="size-4" /> Faturas
          </TabsTrigger>
          <TabsTrigger value="contratos" className="gap-1.5">
            <ClipboardList className="size-4" /> Contratos
          </TabsTrigger>
          <TabsTrigger value="suporte" className="gap-1.5">
            <LifeBuoy className="size-4" /> Suporte
          </TabsTrigger>
        </TabsList>

        <TabsContent value="faturas">
          <InvoicesTab />
        </TabsContent>
        <TabsContent value="contratos">
          <ContractsTab />
        </TabsContent>
        <TabsContent value="suporte">
          <SupportTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
