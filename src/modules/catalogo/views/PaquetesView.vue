<script setup>
import { ref, computed } from 'vue'
import { PAQUETES_MOCK, PRODUCTOS_MOCK } from '@/services/catalogo.service'
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

function crearNuevoPaquete() {
  const nuevoId = Date.now()
  const nuevo = {
    id: nuevoId,
    nombre: `Nuevo Paquete ${paquetes.value.length + 1}`,
    detalle: '$250',
    precioFijo: '250',
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
  paqueteActivoId.value = nuevoId
}

function guardarPaqueteActual() {
  const totalPzas = paqueteActual.value.itemsIncluidos.reduce((acc, i) => acc + i.cantidad, 0)
  if (paqueteActual.value.tipoPrecio === 'regla') {
    paqueteActual.value.detalle = `${totalPzas} pzas`
  } else if (paqueteActual.value.precioFijo) {
    const num = String(paqueteActual.value.precioFijo).replace(/[^0-9.]/g, '')
    paqueteActual.value.detalle = num ? `$${num}` : paqueteActual.value.detalle
  }

  const idx = PAQUETES_MOCK.findIndex((p) => p.id === paqueteActual.value.id)
  if (idx > -1) {
    PAQUETES_MOCK[idx] = {
      ...paqueteActual.value,
      itemsIncluidos: paqueteActual.value.itemsIncluidos.map((i) => ({ ...i }))
    }
  }
  mensajeGuardado.value = `Paquete "${paqueteActual.value.nombre}" guardado correctamente.`
  setTimeout(() => {
    mensajeGuardado.value = ''
  }, 3000)
}
</script>

<template>
  <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
    <div style="display:flex;flex-direction:column;gap:4px">
      <h1 style="font-size:22px;font-weight:600">Paquetes</h1>
      <p class="sub">Arma combos incluyendo sushi, yakimeshi, teppanyaki, bebidas y reglas de cálculo.</p>
    </div>
    <BaseButton variant="p" href="#" @click.prevent="crearNuevoPaquete">+ Nuevo paquete</BaseButton>
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
            <h2 style="font-size:15px;font-weight:600">Platillos incluidos en el paquete</h2>
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
            Este paquete aún no tiene platillos asignados.
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
            Un producto sale gratis (ej. Paga 4, lleva 5)
          </label>
          <div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:12px">
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
          <p class="sub" style="line-height:1.5">
            El sistema detecta automáticamente el platillo o barra de menor precio y lo descuenta.
          </p>
        </section>
      </div>

      <div style="display:flex;gap:12px;justify-content:flex-end">
        <BaseButton variant="s" to="/admin/paquetes">Cancelar</BaseButton>
        <BaseButton variant="p" href="#" @click.prevent="guardarPaqueteActual">Guardar paquete</BaseButton>
      </div>
    </div>
  </div>

  <!-- Modal para elegir cualquier platillo del menú e incluirlo en el paquete -->
  <BaseModal
    v-model="showModalProducto"
    aria-label="Agregar platillo al paquete"
    width="540px"
  >
    <div style="display:flex;flex-direction:column;gap:4px">
      <h2 style="font-size:19px;font-weight:600">Agregar platillo a {{ paqueteActual.nombre }}</h2>
      <p class="sub">Busca y selecciona cualquier platillo del menú (Yakimeshi, Teppanyaki, Rollos, Bebidas, Kushiages...).</p>
    </div>

    <input
      v-model="busquedaModal"
      class="inp"
      type="search"
      placeholder="Buscar ej. Yakimeshi, Teppanyaki, Tampico, Té verde..."
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
