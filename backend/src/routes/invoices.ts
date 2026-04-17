import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

// Get all invoices
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const { status, clientId, month } = req.query
    
    const where: any = { organizationId }
    
    if (status) where.status = status
    if (clientId) where.clientId = String(clientId)
    if (month) where.referenceMonth = String(month)
    
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } }
      },
      orderBy: { dueDate: 'desc' }
    })
    
    res.json(invoices)
  } catch (error) {
    console.error('Get invoices error:', error)
    res.status(500).json({ error: 'Failed to get invoices' })
  }
})

// Get invoice stats
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const { month } = req.query
    
    const where: any = { organizationId }
    if (month) where.referenceMonth = String(month)
    
    const [total, pending, paid, overdue] = await Promise.all([
      prisma.invoice.aggregate({ where, _sum: { amount: true } }),
      prisma.invoice.aggregate({ where: { ...where, status: 'pending' }, _sum: { amount: true } }),
      prisma.invoice.aggregate({ where: { ...where, status: 'paid' }, _sum: { amount: true } }),
      prisma.invoice.aggregate({ where: { ...where, status: 'overdue' }, _sum: { amount: true } })
    ])
    
    res.json({
      total: total._sum.amount || 0,
      pending: pending._sum.amount || 0,
      paid: paid._sum.amount || 0,
      overdue: overdue._sum.amount || 0
    })
  } catch (error) {
    console.error('Get invoice stats error:', error)
    res.status(500).json({ error: 'Failed to get invoice stats' })
  }
})

// Create invoice
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const data = req.body
    
    const invoice = await prisma.invoice.create({
      data: {
        ...data,
        organizationId
      },
      include: {
        client: { select: { name: true } }
      }
    })
    
    res.json(invoice)
  } catch (error) {
    console.error('Create invoice error:', error)
    res.status(500).json({ error: 'Failed to create invoice' })
  }
})

// Update invoice
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const { id } = req.params
    const data = req.body
    
    const invoice = await prisma.invoice.findFirst({
      where: { id, organizationId }
    })
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' })
    }
    
    const updated = await prisma.invoice.update({
      where: { id },
      data
    })
    
    res.json(updated)
  } catch (error) {
    console.error('Update invoice error:', error)
    res.status(500).json({ error: 'Failed to update invoice' })
  }
})

// Mark invoice as paid
router.post('/:id/pay', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const { id } = req.params
    const { paidAmount, paymentMethod } = req.body
    
    const invoice = await prisma.invoice.findFirst({
      where: { id, organizationId }
    })
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' })
    }
    
    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status: 'paid',
        paidAt: new Date(),
        paidAmount: paidAmount || invoice.amount,
        paymentMethod: paymentMethod || 'pix'
      }
    })
    
    res.json(updated)
  } catch (error) {
    console.error('Pay invoice error:', error)
    res.status(500).json({ error: 'Failed to pay invoice' })
  }
})

// Generate invoices for month
router.post('/generate', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const { referenceMonth } = req.body // formato: YYYY-MM
    
    // Buscar contratos ativos
    const contracts = await prisma.contract.findMany({
      where: { organizationId, status: 'active' },
      include: { 
        client: true,
        plan: true 
      }
    })
    
    // Criar faturas
    const invoices = await Promise.all(
      contracts.map(contract => 
        prisma.invoice.create({
          data: {
            organizationId: organizationId!,
            clientId: contract.clientId,
            contractId: contract.id,
            referenceMonth,
            dueDate: new Date(`${referenceMonth}-10`), // Dia 10 do mês
            amount: contract.plan.price,
            status: 'pending'
          }
        })
      )
    )
    
    res.json({ generated: invoices.length, invoices })
  } catch (error) {
    console.error('Generate invoices error:', error)
    res.status(500).json({ error: 'Failed to generate invoices' })
  }
})

export default router
