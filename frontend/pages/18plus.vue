<template>
  <div class="theme-18plus-container" style="padding: 30px 20px;">
    <div style="max-width: 1280px; margin: 0 auto;">
      
      <!-- Banner Thématique +18 Crimson Dark -->
      <div style="background: linear-gradient(135deg, #1e1e1e 0%, #2a0808 100%); border-radius: 16px; border: 1px solid #dc2626; padding: 25px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; box-shadow: 0 8px 30px rgba(220, 38, 38, 0.15);">
        <div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <h1 style="margin: 0; font-size: 26px; color: #ffffff;">SHCK<span style="color: #dc2626; font-weight: 900;">Video +18</span></h1>
            <span style="background: #dc2626; color: white; font-size: 11px; font-weight: bold; padding: 3px 10px; border-radius: 12px; text-transform: uppercase;">
              Catalogue Mature
            </span>
          </div>
          <p style="margin: 6px 0 0 0; color: #a1a1aa; font-size: 14px;">
            Espace réservé aux utilisateurs majeurs (≥ 18 ans). Thème Crimson Dark actif.
          </p>
        </div>

        <NuxtLink to="/" class="neon-btn neon-btn-crimson" style="text-decoration: none; padding: 10px 20px; font-size: 14px;">
          ⬅️ Retour à SHCK Video Classique
        </NuxtLink>
      </div>

      <!-- Grille des Vidéos Matures (+18) -->
      <div>
        <div v-if="loading" style="color: #dc2626; text-align: center; padding: 50px; font-weight: bold;">
          Chargement du catalogue réservé +18...
        </div>

        <div v-else-if="videos.length === 0" style="text-align: center; padding: 60px; color: #a1a1aa; background: #1e1e1e; border-radius: 12px; border: 1px solid #333333;">
          <span style="font-size: 36px; display: block; margin-bottom: 10px;">🔞</span>
          Aucune vidéo réservée aux adultes n'est disponible pour le moment.
        </div>

        <div v-else class="video-grid" style="padding: 0;">
          <div 
            v-for="video in videos" 
            :key="video.id"
            class="video-card"
          >
            <NuxtLink :to="`/video/${video.customId || video.id}`" style="text-decoration: none; display: block;">
              <div class="thumbnail" style="background: linear-gradient(135deg, #2a0808 0%, #121212 100%);">
                <img 
                  v-if="video.thumbnail" 
                  :src="`http://localhost:4000/uploads/thumbnails/${video.thumbnail}`" 
                  loading="lazy"
                  decoding="async"
                  style="width: 100%; height: 100%; object-fit: cover;"
                />
                <span v-else style="color: #dc2626; font-size: 32px;">🔞</span>
              </div>
            </NuxtLink>
            
            <div class="video-info">
              <h3>
                <NuxtLink :to="`/video/${video.customId || video.id}`" style="color: inherit; text-decoration: none;">{{ video.title }}</NuxtLink>
              </h3>
              
              <NuxtLink 
                :to="`/user/${video.userId}`" 
                style="display: flex; align-items: center; gap: 8px; margin: 8px 0; text-decoration: none;"
              >
                <img :src="video.user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${video.user?.username || 'U'}`" loading="lazy" decoding="async" style="width: 22px; height: 22px; border-radius: 50%; border: 1px solid #dc2626;" />
                <span style="font-size: 13px; color: #d4d4d8; font-weight: 600;">{{ video.user?.username || 'Utilisateur' }}</span>
              </NuxtLink>

              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #a1a1aa;">
                <span style="color: #dc2626; font-weight: 700;">🔞 +18 • {{ video.category || 'Divertissement' }}</span>
                <span>👁 {{ video.views || 0 }} vues</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'

const { token, user, isAuthenticated } = useAuth()
const router = useRouter()

const videos = ref([])
const loading = ref(true)

const checkAccessAndFetch = async () => {
  if (!isAuthenticated()) {
    alert("Accès refusé. Vous devez être connecté pour accéder à la section +18.")
    router.push('/login')
    return
  }

  // Verification stricte de l'âge >= 18
  let userAge = user.value?.age
  if (userAge === undefined || userAge === null) {
    if (user.value?.birthdate) {
      const birth = new Date(user.value.birthdate)
      if (!isNaN(birth.getTime())) {
        const today = new Date()
        userAge = today.getFullYear() - birth.getFullYear()
        const m = today.getMonth() - birth.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) userAge--
      }
    }
  }

  if (!userAge || userAge < 18) {
    alert("Accès refusé. La section SHCK Video +18 est strictement réservée aux utilisateurs majeurs (≥ 18 ans).")
    router.push('/')
    return
  }

  try {
    const data = await $fetch('http://localhost:4000/api/videos?is18Plus=true', {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    videos.value = data || []
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
