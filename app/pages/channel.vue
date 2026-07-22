<template>
  <div style="max-width: 1100px; margin: 30px auto; padding: 0 20px;">
    
    <!-- Profile Header & Owner Statistics -->
    <div style="background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); margin-bottom: 30px;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
        
        <div style="display: flex; align-items: center; gap: 20px;">
          <img :src="profile.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.username}`" loading="lazy" decoding="async" style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid var(--neon-purple); object-fit: cover;" />
          <div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <h1 style="margin: 0; font-size: 24px; color: #111;">{{ profile.username }}</h1>
              <span style="background: #f1f5f9; color: #475569; font-size: 11px; font-weight: bold; padding: 2px 8px; border-radius: 12px;">Compte Propriétaire</span>
            </div>
            <p style="margin: 6px 0 0 0; color: var(--text-muted); font-size: 14px;">{{ profile.bio || "Aucune description de profil." }}</p>
            
            <!-- Total Abonnés (Exclusif au Propriétaire) -->
            <div style="margin-top: 10px; font-size: 13px; font-weight: 600; color: var(--neon-purple);">
              👥 Vous avez {{ profile.followersCount || 0 }} abonné(s) à votre chaîne
            </div>
          </div>
        </div>

        <!-- Redirection Buttons -->
        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
          <NuxtLink 
            v-if="profile.id" 
            :to="`/user/${profile.id}`" 
            class="neon-btn" 
            style="text-decoration: none; padding: 8px 14px; font-size: 13px;"
          >
            👁 Voir ma page publique
          </NuxtLink>

          <NuxtLink 
            to="/dashboard/videos" 
            class="neon-btn" 
            style="text-decoration: none; padding: 8px 14px; font-size: 13px;"
          >
            🎬 Gestionnaire de vidéos
          </NuxtLink>

          <!-- BOUTON D'ACCÈS EXCLUSIF AU MODULE +18 (Restreint aux utilisateurs 18+) -->
          <NuxtLink 
            v-if="isAdult" 
            to="/18plus" 
            class="neon-btn neon-btn-crimson" 
            style="text-decoration: none; padding: 8px 14px; font-size: 13px; font-weight: bold;"
          >
            🔞 Espace SHCK Video +18
          </NuxtLink>

          <NuxtLink 
            to="/settings" 
            class="neon-btn neon-btn-pink" 
            style="text-decoration: none; padding: 8px 14px; font-size: 13px;"
          >
            ✏️ Modifier le profil
          </NuxtLink>
        </div>

      </div>
    </div>

    <!-- 2 Columns Grid: Mes Abonnements & Historique des Commentaires -->
    <div style="display: grid; grid-template-columns: 320px 1fr; gap: 25px; align-items: start;">
      
      <!-- INTEGRATION DE LA LISTE DES ABONNEMENTS AU PROFIL -->
      <div style="background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 22px; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
        <h3 style="margin: 0 0 14px 0; font-size: 16px; color: #111; display: flex; align-items: center; justify-content: space-between;">
          <span>📺 Mes Abonnements</span>
          <span style="font-size: 11px; background: rgba(138, 43, 226, 0.1); color: var(--neon-purple); padding: 2px 8px; border-radius: 10px; font-weight: bold;">
            {{ subscriptions.length }}
          </span>
        </h3>

        <div v-if="subscriptions.length === 0" style="font-size: 13px; color: #777; text-align: center; padding: 20px 0;">
          Vous ne suivez aucune chaîne.
        </div>

        <div v-else style="display: flex; flex-direction: column; gap: 10px; max-height: 400px; overflow-y: auto;">
          <NuxtLink 
            v-for="sub in subscriptions" 
            :key="sub.id" 
            :to="`/user/${sub.id}`"
            style="display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 8px; border: 1px solid #f1f5f9; text-decoration: none; transition: background 0.15s;"
          >
            <img :src="sub.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${sub.username}`" loading="lazy" decoding="async" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />
            <span style="font-size: 13px; font-weight: 600; color: #333; flex: 1; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
              {{ sub.username }}
            </span>
            <span style="font-size: 11px; color: var(--neon-purple); font-weight: 500;">Visiter &rarr;</span>
          </NuxtLink>
        </div>
      </div>

      <!-- HISTORIQUE DES COMMENTAIRES -->
      <div style="background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 25px; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
        <h2 style="margin: 0 0 6px 0; font-size: 18px; color: #111;">Historique de mes Commentaires</h2>
        <p style="margin: 0 0 20px 0; color: var(--text-muted); font-size: 13px;">Gérez l'ensemble de vos commentaires publiés sur la plateforme.</p>

        <div v-if="loadingComments" style="color: var(--neon-purple); padding: 20px; text-align: center;">
          Chargement de vos commentaires...
        </div>

        <div v-else-if="myComments.length === 0" style="text-align: center; padding: 35px; color: #777; font-size: 14px;">
          Vous n'avez pas encore rédigé de commentaire.
        </div>

        <div v-else style="display: flex; flex-direction: column; gap: 14px;">
          <div 
            v-for="c in myComments" 
            :key="c.id"
            style="background: #f8f9fa; border-radius: 10px; border: 1px solid #e2e8f0; padding: 16px; display: flex; align-items: flex-start; justify-content: space-between; gap: 15px;"
          >
            <div style="flex: 1;">
              <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">
                Sur la vidéo : 
                <NuxtLink :to="`/video/${c.video?.id}`" style="color: var(--neon-purple); font-weight: 600; text-decoration: none;">
                  {{ c.video?.title || 'Vidéo' }}
                </NuxtLink>
                <span style="margin-left: 10px; font-size: 11px;">• {{ formatDate(c.createdAt) }}</span>
                <span v-if="c.isEdited" style="color: var(--neon-pink); font-size: 11px; margin-left: 4px;">(modifié)</span>
              </div>
              <p style="margin: 0; font-size: 14px; color: #222; line-height: 1.4;">"{{ c.content }}"</p>
            </div>

            <button 
              @click="deleteComment(c.id)" 
              class="neon-btn neon-btn-pink"
              style="padding: 4px 10px; font-size: 12px; flex-shrink: 0;"
            >
              ❌ Supprimer
            </button>
          </div>
        </div>
      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'

const { token, user, isAuthenticated } = useAuth()
const router = useRouter()

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

const profile = ref({ id: null, username: '', email: '', avatar: '', bio: '', followersCount: 0 })
const subscriptions = ref([])
const myComments = ref([])
const loadingComments = ref(true)

const loadDashboard = async () => {
  try {
    const me = await $fetch('/api/users/me', {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    profile.value = me

    const subsData = await $fetch('/api/users/subscriptions', {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    subscriptions.value = subsData || []

    const commentsData = await $fetch('/api/users/my-comments', {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    myComments.value = commentsData || []
  } catch (err) {
    console.error(err)
  } finally {
    loadingComments.value = false
  }
}

onMounted(() => {
  if (!isAuthenticated()) {
    router.push('/login')
    return
  }
  loadDashboard()
})

const deleteComment = async (id) => {
  if (!confirm('Supprimer ce commentaire ?')) return
  try {
    await $fetch(`/api/comments/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    loadDashboard()
  } catch (err) {
    alert(err.data?.error || 'Erreur lors de la suppression.')
  }
}

const formatDate = (d) => {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}
</script>
