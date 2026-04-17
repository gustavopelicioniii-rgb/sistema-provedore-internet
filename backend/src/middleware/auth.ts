import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'netpulse-secret-change-in-production'

export interface AuthRequest extends Request {
  userId?: string
  organizationId?: string
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }
  
  const token = authHeader.substring(7)
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string
      organizationId: string
    }
    
    req.userId = decoded.userId
    req.organizationId = decoded.organizationId
    
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export function generateToken(userId: string, organizationId: string): string {
  return jwt.sign(
    { userId, organizationId },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}
