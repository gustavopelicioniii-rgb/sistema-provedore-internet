import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SlaConfig {
  id: string;
  organization_id: string;
  priority: string;
  max_response_minutes: number;
  max_resolution_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface SlaConfigFormData {
  priority: string;
  max_response_minutes: number;
  max_resolution_minutes: number;
}

async function getOrgId() {
  const { data, error } = await supabase.from("profiles").select("organization_id").maybeSingle();
  if (error) throw error;
  if (!data?.organization_id) throw new Error("Organização não encontrada.");
  return data.organization_id;
}

export function useSlaConfigs() {
  return useQuery({
    queryKey: ["sla_configs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sla_configs" as any)
        .select("*")
        .order("priority");
      if (error) throw error;
      return (data ?? []) as unknown as SlaConfig[];
    },
  });
}

export function useUpsertSlaConfig() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (form: SlaConfigFormData) => {
      const orgId = await getOrgId();
      const { data, error } = await supabase
        .from("sla_configs" as any)
        .upsert(
          {
            organization_id: orgId,
            priority: form.priority,
            max_response_minutes: form.max_response_minutes,
            max_resolution_minutes: form.max_resolution_minutes,
          },
          { onConflict: "organization_id,priority" }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sla_configs"] });
      toast({ title: "SLA configurado!" });
    },
    onError: (e: Error) => {
      toast({ title: "Erro ao configurar SLA", description: e.message, variant: "destructive" });
    },
  });
}
