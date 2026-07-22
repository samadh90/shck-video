import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { H3Event, createError, getHeader } from 'h3'
import { db, schema } from './db'
import { eq } from 'drizzle-orm'

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_shck_video'

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10)
}

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash)
}

export const signToken = (payload: { userId: number; email: string }): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export const verifyToken = (token: string): { userId: number; email: string } | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; email: string }
  } catch (err) {
    return null
  }
}

export const getUserFromEvent = async (event: H3Event) => {
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null

  const token = authHeader.slice('Bearer '.length)
  const decoded = verifyToken(token)
  if (!decoded || !decoded.userId) return null

  const userList = await db.select().from(schema.users).where(eq(schema.users.id, decoded.userId)).limit(1)
  if (!userList.length) return null

  return userList[0]!
}

export const requireAuthUser = async (event: H3Event) => {
  const user = await getUserFromEvent(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Non autorisé. Veuillez vous connecter.'
    })
  }
  return user
}

export const requireVerifiedUser = async (event: H3Event) => {
  const user = await requireAuthUser(event)
  if (!user.isVerified) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Veuillez vérifier votre adresse email avant d\'effectuer cette action.'
    })
  }
  return user
}

export const generateNanoId = (length: number = 9): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const bytes = crypto.randomBytes(length)
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i]! % chars.length]
  }
  return result
}

export const generateEmailVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('base64url')
}

export const hashEmailVerificationToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export const calculateAge = (birthdateStr?: string | null): number | null => {
  if (!birthdateStr) return null
  const birth = new Date(birthdateStr)
  if (isNaN(birth.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}
