<template>
  <div class="p-8 text-center">
    <h2 class="text-brand">Créer un compte SHCK Video</h2>
    <form @submit.prevent="register" class="mx-auto flex max-w-sm flex-col gap-4">
      <input type="text" placeholder="Nom d'utilisateur" required v-model="username" class="rounded-md border border-brand bg-white p-2.5 text-black" />
      <input type="email" placeholder="Email" required v-model="email" class="rounded-md border border-brand bg-white p-2.5 text-black" />
      <input type="password" placeholder="Mot de passe" required v-model="password" class="rounded-md border border-brand bg-white p-2.5 text-black" />
      
      <button type="submit" class="rounded-md bg-accent px-4 py-2 font-semibold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60" :disabled="loading">
        {{ loading ? 'Création...' : 'S\'inscrire' }}
      </button>
    </form>
    <p v-if="errorMsg" class="mt-4 text-red-600">{{ errorMsg }}</p>
    <p class="mt-5">
      Déjà un compte ? <NuxtLink to="/login" class="text-brand">Se connecter</NuxtLink>
    </p>
    <p class="mt-2.5"><NuxtLink to="/" class="text-muted">Retour à l'accueil</NuxtLink></p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import type { AuthUser } from '#shared/types/models'

const username = ref('')
const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)
const router = useRouter()
const { setAuth } = useAuth()

const register = async () => {
  loading.value = true
  errorMsg.value = ''
  
  try {
    const res = await $fetch<{ success: boolean, user?: AuthUser, developmentVerificationUrl?: string }>('/api/auth/register', {
      method: 'POST',
      body: {
        username: username.value,
        email: email.value,
        password: password.value
      }
    })
    
    if (!res?.success || !res.user) throw new Error('La creation du compte a echoue.')

    if (res.success) {
      setAuth(res.user)
      if (res.developmentVerificationUrl && import.meta.client) {
        window.location.assign(res.developmentVerificationUrl)
        return
      }
      alert('Compte créé avec succès ! Vous pouvez maintenant vous connecter.')
      router.push('/login')
    }
  } catch (error: unknown) {
    errorMsg.value = error instanceof Error ? error.message : 'Erreur lors de la création du compte.'
  } finally {
    loading.value = false
  }
}
</script>
