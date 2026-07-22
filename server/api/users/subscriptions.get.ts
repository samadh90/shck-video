import { defineEventHandler } from 'h3'
import { db, schema } from '~/server/utils/db'
import { eq } from 'drizzle-orm'
import { requireAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const currentUser = await requireAuthUser(event)

  const userFollows = await db.select({
    id: schema.users.id,
    username: schema.users.username,
    avatar: schema.users.avatar,
    bio: schema.users.bio
  })
  .from(schema.follows)
  .innerJoin(schema.users, eq(schema.follows.followingId, schema.users.id))
  .where(eq(schema.follows.followerId, currentUser.id))

  return userFollows
})
