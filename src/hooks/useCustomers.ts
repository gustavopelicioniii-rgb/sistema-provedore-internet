import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

export interface CustomerAddress {
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

export interface CustomerFormData {
  name: string;
  cpf_cnpj: string;
  rg?: string;
  birth_date?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: CustomerAddress;
  notes?: string;
  status?: "active" | "suspended" | "defaulting" | "cancelled";
}

export type CustomerRecord = Database["public"]["Tables"]["customers"]["Row"];

type CustomerInsert = Database["public"]["Tables"]["customers"]["Insert"];
type CustomerUpdate = Database["public"]["Tables"]["customers"]["Update"];

async function getCurrentOrganizationId() {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("organization_id")
    .maybeSingle();

  if (error) throw error;
  if (!profile?.organization_id) {
    throw new Error("Seu usuário ainda não está vinculado a uma organização. Faça logout e login novamente.");
  }

  return profile.organization_id;
}

export function useCustomers(search?: string) {
  return useQuery({
    queryKey: ["customers", search],
    queryFn: async () => {
      let query = supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (search?.trim()) {
        const term = `%${search.trim()}%`;
        query = query.or(`name.ilike.${term},cpf_cnpj.ilike.${term}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as CustomerRecord[];
    },
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const organizationId = await getCurrentOrganizationId();

      const insertData: CustomerInsert = {
        organization_id: organizationId,
        name: data.name,
        cpf_cnpj: data.cpf_cnpj.replace(/\D/g, ""),
        rg: data.rg || null,
        birth_date: data.birth_date || null,
        email: data.email || null,
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        address: (data.address || {}) as Json,
        notes: data.notes || null,
        status: data.status || "active",
      };

      const { data: customer, error } = await supabase
        .from("customers")
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      return customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
      queryClient.invalidateQueries({ queryKey: ["financeiro-data"] });
      toast({ title: "Cliente criado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar cliente", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CustomerFormData> }) => {
      const updateData: CustomerUpdate = {};

      if (data.name !== undefined) updateData.name = data.name;
      if (data.cpf_cnpj !== undefined) updateData.cpf_cnpj = data.cpf_cnpj.replace(/\D/g, "");
      if (data.rg !== undefined) updateData.rg = data.rg || null;
      if (data.birth_date !== undefined) updateData.birth_date = data.birth_date || null;
      if (data.email !== undefined) updateData.email = data.email || null;
      if (data.phone !== undefined) updateData.phone = data.phone || null;
      if (data.whatsapp !== undefined) updateData.whatsapp = data.whatsapp || null;
      if (data.address !== undefined) updateData.address = (data.address || {}) as Json;
      if (data.notes !== undefined) updateData.notes = data.notes || null;
      if (data.status !== undefined) updateData.status = data.status;

      const { data: customer, error } = await supabase
        .from("customers")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
      queryClient.invalidateQueries({ queryKey: ["financeiro-data"] });
      toast({ title: "Cliente atualizado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar cliente", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
      queryClient.invalidateQueries({ queryKey: ["financeiro-data"] });
      toast({ title: "Cliente removido com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao remover cliente", description: error.message, variant: "destructive" });
    },
  });
}

export async function fetchViaCep(cep: string): Promise<CustomerAddress | null> {
  const cleanCep = cep.replace(/\D/g, "");
  if (cleanCep.length !== 8) return null;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const data = await response.json();

    if (data.erro) return null;

    return {
      cep: cleanCep,
      street: data.logradouro || "",
      neighborhood: data.bairro || "",
      city: data.localidade || "",
      state: data.uf || "",
    };
  } catch {
    return null;
  }
}
