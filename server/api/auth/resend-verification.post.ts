import { createError, defineEventHandler } from 'h3'
import { eq } from 'drizzle-orm'
import { db, schema } from '~~/server/utils/db'
import { generateEmailVerificationToken, hashEmailVerificationToken, requireAuthUser } from '~~/server/utils/auth'
import { getVerificationTokenExpiry, sendVerificationEmail } from '~~/server/utils/email'
import { enforceRateLimit } from '~~/server/utils/rate-limit'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  enforceRateLimit(event, { name: 'auth:resend-verification', limit: 3, windowMs: 15 * 60 * 1000, userId: user.id })

  if (user.isVerified) {
    return { success: true, message: 'Cette adresse e-mail est déjà vérifiée.' }
  }

  const rawToken = generateEmailVerificationToken()

  await db.update(schema.users)
    .set({
      verificationToken: hashEmailVerificationToken(rawToken),
      verificationTokenExpiresAt: getVerificationTokenExpiry()
    })
    .where(eq(schema.users.id, user.id))

  const developmentVerificationUrl = await sendVerificationEmail(user.email, rawToken)

  return {
    success: true,
    message: 'Un nouveau lien de vérification a été envoyé.',
    developmentVerificationUrl: developmentVerificationUrl || undefined
  }
})
