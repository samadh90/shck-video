<template>
  <div class="min-h-screen bg-[#fcfcfc]">
    <!-- Navbar -->
    <nav class="flex items-center justify-between border-b border-line bg-white px-5 py-4">
      <NuxtLink to="/" class="text-xl font-black text-ink no-underline">SHCK<span class="text-accent">Video</span></NuxtLink>
      <div class="flex items-center gap-4">
        <NuxtLink to="/channel" class="text-sm text-ink no-underline">Ma Chaîne</NuxtLink>
        <NuxtLink to="/settings" class="text-sm text-ink no-underline">Paramètres</NuxtLink>
        <button @click="logout" class="rounded-md bg-accent px-4 py-2 font-semibold text-white">Déconnexion</button>
      </div>
    </nav>

    <div class="mx-auto my-8 max-w-4xl px-5">
      <h1 class="mb-1 text-[26px] text-[#111]">Gestion de mes Commentaires</h1>
      <p class="mb-6 text-sm text-muted">Consultez et gérez l'ensemble de vos commentaires publiés.</p>

      <div v-if="loading" class="p-10 text-center text-brand">
        Chargement de vos commentaires...
      </div>

      <div v-else-if="comments.length === 0" class="rounded-xl border border-line bg-white p-12 text-center">
        <h3 class="mt-0">Aucun commentaire rédigé</h3>
        <p class="text-muted">Vous n'avez pas encore laissé de commentaires sous les vidéos.</p>
        <NuxtLink to="/" class="mt-4 inline-block rounded-md bg-brand px-4 py-2 font-semibold text-white no-underline">Découvrir les vidéos</NuxtLink>
      </div>

      <div v-else class="flex flex-col gap-4">
        <div 
          v-for="c in comments" 
          :key="c.id"
          class="flex items-start justify-between gap-5 rounded-xl border border-line bg-white p-[18px] shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
        >
          <div class="flex-1">
            <div class="mb-1.5 text-[13px] text-muted">
              Sur la vidéo : 
              <NuxtLink :to="`/video/${c.video?.id}`" class="font-semibold text-brand no-underline">
                {{ c.video?.title || 'Vidéo' }}
              </NuxtLink>
              <span class="ml-2.5 text-xs">• {{ formatDate(c.createdAt) }}</span>
            </div>
            <p class="m-0 text-[15px] leading-[1.4] text-ink">"{{ c.content }}"</p>
          </div>

          <button 
            @click="deleteComment(c.id)" 
            class="shrink-0 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white"
          >
            ❌ Supprimer
          </button>
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
import type { UserComment } from '#shared/types/models'

const { token, logout } = useAuth()

const comments = ref<UserComment[]>([])
const loading = ref(true)

const fetchMyComments = async () => {
  loading.value = true
  try {
    const data = await $fetch<UserComment[]>('/api/users/my-comments', {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    comments.value = data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchMyComments()
})

const deleteComment = async (id: number) => {
  if (!confirm('Supprimer ce commentaire ?')) return
  try {
    await $fetch(`/api/comments/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    fetchMyComments()
  } catch (error: unknown) {
    alert(error instanceof Error ? error.message : 'Erreur lors de la suppression.')
  }
}

const formatDate = (d: string) => {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
