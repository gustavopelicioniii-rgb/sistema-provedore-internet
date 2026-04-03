import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type SOType = "installation" | "maintenance" | "technical_visit" | "repair";
export type SOStatus = "open" | "in_progress" | "completed" | "cancelled";

export interface ServiceOrderFormData {
  customer_id: string;
  technician_id?: string;
  type?: SOType;
  status?: SOStatus;
  description?: string;
  scheduled_date?: string;
  notes?: string;
}

export interface ServiceOrderRecord {
  id: string;
  organization_id: string;
  customer_id: string;
  technician_id: string | null;
  type: SOType;
  status: SOStatus;
  description: string | null;
  scheduled_date: string | null;
  completed_date: string | null;
  address: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // joined
  customers?: { name: string } | null;
  technicians?: { name: string } | null;
}

async function getOrgId() {
  const { data, error } = await supabase.from("profiles").select("organization_id").maybeSingle();
  if (error) throw error;
  if (!data?.organization_id) throw new Error("Organização não encontrada.");
  return data.organization_id;
}

export function useServiceOrders(search?: string) {
  return useQuery({
    queryKey: ["service-orders", search],
    queryFn: async () => {
      let query = supabase
        .from("service_orders" as any)
        .select("*, customers:customer_id(name), technicians:technician_id(name)")
        .order("created_at", { ascending: false });
      if (search?.trim()) {
        query = query.or(`description.ilike.%${search.trim()}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as ServiceOrderRecord[];
    },
  });
}

export function useCreateServiceOrder() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (form: ServiceOrderFormData) => {
      const orgId = await getOrgId();
      const { data, error } = await supabase.from("service_orders" as any).insert([{
        organization_id: orgId,
        customer_id: form.customer_id,
        technician_id: form.technician_id || null,
        type: form.type || "installation",
        status: form.status || "open",
        description: form.description || null,
        scheduled_date: form.scheduled_date || null,
        notes: form.notes || null,
      }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["service-orders"] }); toast({ title: "OS criada!" }); },
    onError: (e: Error) => { toast({ title: "Erro ao criar OS", description: e.message, variant: "destructive" }); },
  });
}

export function useUpdateServiceOrder() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, data: form }: { id: string; data: Partial<ServiceOrderFormData> }) => {
      const update: Record<string, unknown> = {};
      if (form.customer_id !== undefined) update.customer_id = form.customer_id;
      if (form.technician_id !== undefined) update.technician_id = form.technician_id || null;
      if (form.type !== undefined) update.type = form.type;
      if (form.status !== undefined) update.status = form.status;
      if (form.description !== undefined) update.description = form.description || null;
      if (form.scheduled_date !== undefined) update.scheduled_date = form.scheduled_date || null;
      if (form.notes !== undefined) update.notes = form.notes || null;
      if (form.status === "completed") update.completed_date = new Date().toISOString();
      const { data, error } = await supabase.from("service_orders" as any).update(update).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["service-orders"] }); toast({ title: "OS atualizada!" }); },
    onError: (e: Error) => { toast({ title: "Erro ao atualizar OS", description: e.message, variant: "destructive" }); },
  });
}

export function useDeleteServiceOrder() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("service_orders" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["service-orders"] }); toast({ title: "OS removida!" }); },
    onError: (e: Error) => { toast({ title: "Erro ao remover OS", description: e.message, variant: "destructive" }); },
  });
}
