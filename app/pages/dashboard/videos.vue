<template>
  <div style="max-width: 1100px; margin: 30px auto; padding: 0 20px;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
      <div>
        <h1 style="margin: 0; font-size: 26px; color: #111;">Gestionnaire de Vidéos</h1>
        <p style="margin: 5px 0 0 0; color: var(--text-muted); font-size: 14px;">Gérez, modifiez ou supprimez vos vidéos téléversées.</p>
      </div>
      <NuxtLink to="/channel" style="color: var(--text-muted); text-decoration: none; font-size: 14px;">&larr; Retour à mon profil</NuxtLink>
    </div>

    <div v-if="loading" style="text-align: center; padding: 40px; color: var(--neon-purple);">
      Chargement de vos vidéos...
    </div>

    <!-- Barre de recherche spécifique dans le gestionnaire -->
    <div v-else-if="videos.length > 0" style="margin-bottom: 20px; display: flex; justify-content: flex-end;">
      <div style="position: relative; width: 100%; max-width: 320px;">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Filtrer mes vidéos..." 
          style="width: 100%; padding: 8px 14px 8px 36px; border-radius: 20px; border: 1px solid #cbd5e1; font-size: 13px; outline: none; background: #ffffff;"
        />
        <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 14px; color: #64748b;">🔍</span>
      </div>
    </div>

    <div v-if="filteredVideos.length === 0 && videos.length > 0" style="background: #ffffff; border-radius: 12px; padding: 40px; text-align: center; border: 1px solid #e2e8f0; color: #666;">
      Aucune vidéo ne correspond à votre recherche "{{ searchQuery }}".
    </div>

    <div v-else-if="videos.length === 0" style="background: #ffffff; border-radius: 12px; padding: 50px; text-align: center; border: 1px solid #e2e8f0;">
      <h3 style="margin-top: 0;">Aucune vidéo publiée</h3>
      <p style="color: var(--text-muted);">Vous n'avez pas encore téléversé de vidéos.</p>
      <NuxtLink to="/upload" class="neon-btn" style="margin-top: 15px; display: inline-block;">Téléverser une vidéo</NuxtLink>
    </div>

    <div v-else style="display: flex; flex-direction: column; gap: 16px;">
      <div 
        v-for="v in filteredVideos" 
        :key="v.id" 
        style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 18px; display: flex; align-items: center; justify-content: space-between; gap: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.03);"
      >
        <div style="display: flex; align-items: center; gap: 18px; flex: 1; min-width: 0;">
          <div style="width: 110px; height: 65px; background: #1e1e24; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px; flex-shrink: 0; overflow: hidden;">
            <img 
              v-if="v.thumbnail" 
              :src="`/uploads/thumbnails/${v.thumbnail}`" 
              loading="lazy"
              decoding="async"
              style="width: 100%; height: 100%; object-fit: cover;"
            />
            <span v-else>▶</span>
          </div>
          <div style="flex: 1; min-width: 0;">
            <h3 style="margin: 0 0 6px 0; font-size: 16px; color: #111; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
              <NuxtLink :to="`/video/${v.customId || v.id}`" style="color: inherit; text-decoration: none;">{{ v.title }}</NuxtLink>
            </h3>
            <div style="display: flex; align-items: center; gap: 10px; font-size: 12px;">
              <span :style="getVisibilityStyle(v.visibility)" style="padding: 2px 8px; border-radius: 12px; font-weight: 600;">
                {{ getVisibilityLabel(v.visibility) }}
              </span>
              <span style="color: var(--neon-purple); font-weight: 600;">{{ v.category || 'Divertissement' }}</span>
              <span style="color: var(--text-muted);">👁 {{ v.views }} vues</span>
              <span style="color: #666;">👍 {{ v.likesCount }} | 👎 {{ v.dislikesCount }}</span>
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 10px;">
          <!-- Redirection vers la page dédiée d'édition /video/edit/[id] -->
          <NuxtLink :to="`/video/edit/${v.customId || v.id}`" class="neon-btn" style="text-decoration: none; padding: 6px 14px; font-size: 13px;">
            ✏️ Modifier
          </NuxtLink>
          <button @click="confirmDelete(v.id)" class="neon-btn neon-btn-pink" style="padding: 6px 14px; font-size: 13px;">
            ❌ Supprimer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import type { Video } from '#shared/types/models'

const { token } = useAuth()

const videos = ref<Video[]>([])
const loading = ref(true)
const searchQuery = ref('')

const filteredVideos = computed(() => {
  if (!searchQuery.value.trim()) return videos.value
  const q = searchQuery.value.toLowerCase().trim()
  return videos.value.filter(v => 
    v.title.toLowerCase().includes(q) ||
    (v.description && v.description.toLowerCase().includes(q)) ||
    (v.category && v.category.toLowerCase().includes(q))
  )
})

const fetchMyVideos = async () => {
  loading.value = true
  try {
    const data = await $fetch<Video[]>('/api/users/my-videos', {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    videos.value = data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchMyVideos()
})

const confirmDelete = async (id: number) => {
  if (!confirm('Supprimer définitivement cette vidéo ?')) return
  try {
    await $fetch(`/api/videos/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    fetchMyVideos()
  } catch (error: unknown) {
    alert(error instanceof Error ? error.message : 'Erreur lors de la suppression.')
  }
}

const getVisibilityLabel = (v: string | null) => {
  if (v === 'PRIVATE') return '🔒 Privée'
  if (v === 'UNLISTED') return '🔗 Non répertoriée'
  return '🌐 Publique'
}

const getVisibilityStyle = (v: string | null) => {
  if (v === 'PRIVATE') return 'background: #fee2e2; color: #dc2626;'
  if (v === 'UNLISTED') return 'background: #fef3c7; color: #d97706;'
  return 'background: #dcfce7; color: #16a34a;'
}
</script>
