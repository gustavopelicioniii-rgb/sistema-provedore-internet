import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { generateToken } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }
    
    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true }
    })
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    const validPassword = await bcrypt.compare(password, user.passwordHash)
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    const token = generateToken(user.id, user.organizationId)
    
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          slug: user.organization.slug
        }
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

// Register (cria org + usuário admin)
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, organizationName, organizationSlug } = req.body
    
    if (!email || !password || !fullName || !organizationName || !organizationSlug) {
      return res.status(400).json({ error: 'All fields required' })
    }
    
    // Check if email exists
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' })
    }
    
    // Check if slug exists
    const existingOrg = await prisma.organization.findUnique({ where: { slug: organizationSlug } })
    if (existingOrg) {
      return res.status(400).json({ error: 'Organization slug already in use' })
    }
    
    const passwordHash = await bcrypt.hash(password, 10)
    
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: organizationName,
          slug: organizationSlug
        }
      })
      
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          fullName,
          role: 'admin',
          organizationId: org.id
        }
      })
      
      return { org, user }
    })
    
    const token = generateToken(result.user.id, result.org.id)
    
    res.json({
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        role: result.user.role,
        organization: {
          id: result.org.id,
          name: result.org.name,
          slug: result.org.slug
        }
      }
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

export default router
