import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Constants } from "@/integrations/supabase/types";
import type { NetworkDevice, NetworkDeviceInsert } from "@/hooks/useNetworkDevices";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device?: NetworkDevice | null;
  onSubmit: (data: Omit<NetworkDeviceInsert, "organization_id">) => void;
  isLoading?: boolean;
}

const typeLabels: Record<string, string> = {
  olt: "OLT",
  onu: "ONU",
  router: "Roteador",
  switch: "Switch",
  server: "Servidor",
  access_point: "Access Point",
  other: "Outro",
};

const manufacturerLabels: Record<string, string> = {
  mikrotik: "MikroTik",
  huawei: "Huawei",
  intelbras: "Intelbras",
  fiberhome: "FiberHome",
  zte: "ZTE",
  other: "Outro",
};

const statusLabels: Record<string, string> = {
  online: "Online",
  offline: "Offline",
  warning: "Alerta",
  maintenance: "Manutenção",
};

export default function NetworkDeviceFormDialog({ open, onOpenChange, device, onSubmit, isLoading }: Props) {
  const [form, setForm] = useState({
    name: "",
    device_type: "router" as string,
    manufacturer: "mikrotik" as string,
    status: "offline" as string,
    ip_address: "",
    mac_address: "",
    model: "",
    firmware_version: "",
    serial_number: "",
    location: "",
    api_username: "",
    api_password: "",
    api_port: 8728,
    snmp_community: "",
    notes: "",
  });

  useEffect(() => {
    if (device) {
      setForm({
        name: device.name ?? "",
        device_type: device.device_type ?? "router",
        manufacturer: device.manufacturer ?? "mikrotik",
        status: device.status ?? "offline",
        ip_address: device.ip_address ?? "",
        mac_address: device.mac_address ?? "",
        model: device.model ?? "",
        firmware_version: device.firmware_version ?? "",
        serial_number: device.serial_number ?? "",
        location: device.location ?? "",
        api_username: device.api_username ?? "",
        api_password: device.api_password ?? "",
        api_port: device.api_port ?? 8728,
        snmp_community: device.snmp_community ?? "",
        notes: device.notes ?? "",
      });
    } else {
      setForm({
        name: "", device_type: "router", manufacturer: "mikrotik", status: "offline",
        ip_address: "", mac_address: "", model: "", firmware_version: "", serial_number: "",
        location: "", api_username: "", api_password: "", api_port: 8728, snmp_community: "", notes: "",
      });
    }
  }, [device, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: form.name,
      device_type: form.device_type as any,
      manufacturer: form.manufacturer as any,
      status: form.status as any,
      ip_address: form.ip_address || null,
      mac_address: form.mac_address || null,
      model: form.model || null,
      firmware_version: form.firmware_version || null,
      serial_number: form.serial_number || null,
      location: form.location || null,
      api_username: form.api_username || null,
      api_password: form.api_password || null,
      api_port: form.api_port || null,
      snmp_community: form.snmp_community || null,
      notes: form.notes || null,
    });
  };

  const set = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{device ? "Editar Equipamento" : "Novo Equipamento"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="OLT-01 Centro" />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.device_type} onValueChange={(v) => set("device_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Constants.public.Enums.device_type.map((t) => (
                    <SelectItem key={t} value={t}>{typeLabels[t] ?? t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fabricante</Label>
              <Select value={form.manufacturer} onValueChange={(v) => set("manufacturer", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Constants.public.Enums.device_manufacturer.map((m) => (
                    <SelectItem key={m} value={m}>{manufacturerLabels[m] ?? m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Constants.public.Enums.device_status.map((s) => (
                    <SelectItem key={s} value={s}>{statusLabels[s] ?? s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Endereço IP</Label>
              <Input value={form.ip_address} onChange={(e) => set("ip_address", e.target.value)} placeholder="10.0.0.1" />
            </div>
            <div className="space-y-2">
              <Label>MAC Address</Label>
              <Input value={form.mac_address} onChange={(e) => set("mac_address", e.target.value)} placeholder="AA:BB:CC:DD:EE:FF" />
            </div>
            <div className="space-y-2">
              <Label>Modelo</Label>
              <Input value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="CCR1036-8G-2S+" />
            </div>
            <div className="space-y-2">
              <Label>Firmware</Label>
              <Input value={form.firmware_version} onChange={(e) => set("firmware_version", e.target.value)} placeholder="7.14" />
            </div>
            <div className="space-y-2">
              <Label>Número de Série</Label>
              <Input value={form.serial_number} onChange={(e) => set("serial_number", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Localização</Label>
              <Input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="POP Centro" />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3">Credenciais de Acesso</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Usuário API</Label>
                <Input value={form.api_username} onChange={(e) => set("api_username", e.target.value)} placeholder="admin" />
              </div>
              <div className="space-y-2">
                <Label>Senha API</Label>
                <Input type="password" value={form.api_password} onChange={(e) => set("api_password", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Porta API</Label>
                <Input type="number" value={form.api_port} onChange={(e) => set("api_port", parseInt(e.target.value) || 8728)} />
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <Label>Comunidade SNMP</Label>
              <Input value={form.snmp_community} onChange={(e) => set("snmp_community", e.target.value)} placeholder="public" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>{device ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
