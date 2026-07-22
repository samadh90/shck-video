import { defineEventHandler, createError, readBody, getRouterParam } from 'h3'
import { db, schema } from '~~/server/utils/db'
import { eq, and, sql } from 'drizzle-orm'
import { requireAuthUser } from '~~/server/utils/auth'
import { enforceRateLimit } from '~~/server/utils/rate-limit'

export default defineEventHandler(async (event) => {
  const currentUser = await requireAuthUser(event)
  enforceRateLimit(event, { name: 'user:rate', limit: 10, windowMs: 60 * 1000, userId: currentUser.id })
  const paramId = getRouterParam(event, 'id')
  const targetUserId = parseInt(paramId || '', 10)

  if (!targetUserId || isNaN(targetUserId)) {
    throw createError({
      statusCode: 400,
      message: 'ID utilisateur invalide.'
    })
  }

  if (currentUser.id === targetUserId) {
    throw createError({
      statusCode: 400,
      message: 'Vous ne pouvez pas noter votre propre profil.'
    })
  }

  const body = await readBody(event)
  const stars = parseInt(body?.stars, 10)

  if (isNaN(stars) || stars < 1 || stars > 5) {
    throw createError({
      statusCode: 400,
      message: 'La note doit être comprise entre 1 et 5 étoiles.'
    })
  }

  const existingRating = await db.select().from(schema.ratings)
    .where(and(
      eq(schema.ratings.targetUserId, targetUserId),
      eq(schema.ratings.userId, currentUser.id)
    ))
    .limit(1)

  if (existingRating.length > 0) {
    await db.update(schema.ratings)
      .set({ stars })
      .where(and(
        eq(schema.ratings.targetUserId, targetUserId),
        eq(schema.ratings.userId, currentUser.id)
      ))
  } else {
    await db.insert(schema.ratings).values({
      stars,
      targetUserId,
      userId: currentUser.id
    })

    await db.insert(schema.notifications).values({
      userId: targetUserId,
      message: `${currentUser.username} a évalué votre chaîne ${stars} ⭐ !`,
      link: `/user/${targetUserId}`
    })
  }

  const ratingResult = await db.select({
    average: sql<number>`avg(${schema.ratings.stars})`,
    count: sql<number>`count(*)`
  })
  .from(schema.ratings)
  .where(eq(schema.ratings.targetUserId, targetUserId))

  return {
    averageRating: ratingResult[0]?.average ? parseFloat(Number(ratingResult[0].average).toFixed(1)) : stars,
    ratingsCount: Number(ratingResult[0]?.count || 1),
    userRating: stars
  }
})
