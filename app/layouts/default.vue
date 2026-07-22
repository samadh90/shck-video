<template>
  <div class="min-h-screen bg-[#fcfcfc]">
    <!-- En-tête Global Persistant avec Cloche de Notifications -->
    <Navbar />
    
    <!-- Emplacement principal des pages -->
    <main>
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import Navbar from '~/components/Navbar.vue'
</script>
