import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Zap, Trash2, Pencil, Copy, ExternalLink, CheckCircle2, XCircle, SkipForward, Eye, EyeOff, FileText, UserCheck, AlertTriangle, CreditCard, Bell, Clock, MessageSquare, Mail, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAutomations, type Automation, type AutomationLog } from "@/hooks/useAutomations";
import AutomationFormDialog from "@/components/automations/AutomationFormDialog";
import AiAutomationAssistant from "@/components/automations/AiAutomationAssistant";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AutomationTemplate {
  name: string;
  description: string;
  category: Automation["category"];
  trigger_type: Automation["trigger_type"];
  trigger_config: Record<string, unknown>;
  action_type: Automation["action_type"];
  action_config: Record<string, unknown>;
  icon: React.ElementType;
}

const templates: AutomationTemplate[] = [
  {
    name: "Lembrete de Vencimento (3 dias)",
    description: "Envia notificação via webhook 3 dias antes do vencimento da fatura",
    category: "cobranca",
    trigger_type: "event",
    trigger_config: { event: "invoice.due_soon", days_before: 3 },
    action_type: "webhook_call",
    action_config: { method: "POST", payload_template: { type: "payment_reminder", days_before: 3 } },
    icon: Clock,
  },
  {
    name: "Fatura Vencida — 1ª Cobrança",
    description: "Dispara webhook no dia do vencimento sem pagamento para iniciar régua de cobrança",
    category: "cobranca",
    trigger_type: "event",
    trigger_config: { event: "invoice.overdue" },
    action_type: "webhook_call",
    action_config: { method: "POST", payload_template: { type: "first_collection", stage: 1 } },
    icon: Mail,
  },
  {
    name: "Cobrança Recorrente (7 dias)",
    description: "Envia lembrete via webhook 7 dias após vencimento sem pagamento",
    category: "cobranca",
    trigger_type: "event",
    trigger_config: { event: "invoice.overdue", days_after: 7 },
    action_type: "webhook_call",
    action_config: { method: "POST", payload_template: { type: "recurring_collection", stage: 2 } },
    icon: MessageSquare,
  },
  {
    name: "Suspensão Automática (15 dias)",
    description: "Suspende contrato automaticamente após 15 dias de inadimplência",
    category: "cobranca",
    trigger_type: "event",
    trigger_config: { event: "invoice.overdue", days_after: 15 },
    action_type: "internal",
    action_config: { action: "suspend_contract" },
    icon: AlertTriangle,
  },
  {
    name: "Boas-vindas ao Novo Assinante",
    description: "Envia mensagem de boas-vindas quando um novo contrato é ativado",
    category: "atendimento",
    trigger_type: "event",
    trigger_config: { event: "contract.created" },
    action_type: "webhook_call",
    action_config: { method: "POST", payload_template: { type: "welcome_message" } },
    icon: UserCheck,
  },
  {
    name: "Pesquisa NPS pós-atendimento",
    description: "Envia pesquisa de satisfação quando um ticket é resolvido",
    category: "atendimento",
    trigger_type: "event",
    trigger_config: { event: "ticket.resolved" },
    action_type: "webhook_call",
    action_config: { method: "POST", payload_template: { type: "nps_survey" } },
    icon: Bell,
  },
  {
    name: "Reativação por Pagamento",
    description: "Reativa contrato automaticamente quando pagamento é confirmado",
    category: "cobranca",
    trigger_type: "event",
    trigger_config: { event: "invoice.paid" },
    action_type: "internal",
    action_config: { action: "reactivate_contract" },
    icon: CreditCard,
  },
  {
    name: "Notificar Nova OS",
    description: "Dispara webhook quando uma nova ordem de serviço é criada",
    category: "operacional",
    trigger_type: "event",
    trigger_config: { event: "service_order.created" },
    action_type: "webhook_call",
    action_config: { method: "POST", payload_template: { type: "new_service_order" } },
    icon: FileText,
  },
];

const categoryLabels: Record<string, { label: string; className: string }> = {
  cobranca: { label: "Cobrança", className: "bg-warning/10 text-warning border-warning/20" },
  atendimento: { label: "Atendimento", className: "bg-primary/10 text-primary border-primary/20" },
  operacional: { label: "Operacional", className: "bg-success/10 text-success border-success/20" },
};

const actionLabels: Record<string, string> = {
  webhook_call: "Webhook",
  whatsapp: "WhatsApp",
  email: "E-mail",
  internal: "Interna",
};

const triggerLabels: Record<string, string> = {
  webhook: "Webhook",
  schedule: "Agendamento",
  event: "Evento",
};

const logStatusIcons: Record<string, React.ReactNode> = {
  success: <CheckCircle2 className="size-4 text-success" />,
  error: <XCircle className="size-4 text-destructive" />,
  skipped: <SkipForward className="size-4 text-muted-foreground" />,
};

export default function Automacoes() {
  const { automations, isLoading, logs, logsLoading, createAutomation, updateAutomation, toggleAutomation, deleteAutomation } = useAutomations();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Automation | null>(null);
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [aiOpen, setAiOpen] = useState(false);

  const toggleLogExpand = (id: string) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const activeCount = automations.filter((a) => a.enabled).length;

  const activateTemplate = (template: AutomationTemplate) => {
    const { icon, ...rest } = template;
    createAutomation.mutate(rest);
  };

  const isTemplateActive = (template: AutomationTemplate) =>
    automations.some((a) => a.name === template.name);

  const handleSubmit = (values: Partial<Automation>) => {
    if (values.id) {
      updateAutomation.mutate(values as Automation & { id: string });
    } else {
      createAutomation.mutate(values);
    }
  };

  const copyWebhookUrl = (automation: Automation) => {
    const url = `${automation.webhook_url}?automation_id=${automation.id}`;
    navigator.clipboard.writeText(url);
    toast.success("URL do webhook copiada!");
  };

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toast.success("Secret copiado!");
  };

  const toggleSecretVisibility = (id: string) => {
    setVisibleSecrets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Automações</h1>
          <p className="text-muted-foreground text-sm">Crie automações reais com webhooks universais e integre com n8n, Zapier ou Make</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAiOpen(true)}>
            <Sparkles className="mr-2 size-4" />Criar com IA
          </Button>
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="mr-2 size-4" />Nova Automação
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
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
                <p className="text-2xl font-bold">{logs.filter((l) => l.status === "error").length}</p>
                <p className="text-xs text-muted-foreground">Erros recentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
          <TabsTrigger value="automations">Automações ({automations.length})</TabsTrigger>
          <TabsTrigger value="logs">Logs de Execução ({logs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {templates.map((t) => {
              const cat = categoryLabels[t.category];
              const alreadyActive = isTemplateActive(t);
              return (
                <Card key={t.name} className={alreadyActive ? "border-primary/30 bg-primary/5" : ""}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 mt-0.5">
                        <t.icon className="size-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium">{t.name}</p>
                          <Badge variant="outline" className={cat?.className + " text-[10px]"}>{cat?.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{t.description}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">{triggerLabels[t.trigger_type]}</Badge>
                          <Badge variant="secondary" className="text-[10px]">{actionLabels[t.action_type]}</Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={alreadyActive ? "outline" : "default"}
                        disabled={alreadyActive || createAutomation.isPending}
                        onClick={() => activateTemplate(t)}
                        className="shrink-0"
                      >
                        {alreadyActive ? "✓ Ativado" : "Ativar"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="automations" className="space-y-3 mt-4">
          {automations.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Zap className="mx-auto mb-3 size-10 text-muted-foreground/50" />
                <p className="font-medium">Nenhuma automação criada</p>
                <p className="text-sm">Crie sua primeira automação para integrar com n8n ou outros serviços</p>
              </CardContent>
            </Card>
          )}

          {automations.map((a) => {
            const cat = categoryLabels[a.category];
            const webhookFullUrl = `${a.webhook_url}?automation_id=${a.id}`;
            const isSecretVisible = visibleSecrets.has(a.id);

            return (
              <Card key={a.id} className={!a.enabled ? "opacity-60" : ""}>
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Zap className="size-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">{a.name}</p>
                        <Badge variant="outline" className={cat?.className}>{cat?.label}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{triggerLabels[a.trigger_type]}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{actionLabels[a.action_type]}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{a.description}</p>
                      {a.last_triggered_at && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Última execução: {format(new Date(a.last_triggered_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="ghost" onClick={() => { setEditing(a); setFormOpen(true); }}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteAutomation.mutate(a.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                      <Switch checked={a.enabled} onCheckedChange={(enabled) => toggleAutomation.mutate({ id: a.id, enabled })} />
                    </div>
                  </div>

                  {/* Webhook info */}
                  {a.webhook_url && (
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Webhook URL (cole no n8n)</p>
                        <Button size="icon" variant="ghost" className="size-5" onClick={() => copyWebhookUrl(a)}>
                          <Copy className="size-3" />
                        </Button>
                      </div>
                      <code className="text-[11px] block break-all bg-background rounded px-2 py-1 border">
                        {webhookFullUrl}
                      </code>
                      {a.webhook_secret && (
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] text-muted-foreground">Secret (header x-webhook-secret):</p>
                          <code className="text-[11px] bg-background rounded px-2 py-0.5 border">
                            {isSecretVisible ? a.webhook_secret : "••••••••••••••••"}
                          </code>
                          <Button size="icon" variant="ghost" className="size-5" onClick={() => toggleSecretVisibility(a.id)}>
                            {isSecretVisible ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                          </Button>
                          <Button size="icon" variant="ghost" className="size-5" onClick={() => copySecret(a.webhook_secret!)}>
                            <Copy className="size-3" />
                          </Button>
                        </div>
                      )}
                      {(a.action_config as any)?.url && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <ExternalLink className="size-3" />
                          Destino: {(a.action_config as any).url}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="logs" className="space-y-2 mt-4">
          {logsLoading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)
          ) : logs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p className="text-sm">Nenhum log de execução encontrado</p>
              </CardContent>
            </Card>
          ) : (
            logs.map((log) => {
              const automation = automations.find((a) => a.id === log.automation_id);
              const isExpanded = expandedLogs.has(log.id);
              const hasPayload = log.trigger_payload && Object.keys(log.trigger_payload).length > 0;
              const hasResponse = log.response_payload && Object.keys(log.response_payload).length > 0;

              return (
                <Collapsible key={log.id} open={isExpanded} onOpenChange={() => toggleLogExpand(log.id)}>
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardContent className="flex items-center gap-3 py-3 cursor-pointer hover:bg-muted/30 transition-colors">
                        {logStatusIcons[log.status]}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{automation?.name || "Automação removida"}</p>
                          {log.error_message && (
                            <p className="text-xs text-destructive">{log.error_message}</p>
                          )}
                        </div>
                        <Badge variant={log.status === "success" ? "default" : log.status === "error" ? "destructive" : "secondary"}>
                          {log.status}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {format(new Date(log.executed_at), "dd/MM HH:mm:ss", { locale: ptBR })}
                        </span>
                        {isExpanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                      </CardContent>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-6 pb-4 space-y-3 border-t border-border pt-3">
                        {hasPayload && (
                          <div>
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Payload Enviado</p>
                            <pre className="text-[11px] bg-muted/50 rounded-lg p-3 overflow-x-auto max-h-48 border">
                              {JSON.stringify(log.trigger_payload, null, 2)}
                            </pre>
                          </div>
                        )}
                        {hasResponse && (
                          <div>
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Resposta Recebida</p>
                            <pre className="text-[11px] bg-muted/50 rounded-lg p-3 overflow-x-auto max-h-48 border">
                              {JSON.stringify(log.response_payload, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.error_message && (
                          <div>
                            <p className="text-[10px] font-medium text-destructive uppercase tracking-wider mb-1">Erro</p>
                            <p className="text-xs text-destructive bg-destructive/10 rounded-lg p-3 border border-destructive/20">{log.error_message}</p>
                          </div>
                        )}
                        {!hasPayload && !hasResponse && !log.error_message && (
                          <p className="text-xs text-muted-foreground">Nenhum detalhe disponível para este log.</p>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      <AutomationFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        automation={editing}
      />

      <AiAutomationAssistant
        open={aiOpen}
        onOpenChange={setAiOpen}
        onCreateAutomation={(values) => createAutomation.mutate(values as Partial<Automation>)}
      />
    </div>
  );
}
