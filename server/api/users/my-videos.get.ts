import { defineEventHandler } from 'h3'
import { db, schema } from '~/server/utils/db'
import { eq, desc } from 'drizzle-orm'
import { requireAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const currentUser = await requireAuthUser(event)

  const myVideos = await db.select().from(schema.videos)
    .where(eq(schema.videos.userId, currentUser.id))
    .orderBy(desc(schema.videos.createdAt))

  return myVideos
})
