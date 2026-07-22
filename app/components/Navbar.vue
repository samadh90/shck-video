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

    <!-- Actions utilisateur -->
    <div class="flex items-center gap-2 sm:gap-3">
      <template v-if="isAuthenticated">
        <NuxtLink
          v-if="is18PlusRoute"
          to="/"
          class="hidden items-center rounded-lg border border-[#dc2626] px-3 py-2 text-xs font-bold text-[#dc2626] no-underline transition hover:bg-[#dc2626] hover:text-white sm:inline-flex"
        >
          Retour classique
        </NuxtLink>

        <!-- Notifications -->
        <div class="relative">
          <button
            type="button"
            :aria-expanded="showNotifs"
            aria-label="Afficher les notifications"
            @click="toggleNotifications"
            class="relative inline-flex size-10 cursor-pointer items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-[#475569] shadow-sm transition hover:border-[#c4b5fd] hover:bg-[#f5f3ff] hover:text-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#c4b5fd]"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" class="size-5 fill-none stroke-current stroke-[1.8]">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a3 3 0 0 1-5.714 0M18 9a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
            </svg>
            <span v-if="unreadCount > 0" class="absolute -right-1 -top-1 flex min-w-4 size-4 items-center justify-center rounded-full bg-[#ff1493] px-1 text-[10px] font-bold text-white ring-2 ring-white">
              {{ unreadCount > 9 ? '9+' : unreadCount }}
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

        <!-- Upload -->
        <NuxtLink
          to="/upload"
          class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#8a2be2] to-[#ff1493] px-3.5 py-2.5 text-sm font-bold text-white no-underline shadow-[0_5px_14px_rgba(138,43,226,0.24)] transition hover:-translate-y-px hover:shadow-[0_8px_18px_rgba(138,43,226,0.32)] focus:outline-none focus:ring-2 focus:ring-[#c4b5fd]"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" class="size-4 fill-none stroke-current stroke-[2]">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 16V4m0 0L8 8m4-4 4 4M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
          </svg>
          <span class="hidden sm:inline">Upload</span>
        </NuxtLink>

        <!-- Profil : hover, focus clavier ou clic -->
        <div
          class="relative"
          @mouseenter="profileMenuOpen = true"
          @mouseleave="profileMenuOpen = false"
          @focusin="profileMenuOpen = true"
          @focusout="closeProfileMenu"
          @keydown.esc="profileMenuOpen = false"
        >
          <button
            type="button"
            :aria-expanded="profileMenuOpen"
            aria-haspopup="menu"
            aria-label="Ouvrir le menu du profil"
            @click="profileMenuOpen = !profileMenuOpen"
            class="group inline-flex cursor-pointer items-center gap-2 rounded-xl border border-transparent bg-transparent p-1.5 text-left transition hover:border-[#e2e8f0] hover:bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#c4b5fd]"
          >
            <img :src="user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username}`" loading="lazy" decoding="async" class="size-8 rounded-lg object-cover ring-1 ring-[#e2e8f0]" />
            <span class="hidden max-w-28 truncate text-sm font-bold text-[#1e293b] lg:block">{{ user?.username }}</span>
            <svg aria-hidden="true" viewBox="0 0 20 20" class="hidden size-4 fill-none stroke-[#64748b] stroke-2 transition group-hover:stroke-[#7c3aed] sm:block" :class="{ 'rotate-180': profileMenuOpen }">
              <path stroke-linecap="round" stroke-linejoin="round" d="m5 7.5 5 5 5-5" />
            </svg>
          </button>

          <div
            v-if="profileMenuOpen"
            class="absolute right-0 top-full z-[1000] w-64 pt-2"
          >
            <div role="menu" class="origin-top-right overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white p-2 shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
              <NuxtLink to="/channel" role="menuitem" @click="profileMenuOpen = false" class="mb-2 flex items-center gap-3 rounded-xl bg-[#f8fafc] p-3 text-[#0f172a] no-underline transition hover:bg-[#f5f3ff]">
                <img :src="user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username}`" loading="lazy" decoding="async" class="size-10 rounded-xl object-cover" />
                <span class="min-w-0">
                  <strong class="block truncate text-sm">{{ user?.username }}</strong>
                  <span class="block truncate text-xs text-[#64748b]">Voir mon profil</span>
                </span>
              </NuxtLink>

              <NuxtLink to="/channel" role="menuitem" @click="profileMenuOpen = false" class="block rounded-xl px-3 py-2 text-sm font-semibold text-[#334155] no-underline transition hover:bg-[#f5f3ff] hover:text-[#7c3aed]">Ma chaîne</NuxtLink>
              <NuxtLink to="/dashboard/videos" role="menuitem" @click="profileMenuOpen = false" class="block rounded-xl px-3 py-2 text-sm font-semibold text-[#334155] no-underline transition hover:bg-[#f5f3ff] hover:text-[#7c3aed]">Mes vidéos</NuxtLink>
              <NuxtLink to="/my-comments" role="menuitem" @click="profileMenuOpen = false" class="block rounded-xl px-3 py-2 text-sm font-semibold text-[#334155] no-underline transition hover:bg-[#f5f3ff] hover:text-[#7c3aed]">Mes commentaires</NuxtLink>
              <NuxtLink to="/settings" role="menuitem" @click="profileMenuOpen = false" class="block rounded-xl px-3 py-2 text-sm font-semibold text-[#334155] no-underline transition hover:bg-[#f5f3ff] hover:text-[#7c3aed]">Paramètres</NuxtLink>

              <button
                v-if="!user?.isVerified"
                type="button"
                role="menuitem"
                @click="handleVerifyEmail"
                class="mt-1 w-full cursor-pointer rounded-lg border border-[#fde68a] bg-[#fffbeb] px-3 py-2 text-left text-xs font-semibold text-[#b45309]"
              >
                Vérifier mon e-mail
              </button>

              <div class="my-2 border-t border-[#e2e8f0]"></div>
              <button type="button" role="menuitem" @click="logout" class="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-sm font-bold text-[#e11d48] transition hover:bg-[#fff1f2]">
                Déconnexion
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>
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
const { isAuthenticated, user, logout, requestEmailVerification } = useAuth()
const { notifications, unreadCount, showNotifs, fetchNotifications, markNotifsRead, handleNotifClick, startPolling, stopPolling } = useNotifications()
const profileMenuOpen = ref(false)

const toggleNotifications = () => {
  profileMenuOpen.value = false
  showNotifs.value = !showNotifs.value
}

const closeProfileMenu = (event: FocusEvent) => {
  const menu = event.currentTarget as HTMLElement | null
  const nextElement = event.relatedTarget as Node | null
  if (!menu?.contains(nextElement)) profileMenuOpen.value = false
}

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
  profileMenuOpen.value = false
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
