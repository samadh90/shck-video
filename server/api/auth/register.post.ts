import { defineEventHandler, readBody, createError } from 'h3'
import { db, schema } from '~~/server/utils/db'
import { eq } from 'drizzle-orm'
import { hashPassword, signToken, generateEmailVerificationToken, hashEmailVerificationToken, setSessionCookie } from '~~/server/utils/auth'
import { getVerificationTokenExpiry, sendVerificationEmail } from '~~/server/utils/email'
import { enforceRateLimit } from '~~/server/utils/rate-limit'

export default defineEventHandler(async (event) => {
  enforceRateLimit(event, { name: 'auth:register', limit: 5, windowMs: 60 * 60 * 1000 })

  const body = await readBody(event)
  const { email, username, password } = body || {}
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
  const normalizedUsername = typeof username === 'string' ? username.trim() : ''

  if (!normalizedEmail || !normalizedUsername || typeof password !== 'string') {
    throw createError({
      statusCode: 400,
      message: 'Veuillez remplir tous les champs obligatoires.'
    })
  }

  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    throw createError({ statusCode: 400, message: 'Adresse email invalide.' })
  }

  if (normalizedUsername.length < 3 || normalizedUsername.length > 32) {
    throw createError({ statusCode: 400, message: 'Le nom d’utilisateur doit contenir entre 3 et 32 caractères.' })
  }

  if (password.length < 8) {
    throw createError({ statusCode: 400, message: 'Le mot de passe doit contenir au moins 8 caractères.' })
  }

  // Vérification si email existe
  const existingUser = await db.select().from(schema.users).where(eq(schema.users.email, normalizedEmail)).limit(1)
  if (existingUser.length > 0) {
    throw createError({
      statusCode: 409,
      message: 'Cet email est déjà utilisé.'
    })
  }

  const hashedPassword = await hashPassword(password)
  const rawVerificationToken = generateEmailVerificationToken()

  const [newUser] = await db.insert(schema.users).values({
    email: normalizedEmail,
    username: normalizedUsername,
    password: hashedPassword,
    isVerified: false,
    verificationToken: hashEmailVerificationToken(rawVerificationToken),
    verificationTokenExpiresAt: getVerificationTokenExpiry()
  }).returning()
  if (!newUser) throw createError({ statusCode: 500, message: 'Impossible de créer le compte.' })

  const developmentVerificationUrl = await sendVerificationEmail(newUser.email, rawVerificationToken)

  const token = signToken(event, { userId: newUser.id, email: newUser.email })
  setSessionCookie(event, token)

  return {
    success: true,
    user: {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      avatar: newUser.avatar,
      bio: newUser.bio,
      isVerified: newUser.isVerified,
      birthdate: newUser.birthdate
    },
    message: 'Compte créé avec succès.',
    developmentVerificationUrl: developmentVerificationUrl || undefined
  }
})
