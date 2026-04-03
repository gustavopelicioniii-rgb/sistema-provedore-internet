import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Vehicle = Tables<"vehicles">;
export type VehicleInsert = TablesInsert<"vehicles">;
export type VehicleUpdate = TablesUpdate<"vehicles">;
export type FuelLog = Tables<"fuel_logs">;
export type FuelLogInsert = TablesInsert<"fuel_logs">;

export function useFleet() {
  const queryClient = useQueryClient();

  const vehiclesQuery = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .order("model");
      if (error) throw error;
      return data as Vehicle[];
    },
  });

  const fuelLogsQuery = useQuery({
    queryKey: ["fuel_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fuel_logs")
        .select("*, vehicles(plate, model)")
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createVehicle = useMutation({
    mutationFn: async (vehicle: VehicleInsert) => {
      const { data, error } = await supabase.from("vehicles").insert(vehicle).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Veículo cadastrado com sucesso");
    },
    onError: (e) => toast.error("Erro ao cadastrar veículo: " + e.message),
  });

  const updateVehicle = useMutation({
    mutationFn: async ({ id, ...updates }: VehicleUpdate & { id: string }) => {
      const { data, error } = await supabase.from("vehicles").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Veículo atualizado com sucesso");
    },
    onError: (e) => toast.error("Erro ao atualizar veículo: " + e.message),
  });

  const deleteVehicle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Veículo removido com sucesso");
    },
    onError: (e) => toast.error("Erro ao remover veículo: " + e.message),
  });

  const createFuelLog = useMutation({
    mutationFn: async (log: FuelLogInsert) => {
      const { data, error } = await supabase.from("fuel_logs").insert(log).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fuel_logs"] });
      toast.success("Abastecimento registrado com sucesso");
    },
    onError: (e) => toast.error("Erro ao registrar abastecimento: " + e.message),
  });

  return {
    vehicles: vehiclesQuery.data ?? [],
    fuelLogs: fuelLogsQuery.data ?? [],
    isLoading: vehiclesQuery.isLoading || fuelLogsQuery.isLoading,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    createFuelLog,
  };
}
