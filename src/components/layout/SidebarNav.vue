<script setup>
import { computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const menuByRole = {
  admin: [
    { label: 'Inicio', to: '/admin/inicio', matchPrefix: '/admin/inicio' },
    { label: 'Productos', to: '/admin/productos', matchPrefix: '/admin/productos' },
    { label: 'Paquetes', to: '/admin/paquetes', matchPrefix: '/admin/paquetes' },
    { label: 'Promociones', to: '/admin/promociones', matchPrefix: '/admin/promociones' },
    { label: 'Empleados', to: '/admin/empleados', matchPrefix: '/admin/empleados' },
    { label: 'Historial', to: '/admin/historial', matchPrefix: '/admin/historial' },
    { label: 'Reportes', to: '/admin/reportes', matchPrefix: '/admin/reportes' }
  ],
  cajero: [
    { label: 'Inicio', to: '/cajero/inicio', matchPrefix: '/cajero/inicio' },
    { label: 'Nueva venta', to: '/cajero/nueva-venta', matchPrefix: '/cajero/nueva-venta' },
    { label: 'Domicilios', to: '/cajero/domicilios', matchPrefix: '/cajero/domicilios' },
    { label: 'Catálogo', to: '/cajero/catalogo', matchPrefix: '/cajero/catalogo' },
    { label: 'Historial', to: '/cajero/historial', matchPrefix: '/cajero/historial' }
  ]
}

const navItems = computed(() => {
  const currentRole = authStore.role === 'admin' ? 'admin' : 'cajero'
  return menuByRole[currentRole]
})

function isItemActive(item) {
  return route.path === item.to || route.path.startsWith(item.matchPrefix)
}

function handleLogout() {
  authStore.logout()
  router.push({ path: '/login', query: {} })
}
</script>

<template>
  <aside class="side">
    <div class="row side-header" style="padding:4px 8px 20px">
      <div
        class="side-logo-badge"
        style="width:34px;height:34px;border-radius:10px;background:#fff;color:#CF520A;font-weight:600;display:flex;align-items:center;justify-content:center"
      >
        K
      </div>
      <div style="font-weight:600;font-size:18px">KinGo</div>
    </div>

    <RouterLink
      v-for="item in navItems"
      :key="item.to"
      :to="item.to"
      :class="['nav', { on: isItemActive(item) }]"
    >
      <i></i>{{ item.label }}
    </RouterLink>

    <!-- Círculos concéntricos sutiles en medio saliendo del lado derecho -->
    <svg
      class="side-circles-mid"
      width="176"
      height="176"
      viewBox="-88 -88 176 176"
      fill="none"
      aria-hidden="true"
    >
      <circle r="80" stroke="currentColor" stroke-opacity="0.1" stroke-width="1.4" />
      <circle r="58" stroke="currentColor" stroke-opacity="0.14" stroke-width="1.4" />
      <circle r="38" stroke="currentColor" stroke-opacity="0.18" stroke-width="1.5" />
      <circle r="20" fill="currentColor" fill-opacity="0.06" />
      <circle r="7" fill="currentColor" fill-opacity="0.14" />
    </svg>

    <div v-if="!route.meta.hideSidebarFooter" style="flex:1"></div>

    <div v-if="!route.meta.hideSidebarFooter" class="row side-footer" style="padding:10px 8px">
      <div
        style="width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,0.22);color:#fff;font-weight:600;font-size:13px;display:flex;align-items:center;justify-content:center;flex:none"
      >
        <span>{{ authStore.roleInitials }}</span>
      </div>
      <div style="min-width:0">
        <div style="font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
          <span>{{ authStore.user?.fullName || authStore.userName }}</span>
        </div>
        <div class="sub logout-btn" style="font-size:12px;cursor:pointer" @click="handleLogout">
          Cerrar sesión
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.side-circles-mid {
  position: absolute;
  top: 60%;
  right: -68px;
  color: #ffffff;
  pointer-events: none;
  z-index: 0;
  animation: sideSlowSpin 48s linear infinite;
}

@keyframes sideSlowSpin {
  from {
    transform: translateY(-50%) rotate(0deg);
  }
  to {
    transform: translateY(-50%) rotate(360deg);
  }
}

.side-header,
.side-footer,
.nav {
  position: relative;
  z-index: 1;
}

.logout-btn {
  transition: transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.16s ease;
  user-select: none;
}

.logout-btn:hover {
  text-decoration: underline;
  transform: translateX(1px);
}

.logout-btn:active {
  transform: scale(0.94);
}
</style>
