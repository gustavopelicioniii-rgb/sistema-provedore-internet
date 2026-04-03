import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketStatus = "open" | "in_progress" | "waiting" | "resolved" | "closed";

export interface TicketFormData {
  subject: string;
  description?: string;
  priority?: TicketPriority;
  status?: TicketStatus;
  customer_id?: string;
  assigned_to?: string;
}

export interface TicketRecord {
  id: string;
  organization_id: string;
  customer_id: string | null;
  assigned_to: string | null;
  subject: string;
  description: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  customers?: { name: string } | null;
}

async function getOrgId() {
  const { data, error } = await supabase.from("profiles").select("organization_id").maybeSingle();
  if (error) throw error;
  if (!data?.organization_id) throw new Error("Organização não encontrada.");
  return data.organization_id;
}

export function useTickets(search?: string) {
  return useQuery({
    queryKey: ["tickets", search],
    queryFn: async () => {
      let query = supabase
        .from("tickets" as any)
        .select("*, customers:customer_id(name)")
        .order("created_at", { ascending: false });
      if (search?.trim()) {
        query = query.or(`subject.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as TicketRecord[];
    },
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (form: TicketFormData) => {
      const orgId = await getOrgId();
      const { data, error } = await supabase.from("tickets" as any).insert([{
        organization_id: orgId,
        subject: form.subject,
        description: form.description || null,
        priority: form.priority || "medium",
        status: form.status || "open",
        customer_id: form.customer_id || null,
        assigned_to: form.assigned_to || null,
      }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tickets"] }); toast({ title: "Ticket criado!" }); },
    onError: (e: Error) => { toast({ title: "Erro ao criar ticket", description: e.message, variant: "destructive" }); },
  });
}

export function useUpdateTicket() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, data: form }: { id: string; data: Partial<TicketFormData> }) => {
      const update: Record<string, unknown> = {};
      if (form.subject !== undefined) update.subject = form.subject;
      if (form.description !== undefined) update.description = form.description || null;
      if (form.priority !== undefined) update.priority = form.priority;
      if (form.status !== undefined) update.status = form.status;
      if (form.customer_id !== undefined) update.customer_id = form.customer_id || null;
      if (form.assigned_to !== undefined) update.assigned_to = form.assigned_to || null;
      if (form.status === "resolved" || form.status === "closed") update.resolved_at = new Date().toISOString();
      const { data, error } = await supabase.from("tickets" as any).update(update).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tickets"] }); toast({ title: "Ticket atualizado!" }); },
    onError: (e: Error) => { toast({ title: "Erro ao atualizar ticket", description: e.message, variant: "destructive" }); },
  });
}

export function useDeleteTicket() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tickets" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tickets"] }); toast({ title: "Ticket removido!" }); },
    onError: (e: Error) => { toast({ title: "Erro ao remover ticket", description: e.message, variant: "destructive" }); },
  });
}
