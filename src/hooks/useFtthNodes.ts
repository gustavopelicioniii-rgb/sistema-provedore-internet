import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type FtthNode = Tables<"ftth_nodes">;
export type FtthNodeInsert = TablesInsert<"ftth_nodes">;
export type FtthNodeUpdate = TablesUpdate<"ftth_nodes">;

export function useFtthNodes() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["ftth_nodes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ftth_nodes")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as FtthNode[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (node: Omit<FtthNodeInsert, "organization_id">) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .single();
      if (!profile?.organization_id) throw new Error("Organização não encontrada");

      const { data, error } = await supabase
        .from("ftth_nodes")
        .insert({ ...node, organization_id: profile.organization_id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ftth_nodes"] });
      toast.success("Ponto FTTH criado com sucesso");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: FtthNodeUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("ftth_nodes")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ftth_nodes"] });
      toast.success("Ponto FTTH atualizado");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ftth_nodes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ftth_nodes"] });
      toast.success("Ponto FTTH removido");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return {
    nodes: query.data ?? [],
    isLoading: query.isLoading,
    createNode: createMutation.mutateAsync,
    updateNode: updateMutation.mutateAsync,
    deleteNode: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}