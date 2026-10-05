import { useEffect, useState } from 'react'
import { fetchDashboardData } from '../services/dashboardApi'
import type { DashboardData } from '../types/dashboard'

interface UseDashboardResult {
  data: DashboardData | null
  loading: boolean
  error: string | null
}

const REFRESH_INTERVAL_MS = 10_000

export function useDashboard(): UseDashboardResult {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadDashboard(): Promise<void> {
      try {
        const dashboardData = await fetchDashboardData()

        if (active) {
          setData(dashboardData)
          setError(null)
        }
      } catch (requestError) {
        if (active) {
          const message =
            requestError instanceof Error
              ? requestError.message
              : 'Unable to load dashboard data'

          setError(message)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadDashboard()

    const intervalId = window.setInterval(() => {
      void loadDashboard()
    }, REFRESH_INTERVAL_MS)

    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [])

  return { data, loading, error }
}
