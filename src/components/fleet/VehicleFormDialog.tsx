import { useEffect } from "react";
import { useForm } from "react-hook-form";
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

interface VehicleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle | null;
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
}

export default function VehicleFormDialog({ open, onOpenChange, vehicle, onSubmit, isLoading }: VehicleFormDialogProps) {
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      plate: "",
      model: "",
      year: new Date().getFullYear(),
      km: 0,
      status: "available" as string,
      assigned_to: "",
      next_maintenance_date: "",
      fuel_level: 100,
      notes: "",
    },
  });

  useEffect(() => {
    if (vehicle) {
      reset({
        plate: vehicle.plate,
        model: vehicle.model,
        year: vehicle.year ?? new Date().getFullYear(),
        km: vehicle.km ?? 0,
        status: vehicle.status,
        assigned_to: vehicle.assigned_to ?? "",
        next_maintenance_date: vehicle.next_maintenance_date ?? "",
        fuel_level: vehicle.fuel_level ?? 100,
        notes: vehicle.notes ?? "",
      });
    } else {
      reset({
        plate: "", model: "", year: new Date().getFullYear(), km: 0,
        status: "available", assigned_to: "", next_maintenance_date: "",
        fuel_level: 100, notes: "",
      });
    }
  }, [vehicle, open, reset]);

  const onFormSubmit = handleSubmit(async (data) => {
    await onSubmit({
      ...data,
      year: Number(data.year),
      km: Number(data.km),
      fuel_level: Number(data.fuel_level),
      assigned_to: data.assigned_to || null,
      next_maintenance_date: data.next_maintenance_date || null,
      notes: data.notes || null,
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{vehicle ? "Editar Veículo" : "Novo Veículo"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onFormSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Modelo *</Label>
              <Input {...register("model", { required: true })} placeholder="Ex: Fiat Strada" />
            </div>
            <div className="space-y-2">
              <Label>Placa *</Label>
              <Input {...register("plate", { required: true })} placeholder="ABC-1234" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Ano</Label>
              <Input type="number" {...register("year")} />
            </div>
            <div className="space-y-2">
              <Label>KM</Label>
              <Input type="number" {...register("km")} />
            </div>
            <div className="space-y-2">
              <Label>Combustível %</Label>
              <Input type="number" min={0} max={100} {...register("fuel_level")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={watch("status")} onValueChange={(v) => setValue("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Disponível</SelectItem>
                  <SelectItem value="in_use">Em uso</SelectItem>
                  <SelectItem value="maintenance">Manutenção</SelectItem>
                  <SelectItem value="decommissioned">Desativado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Input {...register("assigned_to")} placeholder="Nome do responsável" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Próxima Manutenção</Label>
            <Input type="date" {...register("next_maintenance_date")} />
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea {...register("notes")} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
