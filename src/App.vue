<script setup>
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const route = useRoute()

const showThemeButton = computed(() => route.query.sinBotonTema !== '1')
</script>

<template>
  <RouterView />

  <button
    v-if="showThemeButton"
    type="button"
    :title="authStore.darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
    style="position:fixed;right:12px;bottom:12px;z-index:9999;height:30px;padding:0 10px;border-radius:8px;border:1px solid #ECE5DE;background:#1F1A17;color:#FFFFFF;font:500 11px 'Poppins',sans-serif;cursor:pointer;opacity:0.85;display:inline-flex;align-items:center;gap:5px"
    @click="authStore.toggleDarkMode()"
  >
    <svg v-if="authStore.darkMode" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5"></circle>
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
    </svg>
    <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
    <span>{{ authStore.darkMode ? 'Claro' : 'Oscuro' }}</span>
  </button>
</template>
