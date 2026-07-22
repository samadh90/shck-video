import { defineEventHandler, createError, readMultipartFormData, getRouterParam } from 'h3'
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

  const existingVideo = videoCheck[0]!

  if (existingVideo.userId !== currentUser.id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Vous n\'êtes pas autorisé à modifier cette vidéo.'
    })
  }

  const formData = await readMultipartFormData(event)

  let title = existingVideo.title
  let description = existingVideo.description
  let category = existingVideo.category
  let visibility = existingVideo.visibility
  let is18Plus = existingVideo.is18Plus
  let thumbnailFilename = existingVideo.thumbnail

  const thumbsDir = path.resolve(process.cwd(), 'public/uploads/thumbnails')

  if (formData && formData.length) {
    for (const part of formData) {
      if (part.name === 'title') {
        title = part.data.toString('utf-8')
      } else if (part.name === 'description') {
        description = part.data.toString('utf-8')
      } else if (part.name === 'category') {
        category = part.data.toString('utf-8')
      } else if (part.name === 'visibility') {
        visibility = part.data.toString('utf-8')
      } else if (part.name === 'is18Plus') {
        is18Plus = part.data.toString('utf-8') === 'true'
      } else if (part.name === 'thumbnail' && part.filename) {
        const ext = path.extname(part.filename) || '.jpg'
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext
        const destPath = path.join(thumbsDir, uniqueName)
        fs.writeFileSync(destPath, part.data)
        thumbnailFilename = uniqueName
      }
    }
  }

  const [updatedVideo] = await db.update(schema.videos)
    .set({
      title,
      description,
      category,
      visibility,
      is18Plus,
      thumbnail: thumbnailFilename
    })
    .where(eq(schema.videos.id, existingVideo.id))
    .returning()
  if (!updatedVideo) throw createError({ statusCode: 404, statusMessage: 'Vidéo introuvable.' })

  return {
    message: 'Vidéo mise à jour avec succès.',
    video: updatedVideo
  }
})
