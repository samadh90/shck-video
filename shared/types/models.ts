/** Data returned by the public API. Keep these contracts independent from Drizzle's database types. */
export interface PublicUser {
  id: number
  username: string
  avatar: string | null
  bio?: string | null
}

export interface AuthUser extends PublicUser {
  email: string
  isVerified: boolean
  birthdate: string | null
  createdAt?: string
}

export interface UserProfile extends AuthUser {
  followersCount: number
}

export interface Video {
  id: number
  customId: string | null
  title: string
  description: string | null
  filename: string
  thumbnail: string | null
  category: string | null
  visibility: string | null
  is18Plus: boolean
  views: number
  userId: number
  createdAt: string
  user?: PublicUser
  likesCount?: number
  dislikesCount?: number
  userLikeStatus?: boolean | null
}

export interface VideoDetails extends Video {
  likesCount: number
  dislikesCount: number
  userLikeStatus: boolean | null
  isFollowing: boolean
  subscribersCount: number
}

export interface Channel extends PublicUser {
  createdAt: string
  followersCount: number
  isFollowing: boolean
  averageRating: number
  ratingsCount: number
  userRating: number | null
  videos: Video[]
}

export interface Comment {
  id: number
  content: string
  videoId: number
  userId: number
  parentId: number | null
  isEdited: boolean
  createdAt: string
  updatedAt: string
  user?: PublicUser
  replies?: Comment[]
}

export interface UserComment extends Comment {
  video?: Pick<Video, 'id' | 'customId' | 'title'>
}

export interface Notification {
  id: number
  userId: number
  message: string
  link: string | null
  read: boolean
  createdAt: string
}

export interface PaginatedVideos {
  videos: Video[]
  total?: number
}

export interface NotificationsResponse {
  notifications: Notification[]
  unreadCount: number
}
