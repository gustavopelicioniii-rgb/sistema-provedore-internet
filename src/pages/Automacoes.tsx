import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Zap, Trash2, Pencil, Copy, ExternalLink, CheckCircle2, XCircle, SkipForward, Eye, EyeOff } from "lucide-react";
import { useAutomations, type Automation, type AutomationLog } from "@/hooks/useAutomations";
import AutomationFormDialog from "@/components/automations/AutomationFormDialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

  const activeCount = automations.filter((a) => a.enabled).length;

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
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="mr-2 size-4" />Nova Automação
        </Button>
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

      <Tabs defaultValue="automations">
        <TabsList>
          <TabsTrigger value="automations">Automações ({automations.length})</TabsTrigger>
          <TabsTrigger value="logs">Logs de Execução ({logs.length})</TabsTrigger>
        </TabsList>

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
              return (
                <Card key={log.id}>
                  <CardContent className="flex items-center gap-3 py-3">
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
                  </CardContent>
                </Card>
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
    </div>
  );
}
