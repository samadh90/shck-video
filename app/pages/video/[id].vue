<template>
  <div class="min-h-screen bg-[#fcfcfc]">
    <!-- Main Content Container -->
    <div class="mx-auto max-w-7xl px-5 py-6">
      
      <div v-if="pending" style="text-align: center; color: var(--neon-purple); padding: 60px;">
        <h2>Chargement de la vidéo...</h2>
      </div>

      <div v-else-if="errorMsg" style="text-align: center; padding: 60px;">
        <h2 style="color: var(--neon-pink);">{{ errorMsg }}</h2>
        <NuxtLink to="/" class="neon-btn" style="margin-top: 15px; display: inline-block;">Retour à l'accueil</NuxtLink>
      </div>

      <!-- 2 Columns Layout -->
      <div v-else-if="video" class="flex items-start gap-7.5 max-lg:flex-col">
        
        <!-- LEFT COLUMN -->
        <div class="min-w-0 flex-1">
          <!-- Video Player -->
          <div class="w-full overflow-hidden rounded-xl bg-black shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
            <video 
              ref="videoPlayerRef"
              controls 
              preload="none"
              :poster="video.thumbnail ? `/uploads/thumbnails/${video.thumbnail}` : undefined"
              class="block max-h-[580px] w-full"
            >
              <source :src="`/uploads/videos/${video.filename}`" type="video/mp4" />
            </video>
          </div>

          <!-- Video Meta Header -->
          <div class="mt-[18px] border-b border-line pb-5">
            <h1 class="mb-2.5 text-[22px] leading-[1.3] font-bold text-[#111]">{{ video.title }}</h1>
            
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; margin-bottom: 15px;">
              <div class="flex items-center gap-3">
                <span class="rounded-[20px] bg-[rgba(138,43,226,0.1)] px-2.5 py-1 text-xs font-semibold uppercase text-[#8a2be2]">{{ video.category || 'Divertissement' }}</span>
                <span class="meta-date">Publié le {{ formatDate(video.createdAt) }}</span>
                <span style="color: #666; font-size: 13px;">👁 {{ video.views }} vues</span>
                <span v-if="video.visibility !== 'PUBLIC'" style="background: #fef3c7; color: #d97706; font-size: 11px; font-weight: bold; padding: 2px 6px; border-radius: 4px;">
                  {{ video.visibility === 'PRIVATE' ? '🔒 Privée' : '🔗 Non répertoriée' }}
                </span>
              </div>

              <!-- Owner Action Controls -> Redirection vers la page dédiée d'édition /video/edit/[id] -->
              <div v-if="isOwner" style="display: flex; gap: 10px;">
                <NuxtLink :to="`/video/edit/${video.customId || video.id}`" class="neon-btn" style="text-decoration: none; padding: 6px 12px; font-size: 12px;">✏️ Modifier</NuxtLink>
                <button @click="deleteVideo" class="neon-btn neon-btn-pink" style="padding: 6px 12px; font-size: 12px;">❌ Supprimer</button>
              </div>
            </div>

            <!-- Uploader Profile Bar -->
            <div class="mt-3 flex flex-wrap items-center justify-between gap-[15px] rounded-xl bg-[#f8f9fa] px-[18px] py-[14px]">
              <div style="display: flex; align-items: center; gap: 14px;">
                <NuxtLink :to="`/user/${video.userId}`" style="display: flex; align-items: center; gap: 14px; text-decoration: none;">
                  <img :src="video.user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${video.user?.username}`" loading="lazy" decoding="async" class="size-11 rounded-full border-2 border-[#8a2be2] object-cover" />
                  <div>
                    <h4 style="margin: 0; font-size: 16px; color: #111;">{{ video.user?.username }}</h4>
                    <!-- Confidentialité : Le nombre d'abonnés est visible uniquement par le propriétaire -->
                    <span v-if="isOwner && subscribersCount !== null" style="font-size: 12px; color: #777;">{{ subscribersCount }} abonnés</span>
                  </div>
                </NuxtLink>
                
                <button 
                  v-if="!isOwner" 
                  @click="toggleFollow" 
                  :class="['neon-btn', isFollowing ? '' : 'neon-btn-pink']"
                  style="margin-left: 15px; padding: 6px 16px; font-size: 13px;"
                >
                  {{ isFollowing ? 'Abonné ✔' : 'S\'abonner' }}
                </button>
              </div>

              <!-- Like / Dislike Ratio System -->
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <div style="display: flex; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; background: #ffffff;">
                  <button 
                    @click="toggleLike(true)" 
                    style="border: none; background: none; padding: 6px 16px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 13px;"
                    :style="{ color: userLikeStatus === true ? 'var(--neon-purple)' : '#555' }"
                  >
                    👍 {{ likesCount }}
                  </button>
                  <div style="width: 1px; background: #e2e8f0;"></div>
                  <button 
                    @click="toggleLike(false)" 
                    style="border: none; background: none; padding: 6px 16px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 13px;"
                    :style="{ color: userLikeStatus === false ? 'var(--neon-pink)' : '#555' }"
                  >
                    👎 {{ dislikesCount }}
                  </button>
                </div>
                
                <!-- Ratio Bar -->
                <div style="height: 3px; background: #e2e8f0; border-radius: 2px; overflow: hidden; display: flex;">
                  <div :style="{ width: `${likeRatio}%` }" style="background: var(--neon-purple); transition: width 0.3s;"></div>
                  <div :style="{ width: `${100 - likeRatio}%` }" style="background: var(--neon-pink); transition: width 0.3s;"></div>
                </div>
              </div>
            </div>

            <!-- Description -->
            <div class="rounded-lg border border-[#e9ecef] bg-white p-4 text-sm leading-6 text-[#333]" style="margin-top: 18px;">
              <p>{{ video.description || "Aucune description." }}</p>
            </div>
          </div>

          <!-- Comments Section -->
          <div class="mt-[30px]">
            <h3 class="mb-5 text-lg font-bold text-[#111]">Commentaires ({{ totalCommentsCount }})</h3>

            <!-- Top Level Comment Input -->
            <div v-if="token" class="mb-[25px]">
              <textarea 
                v-model="newComment" 
                placeholder="Ajoutez un commentaire public..." 
                rows="2"
                class="min-h-[70px] w-full text-sm"
                @keydown.ctrl.enter="postComment(null)"
              ></textarea>
              <div style="text-align: right; margin-top: 8px;">
                <button 
                  @click="postComment(null)" 
                  class="neon-btn neon-btn-pink"
                  :disabled="submittingComment || !newComment.trim()"
                >
                  {{ submittingComment ? 'Publication...' : 'Commenter' }}
                </button>
              </div>
            </div>

            <div v-else class="mb-[25px] rounded-lg border border-[rgba(255,20,147,0.2)] bg-[#fff5f8] p-[18px] text-center [&>p]:mb-3 [&>p]:mt-0 [&>p]:text-sm [&>p]:text-[#444]">
              <p>Vous devez avoir un compte et être connecté pour poster un commentaire.</p>
              <NuxtLink to="/login" class="neon-btn">Se connecter à SHCK Video</NuxtLink>
            </div>

            <!-- Comments List (Progressive Batch Rendering) -->
            <div class="flex flex-col gap-4">
              <div v-for="c in visibleComments" :key="c.id" class="comment-block">
                
                <!-- Main Comment Card -->
                <div class="flex gap-[14px] rounded-lg border border-[#f1f5f9] bg-white p-[14px]">
                  <NuxtLink :to="`/user/${c.user?.id}`" style="text-decoration: none;">
                    <img :src="c.user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${c.user?.username}`" loading="lazy" decoding="async" class="size-[38px] shrink-0 rounded-full object-cover" />
                  </NuxtLink>
                  <div class="flex-1">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                      <div class="mb-1 text-sm font-semibold text-[#222]">
                        <NuxtLink :to="`/user/${c.user?.id}`" style="color: inherit; text-decoration: none;">
                          {{ c.user?.username || 'Utilisateur' }}
                        </NuxtLink>
                        <span class="ml-2 text-xs font-normal text-[#888]">{{ formatDate(c.createdAt) }}</span>
                        <span v-if="c.isEdited" style="color: var(--neon-pink); font-size: 11px; margin-left: 6px; font-weight: bold;">(modifié)</span>
                      </div>

                      <div v-if="user && c.userId === user.id" style="display: flex; gap: 8px;">
                        <button @click="startEditComment(c)" style="background: none; border: none; color: var(--neon-purple); cursor: pointer; font-size: 12px; font-weight: 600;">Éditer</button>
                        <button @click="deleteComment(c.id)" style="background: none; border: none; color: var(--neon-pink); cursor: pointer; font-size: 12px; font-weight: 600;">Supprimer</button>
                      </div>
                    </div>

                    <div v-if="editingCommentId === c.id" style="margin-top: 8px;">
                      <textarea v-model="editCommentContent" rows="2" style="width: 100%; font-size: 13px;"></textarea>
                      <div style="text-align: right; margin-top: 6px; display: flex; justify-content: flex-end; gap: 8px;">
                        <button @click="editingCommentId = null" style="padding: 4px 10px; border-radius: 4px; border: 1px solid #ccc; background: white; cursor: pointer; font-size: 12px;">Annuler</button>
                        <button @click="saveEditedComment(c.id)" class="neon-btn neon-btn-pink" style="padding: 4px 10px; font-size: 12px;">Enregistrer</button>
                      </div>
                    </div>

                    <p v-else class="m-0 text-sm leading-[1.4] text-[#333]">{{ c.content }}</p>

                    <div v-if="token" style="margin-top: 8px;">
                      <button @click="toggleReplyForm(c.id)" style="background: none; border: none; color: #666; font-size: 12px; cursor: pointer; font-weight: 600;">
                        💬 Répondre
                      </button>
                    </div>

                    <div v-if="activeReplyId === c.id" style="margin-top: 10px; background: #f8f9fa; padding: 10px; border-radius: 6px;">
                      <textarea v-model="replyText" placeholder="Votre réponse..." rows="2" style="width: 100%; font-size: 13px;"></textarea>
                      <div style="text-align: right; margin-top: 6px; display: flex; justify-content: flex-end; gap: 8px;">
                        <button @click="activeReplyId = null" style="padding: 4px 10px; border-radius: 4px; border: 1px solid #ccc; background: white; cursor: pointer; font-size: 12px;">Annuler</button>
                        <button @click="postComment(c.id)" class="neon-btn neon-btn-pink" style="padding: 4px 10px; font-size: 12px;">Publier la réponse</button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- NESTED REPLIES -->
                <div v-if="c.replies && c.replies.length > 0" class="mt-2.5 ml-[45px] flex flex-col gap-2.5 border-l-2 border-[#e2e8f0] pl-[15px]" style="margin-left: 45px; margin-top: 10px; border-left: 2px solid #e2e8f0; padding-left: 15px; display: flex; flex-direction: column; gap: 10px;">
                  <div v-for="reply in c.replies" :key="reply.id" class="flex gap-[14px] rounded-lg border border-[#f1f5f9] bg-white p-[14px]" style="background: #fafafa;">
                    <NuxtLink :to="`/user/${reply.user?.id}`" style="text-decoration: none;">
                      <img :src="reply.user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${reply.user?.username}`" loading="lazy" decoding="async" class="size-[38px] shrink-0 rounded-full object-cover" style="width: 30px; height: 30px;" />
                    </NuxtLink>

                    <div class="flex-1">
                      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div class="mb-1 text-sm font-semibold text-[#222]">
                          <NuxtLink :to="`/user/${reply.user?.id}`" style="color: inherit; text-decoration: none;">
                            {{ reply.user?.username || 'Utilisateur' }}
                          </NuxtLink>
                          <span class="ml-2 text-xs font-normal text-[#888]">{{ formatDate(reply.createdAt) }}</span>
                          <span v-if="reply.isEdited" style="color: var(--neon-pink); font-size: 10px; margin-left: 4px; font-weight: bold;">(modifié)</span>
                        </div>

                        <div v-if="user && reply.userId === user.id" style="display: flex; gap: 6px;">
                          <button @click="startEditComment(reply)" style="background: none; border: none; color: var(--neon-purple); cursor: pointer; font-size: 11px; font-weight: 600;">Éditer</button>
                          <button @click="deleteComment(reply.id)" style="background: none; border: none; color: var(--neon-pink); cursor: pointer; font-size: 11px; font-weight: 600;">Supprimer</button>
                        </div>
                      </div>

                      <div v-if="editingCommentId === reply.id" style="margin-top: 6px;">
                        <textarea v-model="editCommentContent" rows="2" style="width: 100%; font-size: 12px;"></textarea>
                        <div style="text-align: right; margin-top: 6px; display: flex; justify-content: flex-end; gap: 6px;">
                          <button @click="editingCommentId = null" style="padding: 3px 8px; border-radius: 4px; border: 1px solid #ccc; background: white; cursor: pointer; font-size: 11px;">Annuler</button>
                          <button @click="saveEditedComment(reply.id)" class="neon-btn neon-btn-pink" style="padding: 3px 8px; font-size: 11px;">Enregistrer</button>
                        </div>
                      </div>

                      <p v-else class="m-0 text-sm leading-[1.4] text-[#333]" style="font-size: 13px;">{{ reply.content }}</p>
                    </div>
                  </div>
                </div>

              </div>

              <p v-if="comments.length === 0" style="color: var(--text-muted); font-size: 14px; font-style: italic;">
                Soyez le premier à commenter !
              </p>

              <!-- Progressive Comment Pagination / Load More -->
              <div v-if="comments.length > visibleCommentsLimit" style="text-align: center; margin-top: 15px;">
                <button 
                  @click="visibleCommentsLimit += 10" 
                  class="neon-btn" 
                  style="font-size: 13px; padding: 8px 20px;"
                >
                  Charger plus de commentaires ({{ comments.length - visibleCommentsLimit }} restants)
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN (Recommended Videos) -->
        <div class="w-[340px] shrink-0 rounded-xl border border-[#e2e8f0] bg-white p-5 max-[992px]:w-full">
          <h3 class="sidebar-title">Vidéos suggérées</h3>

          <div class="flex flex-col gap-[14px]">
            <NuxtLink 
              v-for="rec in recommendedVideos" 
              :key="rec.id" 
              :to="`/video/${rec.customId || rec.id}`"
              class="flex gap-3 rounded-lg p-1.5 no-underline transition-[background] duration-200 hover:bg-[#f8f9fa]"
            >
              <div class="flex h-[65px] w-[110px] shrink-0 items-center justify-center overflow-hidden rounded-md bg-[linear-gradient(135deg,#1e1e24_0%,#2a2a36_100%)]">
                <img 
                  v-if="rec.thumbnail" 
                  :src="`/uploads/thumbnails/${rec.thumbnail}`" 
                  loading="lazy"
                  decoding="async"
                  style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px;"
                />
                <span v-else class="rec-play-icon">▶</span>
              </div>
              <div class="min-w-0 flex-1">
                <h4 class="mb-1 mt-0 line-clamp-2 text-[13px] leading-[1.3] font-semibold text-[#222]">{{ rec.title }}</h4>
                <span class="rec-cat">{{ rec.category || 'Général' }}</span>
                <span class="text-[11px] text-[#888]">{{ formatDate(rec.createdAt) }}</span>
              </div>
            </NuxtLink>

            <p v-if="recommendedVideos.length === 0" style="color: var(--text-muted); font-size: 13px;">
              Aucune vidéo suggérée.
            </p>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import type { Comment, Video, VideoDetails } from '#shared/types/models'

const route = useRoute()
const router = useRouter()
const { token, user } = useAuth()

const videoPlayerRef = ref<HTMLVideoElement | null>(null)

const comments = ref<Comment[]>([])

const likesCount = ref(0)
const dislikesCount = ref(0)
const userLikeStatus = ref<boolean | null>(null)
const isFollowing = ref(false)
const subscribersCount = ref<number | null>(null)

const newComment = ref('')
const activeReplyId = ref<number | null>(null)
const replyText = ref('')

const editingCommentId = ref<number | null>(null)
const editCommentContent = ref('')

const submittingComment = ref(false)
const visibleCommentsLimit = ref(10)

const visibleComments = computed(() => {
  return comments.value.slice(0, visibleCommentsLimit.value)
})

const videoId = computed(() => typeof route.params.id === 'string' ? route.params.id : '')

interface VideoPageData {
  video: VideoDetails
  videos: Video[]
  comments: Comment[]
}

const { data: pageData, pending, error, refresh: loadData } = await useAsyncData<VideoPageData>(
  'video-page',
  async () => {
    const headers = token.value ? { Authorization: `Bearer ${token.value}` } : undefined
    const [video, videos, comments] = await Promise.all([
      $fetch<VideoDetails>(`/api/videos/${videoId.value}`, { headers }),
      $fetch<Video[]>('/api/videos'),
      $fetch<Comment[]>(`/api/videos/${videoId.value}/comments`)
    ])
    return { video, videos, comments }
  },
  { watch: [videoId] }
)

const video = computed(() => pageData.value?.video ?? null)
const videosList = computed(() => pageData.value?.videos ?? [])
const errorMsg = computed(() => error.value instanceof Error ? error.value.message : '')

watch(token, () => {
  void loadData()
})

const isOwner = computed(() => {
  return video.value && user.value && video.value.userId === user.value.id
})

const recommendedVideos = computed(() => {
  return videosList.value.filter(v => (v.customId || String(v.id)) !== String(videoId.value))
})

const likeRatio = computed(() => {
  const total = likesCount.value + dislikesCount.value
  if (total === 0) return 50
  return Math.round((likesCount.value / total) * 100)
})

const totalCommentsCount = computed(() => {
  let count = comments.value.length
  comments.value.forEach(c => {
    if (c.replies) count += c.replies.length
  })
  return count
})

watch(pageData, (data) => {
  if (!data) return
  likesCount.value = data.video.likesCount
  dislikesCount.value = data.video.dislikesCount
  userLikeStatus.value = data.video.userLikeStatus
  isFollowing.value = data.video.isFollowing
  subscribersCount.value = data.video.subscribersCount
  comments.value = data.comments
}, { immediate: true })

onUnmounted(() => {
  // Pause and release video player source to free GPU memory
  if (videoPlayerRef.value) {
    videoPlayerRef.value.pause()
    videoPlayerRef.value.removeAttribute('src')
    videoPlayerRef.value.load()
  }
})


const toggleFollow = async () => {
  if (!token.value) {
    router.push('/login')
    return
  }
  try {
    if (!video.value) return
    const res = await $fetch<{ isFollowing: boolean, subscribersCount: number }>(`/api/users/${video.value.userId}/follow`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    isFollowing.value = res.isFollowing
    if (subscribersCount.value !== null) {
      subscribersCount.value = res.subscribersCount
    }
  } catch (err) {
    console.error(err)
  }
}

const toggleLike = async (isLike: boolean) => {
  if (!token.value) {
    router.push('/login')
    return
  }
  try {
    const res = await $fetch<{ likesCount: number, dislikesCount: number, userLikeStatus: boolean | null }>(`/api/videos/${videoId.value}/like`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token.value}` },
      body: { isLike }
    })
    likesCount.value = res.likesCount
    dislikesCount.value = res.dislikesCount
    userLikeStatus.value = res.userLikeStatus
  } catch (err) {
    console.error(err)
  }
}

const toggleReplyForm = (commentId: number) => {
  if (activeReplyId.value === commentId) {
    activeReplyId.value = null
  } else {
    activeReplyId.value = commentId
    replyText.value = ''
  }
}

const postComment = async (parentId: number | null = null) => {
  const content = parentId ? replyText.value : newComment.value
  if (!content.trim() || !token.value) return

  submittingComment.value = true
  try {
    const created = await $fetch<Comment>(`/api/videos/${videoId.value}/comments`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token.value}` },
      body: { content, parentId }
    })

    if (parentId) {
      const parent = comments.value.find(c => c.id === parentId)
      if (parent) {
        if (!parent.replies) parent.replies = []
        parent.replies.push(created)
      }
      activeReplyId.value = null
      replyText.value = ''
    } else {
      created.replies = []
      comments.value.unshift(created)
      newComment.value = ''
    }
  } catch (error: unknown) {
    alert(error instanceof Error ? error.message : 'Erreur lors de la publication.')
  } finally {
    submittingComment.value = false
  }
}

const startEditComment = (comment: Comment) => {
  editingCommentId.value = comment.id
  editCommentContent.value = comment.content
}

const saveEditedComment = async (commentId: number) => {
  if (!editCommentContent.value.trim()) return
  try {
    const updated = await $fetch<{ comment?: Comment }>(`/api/comments/${commentId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token.value}` },
      body: { content: editCommentContent.value }
    })

    const updatedComment = updated.comment
    if (!updatedComment) throw new Error('Invalid comment update response.')
    const found = comments.value.find(comment => comment.id === commentId)
    if (found) {
      found.content = updatedComment.content
      found.isEdited = true
    } else {
      for (const parent of comments.value) {
        if (parent.replies) {
          const r = parent.replies.find(reply => reply.id === commentId)
          if (r) {
            r.content = updatedComment.content
            r.isEdited = true
            break
          }
        }
      }
    }

    editingCommentId.value = null
    editCommentContent.value = ''
  } catch (error: unknown) {
    alert(error instanceof Error ? error.message : 'Erreur lors de la modification du commentaire.')
  }
}

const deleteComment = async (commentId: number) => {
  if (!confirm('Supprimer ce commentaire ?')) return
  try {
    await $fetch(`/api/comments/${commentId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token.value}` }
    })

    comments.value = comments.value.filter(c => c.id !== commentId)
    comments.value.forEach(parent => {
      if (parent.replies) {
        parent.replies = parent.replies.filter(reply => reply.id !== commentId)
      }
    })
  } catch (error: unknown) {
    alert(error instanceof Error ? error.message : 'Erreur lors de la suppression.')
  }
}

const deleteVideo = async () => {
  if (!confirm('Supprimer définitivement cette vidéo ?')) return
  try {
    await $fetch(`/api/videos/${videoId.value}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    router.push('/')
  } catch (error: unknown) {
    alert(error instanceof Error ? error.message : 'Erreur lors de la suppression.')
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}
</script>
