<template>
  <div style="padding: 30px; text-align: center;">
    <h2 style="color: var(--neon-purple);">Connexion</h2>
    <form @submit.prevent="login" style="max-width: 400px; margin: 0 auto; display: flex; flex-direction: column; gap: 15px;">
      <input type="email" placeholder="Email" required v-model="email" style="padding: 10px; border-radius: 5px; border: 1px solid var(--neon-purple); background: white; color: black;" />
      <input type="password" placeholder="Mot de passe" required v-model="password" style="padding: 10px; border-radius: 5px; border: 1px solid var(--neon-purple); background: white; color: black;" />
      <button type="submit" class="neon-btn" :disabled="loading">
        {{ loading ? 'Connexion...' : 'Se connecter' }}
      </button>
    </form>
    <p v-if="errorMsg" style="color: red; margin-top: 15px;">{{ errorMsg }}</p>
    <p style="margin-top: 20px;">
      Pas encore de compte ? <NuxtLink to="/register" style="color: var(--neon-pink);">S'inscrire</NuxtLink>
    </p>
    <p style="margin-top: 10px;"><NuxtLink to="/" style="color: var(--text-muted);">Retour à l'accueil</NuxtLink></p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'

const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)
const router = useRouter()
const { setAuth } = useAuth()

const login = async () => {
  loading.value = true
  errorMsg.value = ''
  
  try {
    const res = await $fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value }
    })
    
    if (res.success) {
      setAuth(res.token, res.user)
      router.push('/')
    }
  } catch (err) {
    errorMsg.value = err.data?.error || 'Identifiants incorrects.'
  } finally {
    loading.value = false
  }
}
</script>
