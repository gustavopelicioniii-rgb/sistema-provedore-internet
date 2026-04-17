/**
 * Intelbras Driver - Integração com equipamentos Intelbras
 * Suporta: OLTs GPON, Switches Web Managed, ONUs
 */

import type { EquipmentDriver, EquipmentCredentials, EquipmentActionResult, EquipmentStatus } from './types'

export class IntelbrasDriver implements EquipmentDriver {
  type = 'intelbras' as const
  name = 'Intelbras'
  
  private host: string = ''
  private port: number = 80
  private credentials: EquipmentCredentials | null = null

  async connect(credentials: EquipmentCredentials): Promise<boolean> {
    this.credentials = credentials
    this.host = credentials.host
    this.port = credentials.port || 80
    
    try {
      const response = await fetch(`http://${this.host}:${this.port}/status`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      })
      return response.ok || response.status === 401
    } catch {
      return false
    }
  }

  async disconnect(): Promise<void> {
    this.credentials = null
  }

  async getStatus(): Promise<EquipmentStatus> {
    try {
      const response = await fetch(`http://${this.host}:${this.port}/api/system/status`)
      if (response.ok) return 'online'
      return 'unknown'
    } catch {
      return 'offline'
    }
  }

  async getInfo(): Promise<Record<string, unknown>> {
    return {
      manufacturer: 'Intelbras',
      model: this.credentials?.model || 'Desconhecido',
      ip: this.host
    }
  }

  // OLT GPON - Listar ONUs
  async listOnu(ponPort: string = '0/0'): Promise<Array<{serial: string; status: string; signal: number}>> {
    try {
      const response = await fetch(`http://${this.host}:${this.port}/api/gpon/onu?port=${ponPort}`, {
        headers: this.getAuthHeader()
      })
      if (!response.ok) return []
      
      const data = await response.json() as { onu_list?: Array<{serial: string; state: string; rx_power: number}> }
      return (data.onu_list || []).map(onu => ({
        serial: onu.serial,
        status: onu.state === '1' ? 'online' : 'offline',
        signal: onu.rx_power || -20
      }))
    } catch {
      return []
    }
  }

  // Ativar ONU
  async activateOnu(serial: string, vlan: number): Promise<EquipmentActionResult> {
    try {
      const response = await fetch(`http://${this.host}:${this.port}/api/gpon/onu`, {
        method: 'POST',
        headers: this.getAuthHeader(),
        body: JSON.stringify({
          command: 'activate',
          serial: serial,
          vlan: vlan
        })
      })
      
      if (response.ok) {
        return { success: true, message: `ONU ${serial} ativada com VLAN ${vlan}` }
      }
      return { success: false, error: `Erro ${response.status}` }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  // Desativar ONU
  async deactivateOnu(serial: string): Promise<EquipmentActionResult> {
    try {
      const response = await fetch(`http://${this.host}:${this.port}/api/gpon/onu`, {
        method: 'POST',
        headers: this.getAuthHeader(),
        body: JSON.stringify({
          command: 'deactivate',
          serial: serial
        })
      })
      
      if (response.ok) {
        return { success: true, message: `ONU ${serial} desativada` }
      }
      return { success: false, error: `Erro ${response.status}` }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  // Buscar sinal da ONU
  async getOnuSignal(serial: string): Promise<number> {
    try {
      const onus = await this.listOnu()
      const onu = onus.find(o => o.serial === serial)
      return onu?.signal || -30
    } catch {
      return -30
    }
  }

  // Informações do OLT
  async getOltInfo(): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(`http://${this.host}:${this.port}/api/gpon/olt/info`, {
        headers: this.getAuthHeader()
      })
      if (response.ok) {
        return await response.json()
      }
      return {}
    } catch {
      return {}
    }
  }

  // Portas PON
  async getPonPorts(): Promise<Array<{port: string; onu_count: number; status: string}>> {
    try {
      const response = await fetch(`http://${this.host}:${this.port}/api/gpon/ports`, {
        headers: this.getAuthHeader()
      })
      if (response.ok) {
        const data = await response.json() as { ports?: Array<{id: string; onu_count: number; status: string}> }
        return data.ports || []
      }
      return []
    } catch {
      return []
    }
  }

  private getAuthHeader(): HeadersInit {
    if (!this.credentials?.username) return {}
    const encoded = btoa(`${this.credentials.username}:${this.credentials.password}`)
    return {
      'Authorization': `Basic ${encoded}`,
      'Content-Type': 'application/json'
    }
  }
}

export const intelbrasDriver = new IntelbrasDriver()
