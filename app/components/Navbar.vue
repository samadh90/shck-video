<template>
  <nav class="sticky top-0 z-[200] flex items-center justify-between border-b border-[#e2e8f0] bg-white px-[30px] py-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] [transform:translateZ(0)] [backface-visibility:hidden] max-[768px]:flex-wrap max-[768px]:gap-2.5 max-[768px]:px-4 max-[768px]:py-3">
    <!-- Logo (Dynamique selon le mode +18) -->
    <NuxtLink v-if="is18PlusRoute" to="/18plus" class="text-2xl font-black tracking-[-0.5px] text-white no-underline">
      SHCK<span class="font-black text-[#dc2626]">Video +18</span>
    </NuxtLink>
    <NuxtLink v-else to="/" class="text-2xl font-black tracking-[-0.5px] text-[#1a1a1a] no-underline">
      SHCK<span class="text-[#ff1493]">Video</span>
    </NuxtLink>

    <!-- Barre de Recherche Unifiée (Présente uniquement sur l'accueil et la recherche) -->
    <form 
      v-if="showSearchBar" 
      @submit.prevent="performSearch" 
      class="mx-5 flex max-w-[450px] flex-1 items-center rounded-[20px] border border-[#cbd5e1] bg-[#f1f5f9] px-[14px] py-1"
    >
      <input 
        type="text" 
        v-model="searchQuery"
        @input="onSearchInput"
        placeholder="Rechercher des vidéos, chaînes, créateurs..." 
        class="w-full border-0 bg-transparent text-sm text-[#111] outline-none"
      />
      <button type="submit" class="cursor-pointer border-0 bg-transparent pl-2 text-base">
        🔍
      </button>
    </form>
    <div v-else class="flex-1"></div>

    <!-- Actions Utilisateur & Cloche de Notifications Persistante -->
    <div class="flex items-center gap-[15px]">
      <template v-if="token">
        
        <!-- CLOCHE DE NOTIFICATIONS GLOBALE PERSISTANTE -->
          <div class="relative">
          <button @click="showNotifs = !showNotifs" class="relative cursor-pointer border-0 bg-transparent text-lg">
            🔔
            <span v-if="unreadCount > 0" class="absolute -top-[5px] -right-[5px] flex size-4 items-center justify-center rounded-full bg-[#ff1493] text-[10px] font-bold text-white">
              {{ unreadCount }}
            </span>
          </button>

          <!-- Dropdown Panneau Notifications -->
          <div v-if="showNotifs" class="absolute top-[35px] right-0 z-[1000] w-[310px] rounded-xl border border-[#e2e8f0] bg-white p-3 shadow-[0_10px_25px_rgba(0,0,0,0.12)]">
            <div class="mb-2 flex items-center justify-between border-b border-[#eee] pb-1.5">
              <strong class="text-[13px]">Notifications</strong>
              <button @click="markNotifsRead" class="cursor-pointer border-0 bg-transparent text-[11px] font-bold text-[#8a2be2]">Tout lire</button>
            </div>
            
            <div v-if="notifications.length === 0" class="p-[15px] text-center text-xs text-[#888]">
              Aucune notification.
            </div>
            
            <div v-else class="flex max-h-[260px] flex-col gap-1.5 overflow-y-auto">
              <div 
                v-for="n in notifications" 
                :key="n.id" 
                @click="handleNotifClick(n)"
                class="cursor-pointer rounded-md p-2 text-xs transition-[background] duration-150"
                :class="n.read ? 'bg-[#f8f9fa]' : 'border-l-[3px] border-l-[#8a2be2] bg-[#f0f4ff]'"
              >
                <div class="font-medium text-[#222]">{{ n.message }}</div>
                <span class="mt-1 block text-[10px] text-[#888]">{{ formatDate(n.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Badge de Vérification d'Email (Mode Restreint) -->
        <button 
          v-if="!user?.isVerified" 
          @click="handleVerifyEmail" 
          title="Envoyer un lien de vérification à votre adresse e-mail"
          class="flex cursor-pointer items-center gap-1 rounded-xl border border-[#f59e0b] bg-[#fffbeb] px-2.5 py-1 text-[11px] font-bold text-[#b45309]"
        >
          <span>⚠️</span> Email non vérifié (Envoyer le lien)
        </button>

        <!-- Option de Retour au Mode Classique (Present uniquement sur /18plus) -->
        <NuxtLink 
          v-if="is18PlusRoute" 
          to="/" 
          class="inline-flex cursor-pointer items-center justify-center rounded-lg border-2 border-[#dc2626] bg-transparent px-3 py-1.5 text-xs font-bold text-[#dc2626] no-underline shadow-[0_0_6px_rgba(220,38,38,0.3)] transition-[background-color,box-shadow,color] duration-[180ms] ease-[ease] [transform:translateZ(0)] [backface-visibility:hidden] [will-change:background-color,box-shadow,color] hover:bg-[#dc2626] hover:text-white hover:shadow-[0_4px_14px_rgba(220,38,38,0.4)]"
        >
          ⬅️ Retour Classique
        </NuxtLink>

        <!-- Badge Utilisateur (Mon Profil) -->
        <NuxtLink to="/channel" class="flex items-center gap-2 text-sm font-semibold text-[#111] no-underline">
          <img :src="user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username}`" loading="lazy" decoding="async" class="size-7 rounded-full object-cover" />
          <span>{{ user?.username }}</span>
        </NuxtLink>

        <!-- Actions -->
        <NuxtLink to="/upload" class="inline-flex cursor-pointer items-center justify-center rounded-lg border-2 border-[#8a2be2] bg-transparent px-5 py-2.5 text-sm font-semibold text-[#8a2be2] no-underline shadow-[0_0_4px_rgba(138,43,226,0.2)] transition-[background-color,box-shadow,color] duration-[180ms] ease-[ease] [transform:translateZ(0)] [backface-visibility:hidden] [will-change:background-color,box-shadow,color] hover:bg-[#8a2be2] hover:text-white hover:shadow-[0_4px_12px_rgba(138,43,226,0.3)]">Upload</NuxtLink>
        <button @click="logout" class="inline-flex cursor-pointer items-center justify-center rounded-lg border-2 border-[#ff1493] bg-transparent px-5 py-2.5 text-sm font-semibold text-[#ff1493] shadow-[0_0_4px_rgba(255,20,147,0.2)] transition-[background-color,box-shadow,color] duration-[180ms] ease-[ease] [transform:translateZ(0)] [backface-visibility:hidden] [will-change:background-color,box-shadow,color] hover:bg-[#ff1493] hover:text-white hover:shadow-[0_4px_12px_rgba(255,20,147,0.3)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-[0.55]">Déconnexion</button>
      </template>

      <template v-else>
        <NuxtLink to="/login" class="inline-flex cursor-pointer items-center justify-center rounded-lg border-2 border-[#ff1493] bg-transparent px-5 py-2.5 text-sm font-semibold text-[#ff1493] no-underline shadow-[0_0_4px_rgba(255,20,147,0.2)] transition-[background-color,box-shadow,color] duration-[180ms] ease-[ease] [transform:translateZ(0)] [backface-visibility:hidden] [will-change:background-color,box-shadow,color] hover:bg-[#ff1493] hover:text-white hover:shadow-[0_4px_12px_rgba(255,20,147,0.3)]">Connexion</NuxtLink>
      </template>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import { useNotifications } from '~/composables/useNotifications'

const route = useRoute()
const router = useRouter()
const { token, user, logout, requestEmailVerification } = useAuth()
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
  const result = await requestEmailVerification()
  if (result?.developmentVerificationUrl && import.meta.client) {
    window.location.assign(result.developmentVerificationUrl)
  } else if (result?.success) {
    alert("Un lien de vérification vient d'être envoyé à votre adresse e-mail.")
  } else {
    alert("Impossible d'envoyer le lien de vérification.")
  }
}

const searchQuery = ref('')

const showSearchBar = computed(() => {
  return route.path === '/' || route.path === '/search' || route.path.startsWith('/video/') || route.path.startsWith('/user/') || route.path === '/channel'
})

// Debounced search — prevents API spam on every keystroke (300ms delay)
let searchDebounceTimer: ReturnType<typeof setTimeout> | undefined
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

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
