<template>
  <div class="mx-auto my-8 max-w-5xl px-5">
    
    <div class="mb-6">
      <h1 class="mb-1.5 text-2xl text-[#111]">
        Résultats pour "<span class="text-brand">{{ activeQuery }}</span>"
      </h1>
      <p class="m-0 text-sm text-muted">
        {{ totalResults }} résultat(s) trouvé(s)
      </p>
    </div>

    <div v-if="loading" class="p-12 text-center text-brand">
      <h2>Recherche en cours...</h2>
    </div>

    <div v-else-if="totalResults === 0" class="rounded-xl border border-line bg-white p-15 text-center">
      <h3>Aucun résultat trouvé</h3>
      <p class="text-muted">Essayez de rechercher d'autres mots-clés ou le nom d'un créateur.</p>
      <NuxtLink to="/" class="mt-4 inline-block rounded-md bg-brand px-4 py-2 font-semibold text-white no-underline">Retour à l'accueil</NuxtLink>
    </div>

    <div v-else class="flex flex-col gap-8">
      
      <!-- SECTION 1 : CHAÎNES & CRÉATEURS -->
      <div v-if="channels.length > 0">
        <h2 class="mb-4 inline-block border-b-2 border-brand pb-2 text-lg text-[#111]">
          👤 Chaînes & Créateurs ({{ channels.length }})
        </h2>

        <div class="flex flex-col gap-3">
          <div 
            v-for="ch in channels" 
            :key="ch.id" 
            class="flex items-center justify-between gap-5 rounded-xl border border-line bg-white p-[18px] shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
          >
            <div class="flex items-center gap-4">
              <img :src="ch.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${ch.username}`" loading="lazy" decoding="async" class="size-[55px] rounded-full border-2 border-brand object-cover" />
              <div>
                <h3 class="mb-1 text-[17px] text-[#111]">{{ ch.username }}</h3>
                <p class="m-0 max-w-[500px] text-[13px] text-muted">{{ ch.bio || 'Aucune biographie.' }}</p>
              </div>
            </div>

            <NuxtLink :to="`/user/${ch.id}`" class="shrink-0 rounded-md bg-brand px-[18px] py-2 text-[13px] font-semibold text-white no-underline">
              Voir la chaîne
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- SECTION 2 : VIDÉOS -->
      <div v-if="videos.length > 0">
        <h2 class="mb-4 inline-block border-b-2 border-accent pb-2 text-lg text-[#111]">
          🎬 Vidéos ({{ videos.length }})
        </h2>

        <div class="flex flex-col gap-4">
          <div 
            v-for="v in videos" 
            :key="v.id" 
            class="flex items-center gap-5 rounded-xl border border-line bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
          >
            <NuxtLink :to="`/video/${v.customId || v.id}`" class="shrink-0 no-underline">
              <div class="flex h-[95px] w-40 items-center justify-center overflow-hidden rounded-lg bg-[#1e1e24] text-white">
                <img v-if="v.thumbnail" :src="`/uploads/thumbnails/${v.thumbnail}`" loading="lazy" decoding="async" class="size-full object-cover" />
                <span v-else class="text-2xl">▶</span>
              </div>
            </NuxtLink>

            <div class="min-w-0 flex-1">
              <h3 class="mb-1.5 text-[17px] text-[#111]">
                <NuxtLink :to="`/video/${v.customId || v.id}`" class="text-inherit no-underline">{{ v.title }}</NuxtLink>
              </h3>

              <NuxtLink :to="`/user/${v.userId}`" class="mb-2 flex items-center gap-2 no-underline">
                <img :src="v.user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${v.user?.username}`" loading="lazy" decoding="async" class="size-[22px] rounded-full" />
                <span class="text-[13px] font-semibold text-[#444]">{{ v.user?.username }}</span>
              </NuxtLink>

              <p class="mb-2 line-clamp-2 text-[13px] leading-[1.3] text-muted">
                {{ v.description || 'Aucune description.' }}
              </p>

              <div class="flex items-center gap-3 text-xs text-muted">
                <span class="font-semibold text-brand">{{ v.category || 'Divertissement' }}</span>
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
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { PublicUser, Video } from '#shared/types/models'

const route = useRoute()

const activeQuery = computed(() => typeof route.query.q === 'string' ? route.query.q : '')
const searchQuery = computed(() => activeQuery.value.trim())

const { data: results, pending: loading } = await useAsyncData<{ channels: PublicUser[], videos: Video[] }>(
  'search-results',
  async () => searchQuery.value
    ? $fetch<{ channels: PublicUser[], videos: Video[] }>(`/api/search?q=${encodeURIComponent(searchQuery.value)}`)
    : { channels: [], videos: [] },
  { watch: [searchQuery] }
)

const channels = computed(() => results.value?.channels ?? [])
const videos = computed(() => results.value?.videos ?? [])
const totalResults = computed(() => channels.value.length + videos.value.length)
</script>
