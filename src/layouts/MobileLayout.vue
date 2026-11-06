<script setup>
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>

<template>
  <div
    :class="['kg', 'kg-mobile', { dark: authStore.darkMode }]"
  >
    <div class="kg-mobile-container">
      <RouterView />
    </div>
  </div>
</template>
