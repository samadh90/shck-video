<template>
  <main class="mx-auto my-20 max-w-xl p-6 text-center">
    <h1>Vérification de l’adresse e-mail</h1>
    <p v-if="pending">Vérification du lien en cours…</p>
    <template v-else>
      <p>{{ message }}</p>
      <NuxtLink to="/login" class="inline-block rounded-md bg-brand px-4 py-2 font-semibold text-white no-underline">Se connecter</NuxtLink>
    </template>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const pending = ref(true)
const message = ref('')

onMounted(async () => {
  const token = typeof route.query.token === 'string' ? route.query.token : ''
  if (!token) {
    message.value = 'Le lien de vérification est incomplet.'
    pending.value = false
    return
  }

  try {
    const response = await $fetch<{ message: string }>('/api/auth/verify-email', { query: { token } })
    message.value = response.message
  } catch (error: unknown) {
    message.value = error instanceof Error ? error.message : 'Le lien de vérification est invalide ou expiré.'
  } finally {
    pending.value = false
  }
})
</script>
