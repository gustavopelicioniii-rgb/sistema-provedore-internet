import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const { stage, pipeline } = req.query
    
    const where: any = { organizationId }
    if (stage) where.stage = String(stage)
    if (pipeline) where.pipeline = String(pipeline)
    
    const leads = await prisma.lead.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    res.json(leads)
  } catch (error) {
    console.error('Get leads error:', error)
    res.status(500).json({ error: 'Failed to get leads' })
  }
})

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const data = req.body
    
    const lead = await prisma.lead.create({
      data: {
        ...data,
        organizationId
      }
    })
    
    res.json(lead)
  } catch (error) {
    console.error('Create lead error:', error)
    res.status(500).json({ error: 'Failed to create lead' })
  }
})

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const { id } = req.params
    const data = req.body
    
    const lead = await prisma.lead.findFirst({
      where: { id, organizationId }
    })
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' })
    }
    
    const updated = await prisma.lead.update({
      where: { id },
      data
    })
    
    res.json(updated)
  } catch (error) {
    console.error('Update lead error:', error)
    res.status(500).json({ error: 'Failed to update lead' })
  }
})

export default router
