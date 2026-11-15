<script setup>
import { ref, computed } from 'vue'
import {
  HISTORIAL_VENTAS_MOCK,
  MESES_LARGOS_ES,
  obtenerFechaISOLocal,
  parsearFechaISO,
  sumarDiasISO,
  formatearFechaCortaEs
} from '@/services/ventas.service'
import HistorialTabla from '@/modules/ventas/components/HistorialTabla.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const hoyISO = computed(() => obtenerFechaISOLocal(new Date()))

// Modos de visualización temporal: 'dia' | 'semana' | 'mes' | 'todo'
const modoPeriodo = ref('semana')
const fechaCursorISO = ref(obtenerFechaISOLocal(new Date()))

const busqueda = ref('')
const filtroTipo = ref('Todos')
const filtroPago = ref('Todos los pagos')
const paginaActual = ref(1)

const tiposFiltro = ['Todos', 'En local', 'Para llevar', 'A domicilio']

function obtenerInicioFinSemana(isoStr) {
  const d = parsearFechaISO(isoStr)
  const diaSem = d.getDay() // 0 dom .. 6 sab
  const diffLunes = diaSem === 0 ? -6 : 1 - diaSem
  const lunes = new Date(d)
  lunes.setDate(d.getDate() + diffLunes)
  const domingo = new Date(lunes)
  domingo.setDate(lunes.getDate() + 6)
  return {
    inicioISO: obtenerFechaISOLocal(lunes),
    finISO: obtenerFechaISOLocal(domingo)
  }
}

const etiquetaPeriodoActivo = computed(() => {
  const cursor = fechaCursorISO.value

  if (modoPeriodo.value === 'dia') {
    return formatearFechaCortaEs(cursor, true)
  }

  if (modoPeriodo.value === 'semana') {
    const { inicioISO, finISO } = obtenerInicioFinSemana(cursor)
    const iniTxt = formatearFechaCortaEs(inicioISO, false)
    const finTxt = formatearFechaCortaEs(finISO, true)
    return `${iniTxt} – ${finTxt}`
  }

  if (modoPeriodo.value === 'mes') {
    const d = parsearFechaISO(cursor)
    const mesNombre = MESES_LARGOS_ES[d.getMonth()] || 'Mes'
    return `${mesNombre} ${d.getFullYear()}`
  }

  return 'Todas las fechas'
})

const esCursorEnPresente = computed(() => {
  const cursor = fechaCursorISO.value
  const hoy = hoyISO.value
  if (modoPeriodo.value === 'dia') return cursor >= hoy
  if (modoPeriodo.value === 'semana') {
    const { inicioISO, finISO } = obtenerInicioFinSemana(cursor)
    return hoy >= inicioISO && hoy <= finISO
  }
  if (modoPeriodo.value === 'mes') {
    return cursor.slice(0, 7) >= hoy.slice(0, 7)
  }
  return true
})

function cambiarModoPeriodo(modo) {
  modoPeriodo.value = modo
  paginaActual.value = 1
}

function moverPeriodo(direccion) {
  if (modoPeriodo.value === 'todo') {
    modoPeriodo.value = 'dia'
  }
  if (modoPeriodo.value === 'dia') {
    fechaCursorISO.value = sumarDiasISO(fechaCursorISO.value, direccion)
  } else if (modoPeriodo.value === 'semana') {
    fechaCursorISO.value = sumarDiasISO(fechaCursorISO.value, direccion * 7)
  } else if (modoPeriodo.value === 'mes') {
    const d = parsearFechaISO(fechaCursorISO.value)
    d.setMonth(d.getMonth() + direccion)
    fechaCursorISO.value = obtenerFechaISOLocal(d)
  }
  paginaActual.value = 1
}

function cumpleFiltroPeriodo(v) {
  if (modoPeriodo.value === 'todo') return true
  const vISO = v.fechaISO || hoyISO.value
  if (modoPeriodo.value === 'dia') {
    return vISO === fechaCursorISO.value
  }
  if (modoPeriodo.value === 'semana') {
    const { inicioISO, finISO } = obtenerInicioFinSemana(fechaCursorISO.value)
    return vISO >= inicioISO && vISO <= finISO
  }
  if (modoPeriodo.value === 'mes') {
    return vISO.slice(0, 7) === fechaCursorISO.value.slice(0, 7)
  }
  return true
}

const ventasFiltradas = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  return HISTORIAL_VENTAS_MOCK.filter((v) => {
    if (!cumpleFiltroPeriodo(v)) return false

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
  modoPeriodo.value = 'todo'
  fechaCursorISO.value = obtenerFechaISOLocal(new Date())
}
</script>

<template>
  <div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:12px">
    <h1 style="font-size:22px;font-weight:600">Historial de ventas</h1>
    <span class="sub">{{ etiquetaPeriodoActivo }}</span>
  </div>

  <!-- Barra de filtros limpia y profesional con tipografía Poppins -->
  <div class="hist-toolbar">
    <div class="hist-toolbar-left">
      <input
        v-model="busqueda"
        class="inp hist-search-inp"
        type="search"
        placeholder="Buscar por folio, cliente o mesa..."
      >
      <label for="f2" style="position:absolute;left:-9999px">Método de pago</label>
      <select id="f2" v-model="filtroPago" class="inp hist-select-inp">
        <option>Todos los pagos</option>
        <option>Efectivo</option>
        <option>Transferencia</option>
        <option>Tarjeta</option>
      </select>
    </div>

    <div class="hist-toolbar-right">
      <div class="seg hist-seg">
        <span :class="{ on: modoPeriodo === 'dia' }" @click="cambiarModoPeriodo('dia')">Día</span>
        <span :class="{ on: modoPeriodo === 'semana' }" @click="cambiarModoPeriodo('semana')">Semana</span>
        <span :class="{ on: modoPeriodo === 'mes' }" @click="cambiarModoPeriodo('mes')">Mes</span>
        <span :class="{ on: modoPeriodo === 'todo' }" @click="cambiarModoPeriodo('todo')">Todo</span>
      </div>

      <div class="date-stepper" role="group" aria-label="Navegador de fechas">
        <button
          type="button"
          class="step-arrow-btn"
          :disabled="modoPeriodo === 'todo'"
          title="Periodo anterior"
          aria-label="Periodo anterior"
          @click="moverPeriodo(-1)"
        >
          &lt;
        </button>
        <span class="date-stepper-label">{{ etiquetaPeriodoActivo }}</span>
        <button
          type="button"
          class="step-arrow-btn"
          :disabled="modoPeriodo === 'todo' || esCursorEnPresente"
          title="Periodo siguiente"
          aria-label="Periodo siguiente"
          @click="moverPeriodo(1)"
        >
          &gt;
        </button>
      </div>
    </div>
  </div>

  <!-- Filtros rápidos por modalidad -->
  <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
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

  <HistorialTabla
    v-if="ventasFiltradas.length > 0"
    :ventas="ventasFiltradas"
  />

  <div
    v-else
    class="card"
    style="align-items:center;justify-content:center;padding:44px 24px;text-align:center;gap:12px"
  >
    <div class="ico" style="width:52px;height:52px;border-radius:50%">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="M21 21l-4.3-4.3"></path>
      </svg>
    </div>
    <h3 style="font-size:16px;font-weight:600">
      No hay ventas registradas en {{ etiquetaPeriodoActivo }}
    </h3>
    <div class="row" style="gap:10px">
      <BaseButton
        v-if="modoPeriodo !== 'semana'"
        variant="s"
        href="#"
        @click.prevent="cambiarModoPeriodo('semana')"
      >
        Ver semana
      </BaseButton>
      <BaseButton
        v-if="HISTORIAL_VENTAS_MOCK.length > 0"
        variant="p"
        href="#"
        @click.prevent="limpiarFiltros"
      >
        Ver todas las ventas
      </BaseButton>
    </div>
  </div>

  <div class="row" style="justify-content:space-between;flex-wrap:wrap">
    <span class="sub">Mostrando {{ ventasFiltradas.length }} ventas</span>
    <div style="display:flex;gap:8px">
      <a class="chip" href="#" @click.prevent="paginaActual = Math.max(1, paginaActual - 1)">Anterior</a>
      <a :class="['chip', { on: paginaActual === 1 }]" href="#" @click.prevent="paginaActual = 1">1</a>
      <a :class="['chip', { on: paginaActual === 2 }]" href="#" @click.prevent="paginaActual = 2">2</a>
      <a class="chip" href="#" @click.prevent="paginaActual = Math.min(2, paginaActual + 1)">Siguiente</a>
    </div>
  </div>
</template>

<style scoped>
.hist-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  font-family: 'Poppins', sans-serif;
}

.hist-toolbar-left,
.hist-toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.hist-search-inp {
  width: 280px;
  height: 40px;
  font-family: 'Poppins', sans-serif;
}

.hist-select-inp {
  width: 175px;
  height: 40px;
  padding: 0 12px;
  font-family: 'Poppins', sans-serif;
}

.hist-seg {
  display: inline-flex;
  align-items: center;
  width: 344px;
  height: 40px;
  padding: 4px;
  gap: 4px;
  flex-shrink: 0;
  font-family: 'Poppins', sans-serif;
}

.hist-seg span {
  flex: 1;
  height: 30px;
  padding: 0 10px;
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
}

.date-stepper {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  width: 245px;
  height: 40px;
  background: var(--bg2);
  border: 1.5px solid var(--bd);
  border-radius: 10px;
  padding: 3px;
  gap: 4px;
  flex-shrink: 0;
  font-family: 'Poppins', sans-serif;
}

.step-arrow-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: var(--sf);
  color: var(--tx);
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.step-arrow-btn:hover:not(:disabled) {
  background: var(--acs);
  color: var(--act);
}

.step-arrow-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.date-stepper-label {
  flex: 1;
  padding: 0 6px;
  font-family: 'Poppins', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: var(--tx);
  text-align: center;
  white-space: nowrap;
}
</style>
