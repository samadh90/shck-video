import { defineEventHandler, createError, getRouterParam } from 'h3'
import { db, schema } from '~~/server/utils/db'
import { eq, and, sql } from 'drizzle-orm'
import { getUserFromEvent } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const idOrCustomId = getRouterParam(event, 'id') || ''

  if (!idOrCustomId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Identifiant vidéo manquant.'
    })
  }

  // 1. Recherche par customId (NanoID)
  let videoList = await db.select({
    video: schema.videos,
    user: {
      id: schema.users.id,
      username: schema.users.username,
      avatar: schema.users.avatar,
      bio: schema.users.bio
    }
  })
  .from(schema.videos)
  .innerJoin(schema.users, eq(schema.videos.userId, schema.users.id))
  .where(eq(schema.videos.customId, idOrCustomId))
  .limit(1)

  // 2. Repli sur l'ID numérique s'il ne correspond pas à un customId
  if (!videoList.length) {
    const numericId = parseInt(idOrCustomId, 10)
    if (!isNaN(numericId)) {
      videoList = await db.select({
        video: schema.videos,
        user: {
          id: schema.users.id,
          username: schema.users.username,
          avatar: schema.users.avatar,
          bio: schema.users.bio
        }
      })
      .from(schema.videos)
      .innerJoin(schema.users, eq(schema.videos.userId, schema.users.id))
      .where(eq(schema.videos.id, numericId))
      .limit(1)
    }
  }

  if (!videoList.length) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Vidéo introuvable.'
    })
  }

  const targetVideo = videoList[0]!.video
  const videoUser = videoList[0]!.user

  // Incrémenter le nombre de vues
  await db.update(schema.videos)
    .set({ views: sql`${schema.videos.views} + 1` })
    .where(eq(schema.videos.id, targetVideo.id))

  const currentUser = await getUserFromEvent(event)

  // Statistiques de Likes / Dislikes
  const likesCountResult = await db.select({ count: sql<number>`count(*)` })
    .from(schema.likes)
    .where(and(eq(schema.likes.videoId, targetVideo.id), eq(schema.likes.isLike, true)))

  const dislikesCountResult = await db.select({ count: sql<number>`count(*)` })
    .from(schema.likes)
    .where(and(eq(schema.likes.videoId, targetVideo.id), eq(schema.likes.isLike, false)))

  let userLikeStatus: boolean | null = null
  if (currentUser) {
    const userLikeCheck = await db.select().from(schema.likes)
      .where(and(eq(schema.likes.videoId, targetVideo.id), eq(schema.likes.userId, currentUser.id)))
      .limit(1)
    if (userLikeCheck.length > 0) {
      userLikeStatus = userLikeCheck[0]!.isLike
    }
  }

  // Statut d'abonnement au créateur de la vidéo
  let isFollowing = false
  let subscribersCount = 0

  const subsResult = await db.select({ count: sql<number>`count(*)` })
    .from(schema.follows)
    .where(eq(schema.follows.followingId, videoUser.id))
  subscribersCount = Number(subsResult[0]?.count || 0)

  if (currentUser) {
    const followCheck = await db.select().from(schema.follows)
      .where(and(eq(schema.follows.followerId, currentUser.id), eq(schema.follows.followingId, videoUser.id)))
      .limit(1)
    isFollowing = followCheck.length > 0
  }

  return {
    ...targetVideo,
    views: targetVideo.views + 1,
    user: videoUser,
    likesCount: Number(likesCountResult[0]?.count || 0),
    dislikesCount: Number(dislikesCountResult[0]?.count || 0),
    userLikeStatus,
    isFollowing,
    subscribersCount
  }
})
