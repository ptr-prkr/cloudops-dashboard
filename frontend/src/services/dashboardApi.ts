import type { DashboardData } from '../types/dashboard'

const API_BASE_URL = 'http://localhost:5000'

export async function fetchDashboardData(): Promise<DashboardData> {
  const response = await fetch(`${API_BASE_URL}/api/dashboard`)

  if (!response.ok) {
    throw new Error(
      `Dashboard API request failed: ${response.status} ${response.statusText}`,
    )
  }

  return response.json() as Promise<DashboardData>
}
