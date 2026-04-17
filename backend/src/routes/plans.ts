import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

// Get all plans
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    
    const plans = await prisma.plan.findMany({
      where: { organizationId },
      orderBy: [{ isActive: 'desc' }, { sortOrder: 'asc' }]
    })
    
    res.json(plans)
  } catch (error) {
    console.error('Get plans error:', error)
    res.status(500).json({ error: 'Failed to get plans' })
  }
})

// Get single plan
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const { id } = req.params
    
    const plan = await prisma.plan.findFirst({
      where: { id, organizationId }
    })
    
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' })
    }
    
    // Get contracts count
    const contractsCount = await prisma.contract.count({
      where: { planId: id, status: 'active' }
    })
    
    res.json({ ...plan, contractsCount })
  } catch (error) {
    console.error('Get plan error:', error)
    res.status(500).json({ error: 'Failed to get plan' })
  }
})

// Create plan
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const data = req.body
    
    const plan = await prisma.plan.create({
      data: {
        ...data,
        organizationId
      }
    })
    
    res.json(plan)
  } catch (error) {
    console.error('Create plan error:', error)
    res.status(500).json({ error: 'Failed to create plan' })
  }
})

// Update plan
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const { id } = req.params
    const data = req.body
    
    const plan = await prisma.plan.findFirst({
      where: { id, organizationId }
    })
    
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' })
    }
    
    const updated = await prisma.plan.update({
      where: { id },
      data
    })
    
    res.json(updated)
  } catch (error) {
    console.error('Update plan error:', error)
    res.status(500).json({ error: 'Failed to update plan' })
  }
})

// Delete plan
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const { id } = req.params
    
    const plan = await prisma.plan.findFirst({
      where: { id, organizationId }
    })
    
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' })
    }
    
    // Check if has active contracts
    const contractsCount = await prisma.contract.count({
      where: { planId: id, status: 'active' }
    })
    
    if (contractsCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete plan with active contracts',
        contractsCount 
      })
    }
    
    await prisma.plan.delete({ where: { id } })
    
    res.json({ success: true })
  } catch (error) {
    console.error('Delete plan error:', error)
    res.status(500).json({ error: 'Failed to delete plan' })
  }
})

// Toggle plan active/inactive
router.post('/:id/toggle', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const { id } = req.params
    
    const plan = await prisma.plan.findFirst({
      where: { id, organizationId }
    })
    
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' })
    }
    
    const updated = await prisma.plan.update({
      where: { id },
      data: { isActive: !plan.isActive }
    })
    
    res.json(updated)
  } catch (error) {
    console.error('Toggle plan error:', error)
    res.status(500).json({ error: 'Failed to toggle plan' })
  }
})

export default router
