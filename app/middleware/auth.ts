export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) {
    const event = useRequestEvent()
    const { getUserFromEvent } = await import('~~/server/utils/auth')

    if (!event || !await getUserFromEvent(event)) {
      return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
    }
    return
  }

  const { isAuthenticated, loadAuth } = useAuth()
  if (!isAuthenticated.value && !await loadAuth()) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
})
