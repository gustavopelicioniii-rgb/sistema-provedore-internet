/**
 * Equipamentos Page - Gerenciamento de equipamentos de rede
 */

import { useState } from 'react'
import { useOrganization } from '@/hooks/useOrganization'
import { useEquipments, useCreateEquipment, useDeleteEquipment, useUpdateEquipment, useEquipmentStats } from '@/hooks/useEquipments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Server, Wifi, WifiOff, Settings, Trash2, RefreshCw, Loader2 } from 'lucide-react'
import type { EquipmentType } from '@/integrations/equipment/types'

const equipmentTypes: Array<{ value: EquipmentType; label: string }> = [
  { value: 'mikrotik', label: 'Mikrotik RouterOS' },
  { value: 'intelbras', label: 'Intelbras OLT/Switch' },
  { value: 'huawei_olt', label: 'Huawei OLT' },
  { value: 'huawei_ont', label: 'Huawei ONT' },
  { value: 'nokia_olt', label: 'Nokia OLT' },
  { value: 'unifi', label: 'Ubiquiti/Unifi' },
  { value: 'juniper', label: 'Juniper' },
  { value: 'datacom', label: 'Datacom' },
  { value: 'raisecom', label: 'Raisecom' },
  { value: 'generic_snmp', label: 'Generic SNMP' },
]

export default function EquipamentosPage() {
  const { organization } = useOrganization()
  const orgId = organization?.id || ''
  
  const { data: equipments, isLoading } = useEquipments(orgId)
  const { data: stats } = useEquipmentStats(orgId)
  const createEquipment = useCreateEquipment()
  const updateEquipment = useUpdateEquipment()
  const deleteEquipment = useDeleteEquipment()
  
  const [modalOpen, setModalOpen] = useState(false)
  const [newEquipment, setNewEquipment] = useState<Partial<{
    name: string
    type: EquipmentType
    ip_address: string
    port: number
    location: string
    username: string
    password: string
  }>>({})

  const handleCreate = async () => {
    if (!orgId || !newEquipment.name || !newEquipment.type || !newEquipment.ip_address) return
    
    await createEquipment.mutateAsync({
      orgId,
      input: {
        name: newEquipment.name,
        type: newEquipment.type,
        ip_address: newEquipment.ip_address,
        port: newEquipment.port || 80,
        location: newEquipment.location,
        credentials: newEquipment.username ? {
          username: newEquipment.username,
          password: newEquipment.password || ''
        } : undefined
      }
    })
    
    setModalOpen(false)
    setNewEquipment({})
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online': return <Badge className="bg-green-100 text-green-800">Online</Badge>
      case 'offline': return <Badge className="bg-red-100 text-red-800">Offline</Badge>
      case 'maintenance': return <Badge className="bg-yellow-100 text-yellow-800">Manutenção</Badge>
      default: return <Badge variant="secondary">Desconhecido</Badge>
    }
  }

  const getTypeLabel = (type: EquipmentType) => {
    return equipmentTypes.find(t => t.value === type)?.label || type
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-7 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Equipamentos</h1>
          <p className="text-muted-foreground text-sm">
            Gerencie roteadores, OLTs, switches e outros equipamentos de rede
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 size-4" />
          Novo Equipamento
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                  <Server className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-green-100">
                  <Wifi className="size-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.online}</p>
                  <p className="text-xs text-muted-foreground">Online</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-red-100">
                  <WifiOff className="size-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{stats.offline}</p>
                  <p className="text-xs text-muted-foreground">Offline</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-yellow-100">
                  <Settings className="size-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{stats.maintenance}</p>
                  <p className="text-xs text-muted-foreground">Manutenção</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Equipment Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {equipments?.map((eq) => (
          <Card key={eq.id} className={eq.status === 'offline' ? 'opacity-70' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`flex size-10 items-center justify-center rounded-lg ${
                    eq.status === 'online' ? 'bg-green-100' :
                    eq.status === 'offline' ? 'bg-red-100' : 'bg-yellow-100'
                  }`}>
                    <Server className={`size-5 ${
                      eq.status === 'online' ? 'text-green-600' :
                      eq.status === 'offline' ? 'text-red-600' : 'text-yellow-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{eq.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono">{eq.ip_address}</p>
                  </div>
                </div>
                {getStatusBadge(eq.status)}
              </div>
              
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo</span>
                  <span className="font-medium">{getTypeLabel(eq.type)}</span>
                </div>
                {eq.model && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Modelo</span>
                    <span className="font-medium">{eq.model}</span>
                  </div>
                )}
                {eq.location && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Local</span>
                    <span className="font-medium">{eq.location}</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Settings className="mr-1 size-4" />
                  Configurar
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => deleteEquipment.mutate({ equipmentId: eq.id, orgId })}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {equipments?.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Server className="mx-auto mb-4 size-12 text-muted-foreground/50" />
            <p className="font-medium">Nenhum equipamento cadastrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Adicione seus roteadores, OLTs e switches para gerenciar
            </p>
            <Button className="mt-4" onClick={() => setModalOpen(true)}>
              <Plus className="mr-2 size-4" />
              Adicionar Equipamento
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal de criação */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Equipamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input 
                placeholder="OLT Central" 
                value={newEquipment.name || ''}
                onChange={(e) => setNewEquipment({...newEquipment, name: e.target.value})}
              />
            </div>
            
            <div>
              <Label>Tipo</Label>
              <Select 
                value={newEquipment.type || ''} 
                onValueChange={(v) => setNewEquipment({...newEquipment, type: v as EquipmentType})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {equipmentTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>IP</Label>
                <Input 
                  placeholder="192.168.1.1" 
                  value={newEquipment.ip_address || ''}
                  onChange={(e) => setNewEquipment({...newEquipment, ip_address: e.target.value})}
                />
              </div>
              <div>
                <Label>Porta</Label>
                <Input 
                  type="number"
                  placeholder="80"
                  value={newEquipment.port || ''}
                  onChange={(e) => setNewEquipment({...newEquipment, port: parseInt(e.target.value)})}
                />
              </div>
            </div>
            
            <div>
              <Label>Localização</Label>
              <Input 
                placeholder="Data Center Principal" 
                value={newEquipment.location || ''}
                onChange={(e) => setNewEquipment({...newEquipment, location: e.target.value})}
              />
            </div>
            
            <div className="border-t pt-4 mt-4">
              <Label className="text-muted-foreground">Credenciais (opcional)</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Label className="text-xs">Usuário</Label>
                  <Input 
                    placeholder="admin" 
                    value={newEquipment.username || ''}
                    onChange={(e) => setNewEquipment({...newEquipment, username: e.target.value})}
                  />
                </div>
                <div>
                  <Label className="text-xs">Senha</Label>
                  <Input 
                    type="password"
                    placeholder="••••••••" 
                    value={newEquipment.password || ''}
                    onChange={(e) => setNewEquipment({...newEquipment, password: e.target.value})}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={createEquipment.isPending}>
                {createEquipment.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Criar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
