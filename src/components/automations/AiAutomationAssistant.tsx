import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, CheckCircle2, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AiAutomationAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateAutomation: (values: Record<string, unknown>) => void;
}

const suggestions = [
  "Enviar WhatsApp quando fatura vencer em 3 dias",
  "Suspender contrato após 15 dias de atraso",
  "Enviar boas-vindas quando novo contrato é criado",
  "Pesquisa NPS após resolver ticket",
  "Notificar equipe quando nova OS é aberta",
  "Reativar contrato quando pagamento é confirmado",
];

const categoryLabels: Record<string, string> = {
  cobranca: "Cobrança",
  atendimento: "Atendimento",
  operacional: "Operacional",
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

export default function AiAutomationAssistant({ open, onOpenChange, onCreateAutomation }: AiAutomationAssistantProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-automation-assistant", {
        body: { prompt: prompt.trim() },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.automation) throw new Error("Resposta inválida");

      setResult(data.automation);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao gerar automação";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!result) return;
    const { explanation, ...automationData } = result;
    onCreateAutomation(automationData);
    onOpenChange(false);
    setPrompt("");
    setResult(null);
    toast.success("Automação criada com IA!");
  };

  const handleClose = () => {
    onOpenChange(false);
    setPrompt("");
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            Assistente IA de Automações
          </DialogTitle>
          <DialogDescription>
            Descreva em linguagem natural a automação que você deseja criar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            placeholder="Ex: Quero enviar uma mensagem no WhatsApp quando uma fatura estiver 3 dias antes de vencer..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            disabled={loading}
          />

          {!result && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Sugestões rápidas:</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    className="text-[11px] px-2 py-1 rounded-full border bg-muted/50 hover:bg-muted transition-colors text-left"
                    onClick={() => setPrompt(s)}
                    disabled={loading}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {result && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-success" />
                <p className="text-sm font-medium">Automação gerada</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="size-4 text-primary" />
                  <p className="text-sm font-semibold">{result.name as string}</p>
                </div>
                <p className="text-xs text-muted-foreground">{result.description as string}</p>

                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-[10px]">
                    {categoryLabels[(result.category as string)] || result.category as string}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    {triggerLabels[(result.trigger_type as string)] || result.trigger_type as string}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    {actionLabels[(result.action_type as string)] || result.action_type as string}
                  </Badge>
                </div>

                {result.explanation && (
                  <div className="bg-background rounded p-2 border mt-2">
                    <p className="text-xs text-muted-foreground">{result.explanation as string}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {result ? (
            <>
              <Button variant="outline" onClick={() => setResult(null)}>
                Refazer
              </Button>
              <Button onClick={handleConfirm}>
                <CheckCircle2 className="mr-2 size-4" />
                Criar Automação
              </Button>
            </>
          ) : (
            <Button onClick={handleGenerate} disabled={loading || prompt.trim().length < 5}>
              {loading ? (
                <><Loader2 className="mr-2 size-4 animate-spin" />Gerando...</>
              ) : (
                <><Sparkles className="mr-2 size-4" />Gerar com IA</>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
