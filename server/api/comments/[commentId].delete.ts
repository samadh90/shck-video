import { defineEventHandler, createError, getRouterParam } from 'h3'
import { db, schema } from '~~/server/utils/db'
import { eq } from 'drizzle-orm'
import { requireAuthUser } from '~~/server/utils/auth'
import { enforceRateLimit } from '~~/server/utils/rate-limit'

export default defineEventHandler(async (event) => {
  const currentUser = await requireAuthUser(event)
  enforceRateLimit(event, { name: 'comment:delete', limit: 20, windowMs: 60 * 1000, userId: currentUser.id })
  const commentIdParam = getRouterParam(event, 'commentId') || ''
  const commentId = parseInt(commentIdParam, 10)

  if (!commentId || isNaN(commentId)) {
    throw createError({
      statusCode: 400,
      message: 'ID commentaire invalide.'
    })
  }

  const commentCheck = await db.select().from(schema.comments)
    .where(eq(schema.comments.id, commentId))
    .limit(1)

  if (!commentCheck.length) {
    throw createError({
      statusCode: 404,
      message: 'Commentaire introuvable.'
    })
  }

  const existingComment = commentCheck[0]!

  if (existingComment.userId !== currentUser.id) {
    throw createError({
      statusCode: 403,
      message: 'Vous n\'êtes pas autorisé à supprimer ce commentaire.'
    })
  }

  await db.delete(schema.comments).where(eq(schema.comments.id, commentId))

  return {
    message: 'Commentaire supprimé avec succès.'
  }
})
