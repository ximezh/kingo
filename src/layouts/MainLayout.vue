<script setup>
import { RouterView, useRoute } from 'vue-router'
import SidebarNav from '@/components/layout/SidebarNav.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const route = useRoute()
</script>

<template>
  <div :class="['kg', 'kg-desktop', { dark: authStore.darkMode }]">
    <SidebarNav />
    <main
      class="main"
      :style="{
        ...(route.meta.mainGap ? { gap: route.meta.mainGap } : {}),
        ...(route.meta.mainPadding ? { padding: route.meta.mainPadding } : {})
      }"
    >
      <RouterView />
    </main>
  </div>
</template>
