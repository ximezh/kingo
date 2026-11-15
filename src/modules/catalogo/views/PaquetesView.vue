<script setup>
import { ref, computed } from 'vue'
import {
  PAQUETES_MOCK,
  PRODUCTOS_MOCK,
  guardarPaquetesStorage,
  guardarProductosStorage
} from '@/services/catalogo.service'
import { reconstruirMenuVenta } from '@/services/ventas.service'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import StatusTag from '@/components/ui/StatusTag.vue'

const paquetes = ref(
  PAQUETES_MOCK.map((p) => ({
    ...p,
    itemsIncluidos: (p.itemsIncluidos || []).map((i) => ({ ...i }))
  }))
)
const paqueteActivoId = ref(paquetes.value[0]?.id || 1)
const mensajeGuardado = ref('')

// Modal para agregar cualquier platillo al paquete (Yakimeshi, Teppanyaki, Sushi, Bebidas, etc.)
const showModalProducto = ref(false)
const showModalEliminarPaquete = ref(false)
const showModalNuevoPaquete = ref(false)
const nuevoPaqueteNombre = ref('')
const nuevoPaquetePrecio = ref('250')
const busquedaModal = ref('')
const categoriaModal = ref('Todas')
const cantidadAgregar = ref(1)
const productoSeleccionadoModal = ref(null)

const paqueteActual = computed(() => {
  return paquetes.value.find((p) => p.id === paqueteActivoId.value) || paquetes.value[0]
})

const OpcionesPlatillosPaquete = computed(() => {
  const base = [
    { id: 'barras-sushi', nombre: 'Barras de sushi (a elegir)', categoria: 'Barra de Sushi', presentacion: '10 piezas, a elegir del menú' },
    ...PRODUCTOS_MOCK.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      categoria: p.categoria,
      presentacion: p.presentacion || p.categoria
    }))
  ]
  const q = busquedaModal.value.trim().toLowerCase()
  return base.filter((item) => {
    if (categoriaModal.value !== 'Todas' && item.categoria !== categoriaModal.value) return false
    if (q) {
      return item.nombre.toLowerCase().includes(q) || item.categoria.toLowerCase().includes(q)
    }
    return true
  })
})

function seleccionarPaquete(id) {
  paqueteActivoId.value = id
  mensajeGuardado.value = ''
}

function cambiarCantidadItemPaquete(item, delta) {
  const nueva = item.cantidad + delta
  if (nueva <= 0) {
    paqueteActual.value.itemsIncluidos = paqueteActual.value.itemsIncluidos.filter((i) => i.id !== item.id)
  } else {
    item.cantidad = nueva
  }
}

function quitarItemDePaquete(itemId) {
  paqueteActual.value.itemsIncluidos = paqueteActual.value.itemsIncluidos.filter((i) => i.id !== itemId)
}

function abrirModalAgregarPlatillo() {
  busquedaModal.value = ''
  categoriaModal.value = 'Todas'
  cantidadAgregar.value = 1
  productoSeleccionadoModal.value = OpcionesPlatillosPaquete.value[1] || OpcionesPlatillosPaquete.value[0]
  showModalProducto.value = true
}

function confirmarAgregarPlatilloAPaquete() {
  if (!productoSeleccionadoModal.value) return
  const elegido = productoSeleccionadoModal.value
  const existente = paqueteActual.value.itemsIncluidos.find(
    (i) => i.nombre.toLowerCase() === elegido.nombre.toLowerCase()
  )
  if (existente) {
    existente.cantidad += cantidadAgregar.value
  } else {
    paqueteActual.value.itemsIncluidos.push({
      id: Date.now(),
      nombre: elegido.nombre,
      subtitulo: elegido.presentacion || elegido.categoria,
      cantidad: cantidadAgregar.value
    })
  }
  showModalProducto.value = false
}

function abrirModalNuevoPaquete() {
  nuevoPaqueteNombre.value = `Paquete ${String.fromCharCode(65 + paquetes.value.length)}`
  nuevoPaquetePrecio.value = '250'
  showModalNuevoPaquete.value = true
}

function confirmarCrearNuevoPaquete() {
  const nuevoId = Date.now()
  const nombreLimpio = nuevoPaqueteNombre.value.trim() || `Nuevo Paquete ${paquetes.value.length + 1}`
  const precioNum = Number(String(nuevoPaquetePrecio.value).replace(/[^0-9.]/g, '')) || 250
  const nuevo = {
    id: nuevoId,
    nombre: nombreLimpio,
    detalle: `$${precioNum}`,
    precioFijo: String(precioNum),
    tipoPrecio: 'fijo',
    cantidadBarras: 2,
    reglaActiva: false,
    productoGratis: false,
    seEligen: '2',
    sePagan: '2',
    itemsIncluidos: [
      { id: Date.now() + 1, nombre: 'Yakimeshi sencillo', subtitulo: 'Tazón 350g', cantidad: 1 },
      { id: Date.now() + 2, nombre: 'Tampico Roll', subtitulo: '10 piezas', cantidad: 1 }
    ]
  }
  paquetes.value.push(nuevo)
  PAQUETES_MOCK.push({
    ...nuevo,
    itemsIncluidos: nuevo.itemsIncluidos.map((i) => ({ ...i }))
  })
  PRODUCTOS_MOCK.push({
    id: nuevoId,
    nombre: nuevo.nombre,
    categoria: 'Paquetes',
    presentacion: 'Paquete',
    descripcion: nuevo.itemsIncluidos.map((i) => `${i.cantidad} ${i.nombre}`).join(', '),
    precio: precioNum,
    tieneFoto: true,
    imagenUrl: null,
    esVector: true,
    activo: true,
    permiteExtras: false
  })
  guardarPaquetesStorage()
  guardarProductosStorage()
  reconstruirMenuVenta()
  paqueteActivoId.value = nuevoId
  showModalNuevoPaquete.value = false
  mensajeGuardado.value = `Se creó "${nuevo.nombre}". Ahora puedes personalizar los platillos que incluye.`
  setTimeout(() => {
    mensajeGuardado.value = ''
  }, 3500)
}

function guardarPaqueteActual() {
  const totalPzas = paqueteActual.value.itemsIncluidos.reduce((acc, i) => acc + i.cantidad, 0)
  const numPrecio = Number(String(paqueteActual.value.precioFijo).replace(/[^0-9.]/g, '')) || 0
  if (paqueteActual.value.tipoPrecio === 'regla') {
    paqueteActual.value.detalle = `${totalPzas} pzas`
  } else if (paqueteActual.value.precioFijo) {
    paqueteActual.value.detalle = numPrecio ? `$${numPrecio}` : paqueteActual.value.detalle
  }

  const idx = PAQUETES_MOCK.findIndex((p) => p.id === paqueteActual.value.id)
  if (idx > -1) {
    PAQUETES_MOCK[idx] = {
      ...paqueteActual.value,
      itemsIncluidos: paqueteActual.value.itemsIncluidos.map((i) => ({ ...i }))
    }
  }

  const prodPaq = PRODUCTOS_MOCK.find((p) => p.id === paqueteActual.value.id)
  if (prodPaq) {
    prodPaq.nombre = paqueteActual.value.nombre
    prodPaq.descripcion = paqueteActual.value.itemsIncluidos.map((i) => `${i.cantidad} ${i.nombre}`).join(', ')
    if (paqueteActual.value.tipoPrecio === 'fijo' && numPrecio > 0) {
      prodPaq.precio = numPrecio
    }
  }

  guardarPaquetesStorage()
  guardarProductosStorage()
  reconstruirMenuVenta()

  mensajeGuardado.value = `Paquete "${paqueteActual.value.nombre}" guardado correctamente.`
  setTimeout(() => {
    mensajeGuardado.value = ''
  }, 3000)
}

function confirmarEliminarPaquete() {
  if (!paqueteActual.value) return
  const idEliminar = paqueteActual.value.id
  const nombreEliminado = paqueteActual.value.nombre

  paquetes.value = paquetes.value.filter((p) => p.id !== idEliminar)

  const idxMock = PAQUETES_MOCK.findIndex((p) => p.id === idEliminar)
  if (idxMock > -1) {
    PAQUETES_MOCK.splice(idxMock, 1)
  }

  const idxProd = PRODUCTOS_MOCK.findIndex((p) => p.id === idEliminar)
  if (idxProd > -1) {
    PRODUCTOS_MOCK.splice(idxProd, 1)
  }

  guardarPaquetesStorage()
  guardarProductosStorage()
  reconstruirMenuVenta()

  fetch(`http://localhost:3000/api/catalogo/paquetes/${idEliminar}`, {
    method: 'DELETE'
  }).catch(() => {})

  showModalEliminarPaquete.value = false
  paqueteActivoId.value = paquetes.value[0]?.id || null

  mensajeGuardado.value = `Paquete "${nombreEliminado}" eliminado.`
  setTimeout(() => {
    mensajeGuardado.value = ''
  }, 3000)
}
</script>

<template>
  <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
    <div class="row" style="gap:10px">
      <h1 style="font-size:22px;font-weight:600">Paquetes</h1>
      <StatusTag>{{ paquetes.length }}</StatusTag>
    </div>
    <BaseButton variant="p" href="#" @click.prevent="abrirModalNuevoPaquete">+ Nuevo paquete</BaseButton>
  </div>

  <div v-if="mensajeGuardado" class="note" style="background:var(--oks);color:var(--ok)">
    ✓ {{ mensajeGuardado }}
  </div>

  <div class="paquetes-layout">
    <section class="card paquetes-sidebar">
      <div style="padding:6px 10px 8px;font-size:12px;font-weight:600;color:var(--tx2)">
        PAQUETES REGISTRADOS ({{ paquetes.length }})
      </div>
      <a
        v-for="paq in paquetes"
        :key="paq.id"
        href="#"
        :class="['li', { on: paq.id === paqueteActivoId }]"
        @click.prevent="seleccionarPaquete(paq.id)"
      >
        {{ paq.nombre }}<span>{{ paq.detalle }}</span>
      </a>
    </section>

    <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:20px">
      <section class="card" style="padding:20px;gap:14px">
        <div class="paquetes-top-grid">
          <BaseInput
            id="pn"
            v-model="paqueteActual.nombre"
            label="Nombre del paquete"
            type="text"
          />
          <div>
            <span class="lbl">Tipo de precio</span>
            <div class="seg">
              <span
                :class="{ on: paqueteActual.tipoPrecio === 'fijo' }"
                @click="paqueteActual.tipoPrecio = 'fijo'"
              >
                Precio fijo
              </span>
              <span
                :class="{ on: paqueteActual.tipoPrecio === 'regla' }"
                @click="paqueteActual.tipoPrecio = 'regla'"
              >
                Según regla
              </span>
            </div>
          </div>
          <BaseInput
            v-if="paqueteActual.tipoPrecio === 'fijo'"
            id="pf"
            v-model="paqueteActual.precioFijo"
            label="Precio del paquete ($)"
            type="text"
            placeholder="Ej. 295"
          />
        </div>
      </section>

      <div class="paquetes-Subgrid">
        <section class="card" style="padding:20px;gap:14px">
          <div class="row" style="justify-content:space-between">
            <h2 style="font-size:15px;font-weight:600">Contenido del paquete</h2>
            <StatusTag>{{ paqueteActual.itemsIncluidos.length }} platillos</StatusTag>
          </div>

          <div v-if="paqueteActual.itemsIncluidos.length > 0" style="display:flex;flex-direction:column;gap:8px">
            <div
              v-for="item in paqueteActual.itemsIncluidos"
              :key="item.id"
              class="item"
              style="padding:10px 14px"
            >
              <span style="display:flex;flex-direction:column;min-width:0;flex:1">
                <span style="font-weight:500">{{ item.nombre }}</span>
                <span class="sub" style="font-size:12px">{{ item.subtitulo }}</span>
              </span>
              <div class="row" style="gap:10px">
                <span class="step">
                  <b @click="cambiarCantidadItemPaquete(item, -1)">-</b>
                  {{ item.cantidad }}
                  <b @click="cambiarCantidadItemPaquete(item, 1)">+</b>
                </span>
                <a
                  href="#"
                  class="back"
                  style="font-size:12px"
                  @click.prevent="quitarItemDePaquete(item.id)"
                >Quitar</a>
              </div>
            </div>
          </div>

          <div v-else class="sub" style="padding:16px;text-align:center;border:1px dashed var(--bd);border-radius:10px">
            Sin platillos asignados.
          </div>

          <BaseButton variant="s" href="#" @click.prevent="abrirModalAgregarPlatillo">
            + Agregar platillo
          </BaseButton>
        </section>

        <section class="card" style="padding:20px;gap:14px">
          <div class="row" style="justify-content:space-between">
            <h2 style="font-size:15px;font-weight:600">Regla especial</h2>
            <StatusTag :variant="paqueteActual.productoGratis ? 'ok' : 'off'">
              {{ paqueteActual.productoGratis ? 'Activa' : 'Opcional' }}
            </StatusTag>
          </div>
          <label class="row" style="font-size:14px;cursor:pointer">
            <input
              v-model="paqueteActual.productoGratis"
              type="checkbox"
              style="width:18px;height:18px;accent-color:#C94C08"
            >
            Un producto gratis (ej. 5x4)
          </label>
          <div v-if="paqueteActual.productoGratis" style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:12px">
            <BaseInput
              id="rt"
              v-model="paqueteActual.seEligen"
              label="Se eligen"
              type="text"
            />
            <BaseInput
              id="rp"
              v-model="paqueteActual.sePagan"
              label="Se pagan"
              type="text"
            />
          </div>
        </section>
      </div>

      <div style="display:flex;gap:12px;justify-content:space-between;align-items:center;flex-wrap:wrap">
        <BaseButton
          v-if="paqueteActual"
          variant="d"
          href="#"
          @click.prevent="showModalEliminarPaquete = true"
        >
          Eliminar paquete
        </BaseButton>
        <div style="display:flex;gap:12px;margin-left:auto">
          <BaseButton variant="s" to="/admin/productos">Cancelar</BaseButton>
          <BaseButton variant="p" href="#" @click.prevent="guardarPaqueteActual">Guardar paquete</BaseButton>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal de confirmación para crear nuevo paquete -->
  <BaseModal
    v-model="showModalNuevoPaquete"
    aria-label="Crear nuevo paquete"
    width="430px"
  >
    <div style="display:flex;align-items:center;gap:12px">
      <div class="ico" style="width:44px;height:44px;border-radius:12px;flex:none">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 4l9 5-9 5-9-5zM3 14l9 5 9-5"></path>
        </svg>
      </div>
      <h2 style="font-size:18px;font-weight:700;margin:0">¿Crear un nuevo paquete?</h2>
    </div>

    <BaseInput
      id="np-nombre"
      v-model="nuevoPaqueteNombre"
      label="Nombre del paquete"
      type="text"
      placeholder="Ej. Paquete Especial"
    />

    <div class="note" style="font-size:12.5px;padding:10px 12px">
      Al confirmar podrás elegir qué platillos, rollos o bebidas incluye este paquete.
    </div>

    <div style="display:flex;gap:10px;justify-content:flex-end;padding-top:4px">
      <BaseButton variant="s" href="#" @click.prevent="showModalNuevoPaquete = false">Cancelar</BaseButton>
      <BaseButton variant="p" href="#" @click.prevent="confirmarCrearNuevoPaquete">Sí, crear paquete</BaseButton>
    </div>
  </BaseModal>

  <!-- Modal de confirmación para eliminar paquete -->
  <BaseModal
    v-model="showModalEliminarPaquete"
    aria-label="Eliminar paquete"
    width="440px"
  >
    <h2 style="font-size:18px;font-weight:600">¿Eliminar {{ paqueteActual?.nombre }}?</h2>
    <p class="sub" style="line-height:1.5">
      Este paquete dejará de aparecer en el catálogo y en la pantalla de nueva venta.
    </p>
    <div style="display:flex;gap:10px;justify-content:flex-end;padding-top:6px">
      <BaseButton variant="s" href="#" @click.prevent="showModalEliminarPaquete = false">Cancelar</BaseButton>
      <BaseButton variant="d" href="#" @click.prevent="confirmarEliminarPaquete">Sí, eliminar</BaseButton>
    </div>
  </BaseModal>

  <!-- Modal para elegir cualquier platillo del menú e incluirlo en el paquete -->
  <BaseModal
    v-model="showModalProducto"
    aria-label="Agregar platillo al paquete"
    width="540px"
  >
    <h2 style="font-size:19px;font-weight:600">Agregar platillo a {{ paqueteActual.nombre }}</h2>

    <input
      v-model="busquedaModal"
      class="inp"
      type="search"
      placeholder="Buscar platillo..."
    >

    <div style="display:flex;flex-direction:column;gap:6px;max-height:260px;overflow-y:auto;padding-right:4px">
      <div
        v-for="op in OpcionesPlatillosPaquete"
        :key="op.id"
        :class="['modal-prod-row', { on: productoSeleccionadoModal?.id === op.id }]"
        @click="productoSeleccionadoModal = op"
      >
        <div style="display:flex;flex-direction:column">
          <span style="font-weight:600;font-size:14px">{{ op.nombre }}</span>
          <span class="sub" style="font-size:12px">{{ op.categoria }} · {{ op.presentacion }}</span>
        </div>
        <StatusTag v-if="productoSeleccionadoModal?.id === op.id" variant="ok">Seleccionado</StatusTag>
      </div>
      <div v-if="OpcionesPlatillosPaquete.length === 0" class="sub" style="text-align:center;padding:24px">
        No se encontraron platillos con "{{ busquedaModal }}".
      </div>
    </div>

    <div class="row" style="justify-content:space-between;padding-top:6px;border-top:1px solid var(--bd)">
      <div class="row" style="gap:10px">
        <span style="font-size:14px;font-weight:500">Cantidad a incluir:</span>
        <span class="step">
          <b @click="cantidadAgregar = Math.max(1, cantidadAgregar - 1)">-</b>
          {{ cantidadAgregar }}
          <b @click="cantidadAgregar++">+</b>
        </span>
      </div>
      <div class="row" style="gap:10px">
        <BaseButton variant="s" href="#" @click.prevent="showModalProducto = false">Cancelar</BaseButton>
        <BaseButton variant="p" href="#" @click.prevent="confirmarAgregarPlatilloAPaquete">
          Incluir en paquete
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.paquetes-layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.paquetes-sidebar {
  width: 280px;
  flex: none;
  padding: 12px;
  gap: 4px;
}

.paquetes-top-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.paquetes-Subgrid {
  display: grid;
  grid-template-columns: 1.25fr 1fr;
  gap: 20px;
  align-items: start;
}

@media (max-width: 960px) {
  .paquetes-layout {
    flex-direction: column;
  }
  .paquetes-sidebar {
    width: 100%;
  }
  .paquetes-Subgrid {
    grid-template-columns: 1fr;
  }
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 46px;
  padding: 0 14px;
  border: 1px solid var(--bd);
  border-radius: 10px;
  font-size: 14px;
}

.modal-prod-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border: 1px solid var(--bd);
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.modal-prod-row:hover {
  border-color: var(--ac);
}

.modal-prod-row.on {
  border-color: var(--btn);
  background: var(--acs);
}
</style>
