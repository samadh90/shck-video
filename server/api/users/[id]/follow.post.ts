import { defineEventHandler, createError, getRouterParam } from 'h3'
import { db, schema } from '~/server/utils/db'
import { eq, and, sql } from 'drizzle-orm'
import { requireAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const currentUser = await requireAuthUser(event)
  const paramId = getRouterParam(event, 'id')
  const followingId = parseInt(paramId || '', 10)

  if (!followingId || isNaN(followingId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID utilisateur invalide.'
    })
  }

  if (currentUser.id === followingId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Vous ne pouvez pas vous abonner à votre propre chaîne.'
    })
  }

  const existingFollow = await db.select().from(schema.follows)
    .where(and(
      eq(schema.follows.followerId, currentUser.id),
      eq(schema.follows.followingId, followingId)
    ))
    .limit(1)

  let isFollowing = false

  if (existingFollow.length > 0) {
    // Désabonnement
    await db.delete(schema.follows)
      .where(and(
        eq(schema.follows.followerId, currentUser.id),
        eq(schema.follows.followingId, followingId)
      ))
    isFollowing = false
  } else {
    // Abonnement
    await db.insert(schema.follows).values({
      followerId: currentUser.id,
      followingId
    })
    isFollowing = true

    // Notification au créateur
    await db.insert(schema.notifications).values({
      userId: followingId,
      message: `${currentUser.username} s'est abonné à votre chaîne !`,
      link: `/user/${currentUser.id}`
    })
  }

  const followersResult = await db.select({ count: sql<number>`count(*)` })
    .from(schema.follows)
    .where(eq(schema.follows.followingId, followingId))

  return {
    isFollowing,
    subscribersCount: Number(followersResult[0]?.count || 0)
  }
})
