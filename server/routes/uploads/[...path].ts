import { createError, defineEventHandler, sendStream } from 'h3'
import fs from 'fs'
import path from 'path'

export default defineEventHandler(async (event) => {
  const reqPath = event.context.params?.path || ''
  const filePath = path.resolve(process.cwd(), 'public/uploads', reqPath)

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Fichier non trouvé.'
    })
  }

  const stream = fs.createReadStream(filePath)
  return sendStream(event, stream)
})
