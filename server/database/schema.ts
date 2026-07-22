import { sqliteTable, integer, text, unique } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  username: text('username').notNull(),
  avatar: text('avatar'),
  bio: text('bio'),
  isVerified: integer('is_verified', { mode: 'boolean' }).notNull().default(false),
  verificationToken: text('verification_token'),
  verificationTokenExpiresAt: text('verification_token_expires_at'),
  birthdate: text('birthdate'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
})

export const videos = sqliteTable('videos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customId: text('custom_id').unique(),
  title: text('title').notNull(),
  description: text('description'),
  filename: text('filename').notNull(),
  thumbnail: text('thumbnail'),
  category: text('category').default('Divertissement'),
  visibility: text('visibility').default('PUBLIC'),
  is18Plus: integer('is_18_plus', { mode: 'boolean' }).notNull().default(false),
  views: integer('views').notNull().default(0),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
})

export const comments = sqliteTable('comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  content: text('content').notNull(),
  videoId: integer('video_id').notNull().references(() => videos.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  parentId: integer('parent_id'),
  isEdited: integer('is_edited', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
})

export const likes = sqliteTable('likes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  videoId: integer('video_id').notNull().references(() => videos.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  isLike: integer('is_like', { mode: 'boolean' }).notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
}, (table) => [
  unique().on(table.videoId, table.userId)
])

export const follows = sqliteTable('follows', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  followerId: integer('follower_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  followingId: integer('following_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
}, (table) => [
  unique().on(table.followerId, table.followingId)
])

export const ratings = sqliteTable('ratings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  stars: integer('stars').notNull(),
  targetUserId: integer('target_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
}, (table) => [
  unique().on(table.targetUserId, table.userId)
])

export const notifications = sqliteTable('notifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  message: text('message').notNull(),
  link: text('link'),
  read: integer('read', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
})
