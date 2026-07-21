<template>
  <div style="min-height: 100vh; background: #fcfcfc;">
    <div v-if="loading" style="text-align: center; color: var(--neon-purple); padding: 60px;">
      <h2>Chargement du profil...</h2>
    </div>

    <div v-else-if="errorMsg" style="text-align: center; padding: 60px;">
      <h2 style="color: var(--neon-pink);">{{ errorMsg }}</h2>
      <NuxtLink to="/" class="neon-btn" style="margin-top: 15px; display: inline-block;">Retour à l'accueil</NuxtLink>
    </div>

    <div v-else-if="channel" style="max-width: 1100px; margin: 30px auto; padding: 0 20px;">
      
      <!-- Profil Public Card -->
      <div style="background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 30px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); margin-bottom: 35px;">
        
        <div style="display: flex; align-items: center; gap: 20px;">
          <img :src="channel.user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${channel.user?.username}`" loading="lazy" decoding="async" style="width: 90px; height: 90px; border-radius: 50%; border: 3px solid var(--neon-purple); object-fit: cover;" />
          <div>
            <h1 style="margin: 0 0 6px 0; font-size: 26px; color: #111;">{{ channel.user?.username }}</h1>
            <p style="margin: 0 0 10px 0; color: var(--text-muted); font-size: 14px; max-width: 500px;">
              {{ channel.user?.bio || "Aucune biographie disponible." }}
            </p>
            <div style="font-size: 13px; color: #555; font-weight: 500;">
              <!-- Masquage strict du nombre d'abonnés sur profil public d'autrui -->
              <span v-if="isOwnChannel && followersCount !== null">👥 {{ followersCount }} abonnés • </span>
              <span>🎬 {{ channel.videos?.length || 0 }} vidéos publiques</span>
            </div>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 15px;">
          <!-- Evaluation Profil par Etoiles -->
          <div style="display: flex; align-items: center; gap: 6px; background: #f8f9fa; padding: 8px 14px; border-radius: 20px; border: 1px solid #e2e8f0;">
            <span style="font-size: 13px; font-weight: 600; color: #444; margin-right: 4px;">Note du créateur:</span>
            <span 
              v-for="star in 5" 
              :key="star" 
              @click="rateChannel(star)" 
              style="cursor: pointer; font-size: 20px; transition: transform 0.1s;"
              :style="{ color: star <= (userRating || Math.round(avgRating)) ? '#f59e0b' : '#cbd5e1' }"
            >
              ★
            </span>
            <span style="font-size: 14px; font-weight: bold; margin-left: 6px; color: #111;">{{ avgRating }}</span>
            <span style="font-size: 12px; color: #888;">({{ totalRatings }})</span>
          </div>

          <!-- Bouton S'abonner OU Modifier le profil si propre compte -->
          <button 
            v-if="!isOwnChannel" 
            @click="toggleFollow" 
            :class="['neon-btn', isFollowing ? '' : 'neon-btn-pink']"
            style="padding: 10px 24px; font-size: 14px;"
          >
            {{ isFollowing ? 'Abonné ✔' : 'S\'abonner' }}
          </button>
          
          <NuxtLink v-else to="/settings" class="neon-btn neon-btn-pink" style="padding: 8px 18px; font-size: 13px; text-decoration: none;">
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
              :src="`http://localhost:4000/uploads/thumbnails/${video.thumbnail}`" 
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

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'

const route = useRoute()
const router = useRouter()
const { token, user } = useAuth()

const channel = ref(null)
const loading = ref(true)
const errorMsg = ref('')

const isFollowing = ref(false)
const followersCount = ref(null)
const avgRating = ref('0.0')
const totalRatings = ref(0)
const userRating = ref(null)

const targetUserId = computed(() => parseInt(route.params.id, 10))

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

const fetchChannel = async () => {
  loading.value = true
  errorMsg.value = ''

  const headers = token.value ? { 'Authorization': `Bearer ${token.value}` } : {}

  try {
    const data = await $fetch(`http://localhost:4000/api/users/${targetUserId.value}/channel`, { headers })
    channel.value = data
    isFollowing.value = data.isFollowing
    followersCount.value = data.followersCount
    avgRating.value = data.avgRating
    totalRatings.value = data.totalRatings
    userRating.value = data.userRating
  } catch (err) {
    errorMsg.value = err.data?.error || 'Impossible d\'afficher ce profil.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchChannel()
})

const toggleFollow = async () => {
  if (!token.value) {
    router.push('/login')
    return
  }
  try {
    const res = await $fetch(`http://localhost:4000/api/users/${targetUserId.value}/follow`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    isFollowing.value = res.isFollowing
    if (followersCount.value !== null) {
      followersCount.value += res.isFollowing ? 1 : -1
    }
  } catch (err) {
    alert(err.data?.error || 'Erreur')
  }
}

const rateChannel = async (stars) => {
  if (!token.value) {
    router.push('/login')
    return
  }
  if (isOwnChannel.value) {
    alert('Vous ne pouvez pas noter votre propre profil.')
    return
  }
  try {
    const res = await $fetch(`http://localhost:4000/api/users/${targetUserId.value}/rate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token.value}` },
      body: { stars }
    })
    avgRating.value = res.avgRating
    totalRatings.value = res.totalRatings
    userRating.value = stars
  } catch (err) {
    alert(err.data?.error || 'Erreur lors de l\'évaluation.')
  }
}
</script>
