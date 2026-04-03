import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type ItemType = "onu" | "router" | "cable" | "splitter" | "connector" | "other";
export type MovementType = "in" | "out" | "loan" | "return";

export interface InventoryItemFormData {
  name: string;
  item_type?: ItemType;
  quantity?: number;
  min_quantity?: number;
  serial_number?: string;
  notes?: string;
}

export interface InventoryItemRecord {
  id: string;
  organization_id: string;
  name: string;
  item_type: ItemType;
  quantity: number;
  min_quantity: number;
  serial_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MovementFormData {
  item_id: string;
  movement_type: MovementType;
  quantity: number;
  customer_id?: string;
  notes?: string;
}

export interface MovementRecord {
  id: string;
  organization_id: string;
  item_id: string;
  customer_id: string | null;
  movement_type: MovementType;
  quantity: number;
  notes: string | null;
  created_at: string;
  inventory_items?: { name: string } | null;
  customers?: { name: string } | null;
}

async function getOrgId() {
  const { data, error } = await supabase.from("profiles").select("organization_id").maybeSingle();
  if (error) throw error;
  if (!data?.organization_id) throw new Error("Organização não encontrada.");
  return data.organization_id;
}

export function useInventoryItems(search?: string) {
  return useQuery({
    queryKey: ["inventory-items", search],
    queryFn: async () => {
      let query = supabase.from("inventory_items" as any).select("*").order("name");
      if (search?.trim()) {
        query = query.or(`name.ilike.%${search.trim()}%,serial_number.ilike.%${search.trim()}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as InventoryItemRecord[];
    },
  });
}

export function useCreateInventoryItem() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (form: InventoryItemFormData) => {
      const orgId = await getOrgId();
      const { data, error } = await supabase.from("inventory_items" as any).insert([{
        organization_id: orgId,
        name: form.name,
        item_type: form.item_type || "other",
        quantity: form.quantity ?? 0,
        min_quantity: form.min_quantity ?? 0,
        serial_number: form.serial_number || null,
        notes: form.notes || null,
      }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory-items"] }); toast({ title: "Item criado!" }); },
    onError: (e: Error) => { toast({ title: "Erro ao criar item", description: e.message, variant: "destructive" }); },
  });
}

export function useUpdateInventoryItem() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, data: form }: { id: string; data: Partial<InventoryItemFormData> }) => {
      const update: Record<string, unknown> = {};
      if (form.name !== undefined) update.name = form.name;
      if (form.item_type !== undefined) update.item_type = form.item_type;
      if (form.quantity !== undefined) update.quantity = form.quantity;
      if (form.min_quantity !== undefined) update.min_quantity = form.min_quantity;
      if (form.serial_number !== undefined) update.serial_number = form.serial_number || null;
      if (form.notes !== undefined) update.notes = form.notes || null;
      const { data, error } = await supabase.from("inventory_items" as any).update(update).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory-items"] }); toast({ title: "Item atualizado!" }); },
    onError: (e: Error) => { toast({ title: "Erro ao atualizar item", description: e.message, variant: "destructive" }); },
  });
}

export function useDeleteInventoryItem() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("inventory_items" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory-items"] }); toast({ title: "Item removido!" }); },
    onError: (e: Error) => { toast({ title: "Erro ao remover item", description: e.message, variant: "destructive" }); },
  });
}

export function useInventoryMovements(itemId?: string) {
  return useQuery({
    queryKey: ["inventory-movements", itemId],
    queryFn: async () => {
      let query = supabase
        .from("inventory_movements" as any)
        .select("*, inventory_items:item_id(name), customers:customer_id(name)")
        .order("created_at", { ascending: false });
      if (itemId) query = query.eq("item_id", itemId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as MovementRecord[];
    },
    enabled: true,
  });
}

export function useCreateMovement() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (form: MovementFormData) => {
      const orgId = await getOrgId();
      const { data, error } = await supabase.from("inventory_movements" as any).insert([{
        organization_id: orgId,
        item_id: form.item_id,
        movement_type: form.movement_type,
        quantity: form.quantity,
        customer_id: form.customer_id || null,
        notes: form.notes || null,
      }]).select().single();
      if (error) throw error;

      // Update item quantity
      const delta = (form.movement_type === "in" || form.movement_type === "return") ? form.quantity : -form.quantity;
      const { data: item } = await supabase.from("inventory_items" as any).select("quantity").eq("id", form.item_id).single();
      if (item) {
        await supabase.from("inventory_items" as any).update({ quantity: (item as any).quantity + delta }).eq("id", form.item_id);
      }

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory-items"] });
      qc.invalidateQueries({ queryKey: ["inventory-movements"] });
      toast({ title: "Movimentação registrada!" });
    },
    onError: (e: Error) => { toast({ title: "Erro ao registrar movimentação", description: e.message, variant: "destructive" }); },
  });
}
