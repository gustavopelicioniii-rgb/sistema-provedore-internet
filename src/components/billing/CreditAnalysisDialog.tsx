import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, AlertTriangle, XCircle, BarChart3 } from "lucide-react";
import { useCreditAnalyses, useCreateCreditAnalysis } from "@/hooks/useEnterpriseBilling";
import { formatDate } from "@/utils/finance";

interface CreditAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: {
    id: string;
    name: string;
    cpf_cnpj: string;
    financial_score: number | null;
    organizationId: string;
  } | null;
}

const resultConfig = {
  approved: { label: "Aprovado", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20", icon: ShieldCheck },
  review: { label: "Em análise", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20", icon: AlertTriangle },
  rejected: { label: "Reprovado", color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
  pending: { label: "Pendente", color: "bg-muted text-muted-foreground border-border", icon: BarChart3 },
};

export function CreditAnalysisDialog({ open, onOpenChange, customer }: CreditAnalysisDialogProps) {
  const { data: analyses = [], isLoading } = useCreditAnalyses(customer?.id);
  const createAnalysis = useCreateCreditAnalysis();

  if (!customer) return null;

  const handleRunAnalysis = () => {
    createAnalysis.mutate({
      customerId: customer.id,
      cpfCnpj: customer.cpf_cnpj,
      organizationId: customer.organizationId,
    });
  };

  const scoreColor = (score: number | null) => {
    if (!score) return "text-muted-foreground";
    if (score >= 7) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 4) return "text-amber-600 dark:text-amber-400";
    return "text-destructive";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="size-5" /> Análise de Crédito
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{customer.name}</p>
              <p className="text-sm text-muted-foreground">{customer.cpf_cnpj}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Score</p>
              <p className={`text-3xl font-bold ${scoreColor(customer.financial_score)}`}>
                {customer.financial_score?.toFixed(1) ?? "—"}
              </p>
            </div>
          </div>

          <Button onClick={handleRunAnalysis} disabled={createAnalysis.isPending} className="w-full">
            {createAnalysis.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Executar Nova Análise
          </Button>

          {isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="size-5 animate-spin" /></div>
          ) : analyses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma análise realizada.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Histórico</p>
              {analyses.map((a: any) => {
                const cfg = resultConfig[a.result as keyof typeof resultConfig] ?? resultConfig.pending;
                const Icon = cfg.icon;
                return (
                  <div key={a.id} className="flex items-start gap-3 rounded-md border p-3">
                    <Icon className="size-4 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs ${cfg.color}`}>{cfg.label}</Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(a.analyzed_at)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Score: {a.score?.toFixed(1)} • {a.source}</p>
                      {a.notes && <p className="text-xs text-muted-foreground mt-0.5">{a.notes}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
