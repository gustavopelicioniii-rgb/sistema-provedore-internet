import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export type AppRole = "admin" | "manager" | "technician" | "financial" | "support";

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  organization_id: string;
  created_at: string;
}

async function getOrgId() {
  const { data, error } = await supabase.from("profiles").select("organization_id").maybeSingle();
  if (error) throw error;
  if (!data?.organization_id) throw new Error("Organização não encontrada.");
  return data.organization_id;
}

export function useUserRoles() {
  return useQuery({
    queryKey: ["user_roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles" as any)
        .select("*")
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as UserRole[];
    },
  });
}

export function useCurrentUserRoles() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user_roles", "current", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles" as any)
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return ((data ?? []) as unknown as { role: AppRole }[]).map((r) => r.role);
    },
  });
}

export function useHasRole() {
  const { data: roles = [] } = useCurrentUserRoles();
  return (role: AppRole) => roles.includes(role);
}

export function useAssignRole() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const orgId = await getOrgId();
      const { error } = await supabase.from("user_roles" as any).insert({
        user_id: userId,
        role,
        organization_id: orgId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user_roles"] });
      toast({ title: "Role atribuída!" });
    },
    onError: (e: Error) => {
      toast({ title: "Erro ao atribuir role", description: e.message, variant: "destructive" });
    },
  });
}

export function useRemoveRole() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_roles" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user_roles"] });
      toast({ title: "Role removida!" });
    },
    onError: (e: Error) => {
      toast({ title: "Erro ao remover role", description: e.message, variant: "destructive" });
    },
  });
}
