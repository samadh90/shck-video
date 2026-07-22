<template>
  <div class="bg-[#121212] px-5 py-8 text-white">
    <div class="mx-auto max-w-7xl">
      
      <!-- Banner Thématique +18 Crimson Dark -->
      <div class="mb-8 flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-red-600 bg-linear-to-br from-[#1e1e1e] to-[#2a0808] p-6 shadow-[0_8px_30px_rgba(220,38,38,0.15)]">
        <div>
          <div class="flex items-center gap-2.5">
            <h1 class="m-0 text-[26px] text-white">SHCK<span class="font-black text-red-600">Video +18</span></h1>
            <span class="rounded-xl bg-red-600 px-2.5 py-0.5 text-[11px] font-bold uppercase text-white">
              Catalogue Mature
            </span>
          </div>
          <p class="mt-1.5 text-sm text-zinc-400">
            Espace réservé aux utilisateurs majeurs (≥ 18 ans). Thème Crimson Dark actif.
          </p>
        </div>

        <NuxtLink to="/" class="rounded-md bg-red-600 px-5 py-2.5 text-sm font-semibold text-white no-underline transition hover:bg-red-700">
          ⬅️ Retour à SHCK Video Classique
        </NuxtLink>
      </div>

      <!-- Grille des Vidéos Matures (+18) -->
      <div>
        <div v-if="loading" class="p-12 text-center font-bold text-red-600">
          Chargement du catalogue réservé +18...
        </div>

        <div v-else-if="videos.length === 0" class="rounded-xl border border-[#333] bg-[#1e1e1e] p-15 text-center text-zinc-400">
          <span class="mb-2.5 block text-4xl">🔞</span>
          Aucune vidéo réservée aux adultes n'est disponible pour le moment.
        </div>

        <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-5 p-0">
          <div 
            v-for="video in videos" 
            :key="video.id"
            class="overflow-hidden rounded-xl border border-[#333] bg-[#1e1e1e] shadow-sm"
          >
            <NuxtLink :to="`/video/${video.customId || video.id}`" class="block no-underline">
              <div class="flex aspect-video items-center justify-center overflow-hidden bg-linear-to-br from-[#2a0808] to-[#121212]">
                <img 
                  v-if="video.thumbnail" 
                  :src="`/uploads/thumbnails/${video.thumbnail}`" 
                  loading="lazy"
                  decoding="async"
                  class="size-full object-cover"
                />
                <span v-else class="text-3xl text-red-600">🔞</span>
              </div>
            </NuxtLink>
            
            <div class="p-4">
              <h3>
                <NuxtLink :to="`/video/${video.customId || video.id}`" class="text-inherit no-underline">{{ video.title }}</NuxtLink>
              </h3>
              
              <NuxtLink 
                :to="`/user/${video.userId}`" 
                class="my-2 flex items-center gap-2 no-underline"
              >
                <img :src="video.user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${video.user?.username || 'U'}`" loading="lazy" decoding="async" class="size-[22px] rounded-full border border-red-600" />
                <span class="text-[13px] font-semibold text-zinc-300">{{ video.user?.username || 'Utilisateur' }}</span>
              </NuxtLink>

              <div class="flex items-center justify-between text-xs text-zinc-400">
                <span class="font-bold text-red-600">🔞 +18 • {{ video.category || 'Divertissement' }}</span>
                <span>👁 {{ video.views || 0 }} vues</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import type { Video } from '#shared/types/models'

const { token, user } = useAuth()
const router = useRouter()

const videos = ref<Video[]>([])
const loading = ref(true)

const checkAccessAndFetch = async () => {
  // Verification stricte de l'âge >= 18
  let userAge: number | null = null
  if (user.value?.birthdate) {
    const birth = new Date(user.value.birthdate)
    if (!isNaN(birth.getTime())) {
      const today = new Date()
      userAge = today.getFullYear() - birth.getFullYear()
      const m = today.getMonth() - birth.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) userAge--
    }
  }

  if (!userAge || userAge < 18) {
    alert("Accès refusé. La section SHCK Video +18 est strictement réservée aux utilisateurs majeurs (≥ 18 ans).")
    router.push('/')
    return
  }

  try {
    videos.value = await $fetch<Video[]>('/api/videos?is18Plus=true', {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  checkAccessAndFetch()
})
</script>
