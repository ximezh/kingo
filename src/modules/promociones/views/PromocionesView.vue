<script setup>
import { ref, computed } from 'vue'
import { PROMOCIONES_MOCK, guardarPromocionesStorage } from '@/services/promociones.service'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import PromocionesTabla from '@/modules/promociones/components/PromocionesTabla.vue'

const busqueda = ref('')
const filtroActivo = ref('Todas')
const filtros = ['Todas', 'Activas', 'Inactivas']

const promoAEliminar = ref(null)
const showModalEliminar = ref(false)

const promocionesFiltradas = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  return PROMOCIONES_MOCK.filter((p) => {
    if (filtroActivo.value === 'Activas' && !p.activa) return false
    if (filtroActivo.value === 'Inactivas' && p.activa) return false
    if (q) {
      return (
        p.nombre.toLowerCase().includes(q) ||
        p.dia.toLowerCase().includes(q) ||
        p.descuento.toLowerCase().includes(q)
      )
    }
    return true
  })
})

function solicitarEliminarPromo(promo) {
  promoAEliminar.value = promo
  showModalEliminar.value = true
}

function confirmarEliminarPromo() {
  if (!promoAEliminar.value) return
  const idEliminar = promoAEliminar.value.id
  const idx = PROMOCIONES_MOCK.findIndex((p) => p.id === idEliminar)
  if (idx > -1) {
    PROMOCIONES_MOCK.splice(idx, 1)
  }
  guardarPromocionesStorage()

  fetch(`http://localhost:3000/api/promociones/${idEliminar}`, {
    method: 'DELETE'
  }).catch(() => {})

  showModalEliminar.value = false
  promoAEliminar.value = null
}
</script>

<template>
  <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
    <h1 style="font-size:22px;font-weight:600">Promociones</h1>
    <BaseButton variant="p" to="/admin/promociones/nueva">+ Nueva promoción</BaseButton>
  </div>

  <div style="display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap">
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <a
        v-for="f in filtros"
        :key="f"
        href="#"
        :class="['chip', { on: filtroActivo === f }]"
        @click.prevent="filtroActivo = f"
      >
        {{ f }}
      </a>
    </div>
    <input
      v-model="busqueda"
      class="inp"
      type="search"
      placeholder="Buscar promoción por nombre o día..."
      style="max-width:340px"
    >
  </div>

  <PromocionesTabla
    v-if="promocionesFiltradas.length > 0"
    :promociones="promocionesFiltradas"
    @eliminar="solicitarEliminarPromo"
  />

  <div
    v-else
    class="card"
    style="align-items:center;justify-content:center;padding:48px 24px;text-align:center;gap:12px"
  >
    <h3 style="font-size:16px;font-weight:600">No se encontraron promociones</h3>
    <p class="sub">No hay promociones que coincidan con "{{ busqueda || filtroActivo }}".</p>
    <BaseButton variant="s" href="#" @click.prevent="busqueda = ''; filtroActivo = 'Todas'">
      Ver todas las promociones
    </BaseButton>
  </div>

  <BaseModal
    v-model="showModalEliminar"
    aria-label="Eliminar promoción"
    width="440px"
  >
    <h2 style="font-size:18px;font-weight:600">¿Eliminar "{{ promoAEliminar?.nombre }}"?</h2>
    <p class="sub" style="line-height:1.5">
      Esta promoción se eliminará de la lista y dejará de aplicarse en las nuevas ventas.
    </p>
    <div style="display:flex;gap:10px;justify-content:flex-end;padding-top:6px">
      <BaseButton variant="s" href="#" @click.prevent="showModalEliminar = false">Cancelar</BaseButton>
      <BaseButton variant="d" href="#" @click.prevent="confirmarEliminarPromo">Sí, eliminar</BaseButton>
    </div>
  </BaseModal>
</template>
