import { defineEventHandler } from 'h3'
import { db, schema } from '~~/server/utils/db'
import { eq, desc } from 'drizzle-orm'
import { requireAuthUser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const currentUser = await requireAuthUser(event)

  const myCommentsList = await db.select({
    comment: schema.comments,
    video: {
      id: schema.videos.id,
      customId: schema.videos.customId,
      title: schema.videos.title
    }
  })
  .from(schema.comments)
  .innerJoin(schema.videos, eq(schema.comments.videoId, schema.videos.id))
  .where(eq(schema.comments.userId, currentUser.id))
  .orderBy(desc(schema.comments.createdAt))

  return myCommentsList.map(item => ({
    ...item.comment,
    video: item.video
  }))
})
