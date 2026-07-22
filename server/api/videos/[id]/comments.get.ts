import { defineEventHandler, createError, getRouterParam } from 'h3'
import { db, schema } from '~~/server/utils/db'
import { eq, or, isNull, asc, and, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const idOrCustomId = getRouterParam(event, 'id') || ''

  const numericId = parseInt(idOrCustomId, 10)
  const videoCheck = await db.select().from(schema.videos)
    .where(or(
      eq(schema.videos.customId, idOrCustomId),
      !isNaN(numericId) ? eq(schema.videos.id, numericId) : eq(schema.videos.customId, idOrCustomId)
    ))
    .limit(1)

  if (!videoCheck.length) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Vidéo introuvable.'
    })
  }

  const targetVideo = videoCheck[0]!

  // Commentaires parents
  const topComments = await db.select({
    comment: schema.comments,
    user: {
      id: schema.users.id,
      username: schema.users.username,
      avatar: schema.users.avatar
    }
  })
  .from(schema.comments)
  .innerJoin(schema.users, eq(schema.comments.userId, schema.users.id))
  .where(and(
    eq(schema.comments.videoId, targetVideo.id),
    isNull(schema.comments.parentId)
  ))
  .orderBy(asc(schema.comments.createdAt))

  // Réponses
  const allReplies = await db.select({
    comment: schema.comments,
    user: {
      id: schema.users.id,
      username: schema.users.username,
      avatar: schema.users.avatar
    }
  })
  .from(schema.comments)
  .innerJoin(schema.users, eq(schema.comments.userId, schema.users.id))
  .where(and(
    eq(schema.comments.videoId, targetVideo.id),
    sql`${schema.comments.parentId} IS NOT NULL`
  ))
  .orderBy(asc(schema.comments.createdAt))

  const repliesByParentId = new Map<number, any[]>()
  for (const r of allReplies) {
    const pid = r.comment.parentId!
    if (!repliesByParentId.has(pid)) {
      repliesByParentId.set(pid, [])
    }
    repliesByParentId.get(pid)!.push({
      ...r.comment,
      user: r.user
    })
  }

  return topComments.map(c => ({
    ...c.comment,
    user: c.user,
    replies: repliesByParentId.get(c.comment.id) || []
  }))
})
