<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { empleadosState } from '@/services/empleados.service'
import { PRODUCTOS_MOCK } from '@/services/catalogo.service'
import { HISTORIAL_VENTAS_MOCK } from '@/services/ventas.service'
import { PEDIDOS_POR_ASIGNAR_MOCK } from '@/services/entregas.service'

const authStore = useAuthStore()

const isAdmin = computed(() => authStore.role === 'admin')
const isCajero = computed(() => authStore.role !== 'admin')

const now = ref(new Date())
let clockTimer = null

onMounted(() => {
  clockTimer = setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
})

const saludoPorHora = computed(() => {
  const hr = now.value.getHours()
  if (hr < 12) return 'Buen día'
  if (hr < 19) return 'Buenas tardes'
  return 'Buenas noches'
})

const nombreMostrado = computed(() => {
  if (isAdmin.value) return 'Administrador'
  return authStore.user?.fullName || authStore.userName || 'Cajero'
})

const horaActualFormateada = computed(() => {
  return now.value.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
})

const fechaActualFormateada = computed(() => {
  return now.value.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })
})

const totalEmpleadosActivos = computed(() => empleadosState.value.filter((e) => e.activo).length)
const totalProductosActivos = computed(() => PRODUCTOS_MOCK.filter((p) => p.activo !== false).length)
const totalVentasHoy = computed(() => HISTORIAL_VENTAS_MOCK.length)
const pendientesDomicilio = computed(() => PEDIDOS_POR_ASIGNAR_MOCK.length)
</script>

<template>
  <!-- Encabezado principal limpio y estético -->
  <section class="dash-hero">
    <svg
      class="dash-hero-art"
      width="300"
      height="300"
      viewBox="-150 -150 300 300"
      fill="none"
      aria-hidden="true"
    >
      <circle r="138" stroke="currentColor" stroke-opacity="0.12" stroke-width="1.5" />
      <circle r="104" stroke="currentColor" stroke-opacity="0.16" stroke-width="1.5" />
      <circle r="72" stroke="currentColor" stroke-opacity="0.22" stroke-width="2" />
      <circle r="42" fill="currentColor" fill-opacity="0.08" />
      <circle r="14" fill="currentColor" fill-opacity="0.18" />
    </svg>

    <div class="dash-hero-top">
      <div style="display:flex;flex-direction:column;gap:6px;position:relative;z-index:1">
        <span class="dash-date-badge">{{ fechaActualFormateada }}</span>
        <h1 class="dash-greeting">{{ saludoPorHora }}, {{ nombreMostrado }}</h1>
      </div>

      <div class="dash-clock-pill">
        <span class="pulse-dot"></span>
        <span>Abierto · {{ horaActualFormateada }}</span>
        <span class="dash-clock-sched">13:00–21:00</span>
      </div>
    </div>
  </section>

  <!-- Dashboard de Cajero -->
  <div v-if="isCajero" class="dash-section">
    <div class="dash-cajero-grid">
      <RouterLink class="dash-cta-banner" to="/cajero/nueva-venta">
        <div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap">
          <div class="dash-cta-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
          </div>
          <div style="display:flex;flex-direction:column;gap:2px">
            <h2 style="font-size:21px;font-weight:600;letter-spacing:-0.2px">Nueva venta</h2>
            <p class="sub" style="font-size:13.5px">En local, para llevar o a domicilio</p>
          </div>
        </div>
        <span class="btn p dash-cta-btn">Empezar venta</span>
      </RouterLink>

      <RouterLink class="card dash-action-card" to="/cajero/domicilios">
        <div class="row" style="justify-content:space-between">
          <div class="ico dash-ico">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"></path>
              <circle cx="7" cy="18" r="1.6"></circle>
              <circle cx="17" cy="18" r="1.6"></circle>
            </svg>
          </div>
          <span class="tag">{{ pendientesDomicilio }} pendientes</span>
        </div>
        <div class="dash-card-Bottom">
          <div>
            <h3>Domicilios</h3>
            <p class="sub">Asignar repartidor</p>
          </div>
        </div>
      </RouterLink>

      <RouterLink class="card dash-action-card" to="/cajero/catalogo">
        <div class="row" style="justify-content:space-between">
          <div class="ico dash-ico">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3zM8 4v13"></path>
            </svg>
          </div>
          <span class="tag ok">{{ totalProductosActivos }} platillos</span>
        </div>
        <div class="dash-card-Bottom">
          <div>
            <h3>Catálogo</h3>
            <p class="sub">Menú y precios</p>
          </div>
        </div>
      </RouterLink>

      <RouterLink class="card dash-action-card" to="/cajero/historial">
        <div class="row" style="justify-content:space-between">
          <div class="ico dash-ico">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="8"></circle>
              <path d="M12 8v4l3 2"></path>
            </svg>
          </div>
          <span class="tag off">{{ totalVentasHoy }} hoy</span>
        </div>
        <div class="dash-card-Bottom">
          <div>
            <h3>Historial</h3>
            <p class="sub">Ventas del turno</p>
          </div>
        </div>
      </RouterLink>
    </div>
  </div>

  <!-- Dashboard de Administrador -->
  <div v-if="isAdmin" class="dash-section">
    <div class="dash-admin-grid">
      <RouterLink class="card dash-action-card" to="/admin/productos">
        <div class="row" style="justify-content:space-between">
          <div class="ico dash-ico">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8"></path>
            </svg>
          </div>
          <span class="tag">{{ totalProductosActivos }} activos</span>
        </div>
        <div class="dash-card-Bottom">
          <div>
            <h3>Productos</h3>
            <p class="sub">Menú y precios</p>
          </div>
        </div>
      </RouterLink>

      <RouterLink class="card dash-action-card" to="/admin/paquetes">
        <div class="row" style="justify-content:space-between">
          <div class="ico dash-ico">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 4l9 5-9 5-9-5zM3 14l9 5 9-5"></path>
            </svg>
          </div>
          <span class="tag">Combos</span>
        </div>
        <div class="dash-card-Bottom">
          <div>
            <h3>Paquetes</h3>
            <p class="sub">Combos y reglas</p>
          </div>
        </div>
      </RouterLink>

      <RouterLink class="card dash-action-card" to="/admin/promociones">
        <div class="row" style="justify-content:space-between">
          <div class="ico dash-ico">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12l9-9h8v8l-9 9z"></path>
              <circle cx="15.5" cy="8.5" r="1.2"></circle>
            </svg>
          </div>
          <span class="tag ok">Automáticas</span>
        </div>
        <div class="dash-card-Bottom">
          <div>
            <h3>Promociones</h3>
            <p class="sub">Descuentos por día</p>
          </div>
        </div>
      </RouterLink>

      <RouterLink class="card dash-action-card" to="/admin/empleados">
        <div class="row" style="justify-content:space-between">
          <div class="ico dash-ico">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <span class="tag ok">{{ totalEmpleadosActivos }} activos</span>
        </div>
        <div class="dash-card-Bottom">
          <div>
            <h3>Empleados</h3>
            <p class="sub">Cajeros y repartidores</p>
          </div>
        </div>
      </RouterLink>

      <RouterLink class="card dash-action-card" to="/admin/reportes">
        <div class="row" style="justify-content:space-between">
          <div class="ico dash-ico">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 20V10M12 20V4M19 20v-7"></path>
            </svg>
          </div>
          <span class="tag">PDF · Excel</span>
        </div>
        <div class="dash-card-Bottom">
          <div>
            <h3>Reportes</h3>
            <p class="sub">Métricas y exportación</p>
          </div>
        </div>
      </RouterLink>

      <RouterLink class="card dash-action-card" to="/admin/historial">
        <div class="row" style="justify-content:space-between">
          <div class="ico dash-ico">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="8"></circle>
              <path d="M12 8v4l3 2"></path>
            </svg>
          </div>
          <span class="tag off">{{ totalVentasHoy }} hoy</span>
        </div>
        <div class="dash-card-Bottom">
          <div>
            <h3>Historial</h3>
            <p class="sub">Registro de ventas</p>
          </div>
        </div>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.dash-hero {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  padding: 26px 32px;
  background: linear-gradient(135deg, #CF520A 0%, #F26A1B 100%);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 26px rgba(201, 76, 8, 0.16);
}

.dash-hero-art {
  position: absolute;
  right: -55px;
  top: -75px;
  color: #ffffff;
  pointer-events: none;
  animation: slowSpin 38s linear infinite;
}

@keyframes slowSpin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.dash-hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}

.dash-date-badge {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 3px 11px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
  letter-spacing: 0.2px;
}

.dash-greeting {
  font-size: 27px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.3px;
}

.dash-clock-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.96);
  color: #1F1A17;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.dash-clock-sched {
  font-weight: 400;
  font-size: 12px;
  color: #6B625B;
  padding-left: 4px;
  border-left: 1px solid #ECE5DE;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2F7D4F;
  box-shadow: 0 0 0 0 rgba(47, 125, 79, 0.7);
  animation: pulseGreen 2s infinite;
}

@keyframes pulseGreen {
  0% {
    box-shadow: 0 0 0 0 rgba(47, 125, 79, 0.6);
  }
  70% {
    box-shadow: 0 0 0 7px rgba(47, 125, 79, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(47, 125, 79, 0);
  }
}

.dash-cajero-grid,
.dash-admin-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

@media (max-width: 1024px) {
  .dash-cajero-grid,
  .dash-admin-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .dash-cajero-grid,
  .dash-admin-grid {
    grid-template-columns: 1fr;
  }
}

.dash-cta-banner {
  grid-column: 1 / -1;
  background: var(--acs);
  border: 1.5px solid var(--ac);
  border-radius: 18px;
  padding: 24px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  text-decoration: none;
  color: var(--tx);
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.22s ease;
}

.dash-cta-banner:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 26px rgba(242, 106, 27, 0.14);
}

.dash-cta-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: var(--btn);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.dash-cta-btn {
  height: 46px;
  padding: 0 24px;
  font-size: 14.5px;
  border-radius: 12px;
  flex: none;
}

.dash-action-card {
  justify-content: space-between;
  padding: 24px;
  min-height: 158px;
  border-radius: 18px;
}

.dash-ico {
  width: 46px;
  height: 46px;
  border-radius: 13px;
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s ease, color 0.2s ease;
}

.dash-action-card:hover .dash-ico {
  transform: scale(1.07) rotate(-4deg);
  background: var(--btn);
  color: #fff;
}

.dash-card-Bottom {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
}

.dash-card-Bottom h3 {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.2px;
  margin-bottom: 2px;
}

.dash-card-Bottom .sub {
  font-size: 13px;
}

.dash-arrow {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bg2);
  color: var(--tx2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 600;
  flex: none;
  transition: transform 0.2s ease, background-color 0.2s ease, color 0.2s ease;
}

.dash-action-card:hover .dash-arrow {
  background: var(--acs);
  color: var(--act);
  transform: translateX(3px);
}
</style>
