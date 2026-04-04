import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type ScheduleStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

export interface TechnicianSchedule {
  id: string;
  organization_id: string;
  technician_id: string;
  service_order_id: string | null;
  title: string | null;
  date: string;
  start_time: string;
  end_time: string;
  status: ScheduleStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  technicians?: { name: string } | null;
  service_orders?: { description: string; type: string; customers: { name: string } | null } | null;
}

export interface ScheduleFormData {
  technician_id: string;
  service_order_id?: string;
  title?: string;
  date: string;
  start_time: string;
  end_time: string;
  status?: ScheduleStatus;
  notes?: string;
}

export interface TechnicianAvailability {
  id: string;
  organization_id: string;
  technician_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
}

async function getOrgId() {
  const { data, error } = await supabase.from("profiles").select("organization_id").maybeSingle();
  if (error) throw error;
  if (!data?.organization_id) throw new Error("Organização não encontrada.");
  return data.organization_id;
}

export function useTechnicianSchedules(dateRange?: { start: string; end: string }) {
  return useQuery({
    queryKey: ["technician_schedules", dateRange],
    queryFn: async () => {
      let query = supabase
        .from("technician_schedules" as any)
        .select("*, technicians:technician_id(name), service_orders:service_order_id(description, type, customers:customer_id(name))")
        .order("date")
        .order("start_time");
      if (dateRange) {
        query = query.gte("date", dateRange.start).lte("date", dateRange.end);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as TechnicianSchedule[];
    },
  });
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (form: ScheduleFormData) => {
      const orgId = await getOrgId();
      const { error } = await supabase.from("technician_schedules" as any).insert({
        organization_id: orgId,
        technician_id: form.technician_id,
        service_order_id: form.service_order_id || null,
        title: form.title || null,
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        status: form.status || "scheduled",
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["technician_schedules"] });
      toast({ title: "Agendamento criado!" });
    },
    onError: (e: Error) => {
      toast({ title: "Erro ao criar agendamento", description: e.message, variant: "destructive" });
    },
  });
}

export function useUpdateSchedule() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, data: form }: { id: string; data: Partial<ScheduleFormData> }) => {
      const update: Record<string, unknown> = {};
      if (form.technician_id !== undefined) update.technician_id = form.technician_id;
      if (form.service_order_id !== undefined) update.service_order_id = form.service_order_id || null;
      if (form.title !== undefined) update.title = form.title || null;
      if (form.date !== undefined) update.date = form.date;
      if (form.start_time !== undefined) update.start_time = form.start_time;
      if (form.end_time !== undefined) update.end_time = form.end_time;
      if (form.status !== undefined) update.status = form.status;
      if (form.notes !== undefined) update.notes = form.notes || null;
      const { error } = await supabase.from("technician_schedules" as any).update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["technician_schedules"] });
      toast({ title: "Agendamento atualizado!" });
    },
    onError: (e: Error) => {
      toast({ title: "Erro ao atualizar", description: e.message, variant: "destructive" });
    },
  });
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("technician_schedules" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["technician_schedules"] });
      toast({ title: "Agendamento removido!" });
    },
    onError: (e: Error) => {
      toast({ title: "Erro ao remover", description: e.message, variant: "destructive" });
    },
  });
}

export function useTechnicianAvailability(technicianId?: string) {
  return useQuery({
    queryKey: ["technician_availability", technicianId],
    enabled: !!technicianId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("technician_availability" as any)
        .select("*")
        .eq("technician_id", technicianId!)
        .order("weekday");
      if (error) throw error;
      return (data ?? []) as unknown as TechnicianAvailability[];
    },
  });
}
