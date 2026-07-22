<template>
  <div class="p-10 text-center">Redirection...</div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

onMounted(() => {
  router.replace(`/user/${route.params.id}`)
})
</script>
