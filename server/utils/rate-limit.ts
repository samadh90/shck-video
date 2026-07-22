import { createError, getRequestIP, setResponseHeader, type H3Event } from 'h3'

type RateLimitOptions = {
  /** A stable name for this protected action, used only for internal buckets and logs. */
  name: string
  limit: number
  windowMs: number
  userId?: number
}

type RateLimitEntry = {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()
const MAX_RATE_LIMIT_ENTRIES = 10_000

const pruneRateLimitStore = (now: number): void => {
  for (const [key, entry] of rateLimitStore) {
    if (entry.resetAt <= now) rateLimitStore.delete(key)
  }

  // A hostile stream of distinct IPs must not make the local protection unbounded.
  while (rateLimitStore.size >= MAX_RATE_LIMIT_ENTRIES) {
    const oldestKey = rateLimitStore.keys().next().value
    if (!oldestKey) break
    rateLimitStore.delete(oldestKey)
  }
}

const getClientIp = (event: H3Event): string => {
  // Forwarded headers must only be trusted when the hosting proxy is explicitly trusted.
  return getRequestIP(event, { xForwardedFor: process.env.TRUST_PROXY === 'true' }) ?? 'unknown'
}

const consumeBucket = (key: string, limit: number, windowMs: number, now: number) => {
  const existing = rateLimitStore.get(key)
  const entry = !existing || existing.resetAt <= now
    ? { count: 0, resetAt: now + windowMs }
    : existing

  entry.count += 1
  rateLimitStore.set(key, entry)

  return {
    allowed: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt
  }
}

const setRateLimitHeaders = (event: H3Event, limit: number, remaining: number, resetAt: number) => {
  setResponseHeader(event, 'RateLimit-Limit', String(limit))
  setResponseHeader(event, 'RateLimit-Remaining', String(remaining))
  setResponseHeader(event, 'RateLimit-Reset', String(Math.ceil(resetAt / 1000)))
}

/**
 * In-memory fixed-window rate limit for a single Nitro instance.
 *
 * Authenticated actions consume both a user and an IP bucket: an account cannot
 * bypass the limit by changing IP, and an IP cannot bypass it by rotating accounts.
 * Deployments with multiple instances must replace this shared in-memory store with
 * Redis or an equivalent shared backend.
 */
export const enforceRateLimit = (event: H3Event, options: RateLimitOptions): void => {
  const now = Date.now()
  pruneRateLimitStore(now)

  const identities = [
    `ip:${getClientIp(event)}`,
    ...(options.userId === undefined ? [] : [`user:${options.userId}`])
  ]

  const results = identities.map(identity => ({
    identity,
    ...consumeBucket(`${options.name}:${identity}`, options.limit, options.windowMs, now)
  }))
  const rejected = results.find(result => !result.allowed)
  const mostRestrictive = results.reduce((current, result) => result.remaining < current.remaining ? result : current)

  setRateLimitHeaders(event, options.limit, mostRestrictive.remaining, mostRestrictive.resetAt)

  if (!rejected) return

  const retryAfter = Math.max(1, Math.ceil((rejected.resetAt - now) / 1000))
  setResponseHeader(event, 'Retry-After', retryAfter)

  console.warn('[rate-limit] request rejected', {
    action: options.name,
    scope: rejected.identity.startsWith('user:') ? 'user' : 'ip',
    retryAfter
  })

  throw createError({
    statusCode: 429,
    message: `Trop de requêtes. Réessayez dans ${retryAfter} seconde${retryAfter > 1 ? 's' : ''}.`
  })
}
