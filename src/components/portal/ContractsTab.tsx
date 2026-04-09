import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/utils/finance";
import { ClipboardList, Wifi, Calendar } from "lucide-react";
import { usePortalApi } from "@/hooks/usePortalApi";

const CONTRACT_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Ativo", variant: "default" },
  suspended: { label: "Suspenso", variant: "destructive" },
  cancelled: { label: "Cancelado", variant: "outline" },
  awaiting_installation: { label: "Aguardando Instalação", variant: "secondary" },
  awaiting_signature: { label: "Aguardando Assinatura", variant: "secondary" },
};

interface PortalContract {
  id: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  signed_at: string | null;
  installation_address: Record<string, string> | null;
  plans: { name: string; price: number; download_speed: number; upload_speed: number } | null;
}

export function ContractsTab() {
  const { portalFetch } = usePortalApi();

  const { data: contracts, isLoading } = useQuery({
    queryKey: ["portal-contracts"],
    queryFn: () => portalFetch<PortalContract[]>("contracts"),
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
              const plan = c.plans;
              const st = CONTRACT_STATUS[c.status] ?? { label: c.status, variant: "outline" as const };
              const addr = c.installation_address;
              const addrStr = addr
                ? [addr.street, addr.number, addr.neighborhood, addr.city].filter(Boolean).join(", ")
                : null;

              return (
                <div key={c.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wifi className="size-4 text-primary" />
                      <span className="font-semibold text-sm">{plan?.name ?? "Plano"}</span>
                    </div>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>

                  {plan && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Velocidade</p>
                        <p className="font-medium">{plan.download_speed}↓ / {plan.upload_speed}↑ Mbps</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Valor</p>
                        <p className="font-medium">{formatCurrency(plan.price)}/mês</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="size-3" />
                    {c.start_date ? `Início: ${formatDate(c.start_date)}` : "Sem data de início"}
                    {c.end_date && ` — Fim: ${formatDate(c.end_date)}`}
                  </div>

                  {addrStr && (
                    <p className="text-xs text-muted-foreground">{addrStr}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
