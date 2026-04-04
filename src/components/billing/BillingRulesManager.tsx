import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Loader2, Trash2, Bell, Ban, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


const actionLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  notify: { label: "Notificar", icon: Bell, color: "text-blue-500" },
  suspend: { label: "Suspender", icon: Ban, color: "text-destructive" },
  reactivate: { label: "Reativar", icon: RefreshCw, color: "text-success" },
};

const channelLabels: Record<string, string> = {
  in_app: "In-App",
  whatsapp: "WhatsApp",
  email: "E-mail",
  sms: "SMS",
};

const defaultTemplates: Record<string, string> = {
  "-3": "Olá {{customer_name}}, sua fatura de R$ {{amount}} vence em {{days}} dias ({{due_date}}). Evite juros, pague em dia!",
  "1": "Olá {{customer_name}}, sua fatura de R$ {{amount}} venceu ontem ({{due_date}}). Regularize para evitar suspensão.",
  "7": "{{customer_name}}, sua fatura de R$ {{amount}} está vencida há {{days}} dias. Regularize urgentemente.",
  "15": "{{customer_name}}, devido à inadimplência de {{days}} dias, seu serviço será suspenso automaticamente.",
};

interface RuleForm {
  rule_name: string;
  days_offset: number;
  action: string;
  channel: string;
  template_message: string;
  priority: number;
}

const emptyForm: RuleForm = {
  rule_name: "",
  days_offset: -3,
  action: "notify",
  channel: "in_app",
  template_message: "",
  priority: 0,
};

export function BillingRulesManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: organizationId } = useQuery({
    queryKey: ["user-org-id"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_organization_id");
      if (error) throw error;
      return data as string;
    },
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<RuleForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: rules, isLoading } = useQuery({
    queryKey: ["billing-rules", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("billing_rules")
        .select("*")
        .eq("organization_id", organizationId)
        .order("days_offset", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  const toggleRule = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("billing_rules").update({ enabled } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["billing-rules"] }),
  });

  const saveRule = useMutation({
    mutationFn: async () => {
      if (!organizationId) throw new Error("Organização não encontrada");
      const payload = { ...form, organization_id: organizationId };
      if (editingId) {
        const { error } = await supabase.from("billing_rules").update(payload as any).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("billing_rules").insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-rules"] });
      toast({ title: editingId ? "Regra atualizada!" : "Regra criada!" });
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("billing_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-rules"] });
      toast({ title: "Regra removida" });
    },
  });

  const handleCreateDefaults = async () => {
    if (!organizationId) return;
    const defaults = [
      { rule_name: "Aviso D-3", days_offset: -3, action: "notify", channel: "in_app", template_message: defaultTemplates["-3"], priority: 1 },
      { rule_name: "Cobrança D+1", days_offset: 1, action: "notify", channel: "in_app", template_message: defaultTemplates["1"], priority: 2 },
      { rule_name: "Cobrança D+7", days_offset: 7, action: "notify", channel: "in_app", template_message: defaultTemplates["7"], priority: 3 },
      { rule_name: "Suspensão D+15", days_offset: 15, action: "suspend", channel: "in_app", template_message: defaultTemplates["15"], priority: 4 },
    ];
    const { error } = await supabase.from("billing_rules").insert(
      defaults.map((d) => ({ ...d, organization_id: organizationId })) as any
    );
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["billing-rules"] });
      toast({ title: "Régua padrão criada com sucesso!" });
    }
  };

  const openEdit = (rule: any) => {
    setForm({
      rule_name: rule.rule_name,
      days_offset: rule.days_offset,
      action: rule.action,
      channel: rule.channel,
      template_message: rule.template_message || "",
      priority: rule.priority,
    });
    setEditingId(rule.id);
    setDialogOpen(true);
  };

  const formatDaysOffset = (d: number) => {
    if (d < 0) return `D${d} (${Math.abs(d)} dias antes)`;
    if (d === 0) return "D-Day (dia do vencimento)";
    return `D+${d} (${d} dias após)`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Régua de Cobrança</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Automações de cobrança baseadas no vencimento das faturas</p>
          </div>
          <div className="flex gap-2">
            {(!rules || rules.length === 0) && !isLoading && (
              <Button variant="outline" size="sm" onClick={handleCreateDefaults}>
                Criar Padrão
              </Button>
            )}
            <Button size="sm" onClick={() => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); }}>
              <Plus className="mr-1 size-3.5" /> Nova Regra
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : !rules?.length ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma regra configurada. Clique em "Criar Padrão" para começar com a régua recomendada.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Regra</TableHead>
                <TableHead>Gatilho</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Ativa</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule: any) => {
                const actionInfo = actionLabels[rule.action] || actionLabels.notify;
                const ActionIcon = actionInfo.icon;
                return (
                  <TableRow key={rule.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openEdit(rule)}>
                    <TableCell className="font-medium">{rule.rule_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{formatDaysOffset(rule.days_offset)}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`flex items-center gap-1 text-xs ${actionInfo.color}`}>
                        <ActionIcon className="size-3" /> {actionInfo.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{channelLabels[rule.channel] || rule.channel}</Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(v) => toggleRule.mutate({ id: rule.id, enabled: v })}
                      />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="size-7 text-destructive"
                        onClick={() => deleteRule.mutate(rule.id)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Regra" : "Nova Regra de Cobrança"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome da Regra</Label>
              <Input value={form.rule_name} onChange={(e) => setForm({ ...form, rule_name: e.target.value })}
                placeholder="Ex: Aviso D-3" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Dias (relativo ao vencimento)</Label>
                <Input type="number" value={form.days_offset}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setForm({ ...form, days_offset: val });
                    const key = String(val);
                    if (defaultTemplates[key] && !form.template_message) {
                      setForm((f) => ({ ...f, days_offset: val, template_message: defaultTemplates[key] }));
                    }
                  }} />
                <p className="text-xs text-muted-foreground">Negativo = antes, positivo = após</p>
              </div>
              <div className="space-y-1.5">
                <Label>Prioridade</Label>
                <Input type="number" value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Ação</Label>
                <Select value={form.action} onValueChange={(v) => setForm({ ...form, action: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="notify">Notificar</SelectItem>
                    <SelectItem value="suspend">Suspender</SelectItem>
                    <SelectItem value="reactivate">Reativar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Canal</Label>
                <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_app">In-App</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Template da Mensagem</Label>
              <Textarea value={form.template_message}
                onChange={(e) => setForm({ ...form, template_message: e.target.value })}
                placeholder="Use {{customer_name}}, {{amount}}, {{due_date}}, {{days}}"
                rows={3} />
              <p className="text-xs text-muted-foreground">
                Variáveis: {"{{customer_name}}"}, {"{{amount}}"}, {"{{due_date}}"}, {"{{days}}"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveRule.mutate()} disabled={!form.rule_name || saveRule.isPending}>
              {saveRule.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {editingId ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
