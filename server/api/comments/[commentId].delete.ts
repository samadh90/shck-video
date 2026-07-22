import { defineEventHandler, createError, getRouterParam } from 'h3'
import { db, schema } from '~/server/utils/db'
import { eq } from 'drizzle-orm'
import { requireAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const currentUser = await requireAuthUser(event)
  const commentIdParam = getRouterParam(event, 'commentId') || ''
  const commentId = parseInt(commentIdParam, 10)

  if (!commentId || isNaN(commentId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID commentaire invalide.'
    })
  }

  const commentCheck = await db.select().from(schema.comments)
    .where(eq(schema.comments.id, commentId))
    .limit(1)

  if (!commentCheck.length) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Commentaire introuvable.'
    })
  }

  const existingComment = commentCheck[0]

  if (existingComment.userId !== currentUser.id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Vous n\'êtes pas autorisé à supprimer ce commentaire.'
    })
  }

  await db.delete(schema.comments).where(eq(schema.comments.id, commentId))

  return {
    message: 'Commentaire supprimé avec succès.'
  }
})
