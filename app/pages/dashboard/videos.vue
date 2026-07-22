<template>
  <div class="mx-auto my-8 max-w-6xl px-5">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="m-0 text-[26px] text-[#111]">Gestionnaire de Vidéos</h1>
        <p class="mt-1 text-sm text-muted">Gérez, modifiez ou supprimez vos vidéos téléversées.</p>
      </div>
      <NuxtLink to="/channel" class="text-sm text-muted no-underline">&larr; Retour à mon profil</NuxtLink>
    </div>

    <div v-if="loading" class="p-10 text-center text-brand">
      Chargement de vos vidéos...
    </div>

    <!-- Barre de recherche spécifique dans le gestionnaire -->
    <div v-else-if="videos.length > 0" class="mb-5 flex justify-end">
      <div class="relative w-full max-w-xs">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Filtrer mes vidéos..." 
          class="w-full rounded-[20px] border border-slate-300 bg-white py-2 pr-3.5 pl-9 text-[13px] outline-none"
        />
        <span class="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-slate-500">🔍</span>
      </div>
    </div>

    <div v-if="filteredVideos.length === 0 && videos.length > 0" class="rounded-xl border border-line bg-white p-10 text-center text-muted">
      Aucune vidéo ne correspond à votre recherche "{{ searchQuery }}".
    </div>

    <div v-else-if="videos.length === 0" class="rounded-xl border border-line bg-white p-12 text-center">
      <h3 class="mt-0">Aucune vidéo publiée</h3>
      <p class="text-muted">Vous n'avez pas encore téléversé de vidéos.</p>
      <NuxtLink to="/upload" class="mt-4 inline-block rounded-md bg-brand px-4 py-2 font-semibold text-white no-underline">Téléverser une vidéo</NuxtLink>
    </div>

    <div v-else class="flex flex-col gap-4">
      <div 
        v-for="v in filteredVideos" 
        :key="v.id" 
        class="flex items-center justify-between gap-5 rounded-xl border border-line bg-white p-[18px] shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
      >
        <div class="flex min-w-0 flex-1 items-center gap-[18px]">
          <div class="flex h-[65px] w-[110px] shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#1e1e24] text-xl text-white">
            <img 
              v-if="v.thumbnail" 
              :src="`/uploads/thumbnails/${v.thumbnail}`" 
              loading="lazy"
              decoding="async"
              class="size-full object-cover"
            />
            <span v-else>▶</span>
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="mb-1.5 truncate text-base text-[#111]">
              <NuxtLink :to="`/video/${v.customId || v.id}`" class="text-inherit no-underline">{{ v.title }}</NuxtLink>
            </h3>
            <div class="flex items-center gap-2.5 text-xs">
              <span :style="getVisibilityStyle(v.visibility)" class="rounded-xl px-2 py-0.5 font-semibold">
                {{ getVisibilityLabel(v.visibility) }}
              </span>
              <span class="font-semibold text-brand">{{ v.category || 'Divertissement' }}</span>
              <span class="text-muted">👁 {{ v.views }} vues</span>
              <span class="text-muted">👍 {{ v.likesCount }} | 👎 {{ v.dislikesCount }}</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2.5">
          <!-- Redirection vers la page dédiée d'édition /video/edit/[id] -->
          <NuxtLink :to="`/video/edit/${v.customId || v.id}`" class="rounded-md bg-brand px-3.5 py-1.5 text-[13px] font-semibold text-white no-underline">
            ✏️ Modifier
          </NuxtLink>
          <button @click="confirmDelete(v.id)" class="rounded-md bg-accent px-3.5 py-1.5 text-[13px] font-semibold text-white">
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
import type { Video } from '#shared/types/models'

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
    const data = await $fetch<Video[]>('/api/users/my-videos')
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
    await $fetch(`/api/videos/${id}`, { method: 'DELETE' })
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
