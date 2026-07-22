import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { H3Event, createError, deleteCookie, getCookie, setCookie } from 'h3'
import { db, schema } from './db'
import { eq } from 'drizzle-orm'

const SESSION_COOKIE_NAME = 'auth_token'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7

const getJwtSecret = (event: H3Event): string => {
  const secret = useRuntimeConfig(event).jwtSecret
  if (typeof secret !== 'string' || secret.length < 32) {
    throw createError({
      statusCode: 500,
      message: 'La configuration de session du serveur est invalide.'
    })
  }
  return secret
}

const getSessionCookieOptions = () => ({
  httpOnly: true,
  maxAge: SESSION_MAX_AGE,
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production'
})

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10)
}

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash)
}

export const signToken = (event: H3Event, payload: { userId: number; email: string }): string => {
  return jwt.sign(payload, getJwtSecret(event), { expiresIn: '7d' })
}

export const verifyToken = (event: H3Event, token: string): { userId: number; email: string } | null => {
  try {
    return jwt.verify(token, getJwtSecret(event)) as { userId: number; email: string }
  } catch (err) {
    return null
  }
}

export const setSessionCookie = (event: H3Event, token: string): void => {
  setCookie(event, SESSION_COOKIE_NAME, token, getSessionCookieOptions())
}

export const clearSessionCookie = (event: H3Event): void => {
  deleteCookie(event, SESSION_COOKIE_NAME, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  })
}

export const getUserFromEvent = async (event: H3Event) => {
  const token = getCookie(event, SESSION_COOKIE_NAME)
  if (!token) return null
  const decoded = verifyToken(event, token)
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
      message: 'Non autorisé. Veuillez vous connecter.'
    })
  }
  return user
}

export const requireVerifiedUser = async (event: H3Event) => {
  const user = await requireAuthUser(event)
  if (!user.isVerified) {
    throw createError({
      statusCode: 403,
      message: 'Veuillez vérifier votre adresse email avant d\'effectuer cette action.'
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
