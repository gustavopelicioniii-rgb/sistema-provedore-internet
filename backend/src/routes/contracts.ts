import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const { status, clientId } = req.query
    
    const where: any = { organizationId }
    if (status) where.status = String(status)
    if (clientId) where.clientId = String(clientId)
    
    const contracts = await prisma.contract.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
        plan: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    res.json(contracts)
  } catch (error) {
    console.error('Get contracts error:', error)
    res.status(500).json({ error: 'Failed to get contracts' })
  }
})

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const data = req.body
    
    const contract = await prisma.contract.create({
      data: {
        ...data,
        organizationId
      },
      include: {
        client: { select: { name: true } },
        plan: true
      }
    })
    
    res.json(contract)
  } catch (error) {
    console.error('Create contract error:', error)
    res.status(500).json({ error: 'Failed to create contract' })
  }
})

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const { id } = req.params
    const data = req.body
    
    const contract = await prisma.contract.findFirst({
      where: { id, organizationId }
    })
    
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' })
    }
    
    const updated = await prisma.contract.update({
      where: { id },
      data,
      include: {
        client: { select: { name: true } },
        plan: true
      }
    })
    
    res.json(updated)
  } catch (error) {
    console.error('Update contract error:', error)
    res.status(500).json({ error: 'Failed to update contract' })
  }
})

router.post('/:id/suspend', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const { id } = req.params
    
    const contract = await prisma.contract.findFirst({
      where: { id, organizationId }
    })
    
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' })
    }
    
    const updated = await prisma.contract.update({
      where: { id },
      data: { status: 'suspended' }
    })
    
    // Update client status
    await prisma.client.update({
      where: { id: contract.clientId },
      data: { status: 'suspended' }
    })
    
    res.json(updated)
  } catch (error) {
    console.error('Suspend contract error:', error)
    res.status(500).json({ error: 'Failed to suspend contract' })
  }
})

router.post('/:id/reactivate', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const { id } = req.params
    
    const contract = await prisma.contract.findFirst({
      where: { id, organizationId }
    })
    
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' })
    }
    
    const updated = await prisma.contract.update({
      where: { id },
      data: { status: 'active' }
    })
    
    // Update client status
    await prisma.client.update({
      where: { id: contract.clientId },
      data: { status: 'active' }
    })
    
    res.json(updated)
  } catch (error) {
    console.error('Reactivate contract error:', error)
    res.status(500).json({ error: 'Failed to reactivate contract' })
  }
})

export default router
