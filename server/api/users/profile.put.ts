import { defineEventHandler, readBody } from 'h3'
import { db, schema } from '~~/server/utils/db'
import { eq } from 'drizzle-orm'
import { requireAuthUser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const currentUser = await requireAuthUser(event)
  const body = await readBody(event)
  const { username, bio, avatar, birthdate } = body || {}

  const [updatedUser] = await db.update(schema.users)
    .set({
      ...(username !== undefined ? { username } : {}),
      ...(bio !== undefined ? { bio } : {}),
      ...(avatar !== undefined ? { avatar } : {}),
      ...(birthdate !== undefined ? { birthdate } : {})
    })
    .where(eq(schema.users.id, currentUser.id))
    .returning()

  return {
    message: 'Profil mis à jour avec succès.',
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
