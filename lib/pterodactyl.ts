/**
 * Pterodactyl Panel API Client
 * Документация: https://pterodactyl-api-docs.netvpx.com/docs/intro
 */

const PTERODACTYL_URL = process.env.PTERODACTYL_URL || ""
const PTERODACTYL_API_KEY = process.env.PTERODACTYL_API_KEY || ""
const PTERODACTYL_CLIENT_KEY = process.env.PTERODACTYL_CLIENT_KEY || ""

interface PterodactylResponse<T> {
  object: string
  data: T
  meta?: {
    pagination: {
      total: number
      count: number
      per_page: number
      current_page: number
      total_pages: number
    }
  }
}

interface PterodactylUser {
  id: number
  external_id: string | null
  uuid: string
  username: string
  email: string
  first_name: string
  last_name: string
  language: string
  root_admin: boolean
  "2fa": boolean
  created_at: string
  updated_at: string
}

interface PterodactylServer {
  id: number
  external_id: string | null
  uuid: string
  identifier: string
  name: string
  description: string
  status: string | null
  suspended: boolean
  limits: {
    memory: number
    swap: number
    disk: number
    io: number
    cpu: number
    threads: string | null
  }
  feature_limits: {
    databases: number
    allocations: number
    backups: number
  }
  user: number
  node: number
  allocation: number
  nest: number
  egg: number
  container: {
    startup_command: string
    image: string
    installed: boolean
    environment: Record<string, string>
  }
  created_at: string
  updated_at: string
}

interface ServerResources {
  current_state: string
  is_suspended: boolean
  resources: {
    memory_bytes: number
    cpu_absolute: number
    disk_bytes: number
    network_rx_bytes: number
    network_tx_bytes: number
    uptime: number
  }
}

class PterodactylAPI {
  private baseUrl: string
  private apiKey: string
  private clientKey: string

  constructor() {
    this.baseUrl = PTERODACTYL_URL.replace(/\/$/, "")
    this.apiKey = PTERODACTYL_API_KEY
    this.clientKey = PTERODACTYL_CLIENT_KEY
  }

  private async adminRequest<T>(
    endpoint: string,
    method: string = "GET",
    body?: object
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}/api/application${endpoint}`, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.errors?.[0]?.detail || `Pterodactyl API error: ${response.status}`)
    }

    return response.json()
  }

  private async clientRequest<T>(
    endpoint: string,
    method: string = "GET",
    body?: object,
    clientApiKey?: string
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}/api/client${endpoint}`, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${clientApiKey || this.clientKey}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.errors?.[0]?.detail || `Pterodactyl API error: ${response.status}`)
    }

    return response.json()
  }

  // ==================== USER MANAGEMENT ====================

  async createUser(data: {
    email: string
    username: string
    firstName: string
    lastName: string
    password?: string
    externalId?: string
  }): Promise<PterodactylUser> {
    const response = await this.adminRequest<PterodactylResponse<{ attributes: PterodactylUser }>>(
      "/users",
      "POST",
      {
        email: data.email,
        username: data.username,
        first_name: data.firstName,
        last_name: data.lastName,
        password: data.password,
        external_id: data.externalId,
      }
    )
    return response.data.attributes
  }

  async getUser(userId: number): Promise<PterodactylUser> {
    const response = await this.adminRequest<PterodactylResponse<{ attributes: PterodactylUser }>>(
      `/users/${userId}`
    )
    return response.data.attributes
  }

  async getUserByExternalId(externalId: string): Promise<PterodactylUser | null> {
    try {
      const response = await this.adminRequest<PterodactylResponse<{ attributes: PterodactylUser }>>(
        `/users/external/${externalId}`
      )
      return response.data.attributes
    } catch {
      return null
    }
  }

  async deleteUser(userId: number): Promise<void> {
    await this.adminRequest(`/users/${userId}`, "DELETE")
  }

  // ==================== SERVER MANAGEMENT ====================

  async createServer(data: {
    name: string
    userId: number
    nestId: number
    eggId: number
    locationId: number
    memory: number
    swap: number
    disk: number
    cpu: number
    databases?: number
    allocations?: number
    backups?: number
    environment?: Record<string, string>
    startOnCompletion?: boolean
  }): Promise<PterodactylServer> {
    const response = await this.adminRequest<PterodactylResponse<{ attributes: PterodactylServer }>>(
      "/servers",
      "POST",
      {
        name: data.name,
        user: data.userId,
        nest: data.nestId,
        egg: data.eggId,
        docker_image: "ghcr.io/pterodactyl/yolks:java_17",
        startup: "java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar server.jar",
        environment: data.environment || {},
        limits: {
          memory: data.memory,
          swap: data.swap,
          disk: data.disk,
          io: 500,
          cpu: data.cpu,
        },
        feature_limits: {
          databases: data.databases || 0,
          allocations: data.allocations || 1,
          backups: data.backups || 2,
        },
        deploy: {
          locations: [data.locationId],
          dedicated_ip: false,
          port_range: [],
        },
        start_on_completion: data.startOnCompletion ?? true,
      }
    )
    return response.data.attributes
  }

  async getServer(serverId: number): Promise<PterodactylServer> {
    const response = await this.adminRequest<PterodactylResponse<{ attributes: PterodactylServer }>>(
      `/servers/${serverId}`
    )
    return response.data.attributes
  }

  async suspendServer(serverId: number): Promise<void> {
    await this.adminRequest(`/servers/${serverId}/suspend`, "POST")
  }

  async unsuspendServer(serverId: number): Promise<void> {
    await this.adminRequest(`/servers/${serverId}/unsuspend`, "POST")
  }

  async reinstallServer(serverId: number): Promise<void> {
    await this.adminRequest(`/servers/${serverId}/reinstall`, "POST")
  }

  async deleteServer(serverId: number, force: boolean = false): Promise<void> {
    await this.adminRequest(`/servers/${serverId}${force ? "/force" : ""}`, "DELETE")
  }

  async updateServerBuild(
    serverId: number,
    data: {
      memory?: number
      swap?: number
      disk?: number
      cpu?: number
      allocation?: number
    }
  ): Promise<void> {
    await this.adminRequest(`/servers/${serverId}/build`, "PATCH", {
      allocation: data.allocation,
      limits: {
        memory: data.memory,
        swap: data.swap,
        disk: data.disk,
        io: 500,
        cpu: data.cpu,
      },
    })
  }

  // ==================== CLIENT API (Server Control) ====================

  async getServerResources(serverIdentifier: string): Promise<ServerResources> {
    const response = await this.clientRequest<{ attributes: ServerResources }>(
      `/servers/${serverIdentifier}/resources`
    )
    return response.attributes
  }

  async sendPowerAction(
    serverIdentifier: string,
    action: "start" | "stop" | "restart" | "kill"
  ): Promise<void> {
    await this.clientRequest(`/servers/${serverIdentifier}/power`, "POST", { signal: action })
  }

  async sendCommand(serverIdentifier: string, command: string): Promise<void> {
    await this.clientRequest(`/servers/${serverIdentifier}/command`, "POST", { command })
  }

  // ==================== BACKUPS ====================

  async listBackups(serverIdentifier: string): Promise<unknown[]> {
    const response = await this.clientRequest<PterodactylResponse<unknown[]>>(
      `/servers/${serverIdentifier}/backups`
    )
    return response.data
  }

  async createBackup(serverIdentifier: string, name?: string): Promise<unknown> {
    const response = await this.clientRequest<{ attributes: unknown }>(
      `/servers/${serverIdentifier}/backups`,
      "POST",
      { name }
    )
    return response.attributes
  }

  async downloadBackup(serverIdentifier: string, backupUuid: string): Promise<string> {
    const response = await this.clientRequest<{ attributes: { url: string } }>(
      `/servers/${serverIdentifier}/backups/${backupUuid}/download`
    )
    return response.attributes.url
  }

  async deleteBackup(serverIdentifier: string, backupUuid: string): Promise<void> {
    await this.clientRequest(`/servers/${serverIdentifier}/backups/${backupUuid}`, "DELETE")
  }

  async restoreBackup(serverIdentifier: string, backupUuid: string): Promise<void> {
    await this.clientRequest(`/servers/${serverIdentifier}/backups/${backupUuid}/restore`, "POST")
  }

  // ==================== LOCATIONS & NODES ====================

  async getLocations(): Promise<unknown[]> {
    const response = await this.adminRequest<PterodactylResponse<unknown[]>>("/locations")
    return response.data
  }

  async getNodes(): Promise<unknown[]> {
    const response = await this.adminRequest<PterodactylResponse<unknown[]>>("/nodes")
    return response.data
  }

  async getNests(): Promise<unknown[]> {
    const response = await this.adminRequest<PterodactylResponse<unknown[]>>("/nests")
    return response.data
  }

  async getEggs(nestId: number): Promise<unknown[]> {
    const response = await this.adminRequest<PterodactylResponse<unknown[]>>(`/nests/${nestId}/eggs`)
    return response.data
  }

  // ==================== WEBSOCKET (for console) ====================

  async getWebsocketCredentials(
    serverIdentifier: string
  ): Promise<{ token: string; socket: string }> {
    const response = await this.clientRequest<{
      data: { token: string; socket: string }
    }>(`/servers/${serverIdentifier}/websocket`)
    return response.data
  }
}

export const pterodactyl = new PterodactylAPI()
export default pterodactyl
