export type ServiceStatus = 'operational' | 'degraded' | 'offline'

export interface ServiceHealth {
  name: string
  status: ServiceStatus
  responseTime: number
}

export interface SystemMetrics {
  hostname: string
  platform: string
  architecture: string
  uptime: number
  memoryUsed: number
  memoryTotal: number
}

export interface DeploymentInfo {
  environment: 'development' | 'staging' | 'production'
  version: string
  deployedAt: string
  deployedBy: string
}

export interface InfrastructureStatus {
  provider: string
  region: string
  instance: string
  network: string
}

export interface DashboardData {
  status: ServiceStatus
  system: SystemMetrics
  deployment: DeploymentInfo
  infrastructure: InfrastructureStatus
  services: ServiceHealth[]
}
