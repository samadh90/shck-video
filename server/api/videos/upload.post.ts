import { defineEventHandler, createError, readMultipartFormData, type MultiPartData } from 'h3'
import { db, schema } from '~~/server/utils/db'
import { requireVerifiedUser, generateNanoId } from '~~/server/utils/auth'
import {
  assertUploadRequestSize,
  MAX_THUMBNAIL_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES,
  removeUpload,
  saveUpload,
  validateThumbnailFile,
  validateVideoFile
} from '~~/server/utils/uploads'
import path from 'node:path'

const CATEGORIES = new Set(['Divertissement', 'Gaming', 'Musique', 'Tutoriel', 'Sport', 'Vlog', 'Technologie', 'Autre'])
const VISIBILITIES = new Set(['PUBLIC', 'UNLISTED', 'PRIVATE'])
const MAX_TITLE_LENGTH = 200
const MAX_DESCRIPTION_LENGTH = 10_000

function getTextPart(part: MultiPartData) {
  if (part.filename) {
    throw createError({ statusCode: 400, message: 'Les champs texte ne peuvent pas contenir de fichier.' })
  }
  return part.data.toString('utf-8').trim()
}

export default defineEventHandler(async (event) => {
  const currentUser = await requireVerifiedUser(event)
  assertUploadRequestSize(event)
  const formData = await readMultipartFormData(event)

  if (!formData?.length) {
    throw createError({ statusCode: 400, message: 'Aucun fichier transmis.' })
  }

  let title = ''
  let description = ''
  let category = 'Divertissement'
  let visibility = 'PUBLIC'
  let is18Plus = false
  let videoPart: MultiPartData | undefined
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
        if (value !== 'true' && value !== 'false') {
          throw createError({ statusCode: 400, message: 'La valeur du contenu +18 est invalide.' })
        }
        is18Plus = value === 'true'
        break
      }
      case 'video':
        if (videoPart || !part.filename) throw createError({ statusCode: 400, message: 'Un seul fichier vidéo est autorisé.' })
        videoPart = part
        break
      case 'thumbnail':
        if (thumbnailPart || !part.filename) throw createError({ statusCode: 400, message: 'Une seule miniature est autorisée.' })
        thumbnailPart = part
        break
      default:
        throw createError({ statusCode: 400, message: 'Champ de formulaire non autorisé.' })
    }
  }

  if (!title || title.length > MAX_TITLE_LENGTH || !videoPart) {
    throw createError({ statusCode: 400, message: 'Le titre et le fichier vidéo sont obligatoires.' })
  }
  if (description.length > MAX_DESCRIPTION_LENGTH || !CATEGORIES.has(category) || !VISIBILITIES.has(visibility)) {
    throw createError({ statusCode: 400, message: 'Les informations de la vidéo sont invalides.' })
  }

  const videoExtension = validateVideoFile(videoPart)
  const thumbnailExtension = thumbnailPart ? validateThumbnailFile(thumbnailPart) : null
  if (videoPart.data.length + (thumbnailPart?.data.length ?? 0) > MAX_VIDEO_SIZE_BYTES + MAX_THUMBNAIL_SIZE_BYTES) {
    throw createError({ statusCode: 413, message: 'Les fichiers dépassent la taille maximale autorisée.' })
  }

  const videosDir = path.resolve(process.cwd(), 'public/uploads/videos')
  const thumbsDir = path.resolve(process.cwd(), 'public/uploads/thumbnails')
  const writtenFiles: string[] = []

  try {
    const savedVideo = await saveUpload(videosDir, videoPart.data, videoExtension)
    writtenFiles.push(savedVideo.destination)
    const savedThumbnail = thumbnailPart && thumbnailExtension
      ? await saveUpload(thumbsDir, thumbnailPart.data, thumbnailExtension)
      : null
    if (savedThumbnail) writtenFiles.push(savedThumbnail.destination)

    const [newVideo] = await db.insert(schema.videos).values({
      customId: generateNanoId(9),
      title,
      description,
      filename: savedVideo.filename,
      thumbnail: savedThumbnail?.filename ?? null,
      category,
      visibility,
      is18Plus,
      userId: currentUser.id
    }).returning()

    return { message: 'Vidéo téléversée avec succès !', video: newVideo }
  } catch (error) {
    await Promise.allSettled(writtenFiles.map(removeUpload))
    throw error
  }
})
