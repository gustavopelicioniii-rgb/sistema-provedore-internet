import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Zap, Mail, MessageSquare, Bell, Clock, AlertTriangle, UserCheck, CreditCard } from "lucide-react";

interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: string;
  action: string;
  icon: React.ElementType;
  enabled: boolean;
  category: "cobrança" | "atendimento" | "operacional";
}

const defaultAutomations: Automation[] = [
  { id: "1", name: "Lembrete de Vencimento", description: "Envia WhatsApp 3 dias antes do vencimento da fatura", trigger: "3 dias antes do vencimento", action: "Enviar WhatsApp", icon: MessageSquare, enabled: true, category: "cobrança" },
  { id: "2", name: "Fatura Vencida", description: "Envia e-mail quando a fatura vence sem pagamento", trigger: "No dia do vencimento", action: "Enviar e-mail", icon: Mail, enabled: true, category: "cobrança" },
  { id: "3", name: "Suspensão Automática", description: "Suspende contrato após 15 dias de inadimplência", trigger: "15 dias após vencimento", action: "Suspender contrato", icon: AlertTriangle, enabled: false, category: "cobrança" },
  { id: "4", name: "Boas-vindas", description: "Envia mensagem de boas-vindas ao novo assinante", trigger: "Novo contrato ativado", action: "Enviar WhatsApp", icon: UserCheck, enabled: true, category: "atendimento" },
  { id: "5", name: "Pesquisa de Satisfação", description: "Envia pesquisa NPS após fechamento de ticket", trigger: "Ticket resolvido", action: "Enviar pesquisa", icon: Bell, enabled: false, category: "atendimento" },
  { id: "6", name: "Atribuição de OS", description: "Atribui OS automaticamente ao técnico mais próximo", trigger: "Nova OS criada", action: "Atribuir técnico", icon: Clock, enabled: false, category: "operacional" },
  { id: "7", name: "Reativação Automática", description: "Reativa contrato quando pagamento é confirmado", trigger: "Pagamento confirmado", action: "Reativar contrato", icon: CreditCard, enabled: true, category: "cobrança" },
];

const categoryLabels: Record<string, { label: string; className: string }> = {
  "cobrança": { label: "Cobrança", className: "bg-warning/10 text-warning border-warning/20" },
  "atendimento": { label: "Atendimento", className: "bg-primary/10 text-primary border-primary/20" },
  "operacional": { label: "Operacional", className: "bg-success/10 text-success border-success/20" },
};

export default function Automacoes() {
  const [automations, setAutomations] = useState(defaultAutomations);

  const toggleAutomation = (id: string) => {
    setAutomations((prev) => prev.map((a) => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const activeCount = automations.filter((a) => a.enabled).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Automações</h1>
          <p className="text-muted-foreground text-sm">Motor de automações inteligentes para seu provedor</p>
        </div>
        <Button><Plus className="mr-2 size-4" />Nova Automação</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{automations.length}</p>
                <p className="text-xs text-muted-foreground">Total de automações</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-success/10">
                <Zap className="size-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-xs text-muted-foreground">Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <Zap className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{automations.length - activeCount}</p>
                <p className="text-xs text-muted-foreground">Inativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {automations.map((a) => {
          const cat = categoryLabels[a.category];
          return (
            <Card key={a.id} className={!a.enabled ? "opacity-60" : ""}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <a.icon className="size-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">{a.name}</p>
                    <Badge variant="outline" className={cat.className}>{cat.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                  <div className="flex gap-4 mt-1">
                    <span className="text-[10px] text-muted-foreground">Gatilho: {a.trigger}</span>
                    <span className="text-[10px] text-muted-foreground">Ação: {a.action}</span>
                  </div>
                </div>
                <Switch checked={a.enabled} onCheckedChange={() => toggleAutomation(a.id)} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
