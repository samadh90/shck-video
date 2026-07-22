import { defineEventHandler, getQuery } from 'h3'
import { db, schema } from '~~/server/utils/db'
import { like, eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const queryParams = getQuery(event)
  const q = String(queryParams.q || '').trim()

  if (!q) {
    return {
      videos: [],
      channels: []
    }
  }

  const searchTerm = `%${q}%`

  // Recherche de vidéos par titre ou description
  const matchingVideos = await db.select({
    video: schema.videos,
    user: {
      id: schema.users.id,
      username: schema.users.username,
      avatar: schema.users.avatar
    }
  })
  .from(schema.videos)
  .innerJoin(schema.users, eq(schema.videos.userId, schema.users.id))
  .where(and(
    eq(schema.videos.visibility, 'PUBLIC'),
    eq(schema.videos.is18Plus, false),
    like(schema.videos.title, searchTerm)
  ))

  const formattedVideos = matchingVideos.map(item => ({
    ...item.video,
    user: item.user
  }))

  // Recherche de chaînes créateurs par nom d'utilisateur
  const matchingChannels = await db.select({
    id: schema.users.id,
    username: schema.users.username,
    avatar: schema.users.avatar,
    bio: schema.users.bio
  })
  .from(schema.users)
  .where(like(schema.users.username, searchTerm))

  return {
    videos: formattedVideos,
    channels: matchingChannels
  }
})
