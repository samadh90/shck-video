<template>
  <div class="mx-auto my-6 max-w-7xl px-5">
    <div class="flex items-start gap-6 max-lg:flex-col">
      
      <!-- COLONNE GAUCHE : GRILLE DES VIDÉOS PUBLIQUES -->
      <div class="min-w-0 flex-1">
        <div v-if="pending" class="p-10 text-center text-brand">
          Chargement des vidéos...
        </div>
        
        <div v-else-if="!videos || videos.length === 0" class="rounded-xl border border-line bg-white p-15 text-center text-muted">
          Aucune vidéo publique disponible pour le moment.
        </div>

        <div 
          v-else
          class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6"
        >
          <div 
            v-for="video in videos" 
            :key="video.id"
            class="cursor-pointer overflow-hidden rounded-xl border border-line bg-white transition duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(138,43,226,0.12)]"
          >
            <NuxtLink :to="`/video/${video.customId || video.id}`" class="block no-underline">
              <div class="relative flex h-[170px] items-center justify-center overflow-hidden bg-gradient-to-br from-[#1e1e24] to-[#2a2a36] before:text-4xl before:text-white/80 before:content-['▶'] has-[img]:before:hidden">
                <img 
                  v-if="video.thumbnail" 
                  :src="`/uploads/thumbnails/${video.thumbnail}`" 
                  loading="lazy"
                  decoding="async"
                  class="size-full object-cover"
                />
              </div>
            </NuxtLink>
            
            <div class="p-3.5">
              <h3 class="mb-2 overflow-hidden text-sm font-semibold whitespace-nowrap text-ellipsis text-[#111]">
                <NuxtLink :to="`/video/${video.customId || video.id}`" class="text-inherit no-underline">{{ video.title }}</NuxtLink>
              </h3>
              
              <NuxtLink 
                :to="`/user/${video.userId}`" 
                class="my-2 flex items-center gap-2 no-underline"
              >
                <img :src="video.user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${video.user?.username || 'U'}`" loading="lazy" decoding="async" class="size-[22px] rounded-full" />
                <span class="text-[13px] font-semibold text-[#444]">{{ video.user?.username || 'Utilisateur' }}</span>
              </NuxtLink>

              <div class="flex items-center justify-between text-xs text-muted">
                <span class="font-semibold text-brand">{{ video.category || 'Divertissement' }}</span>
                <span>👁 {{ video.views || 0 }} vues</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- COLONNE DROITE : SIDEBAR DISCRÈTE DES ABONNEMENTS -->
      <div v-if="isAuthenticated" class="w-[280px] shrink-0 max-lg:w-full">
        <div class="sticky top-[90px] rounded-[14px] border border-line bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.02)]">
          <h3 class="mb-3.5 flex items-center justify-between text-[15px] text-[#111]">
            <span>📺 Mes Abonnements</span>
            <span class="rounded-[10px] bg-brand/10 px-2 py-0.5 text-[11px] text-brand">
              {{ subscriptions.length }}
            </span>
          </h3>

          <div v-if="subscriptions.length === 0" class="py-5 text-center text-[13px] text-[#777]">
            Vous ne suivez aucune chaîne pour le moment.
          </div>

          <div v-else class="flex max-h-[400px] flex-col gap-2.5 overflow-y-auto">
            <NuxtLink 
              v-for="sub in subscriptions" 
              :key="sub.id" 
              :to="`/user/${sub.id}`"
              class="flex items-center gap-2.5 rounded-lg px-2.5 py-2 no-underline transition-colors hover:bg-surface"
            >
              <img :src="sub.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${sub.username}`" loading="lazy" decoding="async" class="size-8 rounded-full object-cover" />
              <span class="flex-1 overflow-hidden text-[13px] font-semibold whitespace-nowrap text-ellipsis text-[#333]">
                {{ sub.username }}
              </span>
              <span class="text-[11px] font-medium text-brand">Voir</span>
            </NuxtLink>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import type { PublicUser, Video } from '#shared/types/models'

const route = useRoute()
const { isAuthenticated, logout } = useAuth()
const subscriptions = ref<PublicUser[]>([])
const isMature = computed(() => route.query.mature === '1')

const { data: videoData, pending } = await useAsyncData<Video[]>(
  'home-videos',
  async () => {
    if (isMature.value && !isAuthenticated.value) return []
    return await $fetch<Video[]>(isMature.value ? '/api/videos?is18Plus=true' : '/api/videos')
  },
  { watch: [isMature, isAuthenticated], default: () => [] }
)

const videos = computed(() => videoData.value ?? [])

const fetchSubscriptions = async () => {
  if (!isAuthenticated.value) {
    subscriptions.value = []
    return
  }
  try {
    subscriptions.value = await $fetch<PublicUser[]>('/api/users/subscriptions')
  } catch (err: unknown) {
    subscriptions.value = []

    // A stale/expired token should end the local session rather than keep
    // retrying an authenticated request on every homepage render.
    const status = (err as { status?: number; statusCode?: number; response?: { status?: number } })?.status
      ?? (err as { statusCode?: number })?.statusCode
      ?? (err as { response?: { status?: number } })?.response?.status
    if (status === 401) {
      logout()
      return
    }

    console.error(err)
  }
}

watch(isAuthenticated, (authenticated) => {
  if (!import.meta.client) return
  if (authenticated) {
    void fetchSubscriptions()
  } else {
    subscriptions.value = []
  }
})

onMounted(() => {
  if (isAuthenticated.value) void fetchSubscriptions()
})
</script>
