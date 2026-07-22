import { defineEventHandler } from 'h3'
import { db, schema } from '~~/server/utils/db'
import { eq } from 'drizzle-orm'
import { requireAuthUser } from '~~/server/utils/auth'
import { enforceRateLimit } from '~~/server/utils/rate-limit'

export default defineEventHandler(async (event) => {
  const currentUser = await requireAuthUser(event)
  enforceRateLimit(event, { name: 'notifications:read-all', limit: 30, windowMs: 60 * 1000, userId: currentUser.id })

  await db.update(schema.notifications)
    .set({ read: true })
    .where(eq(schema.notifications.userId, currentUser.id))

  return {
    message: 'Toutes les notifications ont été marquées comme lues.'
  }
})
