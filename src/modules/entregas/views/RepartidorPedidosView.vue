<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import PedidoRepartidorCard from '@/modules/entregas/components/PedidoRepartidorCard.vue'
import { pedidosRepartidorState } from '@/services/entregas.service'
import { sincronizarConNube } from '@/services/cloudSync'

const router = useRouter()
const authStore = useAuthStore()
const actualizando = ref(false)
let timerRef = null

async function refrescarManual() {
  if (actualizando.value) return
  actualizando.value = true
  try {
    await sincronizarConNube(true)
  } finally {
    setTimeout(() => {
      actualizando.value = false
    }, 400)
  }
}

onMounted(() => {
  refrescarManual()
  timerRef = setInterval(() => {
    sincronizarConNube(true)
  }, 2500)
})

onUnmounted(() => {
  if (timerRef) clearInterval(timerRef)
})

const activeTab = ref('por_entregar')

const pedidosPorEntregar = computed(() =>
  pedidosRepartidorState.value.filter((p) => p.estado === 'Por entregar')
)

const pedidosEntregados = computed(() =>
  pedidosRepartidorState.value.filter((p) => p.estado !== 'Por entregar')
)

const listaMostrada = computed(() =>
  activeTab.value === 'por_entregar' ? pedidosPorEntregar.value : pedidosEntregados.value
)

const nombreRepartidor = computed(() => {
  return authStore.user?.fullName || authStore.userName || 'Carlos'
})

function handleLogout() {
  authStore.logout()
  router.push({ path: '/login', query: {} })
}
</script>

<template>
  <!-- Barra superior limpia con letras grandes -->
  <header class="rep-top-bar">
    <div class="row" style="gap:12px">
      <div class="rep-k-icon">K</div>
      <div>
        <div class="rep-role-txt">Repartidor</div>
        <div class="rep-name-txt">Hola, {{ nombreRepartidor }}</div>
      </div>
    </div>

    <div class="row" style="gap:8px">
      <button
        type="button"
        class="rep-refresh-btn"
        :class="{ 'is-spinning': actualizando }"
        :title="actualizando ? 'Actualizando pedidos...' : 'Actualizar pedidos'"
        @click="refrescarManual"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10"></polyline>
          <polyline points="1 20 1 14 7 14"></polyline>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
      </button>

      <button type="button" class="rep-salir-btn" @click="handleLogout">
        Salir
      </button>
    </div>
  </header>

  <main class="rep-page-body">
    <h1 class="rep-page-title">Mis pedidos</h1>

    <!-- Pestañas grandes y fáciles de tocar -->
    <div class="seg rep-tabs-lg">
      <span :class="{ on: activeTab === 'por_entregar' }" @click="activeTab = 'por_entregar'">
        Por entregar ({{ pedidosPorEntregar.length }})
      </span>
      <span :class="{ on: activeTab === 'entregados' }" @click="activeTab = 'entregados'">
        Entregados ({{ pedidosEntregados.length }})
      </span>
    </div>

    <template v-if="listaMostrada.length > 0">
      <div class="rep-list">
        <PedidoRepartidorCard
          v-for="pedido in listaMostrada"
          :key="pedido.folio"
          :pedido="pedido"
          :to="`/repartidor/entrega/${pedido.id}`"
        />
      </div>
    </template>

    <div v-else class="card rep-empty">
      <div class="rep-empty-title">
        {{ activeTab === 'por_entregar' ? 'No tienes pedidos pendientes' : 'Aún no hay pedidos entregados' }}
      </div>
      <p class="rep-empty-sub">
        {{
          activeTab === 'por_entregar'
            ? 'Cuando caja te asigne un pedido aparecerá aquí con letra grande.'
            : 'Aquí verás los pedidos que vayas entregando.'
        }}
      </p>
    </div>
  </main>
</template>

<style scoped>
.rep-top-bar {
  padding: 20px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: var(--bg2);
  border-bottom: 2px solid var(--bd);
}

.rep-k-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: #F26A1B;
  color: #FFFFFF;
  font-size: 22px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.rep-role-txt {
  font-size: 15px;
  font-weight: 600;
  color: var(--tx2);
}

.rep-name-txt {
  font-size: 21px;
  font-weight: 800;
  color: var(--tx);
}

.rep-refresh-btn {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  border: 2px solid var(--bd);
  background: var(--sf);
  color: var(--tx2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.rep-refresh-btn:active {
  transform: scale(0.95);
  background: var(--bg);
}

.rep-refresh-btn.is-spinning svg {
  animation: spin 0.7s linear infinite;
  color: #F26A1B;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.rep-salir-btn {
  height: 46px;
  padding: 0 18px;
  border-radius: 12px;
  border: 2px solid var(--bd);
  background: var(--sf);
  color: var(--act);
  font: inherit;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}

.rep-page-body {
  padding: 20px 16px 32px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  flex: 1;
}

.rep-page-title {
  font-size: 26px;
  font-weight: 800;
}

.rep-tabs-lg {
  height: 56px;
  border-radius: 14px;
  padding: 5px;
}

.rep-tabs-lg span {
  font-size: 17px;
  font-weight: 700;
  border-radius: 10px;
}

.rep-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rep-empty {
  align-items: center;
  justify-content: center;
  padding: 42px 22px;
  text-align: center;
  gap: 10px;
  border-radius: 20px;
}

.rep-empty-title {
  font-size: 20px;
  font-weight: 800;
  color: var(--tx);
}

.rep-empty-sub {
  font-size: 16px;
  color: var(--tx2);
  line-height: 1.45;
  max-width: 300px;
}
</style>
