<script setup>
import { ref, computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StatusTag from '@/components/ui/StatusTag.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import {
  PEDIDOS_POR_ASIGNAR_MOCK,
  pedidosRepartidorState,
  guardarEntregasStorage,
  depurarEstadoEntregas
} from '@/services/entregas.service'
import { empleadosState, actualizarEstadoRutaRepartidor, guardarEmpleadosStorage } from '@/services/empleados.service'
import { HISTORIAL_VENTAS_MOCK, guardarVentasStorage } from '@/services/ventas.service'
import { sincronizarConNube } from '@/services/cloudSync'

const route = useRoute()
const router = useRouter()

depurarEstadoEntregas()
sincronizarConNube(true)

// Sincronizar cualquier venta "Por asignar" del historial que aún no esté en la cola
for (const v of HISTORIAL_VENTAS_MOCK) {
  if (v.estado === 'Por asignar' && !PEDIDOS_POR_ASIGNAR_MOCK.some((p) => p.folio === v.folio)) {
    PEDIDOS_POR_ASIGNAR_MOCK.push({
      folio: v.folio,
      cliente: v.clienteMesa,
      telefono: v.telefono || '2290000000',
      direccion: v.direccion || 'Domicilio registrado en caja',
      total: v.total,
      metodoPago: `Total · ${v.pago || 'Efectivo'}`,
      envio: v.envio ? `$${v.envio}` : '$35',
      lineas: (v.itemsSnapshot || []).map((it) => ({
        label: `${it.cantidad} × ${it.nombre}${it.detalle ? ` (${it.detalle})` : ''}`,
        importe: `$${it.subtotal}`,
        promo: Boolean(it.promocion)
      })),
      telefonoDireccion: `${v.telefono || '2290000000'} · ${v.direccion || 'Domicilio registrado'}`,
      referencia: v.referencia || ''
    })
  }
}

const pedidos = ref(PEDIDOS_POR_ASIGNAR_MOCK)
const pedidosEnRutaActivos = computed(() =>
  pedidosRepartidorState.value.filter((p) => p.estado === 'Por entregar')
)

// Modal de información detallada del pedido al hacer clic en su card
const showDetallePedidoModal = ref(false)
const pedidoDetalleActivo = ref(null)
const avisoRepartidorOcupado = ref('')
const mensajeAsignado = ref('')

const repartidores = computed(() => {
  return empleadosState.value
    .filter((e) => e.rol === 'repartidor' && e.activo)
    .map((e) => {
      const pedidosAsignadosRuta = pedidosRepartidorState.value.filter(
        (p) =>
          p.estado === 'Por entregar' &&
          (!p.repartidor || p.repartidor.toLowerCase() === e.nombre.toLowerCase())
      )
      const numEnRuta = pedidosAsignadosRuta.length
      const disponible = numEnRuta === 0
      const nuevoEstadoRuta = disponible ? 'Disponible' : 'En ruta'
      if (e.estadoRuta !== nuevoEstadoRuta || e.pedidosEnRuta !== numEnRuta) {
        e.estadoRuta = nuevoEstadoRuta
        e.pedidosEnRuta = numEnRuta
        guardarEmpleadosStorage()
      }
      return {
        id: e.id,
        iniciales: e.iniciales,
        nombre: e.nombre,
        telefono: e.telefono,
        pedidosEnRuta: numEnRuta,
        folioEnRuta: pedidosAsignadosRuta[0]?.folio || null,
        disponible,
        subtitulo: disponible
          ? 'Disponible'
          : `En ruta (${pedidosAsignadosRuta[0]?.folio || '1 pedido'})`,
        estado: disponible ? 'Disponible' : 'En ruta',
        tagVariant: disponible ? 'ok' : 'off'
      }
    })
})

const selectedFolio = ref(route.query.folio || pedidos.value[0]?.folio || '')
const selectedRepartidor = ref('')

watchEffect(() => {
  if (route.query.folio && pedidos.value.some((p) => p.folio === route.query.folio)) {
    selectedFolio.value = String(route.query.folio)
  } else if (!selectedFolio.value || !pedidos.value.some((p) => p.folio === selectedFolio.value)) {
    selectedFolio.value = pedidos.value[0]?.folio || ''
  }

  const repDisponible = repartidores.value.find((r) => r.disponible)
  const actualObj = repartidores.value.find((r) => r.nombre === selectedRepartidor.value)
  if ((!selectedRepartidor.value || !actualObj?.disponible) && repDisponible) {
    selectedRepartidor.value = repDisponible.nombre
  }
})

const repartidorSeleccionadoObj = computed(() =>
  repartidores.value.find((r) => r.nombre === selectedRepartidor.value) || null
)

const puedeAsignar = computed(() => {
  return (
    pedidos.value.length > 0 &&
    Boolean(selectedFolio.value) &&
    Boolean(repartidorSeleccionadoObj.value?.disponible)
  )
})

const rutaHistorial = computed(() =>
  route.path.startsWith('/admin') ? '/admin/historial' : '/cajero/historial'
)

function seleccionarYVerPedido(pedido) {
  selectedFolio.value = pedido.folio
  avisoRepartidorOcupado.value = ''
  // Enriquecer con itemsSnapshot del historial si lineas está vacío
  let lineas = Array.isArray(pedido.lineas) ? pedido.lineas : []
  if (lineas.length === 0) {
    const v = HISTORIAL_VENTAS_MOCK.find((x) => x.folio === pedido.folio)
    if (v && Array.isArray(v.itemsSnapshot)) {
      lineas = v.itemsSnapshot.map((it) => ({
        label: `${it.cantidad} × ${it.nombre}${it.detalle ? ` (${it.detalle})` : ''}`,
        importe: `$${it.subtotal}`,
        promo: Boolean(it.promocion)
      }))
    }
  }
  pedidoDetalleActivo.value = {
    ...pedido,
    lineas
  }
  showDetallePedidoModal.value = true
}

function intentarSeleccionarRepartidor(rep) {
  if (!rep.disponible) {
    avisoRepartidorOcupado.value = `${rep.nombre} está en ruta. Disponible al finalizar su entrega.`
    return
  }
  avisoRepartidorOcupado.value = ''
  selectedRepartidor.value = rep.nombre
}

function asignarPedido() {
  avisoRepartidorOcupado.value = ''
  const folioActual = selectedFolio.value || pedidos.value[0]?.folio
  if (!folioActual) return

  const repObj = repartidorSeleccionadoObj.value
  if (!repObj || !repObj.disponible) {
    avisoRepartidorOcupado.value = 'Repartidor en ruta. Disponible al finalizar su entrega.'
    return
  }

  const tsAhora = Date.now()
  const venta = HISTORIAL_VENTAS_MOCK.find((v) => v.folio === folioActual)
  if (venta) {
    venta.estado = 'Por entregar'
    venta.estadoVariant = ''
    venta.repartidorAsignado = repObj.nombre
    venta._updatedAt = tsAhora
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
      repartidor: repObj.nombre,
      horaEntrega: null,
      lineas: ped.lineas || [],
      envio: ped.envio || '$35',
      _updatedAt: tsAhora
    })
    pedidos.value.splice(idx, 1)
  }

  // Marcar al repartidor como "En ruta" hasta que concluya la entrega
  actualizarEstadoRutaRepartidor(repObj.nombre, true)

  guardarEntregasStorage()
  guardarVentasStorage()
  sincronizarConNube(true)

  fetch('http://localhost:3000/api/entregas/asignar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folio: folioActual, repartidorId: repObj.id || 3 })
  }).catch(() => {})

  mensajeAsignado.value = `Pedido ${folioActual} asignado a ${repObj.nombre}. Estado actualizado a "En ruta".`
  setTimeout(() => {
    mensajeAsignado.value = ''
  }, 4000)

  if (pedidos.value.length === 0) {
    router.push(rutaHistorial.value)
  } else {
    selectedFolio.value = pedidos.value[0]?.folio || ''
  }
}
</script>

<template>
  <div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:12px">
    <div style="display:flex;flex-direction:column;gap:2px">
      <h1 style="font-size:22px;font-weight:600">Pedidos a domicilio</h1>
      <p class="sub" style="font-size:13px">
        Haz clic en cualquier tarjeta de pedido para ver su desglose completo antes de asignarlo.
      </p>
    </div>
    <StatusTag>{{ pedidos.length }} por asignar · {{ pedidosEnRutaActivos.length }} en ruta</StatusTag>
  </div>

  <div v-if="mensajeAsignado" class="note" style="background:var(--oks);color:var(--ok)">
    ✓ {{ mensajeAsignado }}
  </div>

  <div class="asignar-layout">
    <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:16px">
      <!-- Cola de pedidos por asignar -->
      <section class="card asignar-card">
        <div class="row" style="justify-content:space-between">
          <h2 style="font-size:16px;font-weight:600">Pedidos pendientes de repartidor</h2>
          <StatusTag>{{ pedidos.length }} pendientes</StatusTag>
        </div>

        <template v-if="pedidos.length > 0">
          <div
            v-for="pedido in pedidos"
            :key="pedido.folio"
            :class="['ord', { on: selectedFolio === pedido.folio }]"
            @click="seleccionarYVerPedido(pedido)"
          >
            <div class="row" style="justify-content:space-between">
              <div class="row" style="gap:8px">
                <span style="font-weight:700;font-size:15px">{{ pedido.folio }} · {{ pedido.cliente }}</span>
                <button
                  type="button"
                  class="ord-info-btn"
                  title="Ver información del pedido"
                  aria-label="Ver información del pedido"
                  @click.stop="seleccionarYVerPedido(pedido)"
                >
                  i
                </button>
              </div>
              <span style="font-weight:700;font-size:16px;color:var(--act)">{{ pedido.total }}</span>
            </div>
            <span class="sub">{{ pedido.telefonoDireccion }}</span>
            <div class="row" style="justify-content:space-between;margin-top:2px">
              <span v-if="pedido.referencia" class="sub" style="font-size:12px">{{ pedido.referencia }}</span>
              <span class="sub" style="font-size:12px;font-weight:600">{{ pedido.metodoPago }}</span>
            </div>
          </div>
        </template>

        <div v-else class="sub" style="padding:28px;text-align:center;border:1px dashed var(--bd);border-radius:12px">
          Todos los pedidos a domicilio pendientes han sido asignados.
        </div>
      </section>

      <!-- Pedidos actualmente en ruta -->
      <section v-if="pedidosEnRutaActivos.length > 0" class="card asignar-card">
        <div class="row" style="justify-content:space-between">
          <h2 style="font-size:15px;font-weight:600">Pedidos actualmente en ruta</h2>
          <StatusTag variant="off">{{ pedidosEnRutaActivos.length }} en camino</StatusTag>
        </div>
        <div
          v-for="pedRuta in pedidosEnRutaActivos"
          :key="pedRuta.folio"
          class="ord"
          @click="seleccionarYVerPedido(pedRuta)"
        >
          <div class="row" style="justify-content:space-between">
            <div class="row" style="gap:8px">
              <span style="font-weight:600">{{ pedRuta.folio }} · {{ pedRuta.cliente }}</span>
              <StatusTag variant="off">Repartidor: {{ pedRuta.repartidor || 'Carlos R.' }}</StatusTag>
            </div>
            <span style="font-weight:700">{{ pedRuta.total }}</span>
          </div>
          <span class="sub">{{ pedRuta.direccion }}</span>
        </div>
      </section>
    </div>

    <!-- Panel lateral de repartidores -->
    <aside class="card asignar-card asignar-aside">
      <div class="row" style="justify-content:space-between">
        <h2 style="font-size:16px;font-weight:600">
          {{ selectedFolio ? `Asignar pedido ${selectedFolio}` : 'Repartidores' }}
        </h2>
        <span class="sub" style="font-size:12px">
          {{ repartidores.filter((r) => r.disponible).length }} disponibles
        </span>
      </div>

      <div
        v-for="rep in repartidores"
        :key="rep.nombre"
        :class="['rep', { on: selectedRepartidor === rep.nombre && rep.disponible, 'rep-busy': !rep.disponible }]"
        @click="intentarSeleccionarRepartidor(rep)"
      >
        <span class="av">{{ rep.iniciales }}</span>
        <div style="flex:1;min-width:0">
          <div style="font-weight:600">{{ rep.nombre }}</div>
          <div class="sub" style="font-size:12px">{{ rep.subtitulo }}</div>
        </div>
        <StatusTag :variant="rep.tagVariant">{{ rep.estado }}</StatusTag>
      </div>

      <div
        v-if="avisoRepartidorOcupado"
        class="note"
        style="font-size:12.5px;padding:10px 12px;background:#FFF4EC;color:#B93800;border:1px solid #F5C299"
      >
        {{ avisoRepartidorOcupado }}
      </div>

      <div
        v-else-if="repartidores.length > 0 && !repartidores.some((r) => r.disponible)"
        class="note"
        style="font-size:12.5px;padding:10px 12px"
      >
        Repartidores en ruta. Disponibles al finalizar su entrega.
      </div>

      <div style="padding-top:4px;display:flex;flex-direction:column;gap:8px">
        <button
          type="button"
          class="btn p"
          style="width:100%"
          :disabled="!puedeAsignar"
          @click="asignarPedido"
        >
          <template v-if="puedeAsignar">
            Asignar {{ selectedFolio }} a {{ selectedRepartidor }}
          </template>
          <template v-else-if="pedidos.length === 0">
            Sin pedidos por asignar
          </template>
          <template v-else>
            Repartidor en ruta (No disponible)
          </template>
        </button>
      </div>
    </aside>
  </div>

  <!-- Ventana emergente con la información completa del pedido al darle clic a la card -->
  <BaseModal
    v-model="showDetallePedidoModal"
    aria-label="Información del pedido a domicilio"
    width="480px"
  >
    <template v-if="pedidoDetalleActivo">
      <div class="row" style="justify-content:space-between;align-items:flex-start">
        <div>
          <div class="row" style="gap:8px">
            <StatusTag>{{ pedidoDetalleActivo.folio }}</StatusTag>
            <StatusTag :variant="pedidoDetalleActivo.estado === 'Por entregar' ? 'off' : 'ok'">
              {{ pedidoDetalleActivo.estado || 'Por asignar' }}
            </StatusTag>
          </div>
          <h2 style="font-size:19px;font-weight:700;margin-top:6px">
            Pedido de {{ pedidoDetalleActivo.cliente }}
          </h2>
        </div>
        <span style="font-size:20px;font-weight:800;color:var(--act)">
          {{ pedidoDetalleActivo.total }}
        </span>
      </div>

      <!-- Datos de entrega -->
      <div class="modal-info-box">
        <div class="modal-info-row">
          <span>Teléfono:</span>
          <strong>{{ pedidoDetalleActivo.telefono || 'No especificado' }}</strong>
        </div>
        <div class="modal-info-row">
          <span>Dirección:</span>
          <strong>{{ pedidoDetalleActivo.direccion || pedidoDetalleActivo.telefonoDireccion }}</strong>
        </div>
        <div v-if="pedidoDetalleActivo.referencia" class="modal-info-row">
          <span>Referencia:</span>
          <strong>{{ pedidoDetalleActivo.referencia }}</strong>
        </div>
        <div class="modal-info-row">
          <span>Pago:</span>
          <strong>{{ pedidoDetalleActivo.metodoPago || 'Efectivo' }}</strong>
        </div>
        <div v-if="pedidoDetalleActivo.repartidor" class="modal-info-row">
          <span>Repartidor asignado:</span>
          <strong>{{ pedidoDetalleActivo.repartidor }}</strong>
        </div>
      </div>

      <!-- Platillos incluidos en el pedido -->
      <div style="display:flex;flex-direction:column;gap:8px">
        <span class="lbl" style="margin:0">Platillos del pedido</span>
        <div
          v-if="pedidoDetalleActivo.lineas && pedidoDetalleActivo.lineas.length > 0"
          class="modal-items-box"
        >
          <div
            v-for="(ln, i) in pedidoDetalleActivo.lineas"
            :key="i"
            class="modal-item-line"
          >
            <span>{{ ln.label }}</span>
            <strong>{{ ln.importe }}</strong>
          </div>
          <div class="modal-item-line" style="color:var(--tx2);border-top:1px dashed var(--bd);padding-top:6px">
            <span>Costo de envío a domicilio</span>
            <strong>{{ pedidoDetalleActivo.envio || '$35' }}</strong>
          </div>
        </div>
        <div v-else class="sub" style="padding:10px;background:var(--bg2);border-radius:8px">
          Orden registrada en caja ({{ pedidoDetalleActivo.total }})
        </div>
      </div>

      <div class="row" style="justify-content:flex-end;gap:10px;padding-top:4px">
        <BaseButton variant="s" href="#" @click.prevent="showDetallePedidoModal = false">
          Cerrar
        </BaseButton>
        <BaseButton
          v-if="puedeAsignar && selectedFolio === pedidoDetalleActivo.folio"
          variant="p"
          href="#"
          @click.prevent="showDetallePedidoModal = false; asignarPedido()"
        >
          Asignar a {{ selectedRepartidor }}
        </BaseButton>
      </div>
    </template>
  </BaseModal>
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
  border: 1.5px solid var(--bd);
  border-radius: 14px;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.16s ease, background-color 0.16s ease;
  user-select: none;
}

.ord:hover {
  border-color: var(--ac);
  transform: translateY(-1px);
}

.ord.on {
  border-color: var(--btn);
  background: var(--acs);
}

.ord-info-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1.5px solid var(--bd);
  background: var(--bg2);
  color: var(--act);
  font-family: 'Poppins', sans-serif;
  font-size: 12.5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  transition: background-color 0.16s ease, color 0.16s ease, border-color 0.16s ease, transform 0.16s ease;
}

.ord-info-btn:hover {
  background: var(--btn);
  color: #FFFFFF;
  border-color: var(--btn);
  transform: scale(1.08);
}

.rep {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: 1.5px solid var(--bd);
  border-radius: 12px;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.16s ease, background-color 0.16s ease;
  user-select: none;
}

.rep:hover:not(.rep-busy) {
  border-color: var(--ac);
  transform: translateY(-1px);
}

.rep.on {
  border-color: var(--btn);
  background: var(--acs);
}

.rep.rep-busy {
  opacity: 0.68;
  background: var(--bg2);
  cursor: not-allowed;
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

.modal-info-box {
  background: var(--bg2);
  border: 1px solid var(--bd);
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13.5px;
}

.modal-info-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.modal-info-row span {
  color: var(--tx2);
  flex: none;
}

.modal-info-row strong {
  text-align: right;
}

.modal-items-box {
  border: 1px solid var(--bd);
  border-radius: 12px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13.5px;
}

.modal-item-line {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}
</style>
