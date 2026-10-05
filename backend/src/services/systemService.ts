import os from 'node:os'
import http from 'node:http'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type {
  DashboardData,
  ServiceHealth,
  ServiceStatus,
} from '../types/dashboard.js'

const execFileAsync = promisify(execFile)

const deploymentTimestamp =
  process.env.DEPLOYED_AT ?? new Date().toISOString()

const monitoringMode = process.env.MONITORING_MODE ?? 'host'

function bytesToGiB(bytes: number): number {
  return Number((bytes / 1024 ** 3).toFixed(2))
}

async function checkHttpService(
  name: string,
  url: string,
): Promise<ServiceHealth> {
  const startedAt = performance.now()

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(2000),
    })

    const responseTime = Math.max(
      1,
      Math.round(performance.now() - startedAt),
    )

    const status: ServiceStatus =
      response.status >= 500 ? 'degraded' : 'operational'

    return {
      name,
      status,
      responseTime,
    }
  } catch {
    return {
      name,
      status: 'offline',
      responseTime: 0,
    }
  }
}

function checkDocker(): Promise<ServiceHealth> {
  return new Promise((resolve) => {
    const startedAt = performance.now()

    const request = http.request(
      {
        socketPath: '/var/run/docker.sock',
        path: '/_ping',
        method: 'GET',
        timeout: 2000,
      },
      (response) => {
        response.resume()

        resolve({
          name: 'Docker',
          status:
            response.statusCode === 200
              ? 'operational'
              : 'degraded',
          responseTime: Math.max(
            1,
            Math.round(performance.now() - startedAt),
          ),
        })
      },
    )

    request.on('timeout', () => {
      request.destroy()
    })

    request.on('error', () => {
      resolve({
        name: 'Docker',
        status: 'offline',
        responseTime: 0,
      })
    })

    request.end()
  })
}

async function checkNginx(): Promise<ServiceHealth> {
  const startedAt = performance.now()

  try {
    const { stdout } = await execFileAsync(
      'systemctl',
      ['is-active', 'nginx'],
      { timeout: 2000 },
    )

    return {
      name: 'nginx',
      status:
        stdout.trim() === 'active'
          ? 'operational'
          : 'offline',
      responseTime: Math.max(
        1,
        Math.round(performance.now() - startedAt),
      ),
    }
  } catch {
    return {
      name: 'nginx',
      status: 'offline',
      responseTime: 0,
    }
  }
}

function getOverallStatus(
  services: ServiceHealth[],
): ServiceStatus {
  if (
    services.some(
      (service) =>
        service.status === 'offline' ||
        service.status === 'degraded',
    )
  ) {
    return 'degraded'
  }

  return 'operational'
}

async function getServiceHealth(): Promise<ServiceHealth[]> {
  const frontendHealthUrl =
    process.env.FRONTEND_HEALTH_URL ??
    'http://127.0.0.1:5173'

  const commonServices: Promise<ServiceHealth>[] = [
    checkHttpService('Frontend', frontendHealthUrl),
    Promise.resolve({
      name: 'API',
      status: 'operational' as const,
      responseTime: 1,
    }),
  ]

  if (monitoringMode === 'container') {
    return Promise.all(commonServices)
  }

  return Promise.all([
    ...commonServices,
    checkDocker(),
    checkNginx(),
  ])
}

export async function getDashboardData(): Promise<DashboardData> {
  const totalMemory = os.totalmem()
  const freeMemory = os.freemem()
  const services = await getServiceHealth()

  return {
    status: getOverallStatus(services),

    system: {
      hostname: os.hostname(),
      platform: `${os.type()} ${os.release()}`,
      architecture: os.arch(),
      uptime: os.uptime(),
      memoryUsed: bytesToGiB(totalMemory - freeMemory),
      memoryTotal: bytesToGiB(totalMemory),
    },

    deployment: {
      environment:
  process.env.APP_ENVIRONMENT === 'production'
    ? 'production'
    : process.env.APP_ENVIRONMENT === 'staging'
      ? 'staging'
      : 'development',
      version: process.env.APP_VERSION ?? '1.0.0',
      deployedAt: deploymentTimestamp,
      deployedBy:
        process.env.DEPLOYED_BY ?? 'local-development',
    },

    infrastructure: {
      provider:
        process.env.CLOUD_PROVIDER ?? 'on-premises',
      region: process.env.CLOUD_REGION ?? 'local',
      instance:
        process.env.INSTANCE_NAME ?? os.hostname(),
      network:
        process.env.NETWORK_NAME ?? 'local-network',
    },

    services,
  }
}