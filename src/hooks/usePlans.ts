import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { ContractStatus } from "@/hooks/useContracts";
import { useToast } from "@/hooks/use-toast";

export type PlanTechnology = Database["public"]["Enums"]["plan_technology"];
export type PlanRecord = Database["public"]["Tables"]["plans"]["Row"];
type PlanInsert = Database["public"]["Tables"]["plans"]["Insert"];
type PlanUpdate = Database["public"]["Tables"]["plans"]["Update"];

export interface PlanFormData {
  name: string;
  download_speed: number;
  upload_speed: number;
  price: number;
  technology: PlanTechnology;
  loyalty_months?: number;
  active?: boolean;
}

export const TECH_LABELS: Record<PlanTechnology, string> = {
  fiber: "Fibra Óptica",
  radio: "Rádio",
  cable: "Cabo",
  other: "Outro",
};

async function getOrganizationId() {
  const { data, error } = await supabase.from("profiles").select("organization_id").maybeSingle();
  if (error) throw error;
  if (!data?.organization_id) throw new Error("Usuário não vinculado a uma organização.");
  return data.organization_id;
}

export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .order("price", { ascending: true });
      if (error) throw error;
      return (data ?? []) as PlanRecord[];
    },
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (form: PlanFormData) => {
      const organizationId = await getOrganizationId();
      const insert: PlanInsert = {
        organization_id: organizationId,
        name: form.name,
        download_speed: form.download_speed,
        upload_speed: form.upload_speed,
        price: form.price,
        technology: form.technology,
        loyalty_months: form.loyalty_months ?? 0,
        active: form.active ?? true,
      };
      const { data, error } = await supabase.from("plans").insert([insert]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plans"] });
      qc.invalidateQueries({ queryKey: ["dashboard-data"] });
      toast({ title: "Plano criado com sucesso!" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao criar plano", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PlanFormData> }) => {
      const update: PlanUpdate = {};
      if (data.name !== undefined) update.name = data.name;
      if (data.download_speed !== undefined) update.download_speed = data.download_speed;
      if (data.upload_speed !== undefined) update.upload_speed = data.upload_speed;
      if (data.price !== undefined) update.price = data.price;
      if (data.technology !== undefined) update.technology = data.technology;
      if (data.loyalty_months !== undefined) update.loyalty_months = data.loyalty_months;
      if (data.active !== undefined) update.active = data.active;

      const { data: plan, error } = await supabase.from("plans").update(update).eq("id", id).select().single();
      if (error) throw error;
      return plan;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plans"] });
      qc.invalidateQueries({ queryKey: ["dashboard-data"] });
      toast({ title: "Plano atualizado com sucesso!" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao atualizar plano", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plans"] });
      qc.invalidateQueries({ queryKey: ["dashboard-data"] });
      toast({ title: "Plano removido com sucesso!" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao remover plano", description: err.message, variant: "destructive" });
    },
  });
}
