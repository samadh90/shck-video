<template>
  <div style="min-height: 100vh; background: #fcfcfc;">
    <!-- Navbar -->
    <nav class="navbar">
      <NuxtLink to="/" class="logo">SHCK<span style="color:var(--neon-pink)">Video</span></NuxtLink>
      <div class="links" style="display: flex; align-items: center; gap: 15px;">
        <NuxtLink to="/channel" style="color: var(--text-main); text-decoration: none; font-size: 14px;">Ma Chaîne</NuxtLink>
        <NuxtLink to="/settings" style="color: var(--text-main); text-decoration: none; font-size: 14px;">Paramètres</NuxtLink>
        <button @click="logout" class="neon-btn neon-btn-pink">Déconnexion</button>
      </div>
    </nav>

    <div style="max-width: 900px; margin: 30px auto; padding: 0 20px;">
      <h1 style="margin: 0 0 5px 0; font-size: 26px; color: #111;">Gestion de mes Commentaires</h1>
      <p style="margin: 0 0 25px 0; color: var(--text-muted); font-size: 14px;">Consultez et gérez l'ensemble de vos commentaires publiés.</p>

      <div v-if="loading" style="text-align: center; padding: 40px; color: var(--neon-purple);">
        Chargement de vos commentaires...
      </div>

      <div v-else-if="comments.length === 0" style="background: #ffffff; border-radius: 12px; padding: 50px; text-align: center; border: 1px solid #e2e8f0;">
        <h3 style="margin-top: 0;">Aucun commentaire rédigé</h3>
        <p style="color: var(--text-muted);">Vous n'avez pas encore laissé de commentaires sous les vidéos.</p>
        <NuxtLink to="/" class="neon-btn" style="margin-top: 15px; display: inline-block;">Découvrir les vidéos</NuxtLink>
      </div>

      <div v-else style="display: flex; flex-direction: column; gap: 16px;">
        <div 
          v-for="c in comments" 
          :key="c.id"
          style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 18px; display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.03);"
        >
          <div style="flex: 1;">
            <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 6px;">
              Sur la vidéo : 
              <NuxtLink :to="`/video/${c.video?.id}`" style="color: var(--neon-purple); font-weight: 600; text-decoration: none;">
                {{ c.video?.title || 'Vidéo' }}
              </NuxtLink>
              <span style="margin-left: 10px; font-size: 12px;">• {{ formatDate(c.createdAt) }}</span>
            </div>
            <p style="margin: 0; font-size: 15px; color: #222; line-height: 1.4;">"{{ c.content }}"</p>
          </div>

          <button 
            @click="deleteComment(c.id)" 
            class="neon-btn neon-btn-pink"
            style="padding: 6px 12px; font-size: 12px; flex-shrink: 0;"
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
