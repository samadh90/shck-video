import { defineEventHandler } from 'h3'
import { requireAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    avatar: user.avatar,
    bio: user.bio,
    isVerified: user.isVerified,
    birthdate: user.birthdate
  }
})
