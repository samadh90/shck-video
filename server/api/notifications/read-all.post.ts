import { defineEventHandler } from 'h3'
import { db, schema } from '~/server/utils/db'
import { eq } from 'drizzle-orm'
import { requireAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const currentUser = await requireAuthUser(event)

  await db.update(schema.notifications)
    .set({ read: true })
    .where(eq(schema.notifications.userId, currentUser.id))

  return {
    message: 'Toutes les notifications ont été marquées comme lues.'
  }
})
