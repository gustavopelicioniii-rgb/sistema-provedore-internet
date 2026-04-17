import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    
    // Get counts
    const [
      totalClients,
      activeClients,
      defaultingClients,
      totalContracts,
      activeContracts,
      plans,
      pendingInvoices,
      overdueInvoices,
      paidInvoices,
      openTickets,
      pendingServiceOrders,
      recentTickets
    ] = await Promise.all([
      // Clients
      prisma.client.count({ where: { organizationId } }),
      prisma.client.count({ where: { organizationId, status: 'active' } }),
      prisma.client.count({ where: { organizationId, status: 'defaulting' } }),
      
      // Contracts
      prisma.contract.count({ where: { organizationId } }),
      prisma.contract.count({ where: { organizationId, status: 'active' } }),
      
      // Plans
      prisma.plan.findMany({ 
        where: { organizationId, isActive: true },
        select: { id: true, name: true, price: true }
      }),
      
      // Invoices
      prisma.invoice.aggregate({ 
        where: { organizationId, status: 'pending' },
        _sum: { amount: true }
      }),
      prisma.invoice.aggregate({ 
        where: { organizationId, status: 'overdue' },
        _sum: { amount: true }
      }),
      prisma.invoice.aggregate({ 
        where: { organizationId, status: 'paid' },
        _sum: { amount: true }
      }),
      
      // Tickets
      prisma.ticket.count({ where: { organizationId, status: 'open' } }),
      
      // Service Orders
      prisma.serviceOrder.count({ where: { organizationId, status: 'open' } }),
      
      // Recent tickets
      prisma.ticket.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          client: { select: { name: true } },
          assignedTo: { select: { fullName: true } }
        }
      })
    ])
    
    // Calculate MRR (Monthly Recurring Revenue)
    const mrr = activeContracts > 0 
      ? plans.reduce((sum, plan) => sum + Number(plan.price), 0)
      : 0
    
    // Calculate churn rate (clients that cancelled in last 30 days / total)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const cancelledClients = await prisma.client.count({
      where: {
        organizationId,
        status: 'cancelled',
        updatedAt: { gte: thirtyDaysAgo }
      }
    })
    
    const churnRate = totalClients > 0 
      ? (cancelledClients / totalClients) * 100 
      : 0
    
    // Inadimplência
    const overdueRate = totalClients > 0 
      ? (defaultingClients / totalClients) * 100 
      : 0
    
    res.json({
      // Client metrics
      totalClients,
      activeClients,
      defaultingClients,
      churnRate: Number(churnRate.toFixed(2)),
      
      // Contract metrics
      totalContracts,
      activeContracts,
      
      // Financial metrics
      mrr,
      pendingAmount: pendingInvoices._sum.amount || 0,
      overdueAmount: overdueInvoices._sum.amount || 0,
      paidAmount: paidInvoices._sum.amount || 0,
      overdueRate: Number(overdueRate.toFixed(2)),
      
      // Tickets
      openTickets,
      pendingServiceOrders,
      recentTickets,
      
      // Plans
      activePlans: plans.length,
      
      // Chart data - monthly clients
      monthlyData: await getMonthlyData(organizationId!)
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    res.status(500).json({ error: 'Failed to get dashboard data' })
  }
})

async function getMonthlyData(organizationId: string) {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  
  const clients = await prisma.client.findMany({
    where: {
      organizationId,
      createdAt: { gte: sixMonthsAgo }
    },
    select: { createdAt: true }
  })
  
  // Group by month
  const monthlyData: Record<string, number> = {}
  const now = new Date()
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const key = date.toISOString().substring(0, 7) // YYYY-MM
    monthlyData[key] = 0
  }
  
  clients.forEach(client => {
    const key = client.createdAt.toISOString().substring(0, 7)
    if (monthlyData[key] !== undefined) {
      monthlyData[key]++
    }
  })
  
  return Object.entries(monthlyData).map(([month, clients]) => ({
    month,
    clients,
    monthName: new Date(month + '-01').toLocaleDateString('pt-BR', { month: 'short' })
  }))
}

export default router
