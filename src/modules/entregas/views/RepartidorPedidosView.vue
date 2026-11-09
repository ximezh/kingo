<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import PedidoRepartidorCard from '@/modules/entregas/components/PedidoRepartidorCard.vue'
import { pedidosRepartidorState } from '@/services/entregas.service'

const router = useRouter()
const authStore = useAuthStore()

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
  <div style="padding:28px 20px 16px;display:flex;align-items:center;justify-content:space-between;background:var(--bg2);border-bottom:1px solid var(--bd)">
    <div class="row">
      <div style="width:36px;height:36px;border-radius:10px;background:#F26A1B;color:#fff;font-weight:600;display:flex;align-items:center;justify-content:center">K</div>
      <div>
        <div style="font-size:12px;color:var(--tx2)">Repartidor</div>
        <div style="font-size:16px;font-weight:600">Hola, {{ nombreRepartidor }}</div>
      </div>
    </div>
    <a
      href="/login"
      class="back"
      style="font-size:13px;font-weight:500;color:var(--act);text-decoration:none"
      @click.prevent="handleLogout"
    >Salir</a>
  </div>

  <div style="padding:20px;display:flex;flex-direction:column;gap:16px;flex:1">
    <h1 style="font-size:22px;font-weight:600">Mis pedidos</h1>
    <div class="seg rep-seg">
      <span :class="{ on: activeTab === 'por_entregar' }" @click="activeTab = 'por_entregar'">
        Por entregar · {{ pedidosPorEntregar.length }}
      </span>
      <span :class="{ on: activeTab === 'entregados' }" @click="activeTab = 'entregados'">
        Entregados · {{ pedidosEntregados.length }}
      </span>
    </div>

    <template v-if="listaMostrada.length > 0">
      <PedidoRepartidorCard
        v-for="pedido in listaMostrada"
        :key="pedido.folio"
        :pedido="pedido"
        :to="`/repartidor/entrega/${pedido.id}`"
      />
    </template>

    <div
      v-else
      class="card"
      style="align-items:center;justify-content:center;padding:36px 20px;text-align:center;gap:8px;border-radius:16px"
    >
      <div style="font-size:15px;font-weight:600">
        {{ activeTab === 'por_entregar' ? 'Sin entregas pendientes' : 'Sin entregas finalizadas' }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.rep-seg {
  border-radius: 12px;
  height: 46px;
}

.rep-seg span {
  font-size: 14px;
}
</style>
