<template>
  <div style="max-width: 1280px; margin: 25px auto; padding: 0 20px;">
    <div class="home-layout">
      
      <!-- COLONNE GAUCHE : GRILLE DES VIDÉOS PUBLIQUES -->
      <div style="flex: 1; min-width: 0;">
        <div v-if="pending" style="color: var(--neon-purple); text-align: center; padding: 40px;">
          Chargement des vidéos...
        </div>
        
        <div v-else-if="!videos || videos.length === 0" style="text-align: center; padding: 60px; color: #666; background: white; border-radius: 12px; border: 1px solid #e2e8f0;">
          Aucune vidéo publique disponible pour le moment.
        </div>

        <div 
          v-else
          class="video-grid"
          style="padding: 0;"
        >
          <div 
            v-for="video in videos" 
            :key="video.id"
            class="video-card"
          >
            <NuxtLink :to="`/video/${video.customId || video.id}`" style="text-decoration: none; display: block;">
              <div class="thumbnail">
                <img 
                  v-if="video.thumbnail" 
                  :src="`/uploads/thumbnails/${video.thumbnail}`" 
                  loading="lazy"
                  decoding="async"
                  style="width: 100%; height: 100%; object-fit: cover;"
                />
              </div>
            </NuxtLink>
            
            <div class="video-info">
              <h3>
                <NuxtLink :to="`/video/${video.customId || video.id}`" style="color: inherit; text-decoration: none;">{{ video.title }}</NuxtLink>
              </h3>
              
              <NuxtLink 
                :to="`/user/${video.userId}`" 
                style="display: flex; align-items: center; gap: 8px; margin: 8px 0; text-decoration: none;"
              >
                <img :src="video.user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${video.user?.username || 'U'}`" loading="lazy" decoding="async" style="width: 22px; height: 22px; border-radius: 50%;" />
                <span style="font-size: 13px; color: #444; font-weight: 600;">{{ video.user?.username || 'Utilisateur' }}</span>
              </NuxtLink>

              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--text-muted);">
                <span style="color: var(--neon-purple); font-weight: 600;">{{ video.category || 'Divertissement' }}</span>
                <span>👁 {{ video.views || 0 }} vues</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- COLONNE DROITE : SIDEBAR DISCRÈTE DES ABONNEMENTS -->
      <div v-if="token" class="subscriptions-sidebar">
        <div style="background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; padding: 20px; box-shadow: 0 4px 16px rgba(0,0,0,0.02); position: sticky; top: 90px;">
          <h3 style="margin: 0 0 14px 0; font-size: 15px; color: #111; display: flex; align-items: center; justify-content: space-between;">
            <span>📺 Mes Abonnements</span>
            <span style="font-size: 11px; background: rgba(138, 43, 226, 0.1); color: var(--neon-purple); padding: 2px 8px; border-radius: 10px;">
              {{ subscriptions.length }}
            </span>
          </h3>

          <div v-if="subscriptions.length === 0" style="font-size: 13px; color: #777; text-align: center; padding: 20px 0;">
            Vous ne suivez aucune chaîne pour le moment.
          </div>

          <div v-else style="display: flex; flex-direction: column; gap: 10px; max-height: 400px; overflow-y: auto;">
            <NuxtLink 
              v-for="sub in subscriptions" 
              :key="sub.id" 
              :to="`/user/${sub.id}`"
              class="sub-item"
            >
              <img :src="sub.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${sub.username}`" loading="lazy" decoding="async" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />
              <span style="font-size: 13px; font-weight: 600; color: #333; flex: 1; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                {{ sub.username }}
              </span>
              <span style="font-size: 11px; color: var(--neon-purple); font-weight: 500;">Voir</span>
            </NuxtLink>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import type { PublicUser, Video } from '#shared/types/models'

const route = useRoute()
const { token } = useAuth()
const subscriptions = ref<PublicUser[]>([])
const videos = ref<Video[]>([])
const pending = ref(true)

const fetchVideos = async () => {
  pending.value = true
  try {
    const isMature = route.query.mature === '1'
    const headers = token.value ? { Authorization: `Bearer ${token.value}` } : undefined
    const url = isMature ? '/api/videos?is18Plus=true' : '/api/videos'
    videos.value = await $fetch<Video[]>(url, { headers })
  } catch (err) {
    console.error(err)
  } finally {
    pending.value = false
  }
}

watch(() => route.query.mature, () => {
  fetchVideos()
})

const fetchSubscriptions = async () => {
  if (!token.value) return
  try {
    subscriptions.value = await $fetch<PublicUser[]>('/api/users/subscriptions', {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
  } catch (err) {
    console.error(err)
  }
}

onMounted(() => {
  fetchVideos()
  fetchSubscriptions()
})
</script>

<style scoped>
.home-layout {
  display: flex;
  gap: 25px;
  align-items: flex-start;
}

.subscriptions-sidebar {
  width: 280px;
  flex-shrink: 0;
}

@media (max-width: 992px) {
  .home-layout {
    flex-direction: column;
  }
  .subscriptions-sidebar {
    width: 100%;
  }
}

.sub-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  text-decoration: none;
  transition: background 0.15s;
}

.sub-item:hover {
  background: #f8f9fa;
}
</style>
