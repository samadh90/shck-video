import { defineEventHandler } from 'h3'
import { db, schema } from '~~/server/utils/db'
import { eq } from 'drizzle-orm'
import { requireAuthUser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)

  const [updatedUser] = await db.update(schema.users)
    .set({ isVerified: true, verificationToken: null })
    .where(eq(schema.users.id, user.id))
    .returning()

  return {
    message: 'Votre adresse email a été vérifiée avec succès !',
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      avatar: updatedUser.avatar,
      bio: updatedUser.bio,
      isVerified: updatedUser.isVerified,
      birthdate: updatedUser.birthdate
    }
  }
})
