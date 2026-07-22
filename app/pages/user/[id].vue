<template>
  <div class="min-h-screen bg-[#fcfcfc]">
    <div v-if="loading" class="p-15 text-center text-brand">
      <h2>Chargement du profil...</h2>
    </div>

    <div v-else-if="errorMsg" class="p-15 text-center">
      <h2 class="text-accent">{{ errorMsg }}</h2>
      <NuxtLink to="/" class="mt-4 inline-block rounded-md bg-brand px-4 py-2 font-semibold text-white no-underline">Retour à l'accueil</NuxtLink>
    </div>

    <div v-else-if="channel" class="mx-auto my-8 max-w-6xl px-5">
      
      <!-- Profil Public Card -->
      <div class="mb-9 flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-line bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        
        <div class="flex items-center gap-5">
          <img :src="channel.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${channel.username}`" loading="lazy" decoding="async" class="size-[90px] rounded-full border-[3px] border-brand object-cover" />
          <div>
            <h1 class="mb-1.5 text-[26px] text-[#111]">{{ channel.username }}</h1>
            <p class="mb-2.5 max-w-[500px] text-sm text-muted">
              {{ channel.bio || "Aucune biographie disponible." }}
            </p>
            <div class="text-[13px] font-medium text-[#555]">
              <!-- Masquage strict du nombre d'abonnés sur profil public d'autrui -->
              <span v-if="isOwnChannel && followersCount !== null">👥 {{ followersCount }} abonnés • </span>
              <span>🎬 {{ channel.videos?.length || 0 }} vidéos publiques</span>
            </div>
          </div>
        </div>

        <div class="flex flex-col items-end gap-4">
          <!-- Evaluation Profil par Etoiles -->
          <div class="flex items-center gap-1.5 rounded-[20px] border border-line bg-surface px-3.5 py-2">
            <span class="mr-1 text-[13px] font-semibold text-[#444]">Note du créateur:</span>
            <span 
              v-for="star in 5" 
              :key="star" 
              @click="rateChannel(star)" 
              class="cursor-pointer text-xl transition-transform duration-100"
              :style="{ color: star <= (userRating || Math.round(avgRating)) ? '#f59e0b' : '#cbd5e1' }"
            >
              ★
            </span>
            <span class="ml-1.5 text-sm font-bold text-[#111]">{{ avgRating }}</span>
            <span class="text-xs text-[#888]">({{ totalRatings }})</span>
          </div>

          <!-- Bouton S'abonner OU Modifier le profil si propre compte -->
          <button 
            v-if="!isOwnChannel" 
            @click="toggleFollow" 
            :class="isFollowing ? 'bg-brand' : 'bg-accent'"
            class="rounded-md px-6 py-2.5 text-sm font-semibold text-white"
          >
            {{ isFollowing ? 'Abonné ✔' : 'S\'abonner' }}
          </button>
          
          <NuxtLink v-else to="/settings" class="rounded-md bg-accent px-[18px] py-2 text-[13px] font-semibold text-white no-underline">
            ✏️ Modifier le profil
          </NuxtLink>
        </div>

      </div>

      <!-- En-tête & Barre de recherche dédiée sur la chaîne du créateur -->
      <div class="mb-5 flex flex-wrap items-center justify-between gap-4">
        <h2 class="m-0 text-xl text-[#111]">
          Vidéos publiées ({{ filteredVideos.length }})
        </h2>

        <!-- Barre de recherche spécifique au créateur -->
        <div class="relative w-full max-w-xs">
          <input 
            type="text" 
            v-model="channelSearchQuery" 
            placeholder="Rechercher dans cette chaîne..." 
            class="w-full rounded-[20px] border border-slate-300 bg-white py-2 pr-3.5 pl-9 text-[13px] outline-none"
          />
          <span class="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-slate-500">🔍</span>
        </div>
      </div>

      <div v-if="filteredVideos.length === 0 && channel.videos?.length > 0" class="rounded-xl border border-line bg-white p-10 text-center text-muted">
        Aucune vidéo de ce créateur ne correspond à "{{ channelSearchQuery }}".
      </div>

      <div v-else-if="channel.videos?.length === 0" class="p-10 text-center text-muted">
        Ce créateur n'a pas encore publié de vidéo publique.
      </div>

      <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-5">
        <NuxtLink 
          v-for="video in filteredVideos" 
          :key="video.id"
          :to="`/video/${video.customId || video.id}`" 
          class="overflow-hidden rounded-xl border border-line bg-white text-inherit no-underline shadow-sm"
        >
          <div class="aspect-video overflow-hidden bg-surface">
            <img 
              v-if="video.thumbnail" 
              :src="`/uploads/thumbnails/${video.thumbnail}`" 
              loading="lazy"
              decoding="async"
              class="size-full object-cover"
            />
          </div>
          <div class="p-4">
            <h3 class="m-0 text-base text-ink">{{ video.title }}</h3>
            <div class="mt-2 flex items-center justify-between text-xs text-muted">
              <span class="font-semibold text-brand">{{ video.category || 'Divertissement' }}</span>
              <span>👍 {{ video.likesCount }} | 👎 {{ video.dislikesCount }}</span>
            </div>
          </div>
        </NuxtLink>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import type { Channel } from '#shared/types/models'

const route = useRoute()
const router = useRouter()
const { isAuthenticated, user } = useAuth()

const isFollowing = ref(false)
const followersCount = ref<number | null>(null)
const avgRating = ref(0)
const totalRatings = ref(0)
const userRating = ref<number | null>(null)

const targetUserId = computed(() => parseInt(typeof route.params.id === 'string' ? route.params.id : '', 10))

const { data: channelResponse, pending: loading, error, refresh: fetchChannel } = await useAsyncData<{ channel: Channel }>(
  'public-channel',
  async () => $fetch<{ channel: Channel }>(`/api/users/${targetUserId.value}/channel`),
  { watch: [targetUserId] }
)

const channel = computed(() => channelResponse.value?.channel ?? null)
const errorMsg = computed(() => error.value instanceof Error ? error.value.message : '')

watch(isAuthenticated, () => {
  void fetchChannel()
})

const channelSearchQuery = ref('')

const filteredVideos = computed(() => {
  if (!channel.value || !channel.value.videos) return []
  if (!channelSearchQuery.value.trim()) return channel.value.videos
  const q = channelSearchQuery.value.toLowerCase().trim()
  return channel.value.videos.filter(v => 
    v.title.toLowerCase().includes(q) ||
    (v.description && v.description.toLowerCase().includes(q)) ||
    (v.category && v.category.toLowerCase().includes(q))
  )
})

const isOwnChannel = computed(() => {
  return user.value && user.value.id === targetUserId.value
})

watch(channel, (currentChannel) => {
  if (!currentChannel) return
  isFollowing.value = currentChannel.isFollowing
  followersCount.value = currentChannel.followersCount
  avgRating.value = currentChannel.averageRating
  totalRatings.value = currentChannel.ratingsCount
  userRating.value = currentChannel.userRating
}, { immediate: true })

const toggleFollow = async () => {
  if (!isAuthenticated.value) {
    router.push('/login')
    return
  }
  try {
    const res = await $fetch<{ isFollowing: boolean, subscribersCount: number }>(`/api/users/${targetUserId.value}/follow`, { method: 'POST' })
    isFollowing.value = res.isFollowing
    if (followersCount.value !== null) {
      followersCount.value = res.subscribersCount
    }
  } catch (error: unknown) {
    alert(error instanceof Error ? error.message : 'Erreur')
  }
}

const rateChannel = async (stars: number) => {
  if (!isAuthenticated.value) {
    router.push('/login')
    return
  }
  if (isOwnChannel.value) {
    alert('Vous ne pouvez pas noter votre propre profil.')
    return
  }
  try {
    const res = await $fetch<{ averageRating: number, ratingsCount: number, userRating: number }>(`/api/users/${targetUserId.value}/rate`, {
      method: 'POST',
      body: { stars }
    })
    avgRating.value = res.averageRating
    totalRatings.value = res.ratingsCount
    userRating.value = res.userRating
  } catch (error: unknown) {
    alert(error instanceof Error ? error.message : 'Erreur lors de l\'évaluation.')
  }
}
</script>
