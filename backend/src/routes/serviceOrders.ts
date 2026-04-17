import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const { status, technicianId } = req.query
    
    const where: any = { organizationId }
    if (status) where.status = String(status)
    if (technicianId) where.technicianId = String(technicianId)
    
    const orders = await prisma.serviceOrder.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, phone: true } },
        technician: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    res.json(orders)
  } catch (error) {
    console.error('Get service orders error:', error)
    res.status(500).json({ error: 'Failed to get service orders' })
  }
})

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId, userId } = req
    const data = req.body
    
    // Generate number
    const count = await prisma.serviceOrder.count({ where: { organizationId } })
    const number = `OS${String(count + 1).padStart(5, '0')}`
    
    const order = await prisma.serviceOrder.create({
      data: {
        ...data,
        organizationId,
        createdById: userId!,
        number
      },
      include: {
        client: { select: { name: true } }
      }
    })
    
    res.json(order)
  } catch (error) {
    console.error('Create service order error:', error)
    res.status(500).json({ error: 'Failed to create service order' })
  }
})

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const { id } = req.params
    const data = req.body
    
    const order = await prisma.serviceOrder.findFirst({
      where: { id, organizationId }
    })
    
    if (!order) {
      return res.status(404).json({ error: 'Service order not found' })
    }
    
    const updated = await prisma.serviceOrder.update({
      where: { id },
      data,
      include: {
        client: { select: { name: true } }
      }
    })
    
    res.json(updated)
  } catch (error) {
    console.error('Update service order error:', error)
    res.status(500).json({ error: 'Failed to update service order' })
  }
})

export default router
