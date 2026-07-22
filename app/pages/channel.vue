<template>
  <div class="mx-auto my-8 max-w-6xl px-5">
    
    <!-- Profile Header & Owner Statistics -->
    <div class="mb-8 rounded-2xl border border-line bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
      <div class="flex flex-wrap items-center justify-between gap-5">
        
        <div class="flex items-center gap-5">
          <img :src="profile.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.username}`" loading="lazy" decoding="async" class="size-20 rounded-full border-[3px] border-brand object-cover" />
          <div>
            <div class="flex items-center gap-2.5">
              <h1 class="m-0 text-2xl text-[#111]">{{ profile.username }}</h1>
              <span class="rounded-xl bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">Compte Propriétaire</span>
            </div>
            <p class="mt-1.5 text-sm text-muted">{{ profile.bio || "Aucune description de profil." }}</p>
            
            <!-- Total Abonnés (Exclusif au Propriétaire) -->
            <div class="mt-2.5 text-[13px] font-semibold text-brand">
              👥 Vous avez {{ profile.followersCount || 0 }} abonné(s) à votre chaîne
            </div>
          </div>
        </div>

        <!-- Redirection Buttons -->
        <div class="flex flex-wrap gap-2.5">
          <NuxtLink 
            v-if="profile.id" 
            :to="`/user/${profile.id}`" 
            class="rounded-md bg-brand px-3.5 py-2 text-[13px] font-semibold text-white no-underline"
          >
            👁 Voir ma page publique
          </NuxtLink>

          <NuxtLink 
            to="/dashboard/videos" 
            class="rounded-md bg-brand px-3.5 py-2 text-[13px] font-semibold text-white no-underline"
          >
            🎬 Gestionnaire de vidéos
          </NuxtLink>

          <!-- BOUTON D'ACCÈS EXCLUSIF AU MODULE +18 (Restreint aux utilisateurs 18+) -->
          <NuxtLink 
            v-if="isAdult" 
            to="/18plus" 
            class="rounded-md bg-red-600 px-3.5 py-2 text-[13px] font-bold text-white no-underline"
          >
            🔞 Espace SHCK Video +18
          </NuxtLink>

          <NuxtLink 
            to="/settings" 
            class="rounded-md bg-accent px-3.5 py-2 text-[13px] font-semibold text-white no-underline"
          >
            ✏️ Modifier le profil
          </NuxtLink>
        </div>

      </div>
    </div>

    <!-- 2 Columns Grid: Mes Abonnements & Historique des Commentaires -->
    <div class="grid items-start gap-6 lg:grid-cols-[320px_1fr]">
      
      <!-- INTEGRATION DE LA LISTE DES ABONNEMENTS AU PROFIL -->
      <div class="rounded-2xl border border-line bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <h3 class="mb-3.5 flex items-center justify-between text-base text-[#111]">
          <span>📺 Mes Abonnements</span>
          <span class="rounded-[10px] bg-brand/10 px-2 py-0.5 text-[11px] font-bold text-brand">
            {{ subscriptions.length }}
          </span>
        </h3>

        <div v-if="subscriptions.length === 0" class="py-5 text-center text-[13px] text-muted">
          Vous ne suivez aucune chaîne.
        </div>

        <div v-else class="flex max-h-[400px] flex-col gap-2.5 overflow-y-auto">
          <NuxtLink 
            v-for="sub in subscriptions" 
            :key="sub.id" 
            :to="`/user/${sub.id}`"
            class="flex items-center gap-2.5 rounded-lg border border-slate-100 p-2 no-underline transition-colors hover:bg-slate-50"
          >
            <img :src="sub.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${sub.username}`" loading="lazy" decoding="async" class="size-8 rounded-full object-cover" />
            <span class="flex-1 truncate text-[13px] font-semibold text-[#333]">
              {{ sub.username }}
            </span>
            <span class="text-[11px] font-medium text-brand">Visiter &rarr;</span>
          </NuxtLink>
        </div>
      </div>

      <!-- HISTORIQUE DES COMMENTAIRES -->
      <div class="rounded-2xl border border-line bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <h2 class="mb-1.5 text-lg text-[#111]">Historique de mes Commentaires</h2>
        <p class="mb-5 text-[13px] text-muted">Gérez l'ensemble de vos commentaires publiés sur la plateforme.</p>

        <div v-if="loadingComments" class="p-5 text-center text-brand">
          Chargement de vos commentaires...
        </div>

        <div v-else-if="myComments.length === 0" class="p-9 text-center text-sm text-muted">
          Vous n'avez pas encore rédigé de commentaire.
        </div>

        <div v-else class="flex flex-col gap-3.5">
          <div 
            v-for="c in myComments" 
            :key="c.id"
            class="flex items-start justify-between gap-4 rounded-[10px] border border-line bg-surface p-4"
          >
            <div class="flex-1">
              <div class="mb-1 text-xs text-muted">
                Sur la vidéo : 
                <NuxtLink :to="`/video/${c.video?.id}`" class="font-semibold text-brand no-underline">
                  {{ c.video?.title || 'Vidéo' }}
                </NuxtLink>
                <span class="ml-2.5 text-[11px]">• {{ formatDate(c.createdAt) }}</span>
                <span v-if="c.isEdited" class="ml-1 text-[11px] text-accent">(modifié)</span>
              </div>
              <p class="m-0 text-sm leading-[1.4] text-ink">"{{ c.content }}"</p>
            </div>

            <button 
              @click="deleteComment(c.id)" 
              class="shrink-0 rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-white"
            >
              ❌ Supprimer
            </button>
          </div>
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
import type { PublicUser, UserComment, UserProfile } from '#shared/types/models'

const { token, user } = useAuth()

const isAdult = computed(() => {
  if (!user.value || !user.value.birthdate) return false
  const birth = new Date(user.value.birthdate)
  if (isNaN(birth.getTime())) return false
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age >= 18
})

const profile = ref<UserProfile>({
  id: 0,
  username: '',
  email: '',
  avatar: null,
  bio: null,
  birthdate: null,
  isVerified: false,
  followersCount: 0
})
const subscriptions = ref<PublicUser[]>([])
const myComments = ref<UserComment[]>([])
const loadingComments = ref(true)

const loadDashboard = async () => {
  try {
    const me = await $fetch<UserProfile>('/api/users/me', {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    profile.value = me

    const subsData = await $fetch<PublicUser[]>('/api/users/subscriptions', {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    subscriptions.value = subsData

    const commentsData = await $fetch<UserComment[]>('/api/users/my-comments', {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    myComments.value = commentsData
  } catch (err) {
    console.error(err)
  } finally {
    loadingComments.value = false
  }
}

onMounted(() => {
  loadDashboard()
})

const deleteComment = async (id: number) => {
  if (!confirm('Supprimer ce commentaire ?')) return
  try {
    await $fetch(`/api/comments/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    loadDashboard()
  } catch (error: unknown) {
    alert(error instanceof Error ? error.message : 'Erreur lors de la suppression.')
  }
}

const formatDate = (d: string) => {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}
</script>
