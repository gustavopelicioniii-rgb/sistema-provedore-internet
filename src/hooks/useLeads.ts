import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

export type LeadStage = Database["public"]["Enums"]["lead_stage"];
export type LeadSource = Database["public"]["Enums"]["lead_source"];
export type LeadRecord = Database["public"]["Tables"]["leads"]["Row"];
type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];

export interface LeadFormData {
  name: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  company?: string;
  stage?: LeadStage;
  value?: number;
  source?: LeadSource;
  notes?: string;
}

export const STAGE_META: Record<LeadStage, { label: string; color: string }> = {
  new: { label: "Novo", color: "bg-blue-500/15 text-blue-700 border-blue-300" },
  qualified: { label: "Qualificado", color: "bg-violet-500/15 text-violet-700 border-violet-300" },
  proposal: { label: "Proposta", color: "bg-amber-500/15 text-amber-700 border-amber-300" },
  negotiation: { label: "Negociação", color: "bg-orange-500/15 text-orange-700 border-orange-300" },
  won: { label: "Ganho", color: "bg-emerald-500/15 text-emerald-700 border-emerald-300" },
  lost: { label: "Perdido", color: "bg-red-500/15 text-red-700 border-red-300" },
};

export const SOURCE_LABELS: Record<LeadSource, string> = {
  referral: "Indicação",
  website: "Site",
  social_media: "Redes Sociais",
  cold_call: "Prospecção",
  event: "Evento",
  other: "Outro",
};

export const PIPELINE_STAGES: LeadStage[] = ["new", "qualified", "proposal", "negotiation", "won", "lost"];

async function getOrganizationId() {
  const { data, error } = await supabase.from("profiles").select("organization_id").maybeSingle();
  if (error) throw error;
  if (!data?.organization_id) throw new Error("Usuário não vinculado a uma organização.");
  return data.organization_id;
}

export function useLeads() {
  return useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("position", { ascending: true });
      if (error) throw error;
      return (data ?? []) as LeadRecord[];
    },
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (form: LeadFormData) => {
      const organizationId = await getOrganizationId();

      // Get max position for the target stage
      const { data: existing } = await supabase
        .from("leads")
        .select("position")
        .eq("stage", form.stage ?? "new")
        .order("position", { ascending: false })
        .limit(1);

      const nextPos = ((existing?.[0]?.position ?? -1) + 1);

      const insert: LeadInsert = {
        organization_id: organizationId,
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
        company: form.company || null,
        stage: form.stage ?? "new",
        value: form.value ?? 0,
        source: form.source ?? "other",
        notes: form.notes || null,
        position: nextPos,
      };

      const { data, error } = await supabase.from("leads").insert([insert]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: "Lead criado com sucesso!" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao criar lead", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LeadFormData> & { position?: number; stage?: LeadStage } }) => {
      const update: LeadUpdate = {};
      if (data.name !== undefined) update.name = data.name;
      if (data.email !== undefined) update.email = data.email || null;
      if (data.phone !== undefined) update.phone = data.phone || null;
      if (data.whatsapp !== undefined) update.whatsapp = data.whatsapp || null;
      if (data.company !== undefined) update.company = data.company || null;
      if (data.stage !== undefined) update.stage = data.stage;
      if (data.value !== undefined) update.value = data.value;
      if (data.source !== undefined) update.source = data.source;
      if (data.notes !== undefined) update.notes = data.notes || null;
      if (data.position !== undefined) update.position = data.position;

      const { data: lead, error } = await supabase.from("leads").update(update).eq("id", id).select().single();
      if (error) throw error;
      return lead;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao atualizar lead", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: "Lead removido com sucesso!" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao remover lead", description: err.message, variant: "destructive" });
    },
  });
}
