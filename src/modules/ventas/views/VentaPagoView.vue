<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import StatusTag from '@/components/ui/StatusTag.vue'
import StepIndicator from '@/components/ui/StepIndicator.vue'

const router = useRouter()
const cartStore = useCartStore()
const metodosPago = ['Efectivo', 'Transferencia', 'Tarjeta']
const montoRecibido = ref(cartStore.total > 0 ? cartStore.total : '')
const errorPago = ref('')

// Modal de "¡Venta registrada!"
const showVentaRegistradaModal = ref(false)
const ventaConfirmada = ref(null)

const itemsMostrar = computed(() => {
  if (ventaConfirmada.value && cartStore.items.length === 0) {
    return ventaConfirmada.value.itemsSnapshot || []
  }
  return cartStore.items
})

watch(showVentaRegistradaModal, (abierto) => {
  if (!abierto && ventaConfirmada.value) {
    cartStore.iniciarNuevaVentaLimpia()
    router.push('/cajero/nueva-venta')
  }
})

const montoRecibidoNum = computed(() => {
  const n = Number(montoRecibido.value)
  return Number.isFinite(n) ? n : 0
})

const totalMostrar = computed(() => {
  if (ventaConfirmada.value && cartStore.items.length === 0) {
    return ventaConfirmada.value.totalNum
  }
  return cartStore.total
})

const esMontoSuficiente = computed(() => {
  if (cartStore.metodoPago !== 'Efectivo') return totalMostrar.value > 0
  return totalMostrar.value > 0 && montoRecibidoNum.value >= totalMostrar.value
})

const montoFaltante = computed(() => {
  if (cartStore.metodoPago !== 'Efectivo') return 0
  return Math.max(0, totalMostrar.value - montoRecibidoNum.value)
})

const cambioDevolver = computed(() => {
  if (cartStore.metodoPago !== 'Efectivo') return 0
  return Math.max(0, montoRecibidoNum.value - totalMostrar.value)
})

function confirmarYRegistrarVenta() {
  errorPago.value = ''
  if (cartStore.items.length === 0) {
    errorPago.value = 'Agrega al menos un producto al pedido antes de confirmar la venta.'
    return
  }
  if (cartStore.metodoPago === 'Efectivo' && montoRecibidoNum.value < cartStore.total) {
    errorPago.value = `El monto recibido ($${montoRecibidoNum.value.toFixed(2)}) no cubre el total a cobrar ($${cartStore.total.toFixed(2)}).`
    return
  }

  const cambioCalculado = cartStore.metodoPago === 'Efectivo' ? cambioDevolver.value : 0
  const metodoUsado = cartStore.metodoPago
  const recibidoNum = cartStore.metodoPago === 'Efectivo' ? montoRecibidoNum.value : cartStore.total
  const resultado = cartStore.registrarVentaActual({
    montoRecibido: recibidoNum,
    cambio: cambioCalculado
  })
  ventaConfirmada.value = {
    ...resultado,
    pago: metodoUsado,
    montoRecibido: recibidoNum,
    cambio: cambioCalculado
  }
  showVentaRegistradaModal.value = true
}

function irANuevaVenta() {
  ventaConfirmada.value = null
  showVentaRegistradaModal.value = false
  cartStore.iniciarNuevaVentaLimpia()
  router.push('/cajero/nueva-venta')
}

function irAAsignarRepartidor() {
  const folioDestino = ventaConfirmada.value?.folio || ''
  ventaConfirmada.value = null
  showVentaRegistradaModal.value = false
  cartStore.iniciarNuevaVentaLimpia()
  router.push({
    path: '/cajero/domicilios',
    query: folioDestino ? { folio: folioDestino } : {}
  })
}

function irAlHistorial() {
  ventaConfirmada.value = null
  showVentaRegistradaModal.value = false
  cartStore.iniciarNuevaVentaLimpia()
  router.push('/cajero/historial')
}
</script>

<template>
  <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
    <h1 style="font-size:22px;font-weight:600">Resumen y pago</h1>
    <StepIndicator :current-step="4" />
  </div>

  <div class="pago-layout">
    <section class="card" style="flex:1;min-width:0;padding-bottom:16px;gap:0">
      <div class="row" style="justify-content:space-between;padding-bottom:8px;border-bottom:1px solid var(--bd)">
        <h2 style="font-size:16px;font-weight:600">Detalle del pedido</h2>
        <StatusTag style="height:26px;padding:0 12px;border-radius:13px">
          {{ cartStore.tipoEtiqueta }}
        </StatusTag>
      </div>

      <div
        v-for="item in itemsMostrar"
        :key="item.id"
        class="ln"
      >
        <div style="display:flex;flex-direction:column;gap:2px">
          <span>{{ item.cantidad }} × {{ item.nombre }}</span>
          <span v-if="item.detalle" class="sub" style="font-size:12px">{{ item.detalle }}</span>
        </div>
        <span style="font-weight:500">${{ item.subtotal }}</span>
      </div>

      <div v-if="cartStore.descuento > 0" class="ln" style="color:var(--act);font-weight:500">
        <span>Descuento por promoción aplicada</span>
        <span>-${{ cartStore.descuento }}</span>
      </div>

      <div v-if="cartStore.tipoPedido === 'domicilio'" class="ln" style="border-bottom:0">
        <span>Envío a domicilio</span>
        <span style="font-weight:500">${{ cartStore.envio }}</span>
      </div>

      <div
        style="background:var(--bg2);border-radius:12px;padding:14px 16px;margin-top:12px;display:flex;flex-direction:column;gap:4px;font-size:13px"
      >
        <template v-if="cartStore.tipoPedido === 'domicilio'">
          <span style="font-weight:600">Entrega para {{ cartStore.datosCliente.nombreRecibe || 'Laura Méndez' }}</span>
          <span class="sub">
            Tel: {{ cartStore.datosCliente.telefono }} · {{ cartStore.datosCliente.direccion }}
            <template v-if="cartStore.datosCliente.referencia"> ({{ cartStore.datosCliente.referencia }})</template>
          </span>
        </template>
        <template v-else-if="cartStore.tipoPedido === 'llevar'">
          <span style="font-weight:600">Recoge: {{ cartStore.datosCliente.nombreLlevar }}</span>
          <span class="sub">Hora estimada de recolección: {{ cartStore.datosCliente.horaRecoleccion }}</span>
        </template>
        <template v-else>
          <span style="font-weight:600">Servicio en comedor: {{ cartStore.datosCliente.mesa }}</span>
          <span v-if="cartStore.datosCliente.notaCocina" class="sub">Nota: {{ cartStore.datosCliente.notaCocina }}</span>
        </template>
      </div>
    </section>

    <aside class="pago-aside">
      <section class="card" style="display:flex;flex-direction:column;gap:10px">
        <h2 style="font-size:16px;font-weight:600;padding-bottom:4px">Método de pago</h2>
        <div
          v-for="metodo in metodosPago"
          :key="metodo"
          :class="['pay', { on: cartStore.metodoPago === metodo }]"
          style="cursor:pointer"
          @click="cartStore.setMetodoPago(metodo)"
        >
          <span class="rad"></span>{{ metodo }}
        </div>

        <div v-if="cartStore.metodoPago === 'Efectivo'" style="padding-top:8px;display:flex;flex-direction:column;gap:8px">
          <BaseInput
            id="monto-rec"
            v-model="montoRecibido"
            label="Monto recibido ($)"
            type="number"
            min="1"
            :placeholder="`Mínimo $${totalMostrar}`"
          />
          <div v-if="montoFaltante > 0" style="font-size:12px;color:#C94C08;font-weight:500">
            Faltan ${{ montoFaltante.toFixed(2) }} por cubrir.
          </div>
          <div v-else class="row" style="justify-content:space-between;font-size:14px">
            <span class="sub">Cambio:</span>
            <strong style="color:var(--ok);font-size:16px">${{ cambioDevolver.toFixed(2) }}</strong>
          </div>
        </div>
      </section>

      <section
        class="card"
        style="display:flex;flex-direction:column;gap:14px;background:var(--acs);border-color:transparent"
      >
        <div class="row" style="justify-content:space-between">
          <span style="font-size:15px;font-weight:500">Total a cobrar</span>
          <span style="font-size:30px;font-weight:600">${{ totalMostrar }}</span>
        </div>
        <div v-if="errorPago" style="font-size:12px;color:#C94C08;font-weight:500">
          {{ errorPago }}
        </div>
        <BaseButton
          variant="p"
          href="#"
          :disabled="!esMontoSuficiente"
          @click.prevent="confirmarYRegistrarVenta"
        >
          Confirmar venta
        </BaseButton>
        <BaseButton variant="s" to="/cajero/nueva-venta/datos">Atrás</BaseButton>
      </section>
    </aside>
  </div>

  <!-- Ventana emergente de "¡Venta registrada!" -->
  <BaseModal
    v-model="showVentaRegistradaModal"
    aria-label="Venta registrada exitosamente"
    width="460px"
  >
    <div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;padding-top:4px">
      <div class="venta-ok-badge">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6L9 17l-5-5"></path>
        </svg>
      </div>
      <h2 style="font-size:21px;font-weight:600">Venta registrada</h2>
      <StatusTag variant="ok">Folio {{ ventaConfirmada?.folio }}</StatusTag>
    </div>

    <div v-if="ventaConfirmada" class="venta-resumen-box">
      <div class="row" style="justify-content:space-between">
        <span class="sub">Folio y hora</span>
        <strong>{{ ventaConfirmada.folio }} · {{ ventaConfirmada.fechaHora }}</strong>
      </div>
      <div class="row" style="justify-content:space-between">
        <span class="sub">Modalidad</span>
        <StatusTag style="height:24px;padding:0 10px">{{ ventaConfirmada.tipo }}</StatusTag>
      </div>
      <div class="row" style="justify-content:space-between">
        <span class="sub">Cliente / Mesa</span>
        <strong>{{ ventaConfirmada.clienteMesa }}</strong>
      </div>
      <div class="row" style="justify-content:space-between">
        <span class="sub">Método de pago</span>
        <strong>{{ ventaConfirmada.pago }}</strong>
      </div>
      <div v-if="ventaConfirmada.descuento > 0" class="row" style="justify-content:space-between;color:var(--act)">
        <span>Ahorro por promoción</span>
        <strong>-${{ ventaConfirmada.descuento }}</strong>
      </div>
      <div class="row" style="justify-content:space-between;padding-top:8px;border-top:1px solid var(--bd);font-size:16px">
        <span style="font-weight:600">Total cobrado</span>
        <strong style="font-size:20px;color:var(--act)">{{ ventaConfirmada.total }}</strong>
      </div>
      <div v-if="ventaConfirmada.pago === 'Efectivo'" class="row" style="justify-content:space-between;color:var(--ok)">
        <span>Cambio entregado</span>
        <strong>${{ ventaConfirmada.cambio.toFixed(2) }}</strong>
      </div>
    </div>

    <div class="venta-modal-actions">
      <div class="venta-primary-row">
        <BaseButton
          v-if="ventaConfirmada?.tipoCodigo === 'domicilio'"
          variant="p"
          href="#"
          style="flex:1"
          @click.prevent="irAAsignarRepartidor"
        >
          Asignar repartidor
        </BaseButton>
        <BaseButton
          v-else
          variant="p"
          href="#"
          style="flex:1"
          @click.prevent="irANuevaVenta"
        >
          + Nueva venta
        </BaseButton>
      </div>

      <div class="venta-secondary-links">
        <a
          v-if="ventaConfirmada?.tipoCodigo === 'domicilio'"
          href="#"
          class="venta-subtle-link"
          @click.prevent="irANuevaVenta"
        >
          Registrar otra venta
        </a>
        <span v-if="ventaConfirmada?.tipoCodigo === 'domicilio'" class="sub">·</span>
        <a
          href="#"
          class="venta-subtle-link"
          @click.prevent="irAlHistorial"
        >
          Ir al historial de ventas
        </a>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.pago-layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.pago-aside {
  width: 350px;
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (max-width: 900px) {
  .pago-layout {
    flex-direction: column;
  }
  .pago-aside {
    width: 100%;
  }
}

.ln {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--bd);
  font-size: 14px;
}

.pay {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 54px;
  padding: 0 16px;
  border: 1px solid var(--bd);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  transition: transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.16s ease, background-color 0.16s ease;
  user-select: none;
}

.pay:hover {
  border-color: var(--btn);
  transform: translateY(-1px);
}

.pay:active {
  transform: scale(0.98);
}

.pay.on {
  border-color: var(--btn);
  background: var(--acs);
  color: var(--act);
}

.rad {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid var(--bd);
  flex: none;
}

.pay.on .rad {
  border-color: var(--btn);
  background: radial-gradient(circle, var(--btn) 45%, transparent 50%);
}

.venta-ok-badge {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--oks);
  color: var(--ok);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: popOk 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes popOk {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.venta-resumen-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 12px;
  background: var(--bg2);
  border: 1px solid var(--bd);
  font-size: 13px;
}

.venta-modal-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 6px;
}

.venta-primary-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.venta-secondary-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding-top: 2px;
}

.venta-subtle-link {
  font-size: 13px;
  font-weight: 600;
  color: var(--tx2);
  text-decoration: none;
  transition: color 0.15s ease;
}

.venta-subtle-link:hover {
  color: var(--act);
  text-decoration: underline;
}
</style>
