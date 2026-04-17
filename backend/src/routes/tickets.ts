import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const { status, priority } = req.query
    
    const where: any = { organizationId }
    if (status) where.status = String(status)
    if (priority) where.priority = String(priority)
    
    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, fullName: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    res.json(tickets)
  } catch (error) {
    console.error('Get tickets error:', error)
    res.status(500).json({ error: 'Failed to get tickets' })
  }
})

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId, userId } = req
    const data = req.body
    
    const ticket = await prisma.ticket.create({
      data: {
        ...data,
        organizationId,
        createdById: userId!
      },
      include: {
        client: { select: { name: true } }
      }
    })
    
    res.json(ticket)
  } catch (error) {
    console.error('Create ticket error:', error)
    res.status(500).json({ error: 'Failed to create ticket' })
  }
})

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const { id } = req.params
    const data = req.body
    
    const ticket = await prisma.ticket.findFirst({
      where: { id, organizationId }
    })
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }
    
    const updated = await prisma.ticket.update({
      where: { id },
      data,
      include: {
        client: { select: { name: true } }
      }
    })
    
    res.json(updated)
  } catch (error) {
    console.error('Update ticket error:', error)
    res.status(500).json({ error: 'Failed to update ticket' })
  }
})

export default router
