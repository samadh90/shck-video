<template>
  <nav class="navbar">
    <!-- Logo (Dynamique selon le mode +18) -->
    <NuxtLink v-if="is18PlusRoute" to="/18plus" class="logo" style="color: #ffffff;">
      SHCK<span style="color: #dc2626; font-weight: 900;">Video +18</span>
    </NuxtLink>
    <NuxtLink v-else to="/" class="logo">
      SHCK<span style="color:var(--neon-pink)">Video</span>
    </NuxtLink>

    <!-- Barre de Recherche Unifiée (Présente uniquement sur l'accueil et la recherche) -->
    <form 
      v-if="showSearchBar" 
      @submit.prevent="performSearch" 
      style="flex: 1; max-width: 450px; margin: 0 20px; display: flex; align-items: center; background: #f1f5f9; border-radius: 20px; padding: 4px 14px; border: 1px solid #cbd5e1;"
    >
      <input 
        type="text" 
        v-model="searchQuery"
        @input="onSearchInput"
        placeholder="Rechercher des vidéos, chaînes, créateurs..." 
        style="border: none; background: transparent; outline: none; width: 100%; font-size: 14px; color: #111;"
      />
      <button type="submit" style="background: none; border: none; cursor: pointer; font-size: 16px; padding-left: 8px;">
        🔍
      </button>
    </form>
    <div v-else style="flex: 1;"></div>

    <!-- Actions Utilisateur & Cloche de Notifications Persistante -->
    <div class="links" style="display: flex; align-items: center; gap: 15px;">
      <template v-if="token">
        
        <!-- CLOCHE DE NOTIFICATIONS GLOBALE PERSISTANTE -->
        <div style="position: relative;">
          <button @click="showNotifs = !showNotifs" style="background: none; border: none; cursor: pointer; font-size: 18px; position: relative;">
            🔔
            <span v-if="unreadCount > 0" style="position: absolute; top: -5px; right: -5px; background: var(--neon-pink); color: white; font-size: 10px; font-weight: bold; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              {{ unreadCount }}
            </span>
          </button>

          <!-- Dropdown Panneau Notifications -->
          <div v-if="showNotifs" style="position: absolute; right: 0; top: 35px; width: 310px; background: white; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.12); z-index: 1000; padding: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #eee;">
              <strong style="font-size: 13px;">Notifications</strong>
              <button @click="markNotifsRead" style="background: none; border: none; color: var(--neon-purple); font-size: 11px; cursor: pointer; font-weight: bold;">Tout lire</button>
            </div>
            
            <div v-if="notifications.length === 0" style="font-size: 12px; color: #888; text-align: center; padding: 15px;">
              Aucune notification.
            </div>
            
            <div v-else style="max-height: 260px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;">
              <div 
                v-for="n in notifications" 
                :key="n.id" 
                @click="handleNotifClick(n)"
                style="font-size: 12px; padding: 8px; border-radius: 6px; cursor: pointer; transition: background 0.15s;"
                :style="{ background: n.read ? '#f8f9fa' : '#f0f4ff', borderLeft: n.read ? 'none' : '3px solid var(--neon-purple)' }"
              >
                <div style="color: #222; font-weight: 500;">{{ n.message }}</div>
                <span style="font-size: 10px; color: #888; margin-top: 4px; display: block;">{{ formatDate(n.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Badge de Vérification d'Email (Mode Restreint) -->
        <button 
          v-if="!user?.isVerified" 
          @click="handleVerifyEmail" 
          title="Cliquez pour vérifier votre adresse email et débloquer les commentaires et uploads"
          style="background: #fffbeb; color: #b45309; border: 1px solid #f59e0b; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 4px;"
        >
          <span>⚠️</span> Email non vérifié (Vérifier)
        </button>

        <!-- Option de Retour au Mode Classique (Present uniquement sur /18plus) -->
        <NuxtLink 
          v-if="is18PlusRoute" 
          to="/" 
          class="neon-btn neon-btn-crimson" 
          style="text-decoration: none; padding: 6px 12px; font-size: 12px; font-weight: bold;"
        >
          ⬅️ Retour Classique
        </NuxtLink>

        <!-- Badge Utilisateur (Mon Profil) -->
        <NuxtLink to="/channel" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: #111; font-weight: 600; font-size: 14px;">
          <img :src="user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username}`" loading="lazy" decoding="async" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover;" />
          <span>{{ user?.username }}</span>
        </NuxtLink>

        <!-- Actions -->
        <NuxtLink to="/upload" class="neon-btn">Upload</NuxtLink>
        <button @click="logout" class="neon-btn neon-btn-pink">Déconnexion</button>
      </template>

      <template v-else>
        <NuxtLink to="/login" class="neon-btn neon-btn-pink">Connexion</NuxtLink>
      </template>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import { useNotifications } from '~/composables/useNotifications'

const route = useRoute()
const router = useRouter()
const { token, user, logout, verifyEmail } = useAuth()
const { notifications, unreadCount, showNotifs, fetchNotifications, markNotifsRead, handleNotifClick, startPolling, stopPolling } = useNotifications()

const is18PlusRoute = computed(() => {
  return route.path === '/18plus'
})

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

const handleVerifyEmail = async () => {
  const success = await verifyEmail()
  if (success) {
    alert("Votre adresse email a été vérifiée avec succès ! Les fonctionnalités d'upload et de commentaires sont débloquées.")
  } else {
    alert("Erreur lors de la vérification de l'email.")
  }
}

const searchQuery = ref('')

const showSearchBar = computed(() => {
  return route.path === '/' || route.path === '/search' || route.path.startsWith('/video/') || route.path.startsWith('/user/') || route.path === '/channel'
})

// Debounced search — prevents API spam on every keystroke (300ms delay)
let searchDebounceTimer = null
const onSearchInput = () => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    if (searchQuery.value.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.value.trim())}`)
    }
  }, 300)
}

const performSearch = () => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  if (!searchQuery.value.trim()) return
  router.push(`/search?q=${encodeURIComponent(searchQuery.value.trim())}`)
}

onMounted(() => {
  startPolling()
})

onUnmounted(() => {
  stopPolling()
  // Clean up debounce timer to prevent memory leaks
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
})

watch(() => route.path, () => {
  showNotifs.value = false
  fetchNotifications()
})

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
