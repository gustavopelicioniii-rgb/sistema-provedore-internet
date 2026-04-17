/**
 * Equipment Manager - Gerenciador unificado de equipamentos
 * Routing para drivers específicos baseado no tipo
 */

import type { Equipment, EquipmentCredentials, EquipmentStatus, EquipmentDriver } from './types'
import { MikrotikDriver } from './mikrotik'
import { IntelbrasDriver } from './intelbras'
import { HuaweiDriver } from './huawei'

// Driver instances
const drivers: Record<string, EquipmentDriver> = {
  mikrotik: new MikrotikDriver(),
  intelbras: new IntelbrasDriver(),
  huawei_olt: new HuaweiDriver(),
  huawei_ont: new HuaweiDriver(),
}

// Registry de drivers
export const equipmentDrivers = {
  register(type: string, driver: EquipmentDriver) {
    drivers[type] = driver
  },
  
  get(type: string): EquipmentDriver | null {
    return drivers[type] || null
  },
  
  list(): Array<{type: string; name: string}> {
    return Object.values(drivers).map(d => ({ type: d.type, name: d.name }))
  }
}

// Manager de equipamentos
export class EquipmentManager {
  private activeConnections: Map<string, {driver: EquipmentDriver; credentials: EquipmentCredentials}> = new Map()

  // Conectar a um equipamento
  async connect(equipment: Equipment): Promise<boolean> {
    const driver = drivers[equipment.type]
    if (!driver) {
      throw new Error(`Driver não encontrado para tipo: ${equipment.type}`)
    }
    
    const connected = await driver.connect(equipment.credentials)
    if (connected) {
      this.activeConnections.set(equipment.id, {
        driver,
        credentials: equipment.credentials
      })
    }
    return connected
  }

  // Desconectar
  async disconnect(equipmentId: string): Promise<void> {
    const conn = this.activeConnections.get(equipmentId)
    if (conn) {
      await conn.driver.disconnect()
      this.activeConnections.delete(equipmentId)
    }
  }

  // Obter driver conectado
  private getConnected(equipmentId: string): EquipmentDriver | null {
    return this.activeConnections.get(equipmentId)?.driver || null
  }

  // Status do equipamento
  async getStatus(equipmentId: string): Promise<EquipmentStatus> {
    const conn = this.activeConnections.get(equipmentId)
    if (!conn) return 'unknown'
    return conn.driver.getStatus()
  }

  // Informações completas
  async getInfo(equipmentId: string): Promise<Record<string, unknown>> {
    const conn = this.activeConnections.get(equipmentId)
    if (!conn) return {}
    return conn.driver.getInfo()
  }

  // Recursos (CPU, memória, etc)
  async getResources(equipmentId: string): Promise<{uptime: string; cpu: number; memory: number; temperature?: number} | null> {
    const conn = this.activeConnections.get(equipmentId)
    if (!conn?.driver.getResources) return null
    return conn.driver.getResources()
  }

  // Interfaces de rede
  async getInterfaces(equipmentId: string): Promise<Array<{name: string; status: string; speed: number; traffic_in: number; traffic_out: number}>> {
    const conn = this.activeConnections.get(equipmentId)
    if (!conn?.driver.getInterfaces) return []
    return conn.driver.getInterfaces()
  }

  // === PPPoE Operations (Mikrotik, etc) ===
  
  async createPppoeUser(equipmentId: string, user: string, pass: string, profile: string) {
    const conn = this.activeConnections.get(equipmentId)
    if (!conn?.driver.createPppoeUser) {
      return { success: false, error: 'Equipamento não suporta PPPoE' }
    }
    return conn.driver.createPppoeUser(user, pass, profile)
  }

  async deletePppoeUser(equipmentId: string, user: string) {
    const conn = this.activeConnections.get(equipmentId)
    if (!conn?.driver.deletePppoeUser) {
      return { success: false, error: 'Equipamento não suporta PPPoE' }
    }
    return conn.driver.deletePppoeUser(user)
  }

  async enablePppoeUser(equipmentId: string, user: string) {
    const conn = this.activeConnections.get(equipmentId)
    if (!conn?.driver.enablePppoeUser) {
      return { success: false, error: 'Equipamento não suporta PPPoE' }
    }
    return conn.driver.enablePppoeUser(user)
  }

  async disablePppoeUser(equipmentId: string, user: string) {
    const conn = this.activeConnections.get(equipmentId)
    if (!conn?.driver.disablePppoeUser) {
      return { success: false, error: 'Equipamento não suporta PPPoE' }
    }
    return conn.driver.disablePppoeUser(user)
  }

  async listPppoeUsers(equipmentId: string) {
    const conn = this.activeConnections.get(equipmentId)
    if (!conn?.driver.listPppoeUsers) {
      return []
    }
    return conn.driver.listPppoeUsers()
  }

  // === OLT/ONT Operations (Fiber) ===

  async listOnu(equipmentId: string, ponPort: string = '0/0') {
    const conn = this.activeConnections.get(equipmentId)
    if (!conn?.driver.listOnu) {
      return []
    }
    return conn.driver.listOnu(ponPort)
  }

  async activateOnu(equipmentId: string, serial: string, vlan: number) {
    const conn = this.activeConnections.get(equipmentId)
    if (!conn?.driver.activateOnu) {
      return { success: false, error: 'Equipamento não suporta gerenciamento de ONU' }
    }
    return conn.driver.activateOnu(serial, vlan)
  }

  async deactivateOnu(equipmentId: string, serial: string) {
    const conn = this.activeConnections.get(equipmentId)
    if (!conn?.driver.deactivateOnu) {
      return { success: false, error: 'Equipamento não suporta gerenciamento de ONU' }
    }
    return conn.driver.deactivateOnu(serial)
  }

  async getOnuSignal(equipmentId: string, serial: string): Promise<number> {
    const conn = this.activeConnections.get(equipmentId)
    if (!conn?.driver.getOnuSignal) {
      return -30
    }
    return conn.driver.getOnuSignal(serial)
  }
}

export const equipmentManager = new EquipmentManager()
