import { createError, defineEventHandler, getHeader, getRequestURL } from 'h3'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * Session authentication uses a browser cookie. SameSite=Lax is the primary
 * browser defence; this rejects every cross-origin state-changing request,
 * including login CSRF before a session cookie exists.
 */
export default defineEventHandler((event) => {
  if (SAFE_METHODS.has(event.method)) return

  const origin = getHeader(event, 'origin')
  const requestHost = getRequestURL(event).host

  let originHost = ''
  try {
    originHost = origin ? new URL(origin).host : ''
  } catch {
    originHost = ''
  }

  // Compare hosts rather than protocols: TLS is often terminated by a reverse
  // proxy, while the browser still correctly protects the Secure cookie.
  if (!originHost || originHost !== requestHost) {
    throw createError({
      statusCode: 403,
      message: 'Requete inter-origine refusee.'
    })
  }
})
