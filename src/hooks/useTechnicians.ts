import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface TechnicianFormData {
  name: string;
  phone?: string;
  email?: string;
  specialty?: "installation" | "maintenance" | "support" | "general";
  status?: "active" | "inactive" | "vacation";
  notes?: string;
}

export interface TechnicianRecord {
  id: string;
  organization_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  specialty: "installation" | "maintenance" | "support" | "general";
  status: "active" | "inactive" | "vacation";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

async function getOrgId() {
  const { data, error } = await supabase.from("profiles").select("organization_id").maybeSingle();
  if (error) throw error;
  if (!data?.organization_id) throw new Error("Organização não encontrada.");
  return data.organization_id;
}

export function useTechnicians(search?: string) {
  return useQuery({
    queryKey: ["technicians", search],
    queryFn: async () => {
      let query = supabase.from("technicians" as any).select("*").order("created_at", { ascending: false });
      if (search?.trim()) {
        query = query.or(`name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as TechnicianRecord[];
    },
  });
}

export function useCreateTechnician() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (form: TechnicianFormData) => {
      const orgId = await getOrgId();
      const { data, error } = await supabase.from("technicians" as any).insert([{
        organization_id: orgId,
        name: form.name,
        phone: form.phone || null,
        email: form.email || null,
        specialty: form.specialty || "general",
        status: form.status || "active",
        notes: form.notes || null,
      }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["technicians"] }); toast({ title: "Técnico criado!" }); },
    onError: (e: Error) => { toast({ title: "Erro ao criar técnico", description: e.message, variant: "destructive" }); },
  });
}

export function useUpdateTechnician() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, data: form }: { id: string; data: Partial<TechnicianFormData> }) => {
      const update: Record<string, unknown> = {};
      if (form.name !== undefined) update.name = form.name;
      if (form.phone !== undefined) update.phone = form.phone || null;
      if (form.email !== undefined) update.email = form.email || null;
      if (form.specialty !== undefined) update.specialty = form.specialty;
      if (form.status !== undefined) update.status = form.status;
      if (form.notes !== undefined) update.notes = form.notes || null;
      const { data, error } = await supabase.from("technicians" as any).update(update).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["technicians"] }); toast({ title: "Técnico atualizado!" }); },
    onError: (e: Error) => { toast({ title: "Erro ao atualizar técnico", description: e.message, variant: "destructive" }); },
  });
}

export function useDeleteTechnician() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("technicians" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["technicians"] }); toast({ title: "Técnico removido!" }); },
    onError: (e: Error) => { toast({ title: "Erro ao remover técnico", description: e.message, variant: "destructive" }); },
  });
}
