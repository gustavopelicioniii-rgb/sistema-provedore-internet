/**
 * useEquipments - Hook para gerenciar equipamentos
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { EquipmentType, EquipmentStatus } from '@/integrations/equipment/types'

// Tipos para o banco
export interface EquipmentRecord {
  id: string
  organization_id: string
  name: string
  type: EquipmentType
  ip_address: string
  port: number
  location?: string
  model?: string
  firmware?: string
  status: EquipmentStatus
  last_check?: string
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface CreateEquipmentInput {
  name: string
  type: EquipmentType
  ip_address: string
  port?: number
  location?: string
  model?: string
  credentials?: {
    username: string
    password: string
    auth_type?: 'basic' | 'api_key' | 'snmp'
  }
}

export interface UpdateEquipmentInput {
  name?: string
  ip_address?: string
  port?: number
  location?: string
  status?: EquipmentStatus
}

// Hook para listar equipamentos
export function useEquipments(orgId: string) {
  return useQuery({
    queryKey: ['equipments', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipments')
        .select('*')
        .eq('organization_id', orgId)
        .order('name')
      
      if (error) throw error
      return data as EquipmentRecord[]
    },
    enabled: !!orgId
  })
}

// Hook para buscar equipamento específico
export function useEquipment(equipmentId: string) {
  return useQuery({
    queryKey: ['equipment', equipmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipments')
        .select('*')
        .eq('id', equipmentId)
        .single()
      
      if (error) throw error
      return data as EquipmentRecord
    },
    enabled: !!equipmentId
  })
}

// Hook para criar equipamento
export function useCreateEquipment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ orgId, input }: { orgId: string; input: CreateEquipmentInput }) => {
      // 1. Criar equipamento
      const { data: equipment, error: eqError } = await supabase
        .from('equipments')
        .insert({
          organization_id: orgId,
          name: input.name,
          type: input.type,
          ip_address: input.ip_address,
          port: input.port || 80,
          location: input.location,
          model: input.model,
          status: 'unknown'
        })
        .select()
        .single()
      
      if (eqError) throw eqError
      
      // 2. Se tiver credenciais, salvar
      if (input.credentials) {
        const { error: credError } = await supabase
          .from('equipment_credentials')
          .insert({
            equipment_id: equipment.id,
            auth_type: input.credentials.auth_type || 'basic',
            username_encrypted: input.credentials.username,
            password_encrypted: input.credentials.password
          })
        
        if (credError) throw credError
      }
      
      return equipment
    },
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: ['equipments', orgId] })
    }
  })
}

// Hook para atualizar equipamento
export function useUpdateEquipment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      equipmentId, 
      orgId, 
      input 
    }: { 
      equipmentId: string
      orgId: string
      input: UpdateEquipmentInput 
    }) => {
      const { data, error } = await supabase
        .from('equipments')
        .update(input)
        .eq('id', equipmentId)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: ['equipments', orgId] })
    }
  })
}

// Hook para deletar equipamento
export function useDeleteEquipment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ equipmentId, orgId }: { equipmentId: string; orgId: string }) => {
      const { error } = await supabase
        .from('equipments')
        .delete()
        .eq('id', equipmentId)
      
      if (error) throw error
    },
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: ['equipments', orgId] })
    }
  })
}

// Hook para testar conexão com equipamento
export function useTestEquipmentConnection() {
  return useMutation({
    mutationFn: async (equipmentId: string) => {
      const { data: equipment } = await supabase
        .from('equipments')
        .select('*')
        .eq('id', equipmentId)
        .single()
      
      if (!equipment) throw new Error('Equipamento não encontrado')
      
      // TODO: Chamar API para testar conexão
      // Por enquanto simula
      const response = await fetch('/api/equipment/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(equipment)
      })
      
      return response.json()
    }
  })
}

// Estatísticas de equipamentos
export function useEquipmentStats(orgId: string) {
  const { data: equipments } = useEquipments(orgId)
  
  if (!equipments) return null
  
  return {
    total: equipments.length,
    online: equipments.filter(e => e.status === 'online').length,
    offline: equipments.filter(e => e.status === 'offline').length,
    maintenance: equipments.filter(e => e.status === 'maintenance').length,
    byType: equipments.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }
}
