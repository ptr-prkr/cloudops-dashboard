import type { DashboardData } from '../types/dashboard'

export async function fetchDashboardData(): Promise<DashboardData> {
  const response = await fetch('/api/dashboard')

  if (!response.ok) {
    throw new Error(
      `Dashboard API request failed: ${response.status} ${response.statusText}`,
    )
  }

  return response.json() as Promise<DashboardData>
}