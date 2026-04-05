import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AuditLog {
  id: string;
  user_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export function useAuditLogs(limit = 50) {
  return useQuery({
    queryKey: ["audit-logs", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, user_name, action, entity_type, entity_id, details, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as AuditLog[];
    },
  });
}

export function useCreateAuditLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (log: {
      action: string;
      entity_type: string;
      entity_id?: string;
      details?: Record<string, unknown>;
    }) => {
      const { data: profile } = await supabase.from("profiles").select("full_name, organization_id").single();
      if (!profile?.organization_id) throw new Error("Organização não encontrada");
      
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from("audit_logs").insert([{
        organization_id: profile.organization_id,
        user_id: user?.id ?? null,
        user_name: profile.full_name ?? user?.email ?? "Sistema",
        action: log.action,
        entity_type: log.entity_type,
        entity_id: log.entity_id ?? null,
        details: (log.details ?? {}) as any,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });
}
