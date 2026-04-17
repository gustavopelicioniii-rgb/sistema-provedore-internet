import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import authRoutes from './routes/auth.js'
import clientRoutes from './routes/clients.js'
import contractRoutes from './routes/contracts.js'
import planRoutes from './routes/plans.js'
import invoiceRoutes from './routes/invoices.js'
import ticketRoutes from './routes/tickets.js'
import serviceOrderRoutes from './routes/serviceOrders.js'
import leadRoutes from './routes/leads.js'
import automationRoutes from './routes/automations.js'
import equipmentRoutes from './routes/equipment.js'
import dashboardRoutes from './routes/dashboard.js'
import { authMiddleware } from './middleware/auth.js'

dotenv.config()

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Make prisma available in routes
app.locals.prisma = prisma

// Public routes
app.use('/api/auth', authRoutes)

// Protected routes
app.use('/api/clients', authMiddleware, clientRoutes)
app.use('/api/contracts', authMiddleware, contractRoutes)
app.use('/api/plans', authMiddleware, planRoutes)
app.use('/api/invoices', authMiddleware, invoiceRoutes)
app.use('/api/tickets', authMiddleware, ticketRoutes)
app.use('/api/service-orders', authMiddleware, serviceOrderRoutes)
app.use('/api/leads', authMiddleware, leadRoutes)
app.use('/api/automations', authMiddleware, automationRoutes)
app.use('/api/equipment', authMiddleware, equipmentRoutes)
app.use('/api/dashboard', authMiddleware, dashboardRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`🚀 NetPulse API running on port ${PORT}`)
})

export { prisma }
