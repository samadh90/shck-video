import { defineEventHandler } from 'h3'
import { db, schema } from '~/server/utils/db'
import { eq, desc } from 'drizzle-orm'
import { requireAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const currentUser = await requireAuthUser(event)

  const notifs = await db.select().from(schema.notifications)
    .where(eq(schema.notifications.userId, currentUser.id))
    .orderBy(desc(schema.notifications.createdAt))

  const unreadCount = notifs.filter(n => !n.read).length

  return {
    notifications: notifs,
    unreadCount
  }
})
