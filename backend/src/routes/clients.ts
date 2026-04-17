import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

// Get all clients
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const { status, search } = req.query
    
    const where: any = { organizationId }
    
    if (status) {
      where.status = status
    }
    
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
        { phone: { contains: String(search), mode: 'insensitive' } }
      ]
    }
    
    const clients = await prisma.client.findMany({
      where,
      include: {
        contracts: {
          where: { status: 'active' },
          include: { plan: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    res.json(clients)
  } catch (error) {
    console.error('Get clients error:', error)
    res.status(500).json({ error: 'Failed to get clients' })
  }
})

// Get single client
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId, userId } = req
    const { id } = req.params
    
    const client = await prisma.client.findFirst({
      where: { id, organizationId },
      include: {
        contracts: { include: { plan: true } },
        invoices: { orderBy: { dueDate: 'desc' }, take: 10 },
        tickets: { orderBy: { createdAt: 'desc' }, take: 5 }
      }
    })
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' })
    }
    
    res.json(client)
  } catch (error) {
    console.error('Get client error:', error)
    res.status(500).json({ error: 'Failed to get client' })
  }
})

// Create client
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const data = req.body
    
    const client = await prisma.client.create({
      data: {
        ...data,
        organizationId
      }
    })
    
    // Audit log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: req.userId,
        userName: req.userId,
        action: 'created',
        entityType: 'client',
        entityId: client.id
      }
    })
    
    res.json(client)
  } catch (error) {
    console.error('Create client error:', error)
    res.status(500).json({ error: 'Failed to create client' })
  }
})

// Update client
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const { id } = req.params
    const data = req.body
    
    const client = await prisma.client.findFirst({
      where: { id, organizationId }
    })
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' })
    }
    
    const updated = await prisma.client.update({
      where: { id },
      data
    })
    
    // Audit log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: req.userId,
        action: 'updated',
        entityType: 'client',
        entityId: id
      }
    })
    
    res.json(updated)
  } catch (error) {
    console.error('Update client error:', error)
    res.status(500).json({ error: 'Failed to update client' })
  }
})

// Delete client
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const { id } = req.params
    
    const client = await prisma.client.findFirst({
      where: { id, organizationId }
    })
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' })
    }
    
    await prisma.client.delete({ where: { id } })
    
    res.json({ success: true })
  } catch (error) {
    console.error('Delete client error:', error)
    res.status(500).json({ error: 'Failed to delete client' })
  }
})

export default router
