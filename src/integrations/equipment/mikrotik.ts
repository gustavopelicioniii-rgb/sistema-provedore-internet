/**
 * Mikrotik Driver - Integração com RouterOS via API REST
 * Suporta: CCR, hAP, RB750, CRS, etc.
 */

import type { EquipmentDriver, EquipmentCredentials, EquipmentActionResult, EquipmentStatus } from './types'

export class MikrotikDriver implements EquipmentDriver {
  type = 'mikrotik' as const
  name = 'Mikrotik RouterOS'
  
  private host: string = ''
  private port: number = 8728
  private username: string = ''
  private password: string = ''
  private baseUrl: string = ''
  private connected: boolean = false

  async connect(credentials: EquipmentCredentials): Promise<boolean> {
    this.host = credentials.host
    this.port = credentials.port || 8728
    this.username = credentials.username || 'admin'
    this.password = credentials.password || ''
    this.baseUrl = `http://${this.host}:${this.port}/rest`
    
    try {
      const response = await fetch(`${this.baseUrl}/system/resource`, {
        headers: this.getAuthHeader()
      })
      this.connected = response.ok
      return this.connected
    } catch {
      this.connected = false
      return false
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false
    this.host = ''
    this.password = ''
  }

  private getAuthHeader(): HeadersInit {
    const encoded = btoa(`${this.username}:${this.password}`)
    return {
      'Authorization': `Basic ${encoded}`,
      'Content-Type': 'application/json'
    }
  }

  private async apiGet(path: string): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: this.getAuthHeader()
    })
    if (!response.ok) throw new Error(`API error: ${response.status}`)
    return response.json()
  }

  private async apiPut(path: string, data: Record<string, string>): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: this.getAuthHeader(),
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error(`API error: ${response.status}`)
    return response.json()
  }

  private async apiDelete(path: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: this.getAuthHeader()
    })
    return response.status === 204
  }

  async getStatus(): Promise<EquipmentStatus> {
    try {
      await this.apiGet('/system/resource')
      return 'online'
    } catch {
      return 'offline'
    }
  }

  async getInfo(): Promise<Record<string, unknown>> {
    const resource = await this.apiGet('/system/resource') as Record<string, unknown>
    const identity = await this.apiGet('/system/identity') as Record<string, unknown>
    return { ...resource, ...identity }
  }

  async getResources(): Promise<{uptime: string; cpu: number; memory: number; temperature?: number}> {
    const resource = await this.apiGet('/system/resource') as Record<string, unknown>
    return {
      uptime: resource.uptime as string,
      cpu: Number(resource['cpu-load']) || 0,
      memory: Math.round((1 - (Number(resource['free-memory']) || 0) / (Number(resource['memory-total']) || 1)) * 100),
      temperature: Number(resource.temperature) || undefined
    }
  }

  // PPPoE Secrets
  async createPppoeUser(user: string, pass: string, profile: string): Promise<EquipmentActionResult> {
    try {
      await this.apiPut('/ppp/secret', {
        'name': user,
        'password': pass,
        'profile': profile,
        'service': 'pppoe'
      })
      return { success: true, message: `Usuário ${user} criado com profile ${profile}` }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async deletePppoeUser(user: string): Promise<EquipmentActionResult> {
    try {
      await this.apiDelete(`/ppp/secret/${encodeURIComponent(user)}`)
      return { success: true, message: `Usuário ${user} removido` }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async enablePppoeUser(user: string): Promise<EquipmentActionResult> {
    try {
      await this.apiPut(`/ppp/secret/${encodeURIComponent(user)}`, { 'disabled': 'false' })
      return { success: true, message: `Usuário ${user} habilitado` }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async disablePppoeUser(user: string): Promise<EquipmentActionResult> {
    try {
      await this.apiPut(`/ppp/secret/${encodeURIComponent(user)}`, { 'disabled': 'true' })
      return { success: true, message: `Usuário ${user} desabilitado` }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async listPppoeUsers(): Promise<Array<{name: string; profile: string; active: boolean}>> {
    const secrets = await this.apiGet('/ppp/secret') as Array<Record<string, unknown>>
    return secrets.map(s => ({
      name: s.name as string,
      profile: s.profile as string,
      active: s['disabled'] !== 'true'
    }))
  }

  // PPP Profiles
  async listProfiles(): Promise<Array<{name: string; rate_limit: string}>> {
    const profiles = await this.apiGet('/ppp/profile') as Array<Record<string, unknown>>
    return profiles.map(p => ({
      name: p.name as string,
      rate_limit: p['rate-limit'] as string || 'unlimited'
    }))
  }

  async createProfile(name: string, rate_limit: string): Promise<EquipmentActionResult> {
    try {
      await this.apiPut('/ppp/profile', {
        'name': name,
        'rate-limit': rate_limit,
        'local-address': 'poolppoe',
        'remote-address': 'poolppoe'
      })
      return { success: true, message: `Profile ${name} criado (${rate_limit})` }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  // Interfaces
  async getInterfaces(): Promise<Array<{name: string; status: string; speed: number; traffic_in: number; traffic_out: number}>> {
    const interfaces = await this.apiGet('/interface') as Array<Record<string, unknown>>
    return interfaces
      .filter(i => i.type !== 'loopback')
      .map(i => ({
        name: i.name as string,
        status: i.running === true ? 'up' : 'down',
        speed: Number(i['actual-mtu']) || 0,
        traffic_in: 0,
        traffic_out: 0
      }))
  }

  // Hotspot
  async createHotspotUser(user: string, pass: string, profile: string): Promise<EquipmentActionResult> {
    try {
      await this.apiPut('/ip/hotspot/user', {
        'name': user,
        'password': pass,
        'profile': profile
      })
      return { success: true, message: `Usuário hotspot ${user} criado` }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async deleteHotspotUser(user: string): Promise<EquipmentActionResult> {
    try {
      await this.apiDelete(`/ip/hotspot/user/${encodeURIComponent(user)}`)
      return { success: true, message: `Usuário hotspot ${user} removido` }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }
}

export const mikrotikDriver = new MikrotikDriver()
