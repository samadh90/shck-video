<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'

onMounted(() => {
  const { loadAuth } = useAuth()
  loadAuth()
})
</script>
