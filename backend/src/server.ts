import express from 'express'
import cors from 'cors'
import os from 'node:os'
import dashboardRouter from './routes/dashboard.js'

const app = express()

const PORT = Number(process.env.PORT) || 5000

app.use(cors())
app.use(express.json())

app.get('/api/health', (_request, response) => {
  response.json({
    status: 'operational',
    service: 'cloudops-api',
    timestamp: new Date().toISOString(),
    hostname: os.hostname(),
    uptime: os.uptime(),
  })
})

app.use('/api/dashboard', dashboardRouter)

app.listen(PORT, '0.0.0.0', () => {
  console.log(`CloudOps API listening on port ${PORT}`)
})
