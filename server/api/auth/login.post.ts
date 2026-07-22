import { defineEventHandler, readBody, createError } from 'h3'
import { db, schema } from '~~/server/utils/db'
import { eq } from 'drizzle-orm'
import { comparePassword, setSessionCookie, signToken } from '~~/server/utils/auth'
import { enforceRateLimit } from '~~/server/utils/rate-limit'

export default defineEventHandler(async (event) => {
  enforceRateLimit(event, { name: 'auth:login', limit: 10, windowMs: 15 * 60 * 1000 })

  const body = await readBody(event)
  const { email, password } = body || {}
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''

  if (!normalizedEmail || typeof password !== 'string' || !password) {
    throw createError({
      statusCode: 400,
      message: 'Veuillez saisir votre email et votre mot de passe.'
    })
  }

  const usersList = await db.select().from(schema.users).where(eq(schema.users.email, normalizedEmail)).limit(1)
  if (!usersList.length) {
    // Incorrect credentials are an expected form outcome, not a server error.
    // Returning a structured response keeps the dev server and the UI quiet.
    return { success: false, message: 'Identifiants incorrects.' }
  }

  const user = usersList[0]!
  const isValid = await comparePassword(password, user.password)
  if (!isValid) {
    return { success: false, message: 'Identifiants incorrects.' }
  }

  const token = signToken(event, { userId: user.id, email: user.email })
  setSessionCookie(event, token)

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
    }
  }
})
