import type { AuthUser } from '#shared/types/models'

/**
 * Seed the serialized Nuxt state from the HttpOnly session cookie during SSR.
 * This keeps the first server and client render identical.
 */
export default defineNuxtPlugin(async () => {
  const event = useRequestEvent()
  if (!event) return

  const { getUserFromEvent } = await import('~~/server/utils/auth')
  const currentUser = await getUserFromEvent(event)
  if (!currentUser) return

  const user: AuthUser = {
    id: currentUser.id,
    email: currentUser.email,
    username: currentUser.username,
    avatar: currentUser.avatar,
    bio: currentUser.bio,
    isVerified: currentUser.isVerified,
    birthdate: currentUser.birthdate
  }

  useAuth().setAuth(user)
})
