<script setup>
import { ref, computed } from 'vue'
import { HISTORIAL_VENTAS_MOCK } from '@/services/ventas.service'
import HistorialTabla from '@/modules/ventas/components/HistorialTabla.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const fecha = ref('24 oct 2026')
const busqueda = ref('')
const filtroTipo = ref('Todos')
const filtroPago = ref('Todos los pagos')
const paginaActual = ref(1)

const tiposFiltro = ['Todos', 'En local', 'Para llevar', 'A domicilio']

const ventasFiltradas = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  return HISTORIAL_VENTAS_MOCK.filter((v) => {
    if (filtroTipo.value !== 'Todos') {
      const mapTipo = {
        'En local': 'En local',
        'Para llevar': 'Para llevar',
        'A domicilio': 'Domicilio'
      }
      if (v.tipo !== mapTipo[filtroTipo.value]) return false
    }
    if (filtroPago.value !== 'Todos los pagos' && v.pago !== filtroPago.value) {
      return false
    }
    if (q) {
      return (
        v.folio.toLowerCase().includes(q) ||
        v.clienteMesa.toLowerCase().includes(q) ||
        v.estado.toLowerCase().includes(q)
      )
    }
    return true
  })
})

function limpiarFiltros() {
  busqueda.value = ''
  filtroTipo.value = 'Todos'
  filtroPago.value = 'Todos los pagos'
}
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:4px">
    <h1 style="font-size:22px;font-weight:600">Historial de ventas</h1>
    <p class="sub">Consulta ventas anteriores por folio, cliente, fecha y tipo de pedido.</p>
  </div>

  <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
    <input
      v-model="busqueda"
      class="inp"
      type="search"
      placeholder="Buscar por folio (#0143), cliente o mesa..."
      style="max-width:300px"
    >
    <label for="f1" style="position:absolute;left:-9999px">Fecha</label>
    <input
      id="f1"
      v-model="fecha"
      class="inp"
      type="text"
      style="width:155px"
    >
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <a
        v-for="t in tiposFiltro"
        :key="t"
        href="#"
        :class="['chip', { on: filtroTipo === t }]"
        @click.prevent="filtroTipo = t"
      >
        {{ t }}
      </a>
    </div>
    <label for="f2" style="position:absolute;left:-9999px">Método de pago</label>
    <select id="f2" v-model="filtroPago" class="inp" style="width:185px">
      <option>Todos los pagos</option>
      <option>Efectivo</option>
      <option>Transferencia</option>
      <option>Tarjeta</option>
    </select>
  </div>

  <HistorialTabla v-if="ventasFiltradas.length > 0" :ventas="ventasFiltradas" />

  <div
    v-else
    class="card"
    style="align-items:center;justify-content:center;padding:48px 24px;text-align:center;gap:12px"
  >
    <div class="ico" style="width:52px;height:52px;border-radius:50%">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="M21 21l-4.3-4.3"></path>
      </svg>
    </div>
    <h3 style="font-size:16px;font-weight:600">
      {{ HISTORIAL_VENTAS_MOCK.length === 0 ? 'Aún no se han registrado ventas' : 'No existen ventas con esos criterios' }}
    </h3>
    <p class="sub">
      <template v-if="HISTORIAL_VENTAS_MOCK.length === 0">
        Las ventas que registres aparecerán aquí con su folio, modalidad y estado.
      </template>
      <template v-else>
        No encontramos ventas para
        <strong v-if="busqueda">"{{ busqueda }}"</strong>
        <span v-if="filtroTipo !== 'Todos'"> en modalidad <strong>{{ filtroTipo }}</strong></span>
        <span v-if="filtroPago !== 'Todos los pagos'"> con pago en <strong>{{ filtroPago }}</strong></span>.
      </template>
    </p>
    <BaseButton v-if="HISTORIAL_VENTAS_MOCK.length > 0" variant="p" href="#" @click.prevent="limpiarFiltros">
      Ver todas las ventas
    </BaseButton>
  </div>

  <div class="row" style="justify-content:space-between;flex-wrap:wrap">
    <span class="sub">Mostrando {{ ventasFiltradas.length }} ventas registradas</span>
    <div style="display:flex;gap:8px">
      <a class="chip" href="#" @click.prevent="paginaActual = Math.max(1, paginaActual - 1)">Anterior</a>
      <a :class="['chip', { on: paginaActual === 1 }]" href="#" @click.prevent="paginaActual = 1">1</a>
      <a :class="['chip', { on: paginaActual === 2 }]" href="#" @click.prevent="paginaActual = 2">2</a>
      <a class="chip" href="#" @click.prevent="paginaActual = Math.min(2, paginaActual + 1)">Siguiente</a>
    </div>
  </div>
</template>
