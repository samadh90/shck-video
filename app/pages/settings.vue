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
          <input type="date" v-model="form.birthdate" class="w-full" />
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

const { token, setUser } = useAuth()
const router = useRouter()

const loading = ref(true)
const saving = ref(false)
const avatarPreviewTemp = ref(false)
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

const fetchProfile = async () => {
  try {
    const data = await $fetch<AuthUser>('/api/users/me', {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
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
})

onUnmounted(() => {
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
      headers: { 'Authorization': `Bearer ${token.value}` },
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

