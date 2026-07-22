<template>
  <div style="min-height: 100vh; background-color: #fcfcfc;">
    <!-- Main Content Container -->
    <div style="max-width: 1280px; margin: 0 auto; padding: 25px 20px;">
      
      <div v-if="pending" style="text-align: center; color: var(--neon-purple); padding: 60px;">
        <h2>Chargement de la vidéo...</h2>
      </div>

      <div v-else-if="errorMsg" style="text-align: center; padding: 60px;">
        <h2 style="color: var(--neon-pink);">{{ errorMsg }}</h2>
        <NuxtLink to="/" class="neon-btn" style="margin-top: 15px; display: inline-block;">Retour à l'accueil</NuxtLink>
      </div>

      <!-- 2 Columns Layout -->
      <div v-else-if="video" class="video-page-layout">
        
        <!-- LEFT COLUMN -->
        <div class="main-content">
          <!-- Video Player -->
          <div class="player-wrapper">
            <video 
              ref="videoPlayerRef"
              controls 
              preload="none"
              :poster="video.thumbnail ? `/uploads/thumbnails/${video.thumbnail}` : undefined"
              class="video-player"
            >
              <source :src="`/uploads/videos/${video.filename}`" type="video/mp4" />
            </video>
          </div>

          <!-- Video Meta Header -->
          <div class="video-meta">
            <h1 class="video-title">{{ video.title }}</h1>
            
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; margin-bottom: 15px;">
              <div class="meta-sub">
                <span class="category-badge">{{ video.category || 'Divertissement' }}</span>
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
            <div class="uploader-bar">
              <div style="display: flex; align-items: center; gap: 14px;">
                <NuxtLink :to="`/user/${video.userId}`" style="display: flex; align-items: center; gap: 14px; text-decoration: none;">
                  <img :src="video.user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${video.user?.username}`" loading="lazy" decoding="async" class="uploader-avatar" />
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
            <div class="description-box" style="margin-top: 18px;">
              <p>{{ video.description || "Aucune description." }}</p>
            </div>
          </div>

          <!-- Comments Section -->
          <div class="comments-section">
            <h3 class="comments-header">Commentaires ({{ totalCommentsCount }})</h3>

            <!-- Top Level Comment Input -->
            <div v-if="token" class="comment-input-block">
              <textarea 
                v-model="newComment" 
                placeholder="Ajoutez un commentaire public..." 
                rows="2"
                class="comment-textarea"
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

            <div v-else class="comment-login-prompt">
              <p>Vous devez avoir un compte et être connecté pour poster un commentaire.</p>
              <NuxtLink to="/login" class="neon-btn">Se connecter à SHCK Video</NuxtLink>
            </div>

            <!-- Comments List (Progressive Batch Rendering) -->
            <div class="comments-list">
              <div v-for="c in visibleComments" :key="c.id" class="comment-block">
                
                <!-- Main Comment Card -->
                <div class="comment-card">
                  <NuxtLink :to="`/user/${c.user?.id}`" style="text-decoration: none;">
                    <img :src="c.user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${c.user?.username}`" loading="lazy" decoding="async" class="comment-avatar-img" />
                  </NuxtLink>
                  <div class="comment-body">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                      <div class="comment-author">
                        <NuxtLink :to="`/user/${c.user?.id}`" style="color: inherit; text-decoration: none;">
                          {{ c.user?.username || 'Utilisateur' }}
                        </NuxtLink>
                        <span class="comment-time">{{ formatDate(c.createdAt) }}</span>
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

                    <p v-else class="comment-text">{{ c.content }}</p>

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
                <div v-if="c.replies && c.replies.length > 0" class="replies-wrapper" style="margin-left: 45px; margin-top: 10px; border-left: 2px solid #e2e8f0; padding-left: 15px; display: flex; flex-direction: column; gap: 10px;">
                  <div v-for="reply in c.replies" :key="reply.id" class="comment-card" style="background: #fafafa;">
                    <NuxtLink :to="`/user/${reply.user?.id}`" style="text-decoration: none;">
                      <img :src="reply.user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${reply.user?.username}`" loading="lazy" decoding="async" class="comment-avatar-img" style="width: 30px; height: 30px;" />
                    </NuxtLink>

                    <div class="comment-body">
                      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div class="comment-author">
                          <NuxtLink :to="`/user/${reply.user?.id}`" style="color: inherit; text-decoration: none;">
                            {{ reply.user?.username || 'Utilisateur' }}
                          </NuxtLink>
                          <span class="comment-time">{{ formatDate(reply.createdAt) }}</span>
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

                      <p v-else class="comment-text" style="font-size: 13px;">{{ reply.content }}</p>
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
        <div class="sidebar-recommendations">
          <h3 class="sidebar-title">Vidéos suggérées</h3>

          <div class="recommended-list">
            <NuxtLink 
              v-for="rec in recommendedVideos" 
              :key="rec.id" 
              :to="`/video/${rec.customId || rec.id}`"
              class="rec-card"
            >
              <div class="rec-thumb">
                <img 
                  v-if="rec.thumbnail" 
                  :src="`/uploads/thumbnails/${rec.thumbnail}`" 
                  loading="lazy"
                  decoding="async"
                  style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px;"
                />
                <span v-else class="rec-play-icon">▶</span>
              </div>
              <div class="rec-info">
                <h4 class="rec-title">{{ rec.title }}</h4>
                <span class="rec-cat">{{ rec.category || 'Général' }}</span>
                <span class="rec-date">{{ formatDate(rec.createdAt) }}</span>
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import type { Comment, Video, VideoDetails } from '#shared/types/models'

const route = useRoute()
const router = useRouter()
const { token, user } = useAuth()

const videoPlayerRef = ref<HTMLVideoElement | null>(null)

const video = ref<VideoDetails | null>(null)
const videosList = ref<Video[]>([])
const comments = ref<Comment[]>([])
const pending = ref(true)
const errorMsg = ref('')

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

const loadData = async () => {
  pending.value = true
  errorMsg.value = ''
  
  const headers = token.value ? { Authorization: `Bearer ${token.value}` } : undefined

  try {
    const [vidData, allVideos, videoComments] = await Promise.all([
      $fetch<VideoDetails>(`/api/videos/${videoId.value}`, { headers }),
      $fetch<Video[]>('/api/videos'),
      $fetch<Comment[]>(`/api/videos/${videoId.value}/comments`)
    ])

    video.value = vidData
    likesCount.value = vidData.likesCount || 0
    dislikesCount.value = vidData.dislikesCount || 0
    userLikeStatus.value = vidData.userLikeStatus
    isFollowing.value = vidData.isFollowing
    subscribersCount.value = vidData.subscribersCount

    videosList.value = allVideos
    comments.value = videoComments
  } catch (error: unknown) {
    errorMsg.value = error instanceof Error ? error.message : 'Impossible de charger la vidéo.'
  } finally {
    pending.value = false
  }
}

onMounted(() => {
  loadData()
})

onUnmounted(() => {
  // Pause and release video player source to free GPU memory
  if (videoPlayerRef.value) {
    videoPlayerRef.value.pause()
    videoPlayerRef.value.removeAttribute('src')
    videoPlayerRef.value.load()
  }
})

watch(() => route.params.id, () => {
  loadData()
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

<style scoped>
.video-page-layout {
  display: flex;
  gap: 30px;
  align-items: flex-start;
}

@media (max-width: 992px) {
  .video-page-layout {
    flex-direction: column;
  }
}

.main-content {
  flex: 1;
  min-width: 0;
}

.sidebar-recommendations {
  width: 340px;
  flex-shrink: 0;
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--border-color);
}

@media (max-width: 992px) {
  .sidebar-recommendations {
    width: 100%;
  }
}

.player-wrapper {
  width: 100%;
  background: #000000;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.video-player {
  width: 100%;
  max-height: 580px;
  display: block;
}

.video-meta {
  margin-top: 18px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-color);
}

.video-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 10px 0;
  color: #111111;
  line-height: 1.3;
}

.meta-sub {
  display: flex;
  align-items: center;
  gap: 12px;
}

.category-badge {
  background: rgba(138, 43, 226, 0.1);
  color: var(--neon-purple);
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
}

.meta-date {
  color: var(--text-muted);
  font-size: 13px;
}

.uploader-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
  background: #f8f9fa;
  padding: 14px 18px;
  border-radius: 12px;
  margin-top: 12px;
}

.uploader-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--neon-purple);
}

.description-box {
  background: #ffffff;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
}

.comments-section {
  margin-top: 30px;
}

.comments-header {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 20px;
  color: #111;
}

.comment-input-block {
  margin-bottom: 25px;
}

.comment-textarea {
  width: 100%;
  min-height: 70px;
  font-size: 14px;
}

.comment-login-prompt {
  background: #fff5f8;
  border: 1px solid rgba(255, 20, 147, 0.2);
  padding: 18px;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 25px;
}

.comment-login-prompt p {
  margin: 0 0 12px 0;
  color: #444;
  font-size: 14px;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-card {
  display: flex;
  gap: 14px;
  background: #ffffff;
  padding: 14px;
  border-radius: 8px;
  border: 1px solid #f1f5f9;
}

.comment-avatar-img {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.comment-body {
  flex: 1;
}

.comment-author {
  font-weight: 600;
  font-size: 14px;
  color: #222;
  margin-bottom: 4px;
}

.comment-time {
  font-weight: 400;
  font-size: 12px;
  color: #888;
  margin-left: 8px;
}

.comment-text {
  margin: 0;
  font-size: 14px;
  color: #333;
  line-height: 1.4;
}

.sidebar-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: #111;
}

.recommended-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.rec-card {
  display: flex;
  gap: 12px;
  text-decoration: none;
  border-radius: 8px;
  padding: 6px;
  transition: background 0.2s;
}

.rec-card:hover {
  background: #f8f9fa;
}

.rec-thumb {
  width: 110px;
  height: 65px;
  background: linear-gradient(135deg, #1e1e24 0%, #2a2a36 100%);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.rec-play-icon {
  color: #ffffff;
  font-size: 18px;
  opacity: 0.8;
}

.rec-info {
  flex: 1;
  min-width: 0;
}

.rec-title {
  margin: 0 0 4px 0;
  font-size: 13px;
  font-weight: 600;
  color: #222;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.rec-cat {
  display: block;
  font-size: 11px;
  color: var(--neon-purple);
  font-weight: 600;
  margin-bottom: 2px;
}

.rec-date {
  font-size: 11px;
  color: #888;
}
</style>
