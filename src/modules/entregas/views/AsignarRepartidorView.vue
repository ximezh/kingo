<script setup>
import { ref, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import StatusTag from '@/components/ui/StatusTag.vue'
import { PEDIDOS_POR_ASIGNAR_MOCK, pedidosRepartidorState } from '@/services/entregas.service'
import { empleadosState } from '@/services/empleados.service'
import { HISTORIAL_VENTAS_MOCK } from '@/services/ventas.service'

const router = useRouter()
const pedidos = ref(PEDIDOS_POR_ASIGNAR_MOCK)

const repartidores = computed(() => {
  return empleadosState.value
    .filter((e) => e.rol === 'repartidor' && e.activo)
    .map((e) => ({
      iniciales: e.iniciales,
      nombre: e.nombre,
      subtitulo: e.pedidosEnRuta ? `${e.pedidosEnRuta} pedido en ruta` : 'Sin pedidos en ruta',
      estado: e.estadoRuta || 'Disponible',
      tagVariant: (e.estadoRuta || 'Disponible') === 'Disponible' ? 'ok' : 'off'
    }))
})

const selectedFolio = ref(pedidos.value[0]?.folio || '')
const selectedRepartidor = ref('Carlos R.')

function asignarPedido() {
  const folioActual = selectedFolio.value || pedidos.value[0]?.folio
  if (!folioActual) return

  const venta = HISTORIAL_VENTAS_MOCK.find((v) => v.folio === folioActual)
  if (venta) {
    venta.estado = 'Por entregar'
    venta.estadoVariant = ''
  }

  const idx = pedidos.value.findIndex((p) => p.folio === folioActual)
  if (idx > -1) {
    const ped = pedidos.value[idx]
    pedidosRepartidorState.value.unshift({
      id: String(ped.folio).replace('#', ''),
      folio: ped.folio,
      cliente: ped.cliente,
      telefono: ped.telefono || '2290000000',
      direccion: ped.direccion || ped.telefonoDireccion,
      referencia: ped.referencia || '',
      metodoPago: ped.metodoPago || 'Total · Efectivo',
      total: ped.total,
      estado: 'Por entregar',
      horaEntrega: null,
      lineas: ped.lineas || [],
      envio: ped.envio || '$35'
    })
    pedidos.value.splice(idx, 1)
  }

  fetch('http://localhost:3000/api/entregas/asignar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folio: folioActual, repartidorId: 3 })
  }).catch(() => {})

  router.push('/cajero/historial')
}
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:4px">
    <h1 style="font-size:22px;font-weight:600">Pedidos a domicilio</h1>
    <p class="sub">Elige un pedido pendiente y asígnale un repartidor activo.</p>
  </div>

  <div class="asignar-layout">
    <section class="card asignar-card" style="flex:1;min-width:0">
      <div class="row" style="justify-content:space-between">
        <h2 style="font-size:16px;font-weight:600">Por asignar</h2>
        <StatusTag>{{ pedidos.length }} pendientes</StatusTag>
      </div>

      <template v-if="pedidos.length > 0">
        <div
          v-for="pedido in pedidos"
          :key="pedido.folio"
          :class="['ord', { on: selectedFolio === pedido.folio }]"
          @click="selectedFolio = pedido.folio"
        >
          <div class="row" style="justify-content:space-between">
            <span style="font-weight:600">{{ pedido.folio }} · {{ pedido.cliente }}</span>
            <span style="font-weight:600">{{ pedido.total }}</span>
          </div>
          <span class="sub">{{ pedido.telefonoDireccion }}</span>
          <span v-if="pedido.referencia" class="sub">{{ pedido.referencia }}</span>
        </div>
      </template>

      <div v-else class="sub" style="padding:32px;text-align:center">
        Todos los pedidos a domicilio han sido asignados.
      </div>
    </section>

    <aside class="card asignar-card asignar-aside">
      <h2 style="font-size:16px;font-weight:600">Asignar a {{ selectedFolio }}</h2>

      <div
        v-for="rep in repartidores"
        :key="rep.nombre"
        :class="['rep', { on: selectedRepartidor === rep.nombre }]"
        @click="selectedRepartidor = rep.nombre"
      >
        <span class="av">{{ rep.iniciales }}</span>
        <div style="flex:1">
          <div style="font-weight:600">{{ rep.nombre }}</div>
          <div class="sub">{{ rep.subtitulo }}</div>
        </div>
        <StatusTag :variant="rep.tagVariant">{{ rep.estado }}</StatusTag>
      </div>

      <div style="padding-top:6px;display:flex;flex-direction:column;gap:10px">
        <a
          v-if="pedidos.length > 0"
          class="btn p"
          href="/cajero/historial"
          @click.prevent="asignarPedido"
        >
          Asignar a {{ selectedRepartidor }}
        </a>
        <RouterLink class="btn s" to="/cajero/inicio">Cancelar</RouterLink>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.asignar-layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.asignar-card {
  padding: 18px;
}

.asignar-aside {
  width: 400px;
  flex: none;
  gap: 12px;
}

@media (max-width: 900px) {
  .asignar-layout {
    flex-direction: column;
  }
  .asignar-aside {
    width: 100%;
  }
}

.ord {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border: 1px solid var(--bd);
  border-radius: 12px;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.16s ease, background-color 0.16s ease;
  user-select: none;
}

.ord:hover {
  border-color: var(--ac);
  transform: translateY(-1px);
}

.ord:active {
  transform: scale(0.985);
}

.ord.on {
  border-color: var(--btn);
  background: var(--acs);
}

.rep {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid var(--bd);
  border-radius: 12px;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.16s ease, background-color 0.16s ease;
  user-select: none;
}

.rep:hover {
  border-color: var(--ac);
  transform: translateY(-1px);
}

.rep:active {
  transform: scale(0.985);
}

.rep.on {
  border-color: var(--btn);
  background: var(--acs);
}

.av {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--acs);
  color: var(--act);
  font-weight: 600;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.rep.on .av {
  background: var(--sf);
}
</style>
