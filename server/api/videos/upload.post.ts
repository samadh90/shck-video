import { defineEventHandler, createError, readMultipartFormData } from 'h3'
import { db, schema } from '~/server/utils/db'
import { requireVerifiedUser, generateNanoId } from '~/server/utils/auth'
import fs from 'fs'
import path from 'path'

export default defineEventHandler(async (event) => {
  const currentUser = await requireVerifiedUser(event)
  const formData = await readMultipartFormData(event)

  if (!formData || !formData.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Aucun fichier transmis.'
    })
  }

  let title = ''
  let description = ''
  let category = 'Divertissement'
  let visibility = 'PUBLIC'
  let is18Plus = false
  let videoFilename = ''
  let thumbnailFilename: string | null = null

  const videosDir = path.resolve(process.cwd(), 'public/uploads/videos')
  const thumbsDir = path.resolve(process.cwd(), 'public/uploads/thumbnails')

  if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir, { recursive: true })
  if (!fs.existsSync(thumbsDir)) fs.mkdirSync(thumbsDir, { recursive: true })

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
    } else if (part.name === 'video' && part.filename) {
      const ext = path.extname(part.filename) || '.mp4'
      const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext
      const destPath = path.join(videosDir, uniqueName)
      fs.writeFileSync(destPath, part.data)
      videoFilename = uniqueName
    } else if (part.name === 'thumbnail' && part.filename) {
      const ext = path.extname(part.filename) || '.jpg'
      const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext
      const destPath = path.join(thumbsDir, uniqueName)
      fs.writeFileSync(destPath, part.data)
      thumbnailFilename = uniqueName
    }
  }

  if (!title || !videoFilename) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Le titre et le fichier vidéo sont obligatoires.'
    })
  }

  const customId = generateNanoId(9)

  const [newVideo] = await db.insert(schema.videos).values({
    customId,
    title,
    description,
    filename: videoFilename,
    thumbnail: thumbnailFilename,
    category,
    visibility,
    is18Plus,
    userId: currentUser.id
  }).returning()

  return {
    message: 'Vidéo téléversée avec succès !',
    video: newVideo
  }
})
