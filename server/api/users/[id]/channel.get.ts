import { defineEventHandler, createError, getRouterParam } from 'h3'
import { db, schema } from '~~/server/utils/db'
import { eq, and, sql } from 'drizzle-orm'
import { getUserFromEvent } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const paramId = getRouterParam(event, 'id')
  const targetUserId = parseInt(paramId || '', 10)

  if (!targetUserId || isNaN(targetUserId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID utilisateur invalide.'
    })
  }

  const currentUser = await getUserFromEvent(event)

  const usersList = await db.select({
    id: schema.users.id,
    username: schema.users.username,
    avatar: schema.users.avatar,
    bio: schema.users.bio,
    createdAt: schema.users.createdAt
  })
  .from(schema.users)
  .where(eq(schema.users.id, targetUserId))
  .limit(1)

  if (!usersList.length) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Chaîne introuvable.'
    })
  }

  const channelUser = usersList[0]

  // Compte des abonnés
  const followersResult = await db.select({ count: sql<number>`count(*)` })
    .from(schema.follows)
    .where(eq(schema.follows.followingId, targetUserId))
  const followersCount = Number(followersResult[0]?.count || 0)

  // Vérifier si l'utilisateur courant s'est abonné
  let isFollowing = false
  if (currentUser) {
    const followCheck = await db.select().from(schema.follows)
      .where(and(
        eq(schema.follows.followerId, currentUser.id),
        eq(schema.follows.followingId, targetUserId)
      ))
      .limit(1)
    isFollowing = followCheck.length > 0
  }

  // Évaluation moyenne en étoiles
  const ratingResult = await db.select({
    average: sql<number>`avg(${schema.ratings.stars})`,
    count: sql<number>`count(*)`
  })
  .from(schema.ratings)
  .where(eq(schema.ratings.targetUserId, targetUserId))

  const averageRating = ratingResult[0]?.average ? parseFloat(Number(ratingResult[0].average).toFixed(1)) : 0
  const ratingsCount = Number(ratingResult[0]?.count || 0)

  // Note de l'utilisateur courant si connecté
  let userRating: number | null = null
  if (currentUser) {
    const userRatingCheck = await db.select().from(schema.ratings)
      .where(and(
        eq(schema.ratings.targetUserId, targetUserId),
        eq(schema.ratings.userId, currentUser.id)
      ))
      .limit(1)
    if (userRatingCheck.length > 0) {
      userRating = userRatingCheck[0].stars
    }
  }

  // Vidéos publiques du créateur
  const channelVideos = await db.select().from(schema.videos)
    .where(and(
      eq(schema.videos.userId, targetUserId),
      eq(schema.videos.visibility, 'PUBLIC')
    ))

  return {
    channel: {
      ...channelUser,
      followersCount,
      isFollowing,
      averageRating,
      ratingsCount,
      userRating,
      videos: channelVideos
    }
  }
})
