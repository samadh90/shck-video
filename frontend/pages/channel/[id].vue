<template>
  <div style="padding: 40px; text-align: center;">Redirection...</div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

onMounted(() => {
  router.replace(`/user/${route.params.id}`)
})
</script>
