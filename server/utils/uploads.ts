import { createError, getRequestHeader, type H3Event, type MultiPartData } from 'h3'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import path from 'node:path'

export const MAX_VIDEO_SIZE_BYTES = 500 * 1024 * 1024
export const MAX_THUMBNAIL_SIZE_BYTES = 5 * 1024 * 1024
const MAX_MULTIPART_SIZE_BYTES = MAX_VIDEO_SIZE_BYTES + MAX_THUMBNAIL_SIZE_BYTES + 64 * 1024

const VIDEO_TYPES = {
  mp4: { mime: 'video/mp4', signature: isMp4 },
  webm: { mime: 'video/webm', signature: isWebm }
} as const

const IMAGE_TYPES = {
  jpg: { mime: 'image/jpeg', signature: isJpeg },
  png: { mime: 'image/png', signature: isPng },
  webp: { mime: 'image/webp', signature: isWebp }
} as const

type UploadKind = keyof typeof VIDEO_TYPES | keyof typeof IMAGE_TYPES

function hasBytes(data: Buffer, ...bytes: number[]) {
  return data.length >= bytes.length && bytes.every((byte, index) => data[index] === byte)
}

function isMp4(data: Buffer) {
  return data.length >= 12 && data.subarray(4, 8).toString('ascii') === 'ftyp'
}

function isWebm(data: Buffer) {
  return hasBytes(data, 0x1a, 0x45, 0xdf, 0xa3)
}

function isJpeg(data: Buffer) {
  return hasBytes(data, 0xff, 0xd8, 0xff)
}

function isPng(data: Buffer) {
  return hasBytes(data, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)
}

function isWebp(data: Buffer) {
  return data.length >= 12
    && data.subarray(0, 4).toString('ascii') === 'RIFF'
    && data.subarray(8, 12).toString('ascii') === 'WEBP'
}

function extensionFromFilename(filename: string | undefined) {
  return filename ? path.extname(filename).slice(1).toLowerCase() : ''
}

function rejectUpload(message: string) {
  throw createError({ statusCode: 400, message })
}

function validateFile(
  part: MultiPartData,
  allowedTypes: Record<string, { mime: string, signature: (data: Buffer) => boolean }>,
  maxSizeBytes: number,
  label: string
): UploadKind {
  if (!part.filename) rejectUpload(`Le fichier ${label} est invalide.`)
  if (!part.data.length) rejectUpload(`Le fichier ${label} est vide.`)
  if (part.data.length > maxSizeBytes) {
    rejectUpload(`Le fichier ${label} dépasse la taille maximale autorisée.`)
  }

  const extension = extensionFromFilename(part.filename)
  const fileType = allowedTypes[extension]
  if (!fileType || part.type?.toLowerCase() !== fileType.mime || !fileType.signature(part.data)) {
    rejectUpload(`Le fichier ${label} doit être dans un format autorisé.`)
  }

  return extension as UploadKind
}

export function assertUploadRequestSize(event: H3Event) {
  const contentLength = getRequestHeader(event, 'content-length')
  if (!contentLength) {
    throw createError({
      statusCode: 411,
      message: 'L’en-tête Content-Length est obligatoire pour un téléversement.'
    })
  }

  const size = Number(contentLength)
  if (!Number.isSafeInteger(size) || size < 0 || size > MAX_MULTIPART_SIZE_BYTES) {
    throw createError({
      statusCode: 413,
      message: 'La requête dépasse la taille maximale autorisée.'
    })
  }
}

export function validateVideoFile(part: MultiPartData) {
  return validateFile(part, VIDEO_TYPES, MAX_VIDEO_SIZE_BYTES, 'vidéo')
}

export function validateThumbnailFile(part: MultiPartData) {
  return validateFile(part, IMAGE_TYPES, MAX_THUMBNAIL_SIZE_BYTES, 'miniature')
}

export async function saveUpload(directory: string, data: Buffer, extension: UploadKind) {
  await mkdir(directory, { recursive: true })
  const filename = `${randomUUID()}.${extension}`
  const destination = path.resolve(directory, filename)
  const resolvedDirectory = path.resolve(directory) + path.sep
  if (!destination.startsWith(resolvedDirectory)) {
    throw new Error('Chemin de destination d’upload invalide.')
  }

  await writeFile(destination, data, { flag: 'wx' })
  return { filename, destination }
}

export async function removeUpload(filePath: string | null | undefined) {
  if (!filePath) return
  try {
    await unlink(filePath)
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
}

export async function removeStoredUpload(directory: string, filename: string | null | undefined) {
  if (!filename || path.basename(filename) !== filename) return

  const filePath = path.resolve(directory, filename)
  const resolvedDirectory = path.resolve(directory) + path.sep
  if (!filePath.startsWith(resolvedDirectory)) return
  await removeUpload(filePath)
}
