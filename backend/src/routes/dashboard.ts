import { Router } from 'express'
import { getDashboardData } from '../services/systemService.js'

const router = Router()

router.get('/', async (_request, response) => {
  try {
    const dashboardData = await getDashboardData()
    response.json(dashboardData)
  } catch (error) {
    console.error('Failed to collect dashboard data:', error)

    response.status(500).json({
      error: 'Unable to collect dashboard data',
    })
  }
})

export default router
