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
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; margin-bottom: 20px;">
        <h2 style="font-size: 20px; color: #111; margin: 0;">
          Vidéos publiées ({{ filteredVideos.length }})
        </h2>

        <!-- Barre de recherche spécifique au créateur -->
        <div style="position: relative; width: 100%; max-width: 320px;">
          <input 
            type="text" 
            v-model="channelSearchQuery" 
            placeholder="Rechercher dans cette chaîne..." 
            style="width: 100%; padding: 9px 14px 9px 36px; border-radius: 20px; border: 1px solid #cbd5e1; font-size: 13px; outline: none; background: #ffffff;"
          />
          <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 14px; color: #64748b;">🔍</span>
        </div>
      </div>

      <div v-if="filteredVideos.length === 0 && channel.videos?.length > 0" style="text-align: center; padding: 40px; color: #666; background: white; border-radius: 12px; border: 1px solid #e2e8f0;">
        Aucune vidéo de ce créateur ne correspond à "{{ channelSearchQuery }}".
      </div>

      <div v-else-if="channel.videos?.length === 0" style="text-align: center; padding: 40px; color: #777;">
        Ce créateur n'a pas encore publié de vidéo publique.
      </div>

      <div v-else class="video-grid" style="padding: 0;">
        <NuxtLink 
          v-for="video in filteredVideos" 
          :key="video.id"
          :to="`/video/${video.customId || video.id}`" 
          class="video-card"
          style="text-decoration: none;"
        >
          <div class="thumbnail">
            <img 
              v-if="video.thumbnail" 
              :src="`/uploads/thumbnails/${video.thumbnail}`" 
              loading="lazy"
              decoding="async"
              style="width: 100%; height: 100%; object-fit: cover;"
            />
          </div>
          <div class="video-info">
            <h3>{{ video.title }}</h3>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--text-muted); margin-top: 8px;">
              <span style="color: var(--neon-purple); font-weight: 600;">{{ video.category || 'Divertissement' }}</span>
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
const { token, user } = useAuth()

const isFollowing = ref(false)
const followersCount = ref<number | null>(null)
const avgRating = ref(0)
const totalRatings = ref(0)
const userRating = ref<number | null>(null)

const targetUserId = computed(() => parseInt(typeof route.params.id === 'string' ? route.params.id : '', 10))

const { data: channelResponse, pending: loading, error, refresh: fetchChannel } = await useAsyncData<{ channel: Channel }>(
  'public-channel',
  async () => $fetch<{ channel: Channel }>(`/api/users/${targetUserId.value}/channel`, {
    headers: token.value ? { Authorization: `Bearer ${token.value}` } : undefined
  }),
  { watch: [targetUserId] }
)

const channel = computed(() => channelResponse.value?.channel ?? null)
const errorMsg = computed(() => error.value instanceof Error ? error.value.message : '')

watch(token, () => {
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
  if (!token.value) {
    router.push('/login')
    return
  }
  try {
    const res = await $fetch<{ isFollowing: boolean, subscribersCount: number }>(`/api/users/${targetUserId.value}/follow`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    isFollowing.value = res.isFollowing
    if (followersCount.value !== null) {
      followersCount.value = res.subscribersCount
    }
  } catch (error: unknown) {
    alert(error instanceof Error ? error.message : 'Erreur')
  }
}

const rateChannel = async (stars: number) => {
  if (!token.value) {
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
      headers: { 'Authorization': `Bearer ${token.value}` },
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
