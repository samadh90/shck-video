export default defineNuxtRouteMiddleware(async (to) => {
  const token = useCookie<string | null>('auth_token')

  if (!token.value) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }

  if (import.meta.server) {
    const event = useRequestEvent()
    const { getUserFromEvent } = await import('~~/server/utils/auth')

    if (!event || !await getUserFromEvent(event)) {
      return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
    }
  }
})
