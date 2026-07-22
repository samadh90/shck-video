import { createError, defineEventHandler, getQuery } from 'h3'
import { and, eq } from 'drizzle-orm'
import { db, schema } from '~~/server/utils/db'
import { hashEmailVerificationToken } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const token = typeof query.token === 'string' ? query.token : ''

  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Jeton de vérification manquant.' })
  }

  const tokenHash = hashEmailVerificationToken(token)
  const users = await db.select().from(schema.users)
    .where(eq(schema.users.verificationToken, tokenHash))
    .limit(1)
  const user = users[0]

  if (!user || !user.verificationTokenExpiresAt || new Date(user.verificationTokenExpiresAt).getTime() <= Date.now()) {
    throw createError({ statusCode: 400, statusMessage: 'Ce lien de vérification est invalide ou expiré.' })
  }

  const [updatedUser] = await db.update(schema.users)
    .set({
      isVerified: true,
      verificationToken: null,
      verificationTokenExpiresAt: null
    })
    .where(and(
      eq(schema.users.id, user.id),
      eq(schema.users.verificationToken, tokenHash),
      eq(schema.users.isVerified, false)
    ))
    .returning()

  if (!updatedUser) {
    throw createError({ statusCode: 400, statusMessage: 'Ce lien de vérification a déjà été utilisé.' })
  }

  return { success: true, message: 'Votre adresse e-mail a été vérifiée.' }
})
