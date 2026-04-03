import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/utils/finance";
import { ClipboardList, Wifi, Calendar } from "lucide-react";

const CONTRACT_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Ativo", variant: "default" },
  suspended: { label: "Suspenso", variant: "destructive" },
  cancelled: { label: "Cancelado", variant: "outline" },
  awaiting_installation: { label: "Aguardando Instalação", variant: "secondary" },
  awaiting_signature: { label: "Aguardando Assinatura", variant: "secondary" },
};

export function ContractsTab() {
  const { data: contracts, isLoading } = useQuery({
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

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
