<template>
  <div class="mx-auto my-10 max-w-[800px] px-5">
    <div class="mb-[25px] flex items-center justify-between">
      <div>
        <h1 class="m-0 text-[26px] text-[#111]">Modifier le Profil</h1>
        <p class="mt-[5px] text-sm text-(--text-muted)">Mettez à jour vos informations personnelles et votre avatar.</p>
      </div>
      <NuxtLink to="/channel" class="text-sm text-(--text-muted) no-underline">&larr; Retour à mon profil</NuxtLink>
    </div>

    <div v-if="loading" class="p-10 text-center text-(--neon-purple)">
      Chargement de vos paramètres...
    </div>

    <div v-else class="rounded-2xl border border-[#e2e8f0] bg-white p-[30px] shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
      
      <!-- AVATAR SELECTION MODULE & PREVIEW BEFORE CONFIRMATION -->
      <div class="mb-[30px] border-b border-[#e2e8f0] pb-[25px]">
        <label class="mb-[6px] block text-sm font-semibold text-[#333]">Photo de profil (Avatar)</label>
        
        <div class="flex flex-wrap items-center gap-[25px]">
          <div class="relative">
            <img 
              :src="avatarUrl" 
              loading="lazy"
              decoding="async"
              class="size-[100px] rounded-full border-[3px] border-(--neon-purple) object-cover shadow-[0_4px_12px_rgba(0,0,0,0.1)]" 
            />
            
            <label 
              for="avatar-file-input" 
              class="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/50 text-xs font-bold text-white opacity-0 transition-opacity duration-200 hover:opacity-100"
            >
              📷 Changer
            </label>
            <input id="avatar-file-input" type="file" accept="image/*" class="hidden" @change="handleLocalAvatarUpload" />
          </div>

          <div class="min-w-[250px] flex-1">
            <div class="mb-3">
              <span class="mb-1 block text-[13px] font-semibold text-[#333]">Option 1: Importer depuis votre ordinateur</span>
              <input type="file" accept="image/*" @change="handleLocalAvatarUpload" class="text-xs" />
            </div>

            <div class="mb-3">
              <span class="mb-1 block text-[13px] font-semibold text-[#333]">Option 2: URL de l'image</span>
              <input type="text" v-model="form.avatar" placeholder="https://..." class="w-full text-[13px]" />
            </div>
            
            <span v-if="avatarPreviewTemp" class="mt-2 block text-[11px] font-bold text-[#d97706]">
              ⚠️ Prévisualisation (Modifications non enregistrées)
            </span>
          </div>
        </div>
      </div>

      <!-- FORMULAIRE DES INFORMATIONS -->
      <form @submit.prevent="updateProfile" class="flex flex-col gap-5">
        
        <div>
          <label class="mb-[6px] block text-sm font-semibold text-[#333]">Nom d'utilisateur</label>
          <input type="text" v-model="form.username" required class="w-full" />
        </div>

        <div>
          <label class="mb-[6px] block text-sm font-semibold text-[#333]">Adresse Email (Non modifiable)</label>
          <input type="email" :value="form.email" disabled class="w-full cursor-not-allowed bg-[#f1f5f9] text-[#64748b]" />
        </div>

        <div>
          <label class="mb-[6px] block text-sm font-semibold text-[#333]">Biographie / Description de la chaîne</label>
          <textarea v-model="form.bio" rows="4" placeholder="Présentez-vous à votre audience..." class="w-full resize-y"></textarea>
        </div>

        <div>
          <label class="mb-[6px] block text-sm font-semibold text-[#333]">Date de naissance (Strictement privée 🔒)</label>
          <div ref="calendarRef" class="relative">
            <button
              type="button"
              :aria-expanded="calendarOpen"
              aria-haspopup="dialog"
              @click="toggleCalendar"
              class="flex w-full items-center justify-between rounded-xl border border-[#cbd5e1] bg-white px-4 py-3 text-left text-sm text-[#1e293b] shadow-sm transition hover:border-[#a78bfa] hover:shadow-[0_4px_14px_rgba(124,58,237,0.1)] focus:outline-none focus:ring-2 focus:ring-[#c4b5fd]"
            >
              <span class="flex items-center gap-3">
                <svg aria-hidden="true" viewBox="0 0 24 24" class="size-5 fill-none stroke-[#7c3aed] stroke-[1.8]">
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path stroke-linecap="round" d="M16 3v4M8 3v4M3 10h18" />
                </svg>
                <span :class="form.birthdate ? 'font-semibold text-[#1e293b]' : 'text-[#94a3b8]'">
                  {{ selectedBirthdateLabel }}
                </span>
              </span>
              <svg aria-hidden="true" viewBox="0 0 20 20" class="size-4 fill-none stroke-[#64748b] stroke-2 transition" :class="{ 'rotate-180': calendarOpen }">
                <path stroke-linecap="round" stroke-linejoin="round" d="m5 7.5 5 5 5-5" />
              </svg>
            </button>

            <div
              v-if="calendarOpen"
              role="dialog"
              aria-label="Choisir une date de naissance"
              class="absolute left-0 z-30 mt-2 w-[min(360px,calc(100vw-2.5rem))] rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.16)]"
            >
              <div class="mb-4 flex items-center justify-between">
                <button type="button" :aria-label="calendarView === 'years' ? 'Plage d’années précédente' : 'Mois précédent'" @click="previousCalendarPage" class="inline-flex size-9 items-center justify-center rounded-lg text-[#475569] transition hover:bg-[#f5f3ff] hover:text-[#7c3aed]">
                  <svg aria-hidden="true" viewBox="0 0 20 20" class="size-4 fill-none stroke-current stroke-2"><path stroke-linecap="round" stroke-linejoin="round" d="m12.5 15-5-5 5-5" /></svg>
                </button>
                <button type="button" @click="toggleCalendarView" class="rounded-lg px-3 py-2 text-sm font-bold capitalize text-[#1e293b] transition hover:bg-[#f5f3ff] hover:text-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#c4b5fd]">
                  {{ calendarHeaderLabel }}
                </button>
                <button type="button" :aria-label="calendarView === 'years' ? 'Plage d’années suivante' : 'Mois suivant'" :disabled="!canGoToNextCalendarPage" @click="nextCalendarPage" class="inline-flex size-9 items-center justify-center rounded-lg text-[#475569] transition hover:bg-[#f5f3ff] hover:text-[#7c3aed] disabled:cursor-not-allowed disabled:opacity-30">
                  <svg aria-hidden="true" viewBox="0 0 20 20" class="size-4 fill-none stroke-current stroke-2"><path stroke-linecap="round" stroke-linejoin="round" d="m7.5 5 5 5-5 5" /></svg>
                </button>
              </div>

              <template v-if="calendarView === 'days'">
                <div class="mb-2 grid grid-cols-7 text-center text-[11px] font-bold uppercase tracking-wide text-[#94a3b8]">
                  <span v-for="day in weekdayLabels" :key="day">{{ day }}</span>
                </div>
                <div class="grid grid-cols-7 gap-1">
                  <button
                    v-for="day in calendarDays"
                    :key="day.key"
                    type="button"
                    :disabled="day.isFuture"
                    :aria-label="day.ariaLabel"
                    @click="selectBirthdate(day.key)"
                    class="aspect-square rounded-lg text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[#c4b5fd] disabled:cursor-not-allowed disabled:opacity-30"
                    :class="[
                      day.isCurrentMonth ? 'text-[#334155]' : 'text-[#94a3b8]',
                      day.key === form.birthdate ? 'bg-gradient-to-br from-[#8a2be2] to-[#ff1493] text-white shadow-[0_3px_8px_rgba(138,43,226,0.3)]' : 'hover:bg-[#f5f3ff] hover:text-[#7c3aed]',
                      day.isToday && day.key !== form.birthdate ? 'ring-1 ring-inset ring-[#c4b5fd]' : ''
                    ]"
                  >
                    {{ day.date.getDate() }}
                  </button>
                </div>
              </template>

              <div v-else class="grid grid-cols-4 gap-2 py-1">
                <button
                  v-for="year in calendarYears"
                  :key="year"
                  type="button"
                  :disabled="year > currentYear"
                  @click="selectYear(year)"
                  class="rounded-xl px-2 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#c4b5fd] disabled:cursor-not-allowed disabled:opacity-30"
                  :class="year === calendarMonth.getFullYear() ? 'bg-gradient-to-br from-[#8a2be2] to-[#ff1493] text-white shadow-[0_3px_8px_rgba(138,43,226,0.3)]' : 'text-[#334155] hover:bg-[#f5f3ff] hover:text-[#7c3aed]'"
                >
                  {{ year }}
                </button>
              </div>

              <div v-if="calendarView === 'days'" class="mt-4 flex items-center justify-between border-t border-[#f1f5f9] pt-3">
                <button type="button" @click="selectToday" class="text-xs font-bold text-[#7c3aed] transition hover:text-[#5b21b6]">Aujourd’hui</button>
                <button v-if="form.birthdate" type="button" @click="clearBirthdate" class="text-xs font-semibold text-[#64748b] transition hover:text-[#e11d48]">Effacer</button>
              </div>
            </div>
          </div>
          <span class="mt-1 block text-[11px] text-[#666]">
            Votre âge est utilisé uniquement pour débloquer l'accès au catalogue mature (+18). Cette information n'est jamais publiée sur votre profil.
          </span>
        </div>

        <div class="mt-2.5 flex justify-end gap-3">
          <NuxtLink to="/channel" class="inline-flex items-center justify-center rounded-md border border-(--neon-purple) px-[18px] py-2.5 text-sm text-(--neon-purple) no-underline shadow-[0_0_4px_rgba(138,43,226,0.2)] transition-[background-color,box-shadow,color] duration-[180ms] hover:bg-(--neon-purple) hover:text-white hover:shadow-[0_4px_12px_rgba(138,43,226,0.3)]">Annuler</NuxtLink>
          <button type="submit" class="inline-flex items-center justify-center rounded-md border border-(--neon-pink) px-6 py-2.5 text-sm text-(--neon-pink) shadow-[0_0_4px_rgba(255,20,147,0.2)] transition-[background-color,box-shadow,color] duration-[180ms] hover:bg-(--neon-pink) hover:text-white hover:shadow-[0_4px_12px_rgba(255,20,147,0.3)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55" :disabled="saving">
            {{ saving ? 'Enregistrement...' : 'Confirmer / Enregistrer les modifications' }}
          </button>
        </div>

      </form>

    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import type { AuthUser } from '#shared/types/models'

const { setUser } = useAuth()
const router = useRouter()

const loading = ref(true)
const saving = ref(false)
const avatarPreviewTemp = ref(false)
const calendarOpen = ref(false)
const calendarRef = ref<HTMLElement | null>(null)
const calendarMonth = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
const calendarView = ref<'days' | 'years'>('days')
const yearRangeStart = ref(Math.floor(new Date().getFullYear() / 20) * 20)
const weekdayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
// Track blob URL for cleanup when leaving the page
let tempBlobUrl: string | null = null

const form = ref({
  username: '',
  email: '',
  bio: '',
  avatar: '',
  birthdate: ''
})

const avatarUrl = computed(() => {
  if (form.value.avatar) return form.value.avatar
  const seed = form.value.username ? encodeURIComponent(form.value.username) : 'default'
  return 'https://api.dicebear.com/7.x/bottts/svg?seed=' + seed
})

const toDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const fromDateKey = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  const date = new Date(year, month - 1, day)
  return toDateKey(date) === value ? date : null
}

const todayKey = computed(() => toDateKey(new Date()))
const selectedBirthdateLabel = computed(() => {
  const date = fromDateKey(form.value.birthdate)
  return date
    ? date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Choisir votre date de naissance'
})

const calendarMonthLabel = computed(() => calendarMonth.value.toLocaleDateString('fr-FR', {
  month: 'long',
  year: 'numeric'
}))

const currentYear = new Date().getFullYear()
const calendarYears = computed(() => Array.from({ length: 20 }, (_, index) => yearRangeStart.value + index))
const calendarHeaderLabel = computed(() => calendarView.value === 'years'
  ? `${yearRangeStart.value} – ${yearRangeStart.value + 19}`
  : calendarMonthLabel.value)

const canGoToNextMonth = computed(() => {
  const today = new Date()
  return calendarMonth.value.getFullYear() < today.getFullYear()
    || (calendarMonth.value.getFullYear() === today.getFullYear() && calendarMonth.value.getMonth() < today.getMonth())
})

const canGoToNextCalendarPage = computed(() => calendarView.value === 'years'
  ? yearRangeStart.value + 20 <= currentYear
  : canGoToNextMonth.value)

const calendarDays = computed(() => {
  const year = calendarMonth.value.getFullYear()
  const month = calendarMonth.value.getMonth()
  const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7
  const firstVisibleDate = new Date(year, month, 1 - firstDayOffset)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstVisibleDate)
    date.setDate(firstVisibleDate.getDate() + index)
    const key = toDateKey(date)
    return {
      date,
      key,
      isCurrentMonth: date.getMonth() === month,
      isToday: key === todayKey.value,
      isFuture: key > todayKey.value,
      ariaLabel: date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    }
  })
})

const syncCalendarMonth = () => {
  const selectedDate = fromDateKey(form.value.birthdate)
  const date = selectedDate || new Date()
  calendarMonth.value = new Date(date.getFullYear(), date.getMonth(), 1)
}

const toggleCalendar = () => {
  if (!calendarOpen.value) {
    syncCalendarMonth()
    calendarView.value = 'days'
  }
  calendarOpen.value = !calendarOpen.value
}

const previousMonth = () => {
  calendarMonth.value = new Date(calendarMonth.value.getFullYear(), calendarMonth.value.getMonth() - 1, 1)
}

const nextMonth = () => {
  if (canGoToNextMonth.value) {
    calendarMonth.value = new Date(calendarMonth.value.getFullYear(), calendarMonth.value.getMonth() + 1, 1)
  }
}

const toggleCalendarView = () => {
  if (calendarView.value === 'days') {
    yearRangeStart.value = Math.floor(calendarMonth.value.getFullYear() / 20) * 20
    calendarView.value = 'years'
  } else {
    calendarView.value = 'days'
  }
}

const previousCalendarPage = () => {
  if (calendarView.value === 'years') {
    yearRangeStart.value -= 20
  } else {
    previousMonth()
  }
}

const nextCalendarPage = () => {
  if (!canGoToNextCalendarPage.value) return
  if (calendarView.value === 'years') {
    yearRangeStart.value += 20
  } else {
    nextMonth()
  }
}

const selectYear = (year: number) => {
  if (year > currentYear) return
  calendarMonth.value = new Date(year, calendarMonth.value.getMonth(), 1)
  calendarView.value = 'days'
}

const selectBirthdate = (key: string) => {
  if (key > todayKey.value) return
  form.value.birthdate = key
  calendarOpen.value = false
}

const selectToday = () => selectBirthdate(todayKey.value)

const clearBirthdate = () => {
  form.value.birthdate = ''
  calendarOpen.value = false
}

const closeCalendarIfOutside = (event: MouseEvent) => {
  if (!calendarRef.value?.contains(event.target as Node)) calendarOpen.value = false
}

const fetchProfile = async () => {
  try {
    const data = await $fetch<AuthUser>('/api/users/me')
    form.value = {
      username: data.username,
      email: data.email,
      bio: data.bio || '',
      avatar: data.avatar || '',
      birthdate: data.birthdate || ''
    }
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProfile()
  document.addEventListener('mousedown', closeCalendarIfOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', closeCalendarIfOutside)
  // Revoke any temporary blob URLs to free memory (GC)
  if (tempBlobUrl) {
    URL.revokeObjectURL(tempBlobUrl)
    tempBlobUrl = null
  }
})

const handleLocalAvatarUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    // Revoke previous temp blob URL to prevent memory leak
    if (tempBlobUrl) {
      URL.revokeObjectURL(tempBlobUrl)
    }
    const reader = new FileReader()
    reader.onload = () => {
      form.value.avatar = typeof reader.result === 'string' ? reader.result : ''
      avatarPreviewTemp.value = true
    }
    reader.readAsDataURL(file)
  }
}

const updateProfile = async () => {
  saving.value = true
  try {
    const res = await $fetch<{ user?: AuthUser }>('/api/users/profile', {
      method: 'PUT',
      body: {
        username: form.value.username,
        bio: form.value.bio,
        avatar: form.value.avatar,
        birthdate: form.value.birthdate
      }
    })

    if (res.user) {
      setUser(res.user)
    }

    avatarPreviewTemp.value = false
    alert('Profil mis à jour avec succès !')
    router.push('/channel')
  } catch (error: unknown) {
    alert(error instanceof Error ? error.message : 'Erreur lors de la mise à jour du profil.')
  } finally {
    saving.value = false
  }
}
</script>

