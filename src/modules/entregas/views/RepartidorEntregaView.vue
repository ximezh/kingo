<script setup>
import { ref, computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { pedidosRepartidorState, guardarEntregasStorage } from '@/services/entregas.service'
import { HISTORIAL_VENTAS_MOCK, guardarVentasStorage } from '@/services/ventas.service'
import { actualizarEstadoRutaRepartidor } from '@/services/empleados.service'

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

const OPCION_SIN_MOTIVO = 'Selecciona un motivo'

const motivosNoEntrega = [
  OPCION_SIN_MOTIVO,
  'El cliente no quiso pagar / Sin efectivo',
  'El cliente no estaba en el domicilio',
  'Dirección incorrecta o incompleta',
  'El cliente no respondió llamadas',
  'Pedido rechazado al recibir'
]

const motivoSeleccionado = ref(OPCION_SIN_MOTIVO)
const errorMotivo = ref('')

// Si selecciona un motivo de no entrega, se deshabilita el botón "Entregado"
const tieneMotivoNoEntrega = computed(() => motivoSeleccionado.value !== OPCION_SIN_MOTIVO)

function limpiarMotivo() {
  motivoSeleccionado.value = OPCION_SIN_MOTIVO
  errorMotivo.value = ''
}

function marcarEntregado() {
  if (!detalle.value || tieneMotivoNoEntrega.value) return

  const horaStr = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
  detalle.value.estado = 'Entregado'
  detalle.value.horaEntrega = `Entregado a las ${horaStr} hrs`

  const venta = HISTORIAL_VENTAS_MOCK.find((v) => v.folio === detalle.value.folio)
  if (venta) {
    venta.estado = 'Entregado'
    venta.estadoVariant = 'ok'
  }

  actualizarEstadoRutaRepartidor(detalle.value.repartidor || 'Carlos R.', false)
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
  if (!tieneMotivoNoEntrega.value) {
    errorMotivo.value = 'Primero elige arriba el motivo de no entrega.'
    return
  }
  detalle.value.estado = 'No entregado'
  detalle.value.horaEntrega = `No entregado: ${motivoSeleccionado.value}`

  const venta = HISTORIAL_VENTAS_MOCK.find((v) => v.folio === detalle.value.folio)
  if (venta) {
    venta.estado = 'No entregado'
    venta.estadoVariant = 'off'
  }

  actualizarEstadoRutaRepartidor(detalle.value.repartidor || 'Carlos R.', false)
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
  <template v-if="detalle">
    <!-- Cabecera grande y limpia -->
    <header class="ent-header">
      <RouterLink to="/repartidor/pedidos" class="ent-back-btn">
        Volver a mis pedidos
      </RouterLink>
      <div class="row" style="justify-content:space-between;align-items:center">
        <h1 class="ent-title">Pedido {{ detalle.folio }}</h1>
        <span :class="['ent-badge', detalle.estado === 'Entregado' ? 'ok' : detalle.estado === 'No entregado' ? 'err' : 'pend']">
          {{ detalle.estado }}
        </span>
      </div>
    </header>

    <main class="ent-body">
      <!-- 1. Cliente, dirección y botón grande para llamar -->
      <section class="card ent-card">
        <div class="ent-cliente">{{ detalle.cliente }}</div>
        <div class="ent-direccion">{{ detalle.direccion }}</div>
        <div v-if="detalle.referencia" class="ent-ref">{{ detalle.referencia }}</div>

        <a
          :href="`tel:${String(detalle.telefono || '').replace(/\s+/g, '')}`"
          class="btn s ent-call-btn"
        >
          Llamar al {{ detalle.telefono }}
        </a>
      </section>

      <!-- 2. Total a cobrar y platillos en letra grande -->
      <section class="card ent-card">
        <div class="ent-cobro-destacado">
          <span>{{ detalle.metodoPago }}</span>
          <strong>{{ detalle.total }}</strong>
        </div>

        <div class="ent-lineas">
          <div
            v-for="(ln, idx) in detalle.lineas"
            :key="idx"
            class="ent-ln"
          >
            <span>{{ ln.label }}</span>
            <strong>{{ ln.importe }}</strong>
          </div>
          <div class="ent-ln" style="color:var(--tx2)">
            <span>Envío</span>
            <strong>{{ detalle.envio }}</strong>
          </div>
        </div>
      </section>

      <!-- 3. Acciones claras y botones grandes -->
      <template v-if="detalle.estado === 'Por entregar'">
        <!-- Botón principal grande para confirmar entrega -->
        <button
          type="button"
          class="btn p ent-main-btn"
          :disabled="tieneMotivoNoEntrega"
          @click="marcarEntregado"
        >
          Marcar como entregado
        </button>

        <!-- Bloque separado y claro por si NO se pudo entregar -->
        <section class="card ent-card ent-no-card">
          <div class="row" style="justify-content:space-between">
            <label class="ent-lbl" for="mot">¿No se pudo entregar?</label>
            <a
              v-if="tieneMotivoNoEntrega"
              href="#"
              class="ent-clear-link"
              @click.prevent="limpiarMotivo"
            >
              Quitar motivo
            </a>
          </div>

          <select
            id="mot"
            v-model="motivoSeleccionado"
            class="inp ent-select"
            @change="errorMotivo = ''"
          >
            <option v-for="motivo in motivosNoEntrega" :key="motivo" :value="motivo">
              {{ motivo }}
            </option>
          </select>

          <div v-if="errorMotivo" class="ent-error">
            {{ errorMotivo }}
          </div>

          <button
            type="button"
            :class="['btn', tieneMotivoNoEntrega ? 'd' : 's', 'ent-sec-btn']"
            @click="marcarNoEntregado"
          >
            Reportar como no entregado
          </button>
        </section>
      </template>

      <template v-else>
        <div class="ent-resultado-nota" :class="{ err: detalle.estado === 'No entregado' }">
          {{ detalle.horaEntrega }}
        </div>
        <RouterLink class="btn s ent-main-btn" to="/repartidor/pedidos">
          Volver a mis pedidos
        </RouterLink>
      </template>
    </main>
  </template>
</template>

<style scoped>
.ent-header {
  padding: 20px 18px;
  background: var(--bg2);
  border-bottom: 2px solid var(--bd);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ent-back-btn {
  align-self: flex-start;
  padding: 8px 16px;
  border-radius: 12px;
  background: var(--sf);
  border: 2px solid var(--bd);
  color: var(--act);
  font-size: 16px;
  font-weight: 700;
  text-decoration: none;
}

.ent-title {
  font-size: 26px;
  font-weight: 800;
}

.ent-badge {
  padding: 6px 14px;
  border-radius: 99px;
  font-size: 15px;
  font-weight: 700;
}

.ent-badge.pend {
  background: #FFF0E0;
  color: #C94C08;
}

.ent-badge.ok {
  background: var(--oks);
  color: var(--ok);
}

.ent-badge.err {
  background: var(--bg2);
  color: var(--tx2);
}

.ent-body {
  padding: 20px 16px 32px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  flex: 1;
}

.ent-card {
  border-radius: 20px;
  padding: 20px;
  gap: 12px;
  border: 2px solid var(--bd);
}

.ent-cliente {
  font-size: 23px;
  font-weight: 800;
  color: var(--tx);
}

.ent-direccion {
  font-size: 19px;
  font-weight: 600;
  color: var(--tx);
  line-height: 1.4;
}

.ent-ref {
  font-size: 16.5px;
  color: var(--tx2);
  line-height: 1.35;
}

.ent-call-btn {
  width: 100%;
  height: 54px;
  border-radius: 14px;
  font-size: 17px;
  font-weight: 700;
  margin-top: 4px;
}

.ent-cobro-destacado {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--acs);
  padding: 14px 16px;
  border-radius: 14px;
}

.ent-cobro-destacado span {
  font-size: 18px;
  font-weight: 700;
  color: var(--act);
}

.ent-cobro-destacado strong {
  font-size: 28px;
  font-weight: 800;
  color: var(--act);
}

.ent-lineas {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 4px;
}

.ent-ln {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 17px;
  line-height: 1.35;
}

.ent-main-btn {
  width: 100%;
  height: 62px;
  border-radius: 16px;
  font-size: 19px;
  font-weight: 800;
  cursor: pointer;
}

.ent-main-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.ent-no-card {
  background: var(--bg2);
}

.ent-lbl {
  font-size: 17px;
  font-weight: 700;
  color: var(--tx);
}

.ent-clear-link {
  font-size: 16px;
  font-weight: 700;
  color: var(--act);
  text-decoration: none;
}

.ent-select {
  height: 54px;
  border-radius: 14px;
  font-size: 16.5px;
  font-weight: 600;
}

.ent-sec-btn {
  width: 100%;
  height: 56px;
  border-radius: 14px;
  font-size: 17.5px;
  font-weight: 700;
  cursor: pointer;
}

.ent-error {
  font-size: 16px;
  font-weight: 700;
  color: #C94C08;
}

.ent-resultado-nota {
  font-size: 18px;
  font-weight: 700;
  padding: 16px;
  border-radius: 14px;
  background: var(--oks);
  color: var(--ok);
  text-align: center;
}

.ent-resultado-nota.err {
  background: #FFF3E8;
  color: #9A3412;
}
</style>
