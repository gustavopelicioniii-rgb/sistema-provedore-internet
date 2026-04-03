import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type NetworkDevice = Tables<"network_devices">;
export type NetworkDeviceInsert = TablesInsert<"network_devices">;
export type NetworkDeviceUpdate = TablesUpdate<"network_devices">;

export function useNetworkDevices() {
  const queryClient = useQueryClient();

  const devicesQuery = useQuery({
    queryKey: ["network_devices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("network_devices")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as NetworkDevice[];
    },
  });

  const createDevice = useMutation({
    mutationFn: async (device: NetworkDeviceInsert) => {
      const { data, error } = await supabase
        .from("network_devices")
        .insert(device)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["network_devices"] });
      toast.success("Equipamento cadastrado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar equipamento: " + error.message);
    },
  });

  const updateDevice = useMutation({
    mutationFn: async ({ id, ...updates }: NetworkDeviceUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("network_devices")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["network_devices"] });
      toast.success("Equipamento atualizado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar equipamento: " + error.message);
    },
  });

  const deleteDevice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("network_devices")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["network_devices"] });
      toast.success("Equipamento removido com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao remover equipamento: " + error.message);
    },
  });

  return {
    devices: devicesQuery.data ?? [],
    isLoading: devicesQuery.isLoading,
    error: devicesQuery.error,
    createDevice,
    updateDevice,
    deleteDevice,
  };
}
