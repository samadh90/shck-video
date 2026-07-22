import { defineEventHandler, getQuery } from 'h3'
import { db, schema } from '~~/server/utils/db'
import { eq, and, desc } from 'drizzle-orm'
import { getUserFromEvent, calculateAge } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const is18PlusRequested = query.is18Plus === 'true'

  const currentUser = await getUserFromEvent(event)
  const age = currentUser ? calculateAge(currentUser.birthdate) : null

  if (is18PlusRequested) {
    if (!currentUser || !age || age < 18) {
      return []
    }
    const videosList = await db.select({
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
      eq(schema.videos.is18Plus, true)
    ))
    .orderBy(desc(schema.videos.createdAt))

    return videosList.map(item => ({
      ...item.video,
      user: item.user
    }))
  }

  const videosList = await db.select({
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
    eq(schema.videos.is18Plus, false)
  ))
  .orderBy(desc(schema.videos.createdAt))

  return videosList.map(item => ({
    ...item.video,
    user: item.user
  }))
})
