<template>
  <div style="max-width: 1000px; margin: 30px auto; padding: 0 20px;">
    
    <div style="margin-bottom: 25px;">
      <h1 style="font-size: 24px; color: #111; margin: 0 0 6px 0;">
        Résultats pour "<span style="color: var(--neon-purple);">{{ activeQuery }}</span>"
      </h1>
      <p style="margin: 0; color: var(--text-muted); font-size: 14px;">
        {{ totalResults }} résultat(s) trouvé(s)
      </p>
    </div>

    <div v-if="loading" style="text-align: center; color: var(--neon-purple); padding: 50px;">
      <h2>Recherche en cours...</h2>
    </div>

    <div v-else-if="totalResults === 0" style="background: white; border-radius: 12px; padding: 60px; text-align: center; border: 1px solid #e2e8f0;">
      <h3>Aucun résultat trouvé</h3>
      <p style="color: var(--text-muted);">Essayez de rechercher d'autres mots-clés ou le nom d'un créateur.</p>
      <NuxtLink to="/" class="neon-btn" style="margin-top: 15px; display: inline-block;">Retour à l'accueil</NuxtLink>
    </div>

    <div v-else style="display: flex; flex-direction: column; gap: 30px;">
      
      <!-- SECTION 1 : CHAÎNES & CRÉATEURS -->
      <div v-if="channels.length > 0">
        <h2 style="font-size: 18px; color: #111; margin: 0 0 15px 0; border-bottom: 2px solid var(--neon-purple); padding-bottom: 8px; display: inline-block;">
          👤 Chaînes & Créateurs ({{ channels.length }})
        </h2>

        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div 
            v-for="ch in channels" 
            :key="ch.id" 
            style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 18px; display: flex; align-items: center; justify-content: space-between; gap: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.03);"
          >
            <div style="display: flex; align-items: center; gap: 16px;">
              <img :src="ch.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${ch.username}`" loading="lazy" decoding="async" style="width: 55px; height: 55px; border-radius: 50%; object-fit: cover; border: 2px solid var(--neon-purple);" />
              <div>
                <h3 style="margin: 0 0 4px 0; font-size: 17px; color: #111;">{{ ch.username }}</h3>
                <p style="margin: 0; color: #666; font-size: 13px; max-width: 500px;">{{ ch.bio || 'Aucune biographie.' }}</p>
              </div>
            </div>

            <NuxtLink :to="`/user/${ch.id}`" class="neon-btn" style="text-decoration: none; padding: 8px 18px; font-size: 13px; flex-shrink: 0;">
              Voir la chaîne
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- SECTION 2 : VIDÉOS -->
      <div v-if="videos.length > 0">
        <h2 style="font-size: 18px; color: #111; margin: 0 0 15px 0; border-bottom: 2px solid var(--neon-pink); padding-bottom: 8px; display: inline-block;">
          🎬 Vidéos ({{ videos.length }})
        </h2>

        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div 
            v-for="v in videos" 
            :key="v.id" 
            style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 16px; display: flex; gap: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.03); align-items: center;"
          >
            <NuxtLink :to="`/video/${v.customId || v.id}`" style="flex-shrink: 0; text-decoration: none;">
              <div style="width: 160px; height: 95px; background: #1e1e24; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; color: white;">
                <img v-if="v.thumbnail" :src="`/uploads/thumbnails/${v.thumbnail}`" loading="lazy" decoding="async" style="width: 100%; height: 100%; object-fit: cover;" />
                <span v-else style="font-size: 24px;">▶</span>
              </div>
            </NuxtLink>

            <div style="flex: 1; min-width: 0;">
              <h3 style="margin: 0 0 6px 0; font-size: 17px; color: #111;">
                <NuxtLink :to="`/video/${v.customId || v.id}`" style="color: inherit; text-decoration: none;">{{ v.title }}</NuxtLink>
              </h3>

              <NuxtLink :to="`/user/${v.userId}`" style="display: flex; align-items: center; gap: 8px; text-decoration: none; margin-bottom: 8px;">
                <img :src="v.user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${v.user?.username}`" loading="lazy" decoding="async" style="width: 22px; height: 22px; border-radius: 50%;" />
                <span style="font-size: 13px; color: #444; font-weight: 600;">{{ v.user?.username }}</span>
              </NuxtLink>

              <p style="margin: 0 0 8px 0; color: #666; font-size: 13px; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                {{ v.description || 'Aucune description.' }}
              </p>

              <div style="display: flex; align-items: center; gap: 12px; font-size: 12px; color: var(--text-muted);">
                <span style="color: var(--neon-purple); font-weight: 600;">{{ v.category || 'Divertissement' }}</span>
                <span>👁 {{ v.views }} vues</span>
                <span>👍 {{ v.likesCount }} | 👎 {{ v.dislikesCount }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { PublicUser, Video } from '#shared/types/models'

const route = useRoute()

const activeQuery = ref('')
const channels = ref<PublicUser[]>([])
const videos = ref<Video[]>([])
const loading = ref(true)

const totalResults = computed(() => channels.value.length + videos.value.length)

const fetchSearchResults = async () => {
  const q = typeof route.query.q === 'string' ? route.query.q : ''
  activeQuery.value = q

  if (!q.trim()) {
    channels.value = []
    videos.value = []
    loading.value = false
    return
  }

  loading.value = true
  try {
    const data = await $fetch<{ channels: PublicUser[], videos: Video[] }>(`/api/search?q=${encodeURIComponent(q)}`)
    channels.value = data.channels
    videos.value = data.videos
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSearchResults()
})

watch(() => route.query.q, () => {
  fetchSearchResults()
})
</script>
