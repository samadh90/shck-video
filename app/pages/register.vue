<template>
  <div style="padding: 30px; text-align: center;">
    <h2 style="color: var(--neon-purple);">Créer un compte SHCK Video</h2>
    <form @submit.prevent="register" style="max-width: 400px; margin: 0 auto; display: flex; flex-direction: column; gap: 15px;">
      <input type="text" placeholder="Nom d'utilisateur" required v-model="username" style="padding: 10px; border-radius: 5px; border: 1px solid var(--neon-purple); background: white; color: black;" />
      <input type="email" placeholder="Email" required v-model="email" style="padding: 10px; border-radius: 5px; border: 1px solid var(--neon-purple); background: white; color: black;" />
      <input type="password" placeholder="Mot de passe" required v-model="password" style="padding: 10px; border-radius: 5px; border: 1px solid var(--neon-purple); background: white; color: black;" />
      
      <button type="submit" class="neon-btn neon-btn-pink" :disabled="loading">
        {{ loading ? 'Création...' : 'S\'inscrire' }}
      </button>
    </form>
    <p v-if="errorMsg" style="color: red; margin-top: 15px;">{{ errorMsg }}</p>
    <p style="margin-top: 20px;">
      Déjà un compte ? <NuxtLink to="/login" style="color: var(--neon-purple);">Se connecter</NuxtLink>
    </p>
    <p style="margin-top: 10px;"><NuxtLink to="/" style="color: var(--text-muted);">Retour à l'accueil</NuxtLink></p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const username = ref('')
const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)
const router = useRouter()

const register = async () => {
  loading.value = true
  errorMsg.value = ''
  
  try {
    const res = await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        username: username.value,
        email: email.value,
        password: password.value
      }
    })
    
    if (!res?.success) throw new Error('La creation du compte a echoue.')

    if (res.success) {
      alert('Compte créé avec succès ! Vous pouvez maintenant vous connecter.')
      router.push('/login')
    }
  } catch (err) {
    errorMsg.value = err.data?.error || 'Erreur lors de la création du compte.'
  } finally {
    loading.value = false
  }
}
</script>
