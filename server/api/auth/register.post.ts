import { defineEventHandler, readBody, createError } from 'h3'
import { db, schema } from '~~/server/utils/db'
import { eq } from 'drizzle-orm'
import { hashPassword, signToken, generateNanoId } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, username, password } = body || {}
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
  const normalizedUsername = typeof username === 'string' ? username.trim() : ''

  if (!normalizedEmail || !normalizedUsername || typeof password !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Veuillez remplir tous les champs obligatoires.'
    })
  }

  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    throw createError({ statusCode: 400, statusMessage: 'Adresse email invalide.' })
  }

  if (normalizedUsername.length < 3 || normalizedUsername.length > 32) {
    throw createError({ statusCode: 400, statusMessage: 'Le nom d’utilisateur doit contenir entre 3 et 32 caractères.' })
  }

  if (password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'Le mot de passe doit contenir au moins 8 caractères.' })
  }

  // Vérification si email existe
  const existingUser = await db.select().from(schema.users).where(eq(schema.users.email, normalizedEmail)).limit(1)
  if (existingUser.length > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Cet email est déjà utilisé.'
    })
  }

  const hashedPassword = await hashPassword(password)
  const verificationToken = generateNanoId(16)

  const [newUser] = await db.insert(schema.users).values({
    email: normalizedEmail,
    username: normalizedUsername,
    password: hashedPassword,
    isVerified: false,
    verificationToken
  }).returning()

  const token = signToken({ userId: newUser.id, email: newUser.email })

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
    token,
    message: 'Compte créé avec succès.'
  }
})
