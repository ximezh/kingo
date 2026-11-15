<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { CATEGORIAS_MOCK, PRODUCTOS_MOCK, CATEGORIAS_NOTAS_MAP } from '@/services/catalogo.service'
import { PROMOCIONES_MOCK } from '@/services/promociones.service'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import StatusTag from '@/components/ui/StatusTag.vue'
import ProductoVectorArt from '@/components/ui/ProductoVectorArt.vue'
import ProductoCard from '@/modules/catalogo/components/ProductoCard.vue'

const authStore = useAuthStore()

const isAdmin = computed(() => authStore.role === 'admin')
const busqueda = ref('')
const categoriaActiva = ref('Todas')
const productos = ref(PRODUCTOS_MOCK)
const showInfoModal = ref(false)
const productoDetalle = ref(null)

const promocionesComoCatalogo = computed(() =>
  PROMOCIONES_MOCK.map((pr) => ({
    id: `promo-${pr.id}`,
    promoId: pr.id,
    esPromocion: true,
    nombre: pr.nombre,
    categoria: 'Promociones',
    diaCorto: pr.dia,
    presentacion: `${pr.dia} · ${pr.vigencia}`,
    descripcion: `${pr.descuento} · Vigencia: ${pr.dia} (${pr.vigencia}).`,
    productosIncluidos: pr.productosIncluidos || [],
    precio: null,
    precioNulo: true,
    precioTextoPromo: pr.descuento,
    imagenUrl: null,
    esVector: true,
    tieneFoto: false,
    activo: pr.activa !== false,
    editarRuta: `/admin/promociones/editar?id=${pr.id}`
  }))
)

const itemsCatalogoCompletos = computed(() => [
  ...promocionesComoCatalogo.value,
  ...productos.value
])

function abrirDetalleProducto(prod) {
  productoDetalle.value = prod
  showInfoModal.value = true
}

const notaDetalle = computed(() => {
  if (!productoDetalle.value) return ''
  return productoDetalle.value.presentacion || CATEGORIAS_NOTAS_MAP[productoDetalle.value.categoria] || ''
})

const precioDetalle = computed(() => {
  const p = productoDetalle.value
  if (!p) return ''
  if (p.precioTextoPromo) return p.precioTextoPromo
  if (p.variantes && p.variantes.length > 0) {
    return p.variantes.map((v) => `${v.nombre} $${v.precio}`).join(' / ')
  }
  if (p.precioNulo || p.precio === null) {
    return 'Paga 4, lleva 5'
  }
  return `$${p.precio}`
})

const productosFiltrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  return itemsCatalogoCompletos.value.filter((p) => {
    if (categoriaActiva.value !== 'Todas' && p.categoria !== categoriaActiva.value) {
      return false
    }
    if (q) {
      return (
        p.nombre.toLowerCase().includes(q) ||
        (p.categoria && p.categoria.toLowerCase().includes(q)) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(q))
      )
    }
    return true
  })
})

function limpiarFiltros() {
  busqueda.value = ''
  categoriaActiva.value = 'Todas'
}
</script>

<template>
  <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
    <div class="row" style="gap:10px">
      <h1 style="font-size:22px;font-weight:600">Productos</h1>
      <StatusTag>{{ productosFiltrados.length }}</StatusTag>
    </div>

    <div class="row" style="gap:10px;flex:1;justify-content:flex-end;min-width:260px">
      <label for="buscar" style="position:absolute;left:-9999px">Buscar producto</label>
      <div class="search-wrap" style="max-width:320px;flex:1">
        <svg class="search-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="M21 21l-4.3-4.3"></path>
        </svg>
        <input
          id="buscar"
          v-model="busqueda"
          class="inp search-inp"
          type="search"
          placeholder="Buscar platillo o ingrediente..."
        >
      </div>
      <BaseButton
        v-if="isAdmin && categoriaActiva === 'Promociones'"
        variant="p"
        to="/admin/promociones/nueva"
      >
        + Nueva promoción
      </BaseButton>
      <BaseButton v-else-if="isAdmin" variant="p" to="/admin/productos/nuevo">
        + Nuevo producto
      </BaseButton>
    </div>
  </div>

  <div style="display:flex;flex-wrap:wrap;gap:8px">
    <a
      v-for="cat in CATEGORIAS_MOCK"
      :key="cat"
      href="#"
      :class="['chip', { on: categoriaActiva === cat }]"
      @click.prevent="categoriaActiva = cat"
    >
      {{ cat }}
    </a>
  </div>

  <div v-if="productosFiltrados.length > 0" class="catalogo-grid">
    <ProductoCard
      v-for="prod in productosFiltrados"
      :key="prod.id"
      :producto="prod"
      :editable="isAdmin"
      @ver-info="abrirDetalleProducto"
    />
  </div>

  <div v-else class="card" style="align-items:center;justify-content:center;padding:44px 24px;text-align:center;gap:10px">
    <div class="ico" style="width:48px;height:48px;border-radius:50%">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="M21 21l-4.3-4.3"></path>
      </svg>
    </div>
    <h3 style="font-size:15px;font-weight:600">Sin resultados</h3>
    <BaseButton variant="s" href="#" @click.prevent="limpiarFiltros">
      Ver todo
    </BaseButton>
  </div>

  <!-- Mini ventana de ingredientes / descripción del platillo -->
  <BaseModal
    v-model="showInfoModal"
    aria-label="Descripción del platillo"
    width="390px"
  >
    <template v-if="productoDetalle">
      <div class="info-modal-photo">
        <img
          v-if="productoDetalle.imagenUrl"
          :src="productoDetalle.imagenUrl"
          :alt="productoDetalle.nombre"
        >
        <ProductoVectorArt
          v-else
          :nombre="productoDetalle.nombre"
          :categoria="productoDetalle.categoria"
          :subtitulo="productoDetalle.esPromocion ? (productoDetalle.precioTextoPromo || productoDetalle.nombre) : (productoDetalle.descripcion || '')"
        />
      </div>

      <div class="row" style="justify-content:space-between;align-items:flex-start;gap:10px">
        <div style="display:flex;flex-direction:column;gap:4px">
          <div class="row" style="gap:6px;flex-wrap:wrap">
            <StatusTag>{{ productoDetalle.categoria }}</StatusTag>
            <span v-if="notaDetalle" class="sub" style="font-size:12px">{{ notaDetalle }}</span>
          </div>
          <h2 style="font-size:18px;font-weight:600;line-height:1.25">{{ productoDetalle.nombre }}</h2>
        </div>
        <span style="font-size:15px;font-weight:600;color:var(--act);white-space:nowrap">{{ precioDetalle }}</span>
      </div>

      <div class="info-desc-box">
        <div class="row" style="justify-content:space-between">
          <span class="info-desc-label">
            {{ productoDetalle.esPromocion ? 'Condiciones de la promoción' : 'Ingredientes / Descripción' }}
          </span>
          <span
            v-if="productoDetalle.descripcion && productoDetalle.descripcion.includes('D:')"
            class="sub"
            style="font-size:11px;font-weight:600;color:var(--act)"
          >
            D: Dentro · A: Afuera
          </span>
        </div>
        <p style="font-size:14px;line-height:1.5;color:var(--tx)">
          {{ productoDetalle.descripcion || 'Sin descripción adicional registrada para este platillo.' }}
        </p>
        <div
          v-if="productoDetalle.esPromocion && Array.isArray(productoDetalle.productosIncluidos) && productoDetalle.productosIncluidos.length > 0"
          style="display:flex;flex-direction:column;gap:6px;margin-top:6px;padding-top:8px;border-top:1px solid var(--bd)"
        >
          <span class="info-desc-label">Platillos participantes ({{ productoDetalle.productosIncluidos.length }})</span>
          <div style="display:flex;flex-wrap:wrap;gap:6px;max-height:120px;overflow-y:auto;padding-right:4px">
            <StatusTag
              v-for="plat in productoDetalle.productosIncluidos"
              :key="plat"
              style="height:24px;font-size:11.5px"
            >
              {{ plat }}
            </StatusTag>
          </div>
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:8px;padding-top:2px">
        <BaseButton
          v-if="isAdmin"
          variant="s"
          :to="productoDetalle.editarRuta || `/admin/productos/editar?id=${productoDetalle.id}`"
          @click="showInfoModal = false"
        >
          Editar
        </BaseButton>
        <BaseButton variant="p" href="#" @click.prevent="showInfoModal = false">
          Cerrar
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
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

.catalogo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(215px, 1fr));
  gap: 16px;
}

.info-modal-photo {
  width: 100%;
  height: 150px;
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
  gap: 5px;
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
</style>
