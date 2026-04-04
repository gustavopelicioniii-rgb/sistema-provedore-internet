import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

export type ContractStatus = Database["public"]["Enums"]["contract_status"];
export type ContractRecord = Database["public"]["Tables"]["contracts"]["Row"];
type ContractInsert = Database["public"]["Tables"]["contracts"]["Insert"];
type ContractUpdate = Database["public"]["Tables"]["contracts"]["Update"];

export interface ContractFormData {
  customer_id: string;
  plan_id: string;
  status?: ContractStatus;
  start_date?: string;
  end_date?: string;
  signed_at?: string;
  billing_day?: number;
  installation_address?: Record<string, string>;
  authentication?: Record<string, string>;
}

export const STATUS_META: Record<ContractStatus, { label: string; color: string }> = {
  active: { label: "Ativo", color: "bg-emerald-500/15 text-emerald-700 border-emerald-300" },
  suspended: { label: "Suspenso", color: "bg-amber-500/15 text-amber-700 border-amber-300" },
  cancelled: { label: "Cancelado", color: "bg-red-500/15 text-red-700 border-red-300" },
  awaiting_installation: { label: "Aguardando Instalação", color: "bg-blue-500/15 text-blue-700 border-blue-300" },
  awaiting_signature: { label: "Aguardando Assinatura", color: "bg-violet-500/15 text-violet-700 border-violet-300" },
};

async function getOrganizationId() {
  const { data, error } = await supabase.from("profiles").select("organization_id").maybeSingle();
  if (error) throw error;
  if (!data?.organization_id) throw new Error("Usuário não vinculado a uma organização.");
  return data.organization_id;
}

export interface ContractWithRelations extends ContractRecord {
  customers: { id: string; name: string } | null;
  plans: { id: string; name: string; price: number } | null;
}

export function useContracts() {
  return useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("*, customers(id, name), plans(id, name, price)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ContractWithRelations[];
    },
  });
}

export function useCreateContract() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (form: ContractFormData) => {
      const organizationId = await getOrganizationId();
      const insert: ContractInsert = {
        organization_id: organizationId,
        customer_id: form.customer_id,
        plan_id: form.plan_id,
        status: form.status ?? "awaiting_installation",
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        signed_at: form.signed_at || null,
        billing_day: form.billing_day ?? 10,
        installation_address: (form.installation_address ?? {}) as Json,
        authentication: (form.authentication ?? {}) as Json,
      };
      const { data, error } = await supabase.from("contracts").insert([insert]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contracts"] });
      qc.invalidateQueries({ queryKey: ["dashboard-data"] });
      toast({ title: "Contrato criado com sucesso!" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao criar contrato", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateContract() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ContractFormData> }) => {
      const update: ContractUpdate = {};
      if (data.customer_id !== undefined) update.customer_id = data.customer_id;
      if (data.plan_id !== undefined) update.plan_id = data.plan_id;
      if (data.status !== undefined) update.status = data.status;
      if (data.start_date !== undefined) update.start_date = data.start_date || null;
      if (data.end_date !== undefined) update.end_date = data.end_date || null;
      if (data.signed_at !== undefined) update.signed_at = data.signed_at || null;
      if (data.billing_day !== undefined) (update as any).billing_day = data.billing_day;
      if (data.installation_address !== undefined) update.installation_address = (data.installation_address ?? {}) as Json;
      if (data.authentication !== undefined) update.authentication = (data.authentication ?? {}) as Json;

      const { data: contract, error } = await supabase.from("contracts").update(update).eq("id", id).select().single();
      if (error) throw error;
      return contract;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contracts"] });
      qc.invalidateQueries({ queryKey: ["dashboard-data"] });
      toast({ title: "Contrato atualizado com sucesso!" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao atualizar contrato", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteContract() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contracts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contracts"] });
      qc.invalidateQueries({ queryKey: ["dashboard-data"] });
      toast({ title: "Contrato removido com sucesso!" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao remover contrato", description: err.message, variant: "destructive" });
    },
  });
}
