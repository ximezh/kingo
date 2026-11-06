<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { CATEGORIAS_MOCK, CATEGORIAS_NOTAS_MAP, PRODUCTOS_MOCK } from '@/services/catalogo.service'
import BaseButton from '@/components/ui/BaseButton.vue'
import ProductoCard from '@/modules/catalogo/components/ProductoCard.vue'

const authStore = useAuthStore()

const isAdmin = computed(() => authStore.role === 'admin')
const busqueda = ref('')
const categoriaActiva = ref('Todas')
const productos = ref(PRODUCTOS_MOCK)

const notaCategoriaActual = computed(() => {
  if (categoriaActiva.value === 'Todas') return ''
  return CATEGORIAS_NOTAS_MAP[categoriaActiva.value] || ''
})

const productosFiltrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  return productos.value.filter((p) => {
    if (categoriaActiva.value !== 'Todas' && p.categoria !== categoriaActiva.value) {
      return false
    }
    if (q) {
      return (
        p.nombre.toLowerCase().includes(q) ||
        (p.categoria && p.categoria.toLowerCase().includes(q))
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
    <div style="display:flex;flex-direction:column;gap:4px">
      <h1 style="font-size:22px;font-weight:600">Productos</h1>
      <p class="sub">Menú digital de Kin Sushi</p>
    </div>
    <BaseButton v-if="isAdmin" variant="p" to="/admin/productos/nuevo">
      Nuevo producto
    </BaseButton>
  </div>

  <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
    <label for="buscar" style="position:absolute;left:-9999px">Buscar producto</label>
    <div class="search-wrap" style="max-width:380px;flex:1">
      <svg class="search-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="M21 21l-4.3-4.3"></path>
      </svg>
      <input
        id="buscar"
        v-model="busqueda"
        class="inp search-inp"
        type="search"
        placeholder="Buscar por nombre"
      >
    </div>
    <span v-if="notaCategoriaActual" class="sub">{{ notaCategoriaActual }}</span>
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
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 18px;
}
</style>
