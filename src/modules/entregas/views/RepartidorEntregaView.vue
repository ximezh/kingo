<script setup>
import { ref, computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import StatusTag from '@/components/ui/StatusTag.vue'
import { pedidosRepartidorState, guardarEntregasStorage } from '@/services/entregas.service'
import { HISTORIAL_VENTAS_MOCK, guardarVentasStorage } from '@/services/ventas.service'

const route = useRoute()
const router = useRouter()

const detalle = computed(() => {
  const paramId = route.params.id
  if (paramId) {
    const found = pedidosRepartidorState.value.find((p) => p.id === paramId || p.folio === `#${paramId}`)
    if (found) return found
  }
  return pedidosRepartidorState.value[0]
})

const motivosNoEntrega = [
  'Selecciona un motivo',
  'El cliente no estaba en el domicilio',
  'Dirección incorrecta o incompleta',
  'El cliente no respondió llamadas',
  'Pedido rechazado al recibir'
]
const motivoSeleccionado = ref('Selecciona un motivo')
const errorMotivo = ref('')

function marcarEntregado() {
  if (!detalle.value) return
  const horaStr = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
  detalle.value.estado = 'Entregado'
  detalle.value.horaEntrega = `Entregado a las ${horaStr} hrs`

  const venta = HISTORIAL_VENTAS_MOCK.find((v) => v.folio === detalle.value.folio)
  if (venta) {
    venta.estado = 'Entregado'
    venta.estadoVariant = 'ok'
  }

  guardarEntregasStorage()
  guardarVentasStorage()

  fetch(`http://localhost:3000/api/entregas/${String(detalle.value.folio).replace('#', '')}/estado`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado: 'entregado' })
  }).catch(() => {})

  router.push('/repartidor/pedidos')
}

function marcarNoEntregado() {
  if (!detalle.value) return
  if (motivoSeleccionado.value === 'Selecciona un motivo') {
    errorMotivo.value = 'Por favor selecciona el motivo por el cual no se pudo entregar.'
    return
  }
  detalle.value.estado = 'No entregado'
  detalle.value.horaEntrega = `No entregado: ${motivoSeleccionado.value}`

  const venta = HISTORIAL_VENTAS_MOCK.find((v) => v.folio === detalle.value.folio)
  if (venta) {
    venta.estado = 'No entregado'
    venta.estadoVariant = 'off'
  }

  guardarEntregasStorage()
  guardarVentasStorage()

  fetch(`http://localhost:3000/api/entregas/${String(detalle.value.folio).replace('#', '')}/estado`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado: 'no_entregado', motivoNoEntrega: motivoSeleccionado.value })
  }).catch(() => {})

  router.push('/repartidor/pedidos')
}
</script>

<template>
  <div style="padding:28px 20px 16px;background:var(--bg2);border-bottom:1px solid var(--bd);display:flex;flex-direction:column;gap:6px">
    <RouterLink
      to="/repartidor/pedidos"
      class="back"
      style="font-size:13px;font-weight:500;color:var(--act);text-decoration:none;align-self:flex-start"
    >Mis pedidos</RouterLink>
    <div class="row" style="justify-content:space-between">
      <h1 style="font-size:20px;font-weight:600">Pedido {{ detalle.folio }}</h1>
      <StatusTag :variant="detalle.estado === 'Entregado' ? 'ok' : detalle.estado === 'No entregado' ? 'off' : ''">
        {{ detalle.estado }}
      </StatusTag>
    </div>
  </div>

  <div style="padding:18px 20px;display:flex;flex-direction:column;gap:14px;flex:1">
    <section class="card entrega-card">
      <div class="row" style="justify-content:space-between">
        <span style="font-size:15px;font-weight:600">{{ detalle.cliente }}</span>
        <a
          :href="`tel:${detalle.telefono.replace(/\s+/g, '')}`"
          class="edit row"
          style="gap:4px;font-size:13px;font-weight:500;color:var(--act);text-decoration:none"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
          Llamar
        </a>
      </div>
      <div class="sub">{{ detalle.telefono }}</div>
      <div style="font-size:14px;line-height:1.5">{{ detalle.direccion }}</div>
      <div class="sub">{{ detalle.referencia }}</div>
    </section>

    <section class="card entrega-card">
      <div
        v-for="(ln, idx) in detalle.lineas"
        :key="idx"
        class="ln"
        :style="ln.promo ? 'color:var(--act);font-weight:500' : ''"
      >
        <span>{{ ln.label }}</span>
        <span :style="ln.promo ? '' : 'font-weight:500'">{{ ln.importe }}</span>
      </div>
      <div class="ln">
        <span class="sub">Envío</span>
        <span style="font-weight:500">{{ detalle.envio }}</span>
      </div>
      <div style="height:1px;background:var(--bd);margin:4px 0"></div>
      <div class="ln" style="font-size:16px;font-weight:600">
        <span>{{ detalle.metodoPago }}</span>
        <span>{{ detalle.total }}</span>
      </div>
    </section>

    <div v-if="detalle.estado === 'Por entregar'">
      <label class="lbl" for="mot">Motivo de no entrega (opcional)</label>
      <select
        id="mot"
        v-model="motivoSeleccionado"
        class="inp entrega-inp"
        @change="errorMotivo = ''"
      >
        <option v-for="motivo in motivosNoEntrega" :key="motivo">{{ motivo }}</option>
      </select>
      <span v-if="errorMotivo" style="display:block;margin-top:6px;font-size:12px;color:#C94C08;font-weight:500">
        {{ errorMotivo }}
      </span>
    </div>

    <div
      v-else
      class="note"
      :style="detalle.estado === 'Entregado' ? 'background:var(--oks);color:var(--ok)' : ''"
    >
      {{ detalle.horaEntrega }}
    </div>

    <div style="flex:1"></div>

    <div v-if="detalle.estado === 'Por entregar'" style="display:flex;flex-direction:column;gap:10px;padding-bottom:6px">
      <a class="btn p entrega-btn" href="/repartidor/pedidos" @click.prevent="marcarEntregado">
        Marcar como entregado
      </a>
      <a class="btn s entrega-btn" href="/repartidor/pedidos" @click.prevent="marcarNoEntregado">
        No se pudo entregar
      </a>
    </div>

    <div v-else style="display:flex;flex-direction:column;gap:10px;padding-bottom:6px">
      <RouterLink class="btn s entrega-btn" to="/repartidor/pedidos">
        Volver a la lista de pedidos
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.entrega-card {
  border-radius: 16px;
  padding: 16px 18px;
  gap: 8px;
}

.entrega-inp {
  height: 46px;
  border-radius: 12px;
}

.entrega-btn {
  height: 50px;
  border-radius: 12px;
  font: 500 15px 'Poppins', sans-serif;
}

.ln {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 14px;
}
</style>
