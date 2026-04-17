/**
 * Equipments API - Tipos e integrações com equipamentos de rede
 * Suporta: Mikrotik, Intelbras, Huawei, Nokia, Unifi, Juniper, etc.
 */

// Tipos de equipamento
export type EquipmentType = 
  | 'mikrotik' 
  | 'intelbras' 
  | 'huawei_olt' 
  | 'huawei_ont'
  | 'nokia_olt'
  | 'unifi'
  | 'juniper'
  | 'datacom'
  | 'raisecom'
  | 'generic_snmp'
  | 'generic_api'

// Status do equipamento
export type EquipmentStatus = 'online' | 'offline' | 'maintenance' | 'unknown'

// Credenciais base
export interface EquipmentCredentials {
  type: EquipmentType
  host: string
  port: number
  username?: string
  password?: string
  api_key?: string
  snmp_community?: string
  extra?: Record<string, string>
}

// Equipamento
export interface Equipment {
  id: string
  organization_id: string
  name: string
  type: EquipmentType
  ip_address: string
  port: number
  credentials: EquipmentCredentials
  location?: string
  model?: string
  firmware?: string
  status: EquipmentStatus
  last_check?: string
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}

// Resultado de ação
export interface EquipmentActionResult {
  success: boolean
  message?: string
  data?: unknown
  error?: string
}

// Interface comum para equipamentos
export interface EquipmentDriver {
  type: EquipmentType
  name: string
  
  // Conexão
  connect(credentials: EquipmentCredentials): Promise<boolean>
  disconnect(): Promise<void>
  
  // Status
  getStatus(): Promise<EquipmentStatus>
  getInfo(): Promise<Record<string, unknown>>
  
  // PPPoE
  createPppoeUser?(user: string, pass: string, profile: string): Promise<EquipmentActionResult>
  deletePppoeUser?(user: string): Promise<EquipmentActionResult>
  enablePppoeUser?(user: string): Promise<EquipmentActionResult>
  disablePppoeUser?(user: string): Promise<EquipmentActionResult>
  listPppoeUsers?(): Promise<Array<{name: string, profile: string, active: boolean}>>
  
  // Profiles
  listProfiles?(): Promise<Array<{name: string, rate_limit: string}>>
  createProfile?(name: string, rate_limit: string): Promise<EquipmentActionResult>
  
  // OLT/ONT (para fibra)
  listOnu?(ponPort: string): Promise<Array<{serial: string, status: string, signal: number}>>
  activateOnu?(serial: string, vlan: number): Promise<EquipmentActionResult>
  deactivateOnu?(serial: string): Promise<EquipmentActionResult>
  getOnuSignal?(serial: string): Promise<number>
  
  // Monitoramento
  getResources?(): Promise<{
    uptime: string
    cpu: number
    memory: number
    temperature?: number
  }>
  getInterfaces?(): Promise<Array<{
    name: string
    status: string
    speed: number
    traffic_in: number
    traffic_out: number
  }>>
}

// API de provisionamento unificada
export interface ProvisioningRequest {
  equipment_id: string
  client_id: string
  client_cpf: string
  plan: {
    name: string
    speed_down: number
    speed_up: number
  }
  connection_type: 'pppoe' | 'dhcp' | 'hotspot' | 'ftth'
}

export interface ProvisioningResult {
  success: boolean
  username?: string
  password?: string
  vlan?: number
  ont_serial?: string
  message?: string
  error?: string
}
