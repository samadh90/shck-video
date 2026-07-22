import { defineEventHandler, createError, readBody, getRouterParam } from 'h3'
import { db, schema } from '~~/server/utils/db'
import { eq, or } from 'drizzle-orm'
import { requireVerifiedUser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const currentUser = await requireVerifiedUser(event)
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
  const { content, parentId } = body || {}

  if (!content || !content.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Le commentaire ne peut pas être vide.'
    })
  }

  const [newComment] = await db.insert(schema.comments).values({
    content: content.trim(),
    videoId: targetVideo.id,
    userId: currentUser.id,
    parentId: parentId ? parseInt(parentId, 10) : null
  }).returning()

  // Notification au propriétaire de la vidéo
  if (targetVideo.userId !== currentUser.id) {
    await db.insert(schema.notifications).values({
      userId: targetVideo.userId,
      message: `${currentUser.username} a commenté votre vidéo "${targetVideo.title}".`,
      link: `/video/${targetVideo.customId || targetVideo.id}`
    })
  }

  return {
    ...newComment,
    user: {
      id: currentUser.id,
      username: currentUser.username,
      avatar: currentUser.avatar
    },
    replies: []
  }
})
