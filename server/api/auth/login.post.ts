import { defineEventHandler, readBody, createError } from 'h3'
import { db, schema } from '~~/server/utils/db'
import { eq } from 'drizzle-orm'
import { comparePassword, signToken } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body || {}
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''

  if (!normalizedEmail || typeof password !== 'string' || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Veuillez saisir votre email et votre mot de passe.'
    })
  }

  const usersList = await db.select().from(schema.users).where(eq(schema.users.email, normalizedEmail)).limit(1)
  if (!usersList.length) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Identifiants incorrects.'
    })
  }

  const user = usersList[0]!
  const isValid = await comparePassword(password, user.password)
  if (!isValid) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Identifiants incorrects.'
    })
  }

  const token = signToken({ userId: user.id, email: user.email })

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      isVerified: user.isVerified,
      birthdate: user.birthdate
    },
    token
  }
})
