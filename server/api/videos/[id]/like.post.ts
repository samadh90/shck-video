import { defineEventHandler, createError, readBody, getRouterParam } from 'h3'
import { db, schema } from '~/server/utils/db'
import { eq, and, or, sql } from 'drizzle-orm'
import { requireAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const currentUser = await requireAuthUser(event)
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

  const targetVideo = videoCheck[0]
  const body = await readBody(event)
  const { isLike } = body || {}

  if (typeof isLike !== 'boolean') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Le champ isLike (boolean) est requis.'
    })
  }

  const existingLike = await db.select().from(schema.likes)
    .where(and(
      eq(schema.likes.videoId, targetVideo.id),
      eq(schema.likes.userId, currentUser.id)
    ))
    .limit(1)

  let userLikeStatus: boolean | null = null

  if (existingLike.length > 0) {
    if (existingLike[0].isLike === isLike) {
      // Toggle off
      await db.delete(schema.likes)
        .where(and(
          eq(schema.likes.videoId, targetVideo.id),
          eq(schema.likes.userId, currentUser.id)
        ))
      userLikeStatus = null
    } else {
      // Switch like/dislike
      await db.update(schema.likes)
        .set({ isLike })
        .where(and(
          eq(schema.likes.videoId, targetVideo.id),
          eq(schema.likes.userId, currentUser.id)
        ))
      userLikeStatus = isLike
    }
  } else {
    // Premier vote
    await db.insert(schema.likes).values({
      videoId: targetVideo.id,
      userId: currentUser.id,
      isLike
    })
    userLikeStatus = isLike

    // Notification au propriétaire de la vidéo
    if (targetVideo.userId !== currentUser.id) {
      await db.insert(schema.notifications).values({
        userId: targetVideo.userId,
        message: `${currentUser.username} a ${isLike ? 'aimé' : 'n\'a pas aimé'} votre vidéo "${targetVideo.title}".`,
        link: `/video/${targetVideo.customId || targetVideo.id}`
      })
    }
  }

  const likesCountResult = await db.select({ count: sql<number>`count(*)` })
    .from(schema.likes)
    .where(and(eq(schema.likes.videoId, targetVideo.id), eq(schema.likes.isLike, true)))

  const dislikesCountResult = await db.select({ count: sql<number>`count(*)` })
    .from(schema.likes)
    .where(and(eq(schema.likes.videoId, targetVideo.id), eq(schema.likes.isLike, false)))

  return {
    likesCount: Number(likesCountResult[0]?.count || 0),
    dislikesCount: Number(dislikesCountResult[0]?.count || 0),
    userLikeStatus
  }
})
