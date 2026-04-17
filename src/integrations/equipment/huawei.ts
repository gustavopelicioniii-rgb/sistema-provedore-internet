/**
 * Huawei Driver - Integração com equipamentos Huawei
 * Suporta: OLT MA5600T/MA5800, ONUs HG8245H, HG8546M, etc.
 */

import type { EquipmentDriver, EquipmentCredentials, EquipmentActionResult, EquipmentStatus } from './types'

export class HuaweiDriver implements EquipmentDriver {
  type = 'huawei_olt' as const
  name = 'Huawei OLT/ONT'
  
  private host: string = ''
  private port: number = 8080
  private credentials: EquipmentCredentials | null = null

  async connect(credentials: EquipmentCredentials): Promise<boolean> {
    this.credentials = credentials
    this.host = credentials.host
    this.port = credentials.port || 8080
    return true
  }

  async disconnect(): Promise<void> {
    this.credentials = null
  }

  async getStatus(): Promise<EquipmentStatus> {
    try {
      const response = await fetch(`http://${this.host}:${this.port}/api/system/status`)
      return response.ok ? 'online' : 'unknown'
    } catch {
      return 'offline'
    }
  }

  async getInfo(): Promise<Record<string, unknown>> {
    return {
      manufacturer: 'Huawei',
      model: this.credentials?.model || 'OLT Huawei',
      ip: this.host
    }
  }

  // Listar ONUs na porta PON
  async listOnu(ponPort: string = '0/1/0'): Promise<Array<{serial: string; status: string; signal: number}>> {
    try {
      const response = await fetch(`http://${this.host}:${this.port}/api/gpon/onu?interface=${ponPort}`, {
        headers: this.getAuthHeader()
      })
      
      if (!response.ok) return []
      
      const data = await response.json() as { onu_list?: Array<{serial_number: string; operational_state: string; rx_power: number}> }
      
      return (data.onu_list || []).map(onu => ({
        serial: onu.serial_number,
        status: onu.operational_state === '1' ? 'online' : 'offline',
        signal: this.convertPower(onu.rx_power)
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
          serial_number: serial,
          vlan_id: vlan,
          action: 'activate'
        })
      })
      
      if (response.ok) {
        return { success: true, message: `ONU ${serial} ativada (VLAN ${vlan})` }
      }
      return { success: false, error: `Erro: ${response.status}` }
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
          serial_number: serial,
          action: 'deactivate'
        })
      })
      
      if (response.ok) {
        return { success: true, message: `ONU ${serial} desativada` }
      }
      return { success: false, error: `Erro: ${response.status}` }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  // Sinal da ONU em dBm
  async getOnuSignal(serial: string): Promise<number> {
    try {
      const onus = await this.listOnu()
      const onu = onus.find(o => o.serial === serial)
      return onu?.signal || -30
    } catch {
      return -30
    }
  }

  // Perfis de serviço (para VLANs)
  async listServiceProfiles(): Promise<Array<{id: string; name: string; vlan: number}>> {
    try {
      const response = await fetch(`http://${this.host}:${this.port}/api/gpon/service-profiles`, {
        headers: this.getAuthHeader()
      })
      
      if (!response.ok) return []
      
      const data = await response.json() as { profiles?: Array<{id: string; name: string; vlan_id: number}> }
      return (data.profiles || []).map(p => ({
        id: p.id,
        name: p.name,
        vlan: p.vlan_id
      }))
    } catch {
      return []
    }
  }

  // Converter potência (alguns devices usam valor diferente)
  private convertPower(value: number): number {
    if (value > 40) {
      return (value - 256) / 4
    }
    return value
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

export const huaweiDriver = new HuaweiDriver()
