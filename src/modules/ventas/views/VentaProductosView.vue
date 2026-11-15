<script setup>
import { ref, computed } from 'vue'
import { useCartStore } from '@/stores/cart'
import { CATEGORIAS_VENTA_MOCK, PRODUCTOS_MENU_VENTA_MOCK, reconstruirMenuVenta } from '@/services/ventas.service'
import { EXTRAS_DISPONIBLES_MOCK, ROLLOS_PROMO_MOCK, PRODUCTOS_MOCK } from '@/services/catalogo.service'
import { esPromo2x1ValidaHoy } from '@/services/promociones.service'
import StepIndicator from '@/components/ui/StepIndicator.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import StatusTag from '@/components/ui/StatusTag.vue'
import ProductoVectorArt from '@/components/ui/ProductoVectorArt.vue'
import CarritoLateral from '@/modules/ventas/components/CarritoLateral.vue'

const cartStore = useCartStore()
const busqueda = ref('')
const categoriaActiva = ref('Todo')

reconstruirMenuVenta()

const promoValidaHoy = computed(() => esPromo2x1ValidaHoy())

const categoriasVisibles = computed(() => CATEGORIAS_VENTA_MOCK)

const productosMenu = computed(() => PRODUCTOS_MENU_VENTA_MOCK)

// Modal Promoción 2x1
const showPromo2x1Modal = ref(false)
const numPromos2x1 = ref(1)
const rollosElegidos2x1 = ref([])
const busquedaRolloPromo = ref('')

// Modal Paquete Sushi (5 barras, paga 4)
const showPaqueteSushiModal = ref(false)
const rollosElegidosPaqSushi = ref([])
const busquedaRolloPaq = ref('')

// Modal para Promociones Generales (Combos con descuento, Postre gratis, Especial de fin de semana, etc.)
const showPromoGeneralModal = ref(false)
const promoGeneralActiva = ref(null)
const platilloPromoElegidoId = ref(null)

// Modal Selección de Carnes (Pollo, Cerdo, Res) para Yakimeshis, Teppanyakis, Plato Kin, etc.
const OPCIONES_CARNE = ['Pollo', 'Cerdo', 'Res']
const showCarnesModal = ref(false)
const productoParaCarnes = ref(null)
const carnesSlots = ref(['Pollo'])

// Modal Extras
const showExtrasModal = ref(false)
const productoParaExtras = ref(null)
const itemCarritoParaExtras = ref(null)
const extrasCheck = ref([])
const notaExtraCocina = ref('')
const cantidadModal = ref(1)
const carnesModalExtras = ref([])

// Mini ventana de descripción / ingredientes del platillo
const showInfoProdModal = ref(false)
const productoInfoActivo = ref(null)
const recienAgregados = ref({})

function marcarProductoAgregado(prodId) {
  if (!prodId) return
  recienAgregados.value[prodId] = true
  setTimeout(() => {
    delete recienAgregados.value[prodId]
  }, 750)
}

function abrirInfoProducto(prod) {
  productoInfoActivo.value = prod
  showInfoProdModal.value = true
}

function accionarDesdeInfoModal(prod) {
  showInfoProdModal.value = false
  if (prod.tipoCard === 'promo_2x1') {
    abrirModalPromo2x1()
  } else if (prod.tipoCard === 'paquete_sushi') {
    abrirModalPaqueteSushi()
  } else if (prod.tipoCard === 'promo_general') {
    abrirModalPromoGeneral(prod)
  } else if (prod.tipoCard === 'variantes') {
    agregarVarianteSeleccionada(prod)
  } else {
    clickAgregarProducto(prod)
  }
}

const opcionesPlatillosPromoGeneral = computed(() => {
  const promo = promoGeneralActiva.value?.promoData
  if (!promo) return []
  const nombresIncluidos = Array.isArray(promo.productosIncluidos) ? promo.productosIncluidos : []
  const nomPromo = (promo.nombre || '').toLowerCase()
  const descPromo = (promo.descuento || '').toLowerCase()
  const esPostreGratis = nomPromo.includes('postre') || descPromo.includes('gratis')
  const matchPct = (promo.descuento || promo.nombre || '').match(/(\d+)\s*%/)
  const pctDescuento = matchPct ? Number(matchPct[1]) : 0

  let baseProductos = PRODUCTOS_MOCK.filter(
    (p) => p.activo !== false && nombresIncluidos.some((n) => n.toLowerCase() === p.nombre.toLowerCase())
  )
  if (baseProductos.length === 0) {
    if (esPostreGratis) {
      baseProductos = PRODUCTOS_MOCK.filter((p) => p.activo !== false && p.categoria === 'Postres')
    } else {
      baseProductos = PRODUCTOS_MOCK.filter((p) => p.activo !== false && p.categoria === 'Paquetes' && p.precio)
    }
  }

  return baseProductos.map((p) => {
    const precioOrig = Number(p.precio) || 140
    let descuentoMonto = 0
    let etiquetaCorto = 'Promo'
    if (esPostreGratis) {
      descuentoMonto = precioOrig
      etiquetaCorto = 'Postre gratis'
    } else if (pctDescuento > 0) {
      descuentoMonto = Math.round((precioOrig * pctDescuento) / 100)
      etiquetaCorto = `-${pctDescuento}%`
    } else {
      descuentoMonto = Math.min(precioOrig, 30)
      etiquetaCorto = 'Precio especial'
    }
    return {
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      precioOriginal: precioOrig,
      descuentoMonto,
      precioFinal: Math.max(0, precioOrig - descuentoMonto),
      etiquetaCorto
    }
  })
})

const esPromoActivaPostreGratis = computed(() => {
  const promo = promoGeneralActiva.value?.promoData
  if (!promo) return false
  const nom = (promo.nombre || '').toLowerCase()
  const desc = (promo.descuento || '').toLowerCase()
  return nom.includes('postre') || desc.includes('gratis')
})

const validacionPromoGeneral = computed(() => {
  const promo = promoGeneralActiva.value?.promoData
  if (!promo) return { valido: false, mensaje: '' }

  if (esPromoActivaPostreGratis.value) {
    if (cartStore.tienePostreGratisEnCarrito) {
      return {
        valido: false,
        tipo: 'error',
        mensaje: 'Validación: Ya aplicaste 1 Postre gratis en este pedido (máximo 1 por cuenta).'
      }
    }
    const montoActual = cartStore.subtotalSinPostreGratis
    if (montoActual < 400) {
      const faltante = Math.max(0, 400 - montoActual)
      return {
        valido: false,
        tipo: 'error',
        mensaje: `Requisito: La compra mínima para Postre gratis es de $400.00. Actualmente el pedido suma $${montoActual.toFixed(2)} (faltan $${faltante.toFixed(2)}).`
      }
    }
    return {
      valido: true,
      tipo: 'ok',
      mensaje: `✓ Compra mínima cubierta ($${montoActual.toFixed(2)} ≥ $400.00). Elige el postre de cortesía.`
    }
  }

  return {
    valido: Boolean(platilloPromoElegidoId.value),
    tipo: 'ok',
    mensaje: `✓ Promoción válida (${promo.dia}). Selecciona el paquete o platillo participante.`
  }
})

function abrirModalPromoGeneral(prod) {
  if (prod.promoData?.productosIncluidos?.length === 1 && prod.promoData.productosIncluidos[0] === 'Paquete Sushi') {
    abrirModalPaqueteSushi()
    return
  }
  promoGeneralActiva.value = prod
  const lista = opcionesPlatillosPromoGeneral.value
  platilloPromoElegidoId.value = lista[0]?.id || null
  showPromoGeneralModal.value = true
}

function confirmarPromoGeneral() {
  if (!validacionPromoGeneral.value.valido) return
  const elegido = opcionesPlatillosPromoGeneral.value.find((p) => p.id === platilloPromoElegidoId.value)
  if (!elegido || !promoGeneralActiva.value?.promoData) return
  const ok = cartStore.agregarPromoGeneralAlCarrito(promoGeneralActiva.value.promoData, elegido)
  if (ok !== false) {
    marcarProductoAgregado(promoGeneralActiva.value.id)
    showPromoGeneralModal.value = false
  }
}

const productosFiltrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  return productosMenu.value.filter((prod) => {
    if (categoriaActiva.value !== 'Todo' && prod.categoria !== categoriaActiva.value) {
      return false
    }
    if (q) {
      return (
        prod.nombre.toLowerCase().includes(q) ||
        (prod.categoria && prod.categoria.toLowerCase().includes(q)) ||
        (prod.subtitulo && prod.subtitulo.toLowerCase().includes(q))
      )
    }
    return true
  })
})

// Rollos para modal 2x1
const rollosFiltradosPromo = computed(() => {
  const q = busquedaRolloPromo.value.trim().toLowerCase()
  return ROLLOS_PROMO_MOCK.filter((r) => !q || r.nombre.toLowerCase().includes(q))
})

const metaRollosPromo = computed(() => numPromos2x1.value * 2)

const resumenPromo2x1 = computed(() => {
  const ordenados = [...rollosElegidos2x1.value].sort((a, b) => b.precioNum - a.precioNum)
  let subtotalNormal = 0
  let descuentoGratis = 0

  for (let i = 0; i < metaRollosPromo.value; i += 2) {
    const rMayor = ordenados[i] || null
    const rMenor = ordenados[i + 1] || null
    if (rMayor) subtotalNormal += rMayor.precioNum
    if (rMenor) {
      subtotalNormal += rMenor.precioNum
      descuentoGratis += rMenor.precioNum
    }
  }

  return {
    subtotalNormal,
    descuentoGratis,
    totalCobrar: subtotalNormal - descuentoGratis,
    completos: rollosElegidos2x1.value.length === metaRollosPromo.value
  }
})

function abrirModalPromo2x1() {
  numPromos2x1.value = 1
  rollosElegidos2x1.value = []
  busquedaRolloPromo.value = ''
  showPromo2x1Modal.value = true
}

function cambiarNumPromos2x1(nuevaCant) {
  const cant = Math.max(1, Math.min(6, nuevaCant))
  numPromos2x1.value = cant
  const maxRollos = cant * 2
  if (rollosElegidos2x1.value.length > maxRollos) {
    rollosElegidos2x1.value = rollosElegidos2x1.value.slice(0, maxRollos)
  }
}

function contarRolloEnPromo(rolloId) {
  return rollosElegidos2x1.value.filter((r) => r.id === rolloId).length
}

function agregarRolloAPromo(rollo) {
  if (rollosElegidos2x1.value.length >= metaRollosPromo.value) return
  rollosElegidos2x1.value.push({ ...rollo })
}

function quitarRolloDePromo(rolloId) {
  const idx = rollosElegidos2x1.value.findIndex((r) => r.id === rolloId)
  if (idx !== -1) {
    rollosElegidos2x1.value.splice(idx, 1)
  }
}

function confirmarPromo2x1() {
  if (!resumenPromo2x1.value.completos) return
  cartStore.agregarPromo2x1Configurable(numPromos2x1.value, rollosElegidos2x1.value)
  showPromo2x1Modal.value = false
}

// Paquete Sushi (5 barras, paga 4)
const rollosFiltradosPaq = computed(() => {
  const q = busquedaRolloPaq.value.trim().toLowerCase()
  return ROLLOS_PROMO_MOCK.filter((r) => !q || r.nombre.toLowerCase().includes(q))
})

const resumenPaqSushi = computed(() => {
  const ordenados = [...rollosElegidosPaqSushi.value].sort((a, b) => a.precioNum - b.precioNum)
  const gratis = rollosElegidosPaqSushi.value.length === 5 ? ordenados[0] : null
  const subtotalNormal = rollosElegidosPaqSushi.value.reduce((acc, r) => acc + r.precioNum, 0)
  const descuento = gratis ? gratis.precioNum : 0
  return {
    gratis,
    subtotalNormal,
    descuento,
    totalCobrar: subtotalNormal - descuento,
    completos: rollosElegidosPaqSushi.value.length === 5
  }
})

function abrirModalPaqueteSushi() {
  rollosElegidosPaqSushi.value = []
  busquedaRolloPaq.value = ''
  showPaqueteSushiModal.value = true
}

function contarRolloEnPaq(rolloId) {
  return rollosElegidosPaqSushi.value.filter((r) => r.id === rolloId).length
}

function agregarRolloAPaq(rollo) {
  if (rollosElegidosPaqSushi.value.length >= 5) return
  rollosElegidosPaqSushi.value.push({ ...rollo })
}

function quitarRolloDePaq(rolloId) {
  const idx = rollosElegidosPaqSushi.value.findIndex((r) => r.id === rolloId)
  if (idx !== -1) {
    rollosElegidosPaqSushi.value.splice(idx, 1)
  }
}

function confirmarPaqueteSushi() {
  if (!resumenPaqSushi.value.completos) return
  cartStore.agregarPaqueteSushi5x4(rollosElegidosPaqSushi.value)
  showPaqueteSushiModal.value = false
}

// Variantes y extras
const extrasPermitidosLista = computed(() =>
  EXTRAS_DISPONIBLES_MOCK.filter((e) => e.seleccionado !== false)
)

const costoExtrasModal = computed(() => {
  return extrasCheck.value.reduce(
    (acc, ex) => acc + (Number(ex.costo) || Number(String(ex.precio).replace(/[^0-9.]/g, '')) || 0),
    0
  )
})

const totalModalExtras = computed(() => {
  const base = Number(
    productoParaExtras.value?.precio ||
      itemCarritoParaExtras.value?.precioBase ||
      itemCarritoParaExtras.value?.precioUnitario ||
      0
  )
  return (base + costoExtrasModal.value) * cantidadModal.value
})

function elegirTamanoVariante(prod, variante) {
  prod.variantes.forEach((v) => {
    v.activa = v.label === variante.label
  })
}

function agregarVarianteSeleccionada(prod) {
  const activa = prod.variantes.find((v) => v.activa) || prod.variantes[0]
  cartStore.agregarProducto(prod, { variante: activa })
  marcarProductoAgregado(prod.id)
}

function clickAgregarProducto(prod) {
  if (prod.numCarnes && prod.numCarnes > 0) {
    abrirModalCarnes(prod)
    return
  }
  cartStore.agregarProducto(prod)
  marcarProductoAgregado(prod.id)
}

function inicializarSlotsCarnes(num) {
  if (num === 3) return ['Pollo', 'Cerdo', 'Res']
  if (num === 2) return ['Pollo', 'Res']
  return ['Pollo']
}

function abrirModalCarnes(prod) {
  productoParaCarnes.value = prod
  carnesSlots.value = inicializarSlotsCarnes(prod.numCarnes || 1)
  showCarnesModal.value = true
}

function seleccionarCarneSlot(slotIdx, carne) {
  carnesSlots.value[slotIdx] = carne
}

function confirmarModalCarnes() {
  if (!productoParaCarnes.value) return
  cartStore.agregarProducto(productoParaCarnes.value, {
    carnes: [...carnesSlots.value]
  })
  marcarProductoAgregado(productoParaCarnes.value.id)
  showCarnesModal.value = false
}

function abrirModalExtrasProducto(prod) {
  // Si el platillo ya está en el pedido actual, editar directamente sus extras
  const existenteEnCarrito = [...cartStore.items]
    .reverse()
    .find((i) => i.nombre === prod.nombre && !i.promocion)

  if (existenteEnCarrito) {
    abrirModalExtrasDesdeCarrito(existenteEnCarrito)
    return
  }

  productoParaExtras.value = prod
  itemCarritoParaExtras.value = null
  extrasCheck.value = []
  notaExtraCocina.value = ''
  cantidadModal.value = 1
  carnesModalExtras.value = prod.numCarnes > 0 ? inicializarSlotsCarnes(prod.numCarnes) : []
  showExtrasModal.value = true
}

function abrirModalExtrasDesdeCarrito(item) {
  itemCarritoParaExtras.value = item
  productoParaExtras.value = null
  const preseleccionados = item.extrasSeleccionados || []
  extrasCheck.value = EXTRAS_DISPONIBLES_MOCK.filter((e) => preseleccionados.includes(e.nombre)).map((e) => ({ ...e }))
  notaExtraCocina.value = ''
  cantidadModal.value = item.cantidad
  carnesModalExtras.value = Array.isArray(item.carnesSeleccionadas) ? [...item.carnesSeleccionadas] : []
  showExtrasModal.value = true
}

function isExtraMarcado(ex) {
  return extrasCheck.value.some((e) => e.id === ex.id)
}

function toggleExtraModal(ex) {
  const idx = extrasCheck.value.findIndex((e) => e.id === ex.id)
  if (idx > -1) {
    extrasCheck.value.splice(idx, 1)
  } else {
    extrasCheck.value.push({ ...ex })
  }
}

function confirmarModalExtras() {
  if (itemCarritoParaExtras.value) {
    cartStore.actualizarExtrasItem(
      itemCarritoParaExtras.value.id,
      extrasCheck.value,
      notaExtraCocina.value.trim(),
      carnesModalExtras.value.length > 0 ? [...carnesModalExtras.value] : null
    )
  } else if (productoParaExtras.value) {
    cartStore.agregarProducto(productoParaExtras.value, {
      carnes: carnesModalExtras.value.length > 0 ? [...carnesModalExtras.value] : undefined,
      extras: extrasCheck.value,
      notaCocina: notaExtraCocina.value.trim(),
      cantidad: cantidadModal.value
    })
  }
  showExtrasModal.value = false
}

function limpiarBusquedaVenta() {
  busqueda.value = ''
  categoriaActiva.value = 'Todo'
}
</script>

<template>
  <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
    <h1 style="font-size:22px;font-weight:600">Productos del pedido</h1>
    <StepIndicator :current-step="2" />
  </div>

  <div class="venta-prod-layout">
    <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:14px">
      <!-- Buscador con ícono vectorial SVG -->
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <div class="search-wrap" style="flex:1;min-width:220px;max-width:420px">
          <svg class="search-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21l-4.3-4.3"></path>
          </svg>
          <input
            v-model="busqueda"
            class="inp search-inp"
            type="search"
            placeholder="Buscar por nombre"
          >
        </div>

        <BaseButton
          v-if="promoValidaHoy"
          variant="p"
          href="#"
          @click.prevent="abrirModalPromo2x1"
        >
          Promoción 2x1
        </BaseButton>

        <BaseButton
          v-if="busqueda || categoriaActiva !== 'Todo'"
          variant="s"
          href="#"
          @click.prevent="limpiarBusquedaVenta"
        >
          Ver todo
        </BaseButton>
      </div>

      <!-- Categorías -->
      <div style="display:flex;flex-wrap:wrap;gap:6px">
        <a
          v-for="cat in categoriasVisibles"
          :key="cat"
          href="#"
          :class="['chip', 'chip-sm', { on: categoriaActiva === cat }]"
          @click.prevent="categoriaActiva = cat"
        >
          {{ cat }}
        </a>
      </div>

      <!-- Cuadrícula de productos limpia con imagen igual que en el catálogo -->
      <div v-if="productosFiltrados.length > 0" class="venta-grid">
        <div
          v-for="prod in productosFiltrados"
          :key="prod.id"
          :class="['card', 'venta-item-card', { 'card-added-flash': recienAgregados[prod.id] }]"
        >
          <div :class="['ph', { no: !prod.tieneFoto && !prod.imagenUrl }]">
            <img
              v-if="prod.imagenUrl"
              :src="prod.imagenUrl"
              :alt="prod.nombre"
              loading="lazy"
              class="prod-img"
            >
            <ProductoVectorArt
              v-else
              :nombre="prod.nombre"
              :categoria="prod.categoria"
              :subtitulo="prod.subtitulo || prod.descripcion || prod.presentacion"
              :tipo="prod.tipoCard"
            />

            <button
              type="button"
              class="prod-info-btn"
              title="Ver información y condiciones"
              aria-label="Ver información y condiciones"
              @click.stop.prevent="abrirInfoProducto(prod)"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </button>
          </div>

          <div class="nm">{{ prod.nombre }}</div>

          <!-- Promoción 2x1 (Solo aparece Lunes y Martes) -->
          <div
            v-if="prod.tipoCard === 'promo_2x1'"
            class="row"
            style="justify-content:space-between;margin-top:auto"
          >
            <span class="pr">2x1</span>
            <a class="btn p sm" href="#" @click.prevent="abrirModalPromo2x1">
              Elegir
            </a>
          </div>

          <!-- Paquete Sushi (5 barras, paga 4) -->
          <div
            v-else-if="prod.tipoCard === 'paquete_sushi'"
            class="row"
            style="justify-content:space-between;margin-top:auto"
          >
            <span class="pr">5x4</span>
            <a class="btn s sm" href="#" @click.prevent="abrirModalPaqueteSushi">
              Elegir
            </a>
          </div>

          <!-- Otras Promociones (Combos con descuento, Postre gratis, Especial fin de semana) -->
          <div
            v-else-if="prod.tipoCard === 'promo_general'"
            class="row"
            style="justify-content:space-between;margin-top:auto"
          >
            <span class="pr">{{ prod.etiquetaCorto || 'Promo' }}</span>
            <a
              :class="['btn', 'p', 'sm', { 'btn-added-flash': recienAgregados[prod.id] }]"
              href="#"
              @click.prevent="abrirModalPromoGeneral(prod)"
            >
              {{ recienAgregados[prod.id] ? '✓ Agregado' : 'Elegir' }}
            </a>
          </div>

          <!-- Bebidas con tamaños (Té Verde y Kalpis) -->
          <div
            v-else-if="prod.tipoCard === 'variantes'"
            style="display:flex;flex-direction:column;gap:6px;margin-top:auto"
          >
            <div style="display:flex;gap:6px">
              <span
                v-for="v in prod.variantes"
                :key="v.label"
                :class="['chip', 'chip-sm', { on: v.activa }]"
                style="height:28px;flex:1;justify-content:center;padding:0 6px"
                @click="elegirTamanoVariante(prod, v)"
              >
                {{ v.label }}
              </span>
            </div>
            <a
              :class="['btn', 's', 'sm', { 'btn-added-flash': recienAgregados[prod.id] }]"
              href="#"
              style="width:100%"
              @click.prevent="agregarVarianteSeleccionada(prod)"
            >
              {{ recienAgregados[prod.id] ? '✓ Agregado' : 'Agregar' }}
            </a>
          </div>

          <!-- Platillo o paquete normal -->
          <div
            v-else
            class="row"
            style="justify-content:space-between;margin-top:auto"
          >
            <span class="pr">${{ prod.precio }}</span>
            <div class="row" style="gap:8px">
              <a
                v-if="prod.permiteExtras"
                href="#"
                class="edit"
                style="font-size:12px"
                @click.prevent="abrirModalExtrasProducto(prod)"
              >
                Extras
              </a>
              <a
                :class="['btn', 's', 'sm', { 'btn-added-flash': recienAgregados[prod.id] }]"
                href="#"
                @click.prevent="clickAgregarProducto(prod)"
              >
                {{ recienAgregados[prod.id] ? '✓ Agregado' : prod.numCarnes > 0 ? 'Elegir' : 'Agregar' }}
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Estado vacío -->
      <div
        v-else
        class="card"
        style="align-items:center;justify-content:center;padding:44px 24px;text-align:center;gap:10px"
      >
        <div class="ico" style="width:48px;height:48px;border-radius:50%">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21l-4.3-4.3"></path>
          </svg>
        </div>
        <h3 style="font-size:15px;font-weight:600">Sin resultados</h3>
        <BaseButton variant="s" href="#" @click.prevent="limpiarBusquedaVenta">
          Mostrar todo
        </BaseButton>
      </div>
    </div>

    <CarritoLateral @editar-extras="abrirModalExtrasDesdeCarrito" />
  </div>

  <!-- ========================================================================= -->
  <!-- MODAL PROMOCIÓN 2x1 (Limpio y directo)                                    -->
  <!-- ========================================================================= -->
  <BaseModal
    v-model="showPromo2x1Modal"
    aria-label="Promoción 2x1"
    width="520px"
  >
    <div class="row" style="justify-content:space-between">
      <h2 style="font-size:18px;font-weight:600">Promoción 2x1</h2>
      <StatusTag>{{ rollosElegidos2x1.length }} / {{ metaRollosPromo }} rollos</StatusTag>
    </div>

    <div class="seg">
      <span
        v-for="n in [1, 2, 3]"
        :key="n"
        :class="{ on: numPromos2x1 === n }"
        style="cursor:pointer"
        @click="cambiarNumPromos2x1(n)"
      >
        {{ n }} {{ n === 1 ? 'promo (2 rollos)' : `promos (${n * 2} rollos)` }}
      </span>
    </div>

    <div class="search-wrap">
      <svg class="search-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="M21 21l-4.3-4.3"></path>
      </svg>
      <input
        v-model="busquedaRolloPromo"
        class="inp search-inp"
        type="search"
        placeholder="Buscar rollo"
        style="height:38px"
      >
    </div>

    <div class="rollos-selector-list">
      <div
        v-for="rollo in rollosFiltradosPromo"
        :key="rollo.id"
        :class="['rollo-pick-item', { selected: contarRolloEnPromo(rollo.id) > 0 }]"
      >
        <span style="font-size:13px;font-weight:500">{{ rollo.nombre }}</span>
        <div class="row" style="gap:10px;flex:none">
          <span class="pr">${{ rollo.precioNum }}</span>
          <div class="st">
            <button
              type="button"
              :disabled="contarRolloEnPromo(rollo.id) === 0"
              @click="quitarRolloDePromo(rollo.id)"
            >
              −
            </button>
            <span>{{ contarRolloEnPromo(rollo.id) }}</span>
            <button
              type="button"
              :disabled="rollosElegidos2x1.length >= metaRollosPromo"
              @click="agregarRolloAPromo(rollo)"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="row" style="justify-content:space-between;padding-top:8px;border-top:1px solid var(--bd)">
      <strong style="font-size:16px">Total: ${{ resumenPromo2x1.totalCobrar }}</strong>
      <div class="row" style="gap:10px">
        <BaseButton variant="s" href="#" @click.prevent="showPromo2x1Modal = false">Cancelar</BaseButton>
        <BaseButton
          variant="p"
          href="#"
          :style="{ opacity: resumenPromo2x1.completos ? 1 : 0.5, pointerEvents: resumenPromo2x1.completos ? 'auto' : 'none' }"
          @click.prevent="confirmarPromo2x1"
        >
          Agregar
        </BaseButton>
      </div>
    </div>
  </BaseModal>

  <!-- ========================================================================= -->
  <!-- MODAL PAQUETE SUSHI (5 barras, paga 4)                                    -->
  <!-- ========================================================================= -->
  <BaseModal
    v-model="showPaqueteSushiModal"
    aria-label="Paquete Sushi"
    width="520px"
  >
    <div class="row" style="justify-content:space-between">
      <h2 style="font-size:18px;font-weight:600">Paquete Sushi (5 barras)</h2>
      <StatusTag>{{ rollosElegidosPaqSushi.length }} / 5</StatusTag>
    </div>

    <div class="search-wrap">
      <svg class="search-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="M21 21l-4.3-4.3"></path>
      </svg>
      <input
        v-model="busquedaRolloPaq"
        class="inp search-inp"
        type="search"
        placeholder="Buscar rollo"
        style="height:38px"
      >
    </div>

    <div class="rollos-selector-list">
      <div
        v-for="rollo in rollosFiltradosPaq"
        :key="rollo.id"
        :class="['rollo-pick-item', { selected: contarRolloEnPaq(rollo.id) > 0 }]"
      >
        <span style="font-size:13px;font-weight:500">{{ rollo.nombre }}</span>
        <div class="row" style="gap:10px;flex:none">
          <span class="pr">${{ rollo.precioNum }}</span>
          <div class="st">
            <button type="button" :disabled="contarRolloEnPaq(rollo.id) === 0" @click="quitarRolloDePaq(rollo.id)">−</button>
            <span>{{ contarRolloEnPaq(rollo.id) }}</span>
            <button type="button" :disabled="rollosElegidosPaqSushi.length >= 5" @click="agregarRolloAPaq(rollo)">+</button>
          </div>
        </div>
      </div>
    </div>

    <div class="row" style="justify-content:space-between;padding-top:8px;border-top:1px solid var(--bd)">
      <strong style="font-size:16px">Total: ${{ resumenPaqSushi.totalCobrar }}</strong>
      <div class="row" style="gap:10px">
        <BaseButton variant="s" href="#" @click.prevent="showPaqueteSushiModal = false">Cancelar</BaseButton>
        <BaseButton
          variant="p"
          href="#"
          :style="{ opacity: resumenPaqSushi.completos ? 1 : 0.5, pointerEvents: resumenPaqSushi.completos ? 'auto' : 'none' }"
          @click.prevent="confirmarPaqueteSushi"
        >
          Agregar
        </BaseButton>
      </div>
    </div>
  </BaseModal>

  <!-- ========================================================================= -->
  <!-- MODAL SELECCIÓN DE CARNES (Pollo, Cerdo, Res)                             -->
  <!-- ========================================================================= -->
  <BaseModal
    v-model="showCarnesModal"
    aria-label="Seleccionar carne"
    width="440px"
  >
    <div class="row" style="justify-content:space-between">
      <h2 style="font-size:18px;font-weight:600">{{ productoParaCarnes?.nombre }}</h2>
      <StatusTag>
        {{ carnesSlots.length === 1 ? '1 carne' : `${carnesSlots.length} carnes` }}
      </StatusTag>
    </div>

    <div style="display:flex;flex-direction:column;gap:10px;padding:4px 0">
      <div
        v-for="(carneActual, idx) in carnesSlots"
        :key="idx"
        style="display:flex;align-items:center;justify-content:space-between;gap:12px"
      >
        <span v-if="carnesSlots.length > 1" style="font-size:13px;font-weight:600;min-width:64px">
          Carne {{ idx + 1 }}
        </span>
        <div class="seg" style="flex:1">
          <span
            v-for="op in OPCIONES_CARNE"
            :key="op"
            :class="{ on: carneActual === op }"
            style="cursor:pointer"
            @click="seleccionarCarneSlot(idx, op)"
          >
            {{ op }}
          </span>
        </div>
      </div>
    </div>

    <div class="row" style="justify-content:space-between;padding-top:8px;border-top:1px solid var(--bd)">
      <strong style="font-size:16px">Total: ${{ productoParaCarnes?.precio }}</strong>
      <div class="row" style="gap:10px">
        <BaseButton variant="s" href="#" @click.prevent="showCarnesModal = false">Cancelar</BaseButton>
        <BaseButton variant="p" href="#" @click.prevent="confirmarModalCarnes">
          Agregar
        </BaseButton>
      </div>
    </div>
  </BaseModal>

  <!-- ========================================================================= -->
  <!-- MODAL EXTRAS (Limpio y compacto)                                          -->
  <!-- ========================================================================= -->
  <BaseModal
    v-model="showExtrasModal"
    aria-label="Extras del platillo"
    width="500px"
  >
    <h2 style="font-size:18px;font-weight:600">
      Extras · {{ productoParaExtras?.nombre || itemCarritoParaExtras?.nombre }}
    </h2>

    <!-- Si el platillo también lleva elección de carnes (Pollo, Cerdo, Res) -->
    <div v-if="carnesModalExtras.length > 0" style="display:flex;flex-direction:column;gap:8px;padding-bottom:6px;border-bottom:1px solid var(--bd)">
      <div
        v-for="(carneAct, idx) in carnesModalExtras"
        :key="idx"
        style="display:flex;align-items:center;justify-content:space-between;gap:10px"
      >
        <span style="font-size:12px;font-weight:600;min-width:58px">
          {{ carnesModalExtras.length === 1 ? 'Carne' : `Carne ${idx + 1}` }}
        </span>
        <div class="seg" style="flex:1;height:34px">
          <span
            v-for="op in OPCIONES_CARNE"
            :key="op"
            :class="{ on: carneAct === op }"
            style="cursor:pointer;font-size:12px"
            @click="carnesModalExtras[idx] = op"
          >
            {{ op }}
          </span>
        </div>
      </div>
    </div>

    <div class="extras-modal-grid" style="max-height:260px;overflow-y:auto;padding-right:4px">
      <label
        v-for="ex in extrasPermitidosLista"
        :key="ex.id"
        :class="['extra-option-box', { on: isExtraMarcado(ex) }]"
      >
        <span class="row" style="gap:8px">
          <input
            type="checkbox"
            :checked="isExtraMarcado(ex)"
            style="width:16px;height:16px;accent-color:#C94C08"
            @change="toggleExtraModal(ex)"
          >
          <span style="font-size:13px;font-weight:500">{{ ex.nombre }}</span>
        </span>
        <span class="pr">{{ ex.precio }}</span>
      </label>
    </div>

    <input
      id="nota-ex"
      v-model="notaExtraCocina"
      class="inp"
      type="text"
      placeholder="Nota para cocina (opcional)"
      style="height:38px"
    >

    <div class="row" style="justify-content:space-between;padding-top:8px;border-top:1px solid var(--bd)">
      <strong style="font-size:16px">Total: ${{ totalModalExtras }}</strong>
      <div class="row" style="gap:10px">
        <BaseButton variant="s" href="#" @click.prevent="showExtrasModal = false">Cancelar</BaseButton>
        <BaseButton variant="p" href="#" @click.prevent="confirmarModalExtras">
          {{ itemCarritoParaExtras ? 'Guardar' : 'Agregar' }}
        </BaseButton>
      </div>
    </div>
  </BaseModal>

  <!-- ========================================================================= -->
  <!-- MINI VENTANA DE INGREDIENTES / DESCRIPCIÓN DEL PLATILLO                   -->
  <!-- ========================================================================= -->
  <BaseModal
    v-model="showInfoProdModal"
    aria-label="Descripción del platillo"
    width="380px"
  >
    <template v-if="productoInfoActivo">
      <div class="info-modal-photo">
        <img
          v-if="productoInfoActivo.imagenUrl"
          :src="productoInfoActivo.imagenUrl"
          :alt="productoInfoActivo.nombre"
        >
        <ProductoVectorArt
          v-else
          :nombre="productoInfoActivo.nombre"
          :categoria="productoInfoActivo.categoria"
          :subtitulo="productoInfoActivo.subtitulo || productoInfoActivo.descripcion || productoInfoActivo.presentacion"
          :tipo="productoInfoActivo.tipoCard"
        />
      </div>

      <div class="row" style="justify-content:space-between;align-items:flex-start;gap:10px">
        <div style="display:flex;flex-direction:column;gap:4px">
          <div class="row" style="gap:6px;flex-wrap:wrap">
            <StatusTag>{{ productoInfoActivo.categoria }}</StatusTag>
            <span v-if="productoInfoActivo.presentacion" class="sub" style="font-size:12px">
              {{ productoInfoActivo.presentacion }}
            </span>
          </div>
          <h2 style="font-size:18px;font-weight:600;line-height:1.25">{{ productoInfoActivo.nombre }}</h2>
        </div>
        <span style="font-size:16px;font-weight:600;color:var(--act);white-space:nowrap">
          <template v-if="productoInfoActivo.tipoCard === 'promo_2x1'">2x1</template>
          <template v-else-if="productoInfoActivo.tipoCard === 'paquete_sushi'">5x4</template>
          <template v-else-if="productoInfoActivo.tipoCard === 'promo_general'">
            {{ productoInfoActivo.etiquetaCorto || 'Promo' }}
          </template>
          <template v-else-if="productoInfoActivo.tipoCard === 'variantes'">
            {{ productoInfoActivo.variantes?.map((v) => v.label).join(' / ') }}
          </template>
          <template v-else>${{ productoInfoActivo.precio }}</template>
        </span>
      </div>

      <div class="info-desc-box">
        <span class="info-desc-label">
          {{ productoInfoActivo.categoria === 'Promociones' ? 'Beneficio y platillos participantes' : 'Ingredientes / Qué incluye' }}
        </span>
        <p style="font-size:14px;line-height:1.5;color:var(--tx)">
          {{ productoInfoActivo.descripcion || productoInfoActivo.subtitulo || 'Sin descripción adicional registrada para este platillo.' }}
        </p>
        <div
          v-if="productoInfoActivo.promoData?.productosIncluidos?.length"
          style="display:flex;flex-direction:column;gap:6px;padding-top:6px;border-top:1px solid var(--bd)"
        >
          <span class="info-desc-label">
            {{
              productoInfoActivo.tipoCard === 'promo_2x1'
                ? `Todos los rollos incluidos (${productoInfoActivo.promoData.productosIncluidos.length})`
                : `Platillos participantes (${productoInfoActivo.promoData.productosIncluidos.length})`
            }}
          </span>
          <div style="display:flex;flex-wrap:wrap;gap:6px;max-height:120px;overflow-y:auto;padding-right:4px">
            <StatusTag
              v-for="nomP in productoInfoActivo.promoData.productosIncluidos"
              :key="nomP"
              style="height:24px;font-size:11.5px"
            >
              {{ nomP }}
            </StatusTag>
          </div>
        </div>
      </div>

      <div class="row" style="justify-content:flex-end;gap:8px;padding-top:2px">
        <BaseButton variant="s" href="#" @click.prevent="showInfoProdModal = false">
          Cerrar
        </BaseButton>
        <BaseButton variant="p" href="#" @click.prevent="accionarDesdeInfoModal(productoInfoActivo)">
          {{
            productoInfoActivo.numCarnes > 0 ||
            productoInfoActivo.tipoCard === 'promo_2x1' ||
            productoInfoActivo.tipoCard === 'paquete_sushi' ||
            productoInfoActivo.tipoCard === 'promo_general'
              ? 'Elegir'
              : 'Agregar al pedido'
          }}
        </BaseButton>
      </div>
    </template>
  </BaseModal>

  <!-- ========================================================================= -->
  <!-- MODAL APLICAR PROMOCIÓN (Descuento en paquetes, Postre gratis, Especial)  -->
  <!-- ========================================================================= -->
  <BaseModal
    v-model="showPromoGeneralModal"
    aria-label="Aplicar promoción al pedido"
    width="480px"
  >
    <template v-if="promoGeneralActiva">
      <div class="row" style="justify-content:space-between;align-items:flex-start">
        <div style="display:flex;flex-direction:column;gap:2px">
          <h2 style="font-size:18px;font-weight:600">{{ promoGeneralActiva.nombre }}</h2>
          <span class="sub" style="font-size:12.5px">
            {{ promoGeneralActiva.promoData?.descuento }} · Aplica: {{ promoGeneralActiva.promoData?.dia }}
          </span>
        </div>
        <StatusTag variant="ok">{{ promoGeneralActiva.etiquetaCorto }}</StatusTag>
      </div>

      <!-- Mensaje de validación de requisitos de la promoción -->
      <div
        :style="{
          padding: '10px 12px',
          borderRadius: '10px',
          fontSize: '12.5px',
          fontWeight: '500',
          lineHeight: '1.45',
          background: validacionPromoGeneral.tipo === 'ok' ? 'var(--oks)' : 'var(--acs)',
          color: validacionPromoGeneral.tipo === 'ok' ? 'var(--ok)' : '#C94C08',
          border: validacionPromoGeneral.tipo === 'ok' ? '1px solid var(--ok)' : '1px solid #F26A1B'
        }"
      >
        {{ validacionPromoGeneral.mensaje }}
      </div>

      <div style="display:flex;flex-direction:column;gap:8px;max-height:270px;overflow-y:auto;padding-right:2px">
        <label
          v-for="item in opcionesPlatillosPromoGeneral"
          :key="item.id"
          :class="['rollo-pick-item', { selected: platilloPromoElegidoId === item.id }]"
          style="cursor:pointer;padding:10px 14px"
        >
          <span class="row" style="gap:10px;min-width:0">
            <input
              v-model="platilloPromoElegidoId"
              type="radio"
              :value="item.id"
              style="width:16px;height:16px;accent-color:#C94C08;flex-shrink:0"
            >
            <span style="display:flex;flex-direction:column;gap:2px;min-width:0">
              <strong style="font-size:13.5px">{{ item.nombre }}</strong>
              <span v-if="item.descripcion" class="sub" style="font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:250px">
                {{ item.descripcion }}
              </span>
            </span>
          </span>
          <span class="row" style="gap:8px;flex-shrink:0">
            <span class="sub" style="text-decoration:line-through;font-size:12px">${{ item.precioOriginal }}</span>
            <strong style="color:var(--act);font-size:14.5px">
              {{ item.precioFinal === 0 ? 'GRATIS' : `$${item.precioFinal}` }}
            </strong>
          </span>
        </label>
      </div>

      <div class="row" style="justify-content:flex-end;gap:10px;padding-top:6px;border-top:1px solid var(--bd)">
        <BaseButton variant="s" href="#" @click.prevent="showPromoGeneralModal = false">
          Cancelar
        </BaseButton>
        <BaseButton
          variant="p"
          href="#"
          :disabled="!platilloPromoElegidoId || !validacionPromoGeneral.valido"
          @click.prevent="confirmarPromoGeneral"
        >
          Aplicar promoción
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
.venta-prod-layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.venta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(195px, 1fr));
  gap: 12px;
}

@media (max-width: 960px) {
  .venta-prod-layout {
    flex-direction: column;
  }
}

.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-ico {
  position: absolute;
  left: 12px;
  color: var(--tx2);
  pointer-events: none;
}

.search-inp {
  padding-left: 36px;
}

.venta-item-card {
  padding: 12px;
  gap: 8px;
  border-radius: 15px;
  transition: transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
}

.venta-item-card:hover {
  transform: translateY(-2px);
  border-color: var(--ac);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.04);
}

.ph {
  background: var(--acs);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--act);
  height: 82px;
  overflow: hidden;
  position: relative;
}

.prod-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.prod-info-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 5;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid rgba(31, 26, 23, 0.14);
  background: rgba(255, 255, 255, 0.92);
  color: #1F1A17;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  transition: transform 0.16s ease, background-color 0.16s ease, color 0.16s ease, border-color 0.16s ease;
}

.prod-info-btn:hover {
  transform: scale(1.1);
  background: var(--btn);
  color: #ffffff;
  border-color: var(--btn);
}

.info-modal-photo {
  width: 100%;
  height: 145px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--bg2);
}

.info-modal-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.info-desc-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--bg2);
  border: 1.5px solid var(--bd);
}

.info-desc-label {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--tx2);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.ph.no {
  background: var(--bg2);
  color: var(--tx2);
  opacity: 0.72;
}

.chip-sm {
  height: 30px;
  padding: 0 12px;
  border-radius: 15px;
  font-size: 12px;
}

.btn.sm {
  height: 32px;
  padding: 0 12px;
  font-size: 13px;
  border-radius: 8px;
  transition: background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.btn-added-flash {
  background: #F26A1B !important;
  color: #FFFFFF !important;
  border-color: #F26A1B !important;
  box-shadow: 0 0 0 4px rgba(242, 106, 27, 0.25), 0 6px 14px rgba(242, 106, 27, 0.35) !important;
  transform: scale(1.05);
}

.card-added-flash {
  border-color: #F26A1B !important;
  box-shadow: 0 0 0 3px rgba(242, 106, 27, 0.18) !important;
}

.nm {
  font-size: 13px;
  font-weight: 600;
}

.pr {
  font-size: 13px;
  font-weight: 600;
  color: var(--act);
}

.rollos-selector-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 240px;
  overflow-y: auto;
  padding-right: 4px;
}

.rollo-pick-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border: 1px solid var(--bd);
  border-radius: 10px;
  background: var(--sf);
}

.rollo-pick-item.selected {
  border-color: var(--btn);
  background: var(--acs);
}

.st {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--bd);
  border-radius: 8px;
  height: 28px;
  background: var(--sf);
}

.st button {
  width: 26px;
  height: 26px;
  border: 0;
  background: transparent;
  color: var(--tx);
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
}

.st button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.st span {
  min-width: 22px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
}

.extras-modal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.extra-option-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border: 1px solid var(--bd);
  border-radius: 8px;
  cursor: pointer;
}

.extra-option-box.on {
  border-color: var(--btn);
  background: var(--acs);
}
</style>
