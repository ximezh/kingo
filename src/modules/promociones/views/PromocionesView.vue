<script setup>
import { ref, computed } from 'vue'
import { PROMOCIONES_MOCK } from '@/services/promociones.service'
import BaseButton from '@/components/ui/BaseButton.vue'
import PromocionesTabla from '@/modules/promociones/components/PromocionesTabla.vue'

const busqueda = ref('')
const filtroActivo = ref('Todas')
const filtros = ['Todas', 'Activas', 'Inactivas']

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
</script>

<template>
  <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
    <div style="display:flex;flex-direction:column;gap:4px">
      <h1 style="font-size:22px;font-weight:600">Promociones</h1>
      <p class="sub">Se aplican solas al registrar una venta o pueden seleccionarse desde la caja.</p>
    </div>
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

  <PromocionesTabla v-if="promocionesFiltradas.length > 0" :promociones="promocionesFiltradas" />

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
</template>
