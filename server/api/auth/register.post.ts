import { defineEventHandler, readBody, createError } from 'h3'
import { db, schema } from '~~/server/utils/db'
import { eq } from 'drizzle-orm'
import { hashPassword, signToken, generateNanoId } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, username, password } = body || {}

  if (!email || !username || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Veuillez remplir tous les champs obligatoires.'
    })
  }

  // Vérification si email existe
  const existingUser = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1)
  if (existingUser.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cet email est déjà utilisé.'
    })
  }

  const hashedPassword = await hashPassword(password)
  const verificationToken = generateNanoId(16)

  const [newUser] = await db.insert(schema.users).values({
    email,
    username,
    password: hashedPassword,
    isVerified: false,
    verificationToken
  }).returning()

  const token = signToken({ userId: newUser.id, email: newUser.email })

  return {
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
