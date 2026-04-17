import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../middleware/auth.js'
import { equipmentManager } from './equipmentManager.js'

const router = Router()
const prisma = new PrismaClient()

// Get all equipment
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const { type, status } = req.query
    
    const where: any = { organizationId }
    if (type) where.type = String(type)
    if (status) where.status = String(status)
    
    const equipment = await prisma.equipment.findMany({
      where,
      include: {
        credentials: {
          select: { authType: true, username: true }
        }
      },
      orderBy: { name: 'asc' }
    })
    
    // Remove sensitive data
    const sanitized = equipment.map(eq => ({
      ...eq,
      credentials: undefined
    }))
    
    res.json(sanitized)
  } catch (error) {
    console.error('Get equipment error:', error)
    res.status(500).json({ error: 'Failed to get equipment' })
  }
})

// Get single equipment
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const { id } = req.params
    
    const equipment = await prisma.equipment.findFirst({
      where: { id, organizationId },
      include: {
        credentials: true
      }
    })
    
    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' })
    }
    
    // Remove password from response
    const { credentials, ...rest } = equipment
    res.json({ ...rest, hasCredentials: !!credentials.password })
  } catch (error) {
    console.error('Get equipment error:', error)
    res.status(500).json({ error: 'Failed to get equipment' })
  }
})

// Create equipment
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const { name, type, ipAddress, port, location, model, credentials } = req.body
    
    const equipment = await prisma.equipment.create({
      data: {
        organizationId,
        name,
        type,
        ipAddress,
        port: port || 80,
        location,
        model,
        status: 'unknown'
      }
    })
    
    // Save credentials if provided
    if (credentials && equipment) {
      await prisma.equipmentCredential.create({
        data: {
          equipmentId: equipment.id,
          authType: credentials.authType || 'basic',
          username: credentials.username,
          password: credentials.password
        }
      })
    }
    
    res.json(equipment)
  } catch (error) {
    console.error('Create equipment error:', error)
    res.status(500).json({ error: 'Failed to create equipment' })
  }
})

// Update equipment
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const { id } = req.params
    const data = req.body
    
    const equipment = await prisma.equipment.findFirst({
      where: { id, organizationId }
    })
    
    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' })
    }
    
    const updated = await prisma.equipment.update({
      where: { id },
      data
    })
    
    res.json(updated)
  } catch (error) {
    console.error('Update equipment error:', error)
    res.status(500).json({ error: 'Failed to update equipment' })
  }
})

// Delete equipment
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const { id } = req.params
    
    const equipment = await prisma.equipment.findFirst({
      where: { id, organizationId }
    })
    
    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' })
    }
    
    await prisma.equipment.delete({ where: { id } })
    
    res.json({ success: true })
  } catch (error) {
    console.error('Delete equipment error:', error)
    res.status(500).json({ error: 'Failed to delete equipment' })
  }
})

// Test connection
router.post('/:id/test', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const { id } = req.params
    
    const equipment = await prisma.equipment.findFirst({
      where: { id, organizationId },
      include: { credentials: true }
    })
    
    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' })
    }
    
    // TODO: Implementar teste real de conexão
    // Por enquanto simula
    res.json({ 
      success: true, 
      message: 'Connection test simulated',
      equipmentId: id 
    })
  } catch (error) {
    console.error('Test equipment error:', error)
    res.status(500).json({ error: 'Failed to test equipment' })
  }
})

// Get equipment status
router.get('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req
    const { id } = req.params
    
    const equipment = await prisma.equipment.findFirst({
      where: { id, organizationId }
    })
    
    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' })
    }
    
    // TODO: Implementar verificação real de status
    res.json({ 
      status: equipment.status,
      lastCheck: equipment.lastCheck
    })
  } catch (error) {
    console.error('Get equipment status error:', error)
    res.status(500).json({ error: 'Failed to get equipment status' })
  }
})

export default router
