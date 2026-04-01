// Service types for MyDevStack UI

export interface Service {
  id: string
  name: string
  category: ServiceCategory
  icon: string
  route: string
  description?: string
}

export type ServiceCategory =
  | 'compute'
  | 'storage'
  | 'database'
  | 'messaging'
  | 'security'
  | 'networking'
  | 'analytics'
  | 'orchestration'
  | 'monitoring'
  | 'parameters'

export interface ServiceCategoryInfo {
  id: ServiceCategory
  name: string
  icon: string
  order: number
}

export interface ServiceResource {
  id: string
  name: string
  serviceId: string
  status: 'active' | 'inactive' | 'pending' | 'error'
  lastUpdated: Date
  metadata?: Record<string, unknown>
}

export interface ConnectionStatus {
  isConnected: boolean
  isReachable: boolean
  lastChecked: Date | null
  endpoint?: string
}

export interface SidebarCategory {
  category: ServiceCategoryInfo
  services: Service[]
}

export type Theme = 'light' | 'dark' | 'system'

export interface AppNotification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  timestamp: Date
}
