import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { FuelLogInsert } from "@/hooks/useFleet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Vehicle } from "@/hooks/useFleet";

interface FuelLogFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicles: Vehicle[];
  onSubmit: (data: Omit<FuelLogInsert, "organization_id">) => Promise<void>;
  isLoading: boolean;
}

export default function FuelLogFormDialog({ open, onOpenChange, vehicles, onSubmit, isLoading }: FuelLogFormDialogProps) {
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      vehicle_id: "",
      date: new Date().toISOString().slice(0, 10),
      liters: 0,
      cost: 0,
      fuel_type: "gasoline",
      km: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        vehicle_id: vehicles[0]?.id ?? "",
        date: new Date().toISOString().slice(0, 10),
        liters: 0, cost: 0, fuel_type: "gasoline", km: "", notes: "",
      });
    }
  }, [open, reset, vehicles]);

  const onFormSubmit = handleSubmit(async (data) => {
    if (!data.vehicle_id) return;
    await onSubmit({
      vehicle_id: data.vehicle_id,
      date: data.date,
      liters: Number(data.liters),
      cost: Number(data.cost),
      fuel_type: data.fuel_type as FuelLogInsert["fuel_type"],
      km: data.km ? Number(data.km) : null,
      notes: data.notes || null,
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Abastecimento</DialogTitle>
        </DialogHeader>
        <form onSubmit={onFormSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Veículo *</Label>
            <Select value={watch("vehicle_id")} onValueChange={(v) => setValue("vehicle_id", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione um veículo" /></SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.model} — {v.plate}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data *</Label>
              <Input type="date" {...register("date", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Combustível</Label>
              <Select value={watch("fuel_type")} onValueChange={(v) => setValue("fuel_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gasoline">Gasolina</SelectItem>
                  <SelectItem value="ethanol">Etanol</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="flex">Flex</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Litros *</Label>
              <Input type="number" step="0.01" {...register("liters", { required: true, min: 0.01 })} />
            </div>
            <div className="space-y-2">
              <Label>Valor (R$) *</Label>
              <Input type="number" step="0.01" {...register("cost", { required: true, min: 0.01 })} />
            </div>
            <div className="space-y-2">
              <Label>KM Atual</Label>
              <Input type="number" {...register("km")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea {...register("notes")} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? "Salvando..." : "Registrar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
