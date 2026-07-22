import { defineEventHandler, createError, readMultipartFormData, getRouterParam, type MultiPartData } from 'h3'
import { db, schema } from '~~/server/utils/db'
import { eq, or } from 'drizzle-orm'
import { requireAuthUser } from '~~/server/utils/auth'
import { assertUploadRequestSize, removeStoredUpload, removeUpload, saveUpload, validateThumbnailFile } from '~~/server/utils/uploads'
import path from 'node:path'

const CATEGORIES = new Set(['Divertissement', 'Gaming', 'Musique', 'Tutoriel', 'Sport', 'Vlog', 'Technologie', 'Autre'])
const VISIBILITIES = new Set(['PUBLIC', 'UNLISTED', 'PRIVATE'])
const MAX_TITLE_LENGTH = 200
const MAX_DESCRIPTION_LENGTH = 10_000

function getTextPart(part: MultiPartData) {
  if (part.filename) throw createError({ statusCode: 400, message: 'Les champs texte ne peuvent pas contenir de fichier.' })
  return part.data.toString('utf-8').trim()
}

export default defineEventHandler(async (event) => {
  const currentUser = await requireAuthUser(event)
  const idOrCustomId = getRouterParam(event, 'id') || ''
  const numericId = Number.parseInt(idOrCustomId, 10)
  const videoCheck = await db.select().from(schema.videos)
    .where(or(
      eq(schema.videos.customId, idOrCustomId),
      !Number.isNaN(numericId) ? eq(schema.videos.id, numericId) : eq(schema.videos.customId, idOrCustomId)
    ))
    .limit(1)

  const existingVideo = videoCheck[0]
  if (!existingVideo) throw createError({ statusCode: 404, message: 'Vidéo introuvable.' })
  if (existingVideo.userId !== currentUser.id) {
    throw createError({ statusCode: 403, message: 'Vous n’êtes pas autorisé à modifier cette vidéo.' })
  }

  assertUploadRequestSize(event)
  const formData = await readMultipartFormData(event)
  if (!formData?.length) throw createError({ statusCode: 400, message: 'Aucune modification transmise.' })

  let title = existingVideo.title
  let description: string = existingVideo.description ?? ''
  let category: string = existingVideo.category ?? 'Divertissement'
  let visibility: string = existingVideo.visibility ?? 'PUBLIC'
  let is18Plus = existingVideo.is18Plus
  let thumbnailPart: MultiPartData | undefined

  for (const part of formData) {
    switch (part.name) {
      case 'title':
        title = getTextPart(part)
        break
      case 'description':
        description = getTextPart(part)
        break
      case 'category':
        category = getTextPart(part)
        break
      case 'visibility':
        visibility = getTextPart(part)
        break
      case 'is18Plus': {
        const value = getTextPart(part)
        if (value !== 'true' && value !== 'false') throw createError({ statusCode: 400, message: 'La valeur du contenu +18 est invalide.' })
        is18Plus = value === 'true'
        break
      }
      case 'thumbnail':
        if (thumbnailPart || !part.filename) throw createError({ statusCode: 400, message: 'Une seule miniature est autorisée.' })
        thumbnailPart = part
        break
      default:
        throw createError({ statusCode: 400, message: 'Champ de formulaire non autorisé.' })
    }
  }

  if (!title || title.length > MAX_TITLE_LENGTH || description.length > MAX_DESCRIPTION_LENGTH || !CATEGORIES.has(category) || !VISIBILITIES.has(visibility)) {
    throw createError({ statusCode: 400, message: 'Les informations de la vidéo sont invalides.' })
  }

  const thumbnailExtension = thumbnailPart ? validateThumbnailFile(thumbnailPart) : null
  const thumbsDir = path.resolve(process.cwd(), 'public/uploads/thumbnails')
  let savedThumbnail: Awaited<ReturnType<typeof saveUpload>> | null = null
  let updatedVideo

  try {
    if (thumbnailPart && thumbnailExtension) {
      savedThumbnail = await saveUpload(thumbsDir, thumbnailPart.data, thumbnailExtension)
    }

    ;[updatedVideo] = await db.update(schema.videos)
      .set({
        title,
        description,
        category,
        visibility,
        is18Plus,
        thumbnail: savedThumbnail?.filename ?? existingVideo.thumbnail
      })
      .where(eq(schema.videos.id, existingVideo.id))
      .returning()
    if (!updatedVideo) throw createError({ statusCode: 404, message: 'Vidéo introuvable.' })
  } catch (error) {
    await removeUpload(savedThumbnail?.destination)
    throw error
  }

  if (savedThumbnail && existingVideo.thumbnail) {
    try {
      await removeStoredUpload(thumbsDir, existingVideo.thumbnail)
    } catch (error) {
      console.error('Impossible de supprimer l’ancienne miniature.', error)
    }
  }

  return { message: 'Vidéo mise à jour avec succès.', video: updatedVideo }
})
