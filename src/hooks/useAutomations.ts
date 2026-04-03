import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Automation {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  category: "cobranca" | "atendimento" | "operacional";
  trigger_type: "webhook" | "schedule" | "event";
  trigger_config: Record<string, unknown>;
  action_type: "webhook_call" | "whatsapp" | "email" | "internal";
  action_config: Record<string, unknown>;
  enabled: boolean;
  webhook_url: string | null;
  webhook_secret: string | null;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AutomationLog {
  id: string;
  automation_id: string;
  organization_id: string;
  status: "success" | "error" | "skipped";
  trigger_payload: Record<string, unknown>;
  response_payload: Record<string, unknown>;
  error_message: string | null;
  executed_at: string;
}

export function useAutomations() {
  const queryClient = useQueryClient();

  const { data: automations = [], isLoading } = useQuery({
    queryKey: ["automations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Automation[];
    },
  });

  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["automation_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_logs")
        .select("*")
        .order("executed_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as unknown as AutomationLog[];
    },
  });

  const createAutomation = useMutation({
    mutationFn: async (values: Partial<Automation>) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .single();
      if (!profile) throw new Error("Perfil não encontrado");

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const webhookUrl = `https://${projectId}.supabase.co/functions/v1/automation-webhook`;

      const { data, error } = await supabase
        .from("automations")
        .insert({
          ...values,
          organization_id: profile.organization_id!,
          webhook_url: webhookUrl,
        } as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
      toast.success("Automação criada com sucesso");
    },
    onError: (e) => toast.error("Erro ao criar automação: " + e.message),
  });

  const updateAutomation = useMutation({
    mutationFn: async ({ id, ...values }: Partial<Automation> & { id: string }) => {
      const { data, error } = await supabase
        .from("automations")
        .update(values as never)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
      toast.success("Automação atualizada");
    },
    onError: (e) => toast.error("Erro ao atualizar: " + e.message),
  });

  const toggleAutomation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("automations")
        .update({ enabled } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const deleteAutomation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("automations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
      toast.success("Automação excluída");
    },
    onError: (e) => toast.error("Erro ao excluir: " + e.message),
  });

  return {
    automations,
    isLoading,
    logs,
    logsLoading,
    createAutomation,
    updateAutomation,
    toggleAutomation,
    deleteAutomation,
  };
}
