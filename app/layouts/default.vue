<template>
  <div style="min-height: 100vh; background-color: #fcfcfc;">
    <!-- En-tête Global Persistant avec Cloche de Notifications -->
    <Navbar />
    
    <!-- Emplacement principal des pages -->
    <main>
      <slot />
    </main>
  </div>
</template>

<script setup>
import Navbar from '~/components/Navbar.vue'
</script>
