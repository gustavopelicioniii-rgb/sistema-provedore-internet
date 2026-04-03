import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Automation } from "@/hooks/useAutomations";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: Partial<Automation>) => void;
  automation?: Automation | null;
}

export default function AutomationFormDialog({ open, onOpenChange, onSubmit, automation }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Automation["category"]>("operacional");
  const [triggerType, setTriggerType] = useState<Automation["trigger_type"]>("webhook");
  const [actionType, setActionType] = useState<Automation["action_type"]>("webhook_call");
  const [webhookTargetUrl, setWebhookTargetUrl] = useState("");
  const [eventName, setEventName] = useState("");

  useEffect(() => {
    if (automation) {
      setName(automation.name);
      setDescription(automation.description || "");
      setCategory(automation.category);
      setTriggerType(automation.trigger_type);
      setActionType(automation.action_type);
      setWebhookTargetUrl((automation.action_config as any)?.url || "");
      setEventName((automation.trigger_config as any)?.event || "");
    } else {
      setName("");
      setDescription("");
      setCategory("operacional");
      setTriggerType("webhook");
      setActionType("webhook_call");
      setWebhookTargetUrl("");
      setEventName("");
    }
  }, [automation, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...(automation ? { id: automation.id } : {}),
      name,
      description,
      category,
      trigger_type: triggerType,
      trigger_config: triggerType === "event" ? { event: eventName } : {},
      action_type: actionType,
      action_config: actionType === "webhook_call" ? { url: webhookTargetUrl, method: "POST" } : {},
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{automation ? "Editar Automação" : "Nova Automação"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex: Notificar n8n sobre novo ticket" />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="O que essa automação faz?" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Automation["category"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cobranca">Cobrança</SelectItem>
                  <SelectItem value="atendimento">Atendimento</SelectItem>
                  <SelectItem value="operacional">Operacional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Gatilho</Label>
              <Select value={triggerType} onValueChange={(v) => setTriggerType(v as Automation["trigger_type"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="webhook">Webhook (receber)</SelectItem>
                  <SelectItem value="event">Evento interno</SelectItem>
                  <SelectItem value="schedule">Agendamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {triggerType === "event" && (
            <div className="space-y-2">
              <Label>Nome do Evento</Label>
              <Select value={eventName} onValueChange={setEventName}>
                <SelectTrigger><SelectValue placeholder="Selecione o evento" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="invoice.overdue">Fatura vencida</SelectItem>
                  <SelectItem value="invoice.paid">Pagamento confirmado</SelectItem>
                  <SelectItem value="contract.created">Novo contrato</SelectItem>
                  <SelectItem value="ticket.resolved">Ticket resolvido</SelectItem>
                  <SelectItem value="service_order.created">Nova OS criada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Tipo de Ação</Label>
            <Select value={actionType} onValueChange={(v) => setActionType(v as Automation["action_type"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="webhook_call">Chamar Webhook (n8n / Zapier)</SelectItem>
                <SelectItem value="whatsapp">Enviar WhatsApp</SelectItem>
                <SelectItem value="email">Enviar E-mail</SelectItem>
                <SelectItem value="internal">Ação Interna</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {actionType === "webhook_call" && (
            <div className="space-y-2">
              <Label>URL do Webhook de destino</Label>
              <Input
                value={webhookTargetUrl}
                onChange={(e) => setWebhookTargetUrl(e.target.value)}
                placeholder="https://seu-n8n.com/webhook/abc123"
                type="url"
              />
              <p className="text-[10px] text-muted-foreground">
                Cole aqui a URL do webhook do n8n, Zapier, Make ou qualquer serviço externo.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{automation ? "Salvar" : "Criar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
