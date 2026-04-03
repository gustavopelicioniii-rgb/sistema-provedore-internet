import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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

export function useCustomers(search?: string) {
  return useQuery({
    queryKey: ["customers", search],
    queryFn: async () => {
      let query = supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (search && search.trim()) {
        const term = `%${search.trim()}%`;
        query = query.or(`name.ilike.${term},cpf_cnpj.ilike.${term}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CustomerFormData) => {
      // Get org id from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .single();

      if (!profile?.organization_id) throw new Error("Organização não encontrada");

      const { data: customer, error } = await supabase
        .from("customers")
        .insert({
          organization_id: profile.organization_id,
          name: data.name,
          cpf_cnpj: data.cpf_cnpj.replace(/\D/g, ""),
          rg: data.rg || null,
          birth_date: data.birth_date || null,
          email: data.email || null,
          phone: data.phone || null,
          whatsapp: data.whatsapp || null,
          address: (data.address as Record<string, unknown>) || {},
          notes: data.notes || null,
          status: data.status || "active",
        })
        .select()
        .single();

      if (error) throw error;
      return customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Cliente criado com sucesso!" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao criar cliente", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CustomerFormData> }) => {
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.cpf_cnpj !== undefined) updateData.cpf_cnpj = data.cpf_cnpj.replace(/\D/g, "");
      if (data.rg !== undefined) updateData.rg = data.rg || null;
      if (data.birth_date !== undefined) updateData.birth_date = data.birth_date || null;
      if (data.email !== undefined) updateData.email = data.email || null;
      if (data.phone !== undefined) updateData.phone = data.phone || null;
      if (data.whatsapp !== undefined) updateData.whatsapp = data.whatsapp || null;
      if (data.address !== undefined) updateData.address = data.address || {};
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
      toast({ title: "Cliente atualizado com sucesso!" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao atualizar cliente", description: err.message, variant: "destructive" });
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
      toast({ title: "Cliente removido com sucesso!" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao remover cliente", description: err.message, variant: "destructive" });
    },
  });
}

export async function fetchViaCep(cep: string): Promise<CustomerAddress | null> {
  const cleanCep = cep.replace(/\D/g, "");
  if (cleanCep.length !== 8) return null;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const data = await res.json();
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
