import { defineEventHandler, createError, getRouterParam } from 'h3'
import { db, schema } from '~~/server/utils/db'
import { eq, or } from 'drizzle-orm'
import { requireAuthUser } from '~~/server/utils/auth'
import fs from 'fs'
import path from 'path'

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

  const video = videoCheck[0]

  if (video.userId !== currentUser.id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Vous n\'êtes pas autorisé à supprimer cette vidéo.'
    })
  }

  // Suppression des fichiers physiques si présents
  const videosDir = path.resolve(process.cwd(), 'public/uploads/videos')
  const thumbsDir = path.resolve(process.cwd(), 'public/uploads/thumbnails')

  if (video.filename) {
    const vPath = path.join(videosDir, video.filename)
    if (fs.existsSync(vPath)) fs.unlinkSync(vPath)
  }
  if (video.thumbnail) {
    const tPath = path.join(thumbsDir, video.thumbnail)
    if (fs.existsSync(tPath)) fs.unlinkSync(tPath)
  }

  await db.delete(schema.videos).where(eq(schema.videos.id, video.id))

  return {
    message: 'Vidéo supprimée avec succès.'
  }
})
