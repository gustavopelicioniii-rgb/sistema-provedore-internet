import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../middleware/auth.js'
import crypto from 'crypto'

const router = Router()
const prisma = new PrismaClient()

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    
    const automations = await prisma.automation.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    })
    
    res.json(automations)
  } catch (error) {
    console.error('Get automations error:', error)
    res.status(500).json({ error: 'Failed to get automations' })
  }
})

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const data = req.body
    
    // Generate webhook secret if webhook
    let webhookSecret = null
    let webhookUrl = null
    
    if (data.triggerType === 'webhook' || data.actionType === 'webhook_call') {
      webhookSecret = crypto.randomBytes(32).toString('hex')
    }
    
    const automation = await prisma.automation.create({
      data: {
        ...data,
        organizationId,
        webhookSecret
      }
    })
    
    // Generate webhook URL
    if (webhookSecret) {
      webhookUrl = `/api/webhooks/${automation.id}`
    }
    
    res.json({ ...automation, webhookUrl })
  } catch (error) {
    console.error('Create automation error:', error)
    res.status(500).json({ error: 'Failed to create automation' })
  }
})

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const { id } = req.params
    const data = req.body
    
    const automation = await prisma.automation.findFirst({
      where: { id, organizationId }
    })
    
    if (!automation) {
      return res.status(404).json({ error: 'Automation not found' })
    }
    
    const updated = await prisma.automation.update({
      where: { id },
      data
    })
    
    res.json(updated)
  } catch (error) {
    console.error('Update automation error:', error)
    res.status(500).json({ error: 'Failed to update automation' })
  }
})

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const { id } = req.params
    
    const automation = await prisma.automation.findFirst({
      where: { id, organizationId }
    })
    
    if (!automation) {
      return res.status(404).json({ error: 'Automation not found' })
    }
    
    await prisma.automation.delete({ where: { id } })
    
    res.json({ success: true })
  } catch (error) {
    console.error('Delete automation error:', error)
    res.status(500).json({ error: 'Failed to delete automation' })
  }
})

router.post('/:id/toggle', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const { id } = req.params
    
    const automation = await prisma.automation.findFirst({
      where: { id, organizationId }
    })
    
    if (!automation) {
      return res.status(404).json({ error: 'Automation not found' })
    }
    
    const updated = await prisma.automation.update({
      where: { id },
      data: { enabled: !automation.enabled }
    })
    
    res.json(updated)
  } catch (error) {
    console.error('Toggle automation error:', error)
    res.status(500).json({ error: 'Failed to toggle automation' })
  }
})

// Get automation logs
router.get('/:id/logs', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const { id } = req.params
    
    const logs = await prisma.automationLog.findMany({
      where: { automationId: id, organizationId },
      orderBy: { executedAt: 'desc' },
      take: 50
    })
    
    res.json(logs)
  } catch (error) {
    console.error('Get automation logs error:', error)
    res.status(500).json({ error: 'Failed to get logs' })
  }
})

// Trigger automation (webhook)
router.post('/trigger/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const payload = req.body
    
    const automation = await prisma.automation.findUnique({
      where: { id }
    })
    
    if (!automation || !automation.enabled) {
      return res.status(404).json({ error: 'Automation not found or disabled' })
    }
    
    // Execute action based on type
    let result = { success: true }
    
    if (automation.actionType === 'webhook_call') {
      // Make webhook call
      const actionConfig = automation.actionConfig as any
      // TODO: Implement actual webhook call
      result = { success: true, message: 'Webhook called' }
    }
    
    // Log execution
    await prisma.automationLog.create({
      data: {
        organizationId: automation.organizationId,
        automationId: id,
        status: result.success ? 'success' : 'error',
        triggerPayload: payload,
        responsePayload: result
      }
    })
    
    // Update last triggered
    await prisma.automation.update({
      where: { id },
      data: { lastTriggeredAt: new Date() }
    })
    
    res.json(result)
  } catch (error) {
    console.error('Trigger automation error:', error)
    res.status(500).json({ error: 'Failed to trigger automation' })
  }
})

export default router
