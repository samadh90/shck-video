<template>
  <div class="p-8 text-center">
    <h2 class="text-brand">Connexion</h2>
    <form @submit.prevent="login" class="mx-auto flex max-w-sm flex-col gap-4">
      <input type="email" placeholder="Email" required v-model="email" class="rounded-md border border-brand bg-white p-2.5 text-black" />
      <input type="password" placeholder="Mot de passe" required v-model="password" class="rounded-md border border-brand bg-white p-2.5 text-black" />
      <button type="submit" class="rounded-md bg-brand px-4 py-2 font-semibold text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-60" :disabled="loading">
        {{ loading ? 'Connexion...' : 'Se connecter' }}
      </button>
    </form>
    <p v-if="errorMsg" class="mt-4 text-red-600">{{ errorMsg }}</p>
    <p class="mt-5">
      Pas encore de compte ? <NuxtLink to="/register" class="text-accent">S'inscrire</NuxtLink>
    </p>
    <p class="mt-2.5"><NuxtLink to="/" class="text-muted">Retour à l'accueil</NuxtLink></p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import type { AuthUser } from '#shared/types/models'

const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)
const router = useRouter()
const route = useRoute()
const { setAuth } = useAuth()

const login = async () => {
  loading.value = true
  errorMsg.value = ''
  
  try {
    const res = await $fetch<{ success: boolean, user?: AuthUser, message?: string }>('/api/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value }
    })
    
    if (!res?.success || !res.user) {
      errorMsg.value = res?.message || 'La connexion a échoué. Réessayez.'
      return
    }

    if (res.success) {
      setAuth(res.user)
      const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') && !route.query.redirect.startsWith('//')
        ? route.query.redirect
        : '/'
      router.push(redirect)
    }
  } catch (error: unknown) {
    const serverMessage = (error as { data?: { message?: string } })?.data?.message
    errorMsg.value = serverMessage || 'Un problème est survenu. Réessayez dans un instant.'
  } finally {
    loading.value = false
  }
}
</script>
