<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import {
  TIPOS_REPORTE_MOCK,
  PERIODOS_REPORTE_MOCK,
  reporteConfigState,
  generarNombreArchivoReporte
} from '@/services/reportes.service'

const router = useRouter()
const tipos = ref(TIPOS_REPORTE_MOCK)
const periodos = ref(PERIODOS_REPORTE_MOCK)

const selectedTipo = ref(reporteConfigState.value.tipoId)
const selectedPeriodo = ref(reporteConfigState.value.periodo)
const fechaDesde = ref(reporteConfigState.value.fechaDesde)
const fechaHasta = ref(reporteConfigState.value.fechaHasta)

function elegirTipoReporte(tipo) {
  selectedTipo.value = tipo.id
  reporteConfigState.value.tipoId = tipo.id
  reporteConfigState.value.tipoTitulo = tipo.titulo
}

function elegirPeriodo(p) {
  selectedPeriodo.value = p
  if (p === 'Hoy') {
    fechaDesde.value = '25 oct 2026'
    fechaHasta.value = '25 oct 2026'
  } else if (p === 'Esta semana') {
    fechaDesde.value = '19 oct 2026'
    fechaHasta.value = '25 oct 2026'
  } else if (p === 'Este mes') {
    fechaDesde.value = '01 oct 2026'
    fechaHasta.value = '25 oct 2026'
  }
}

function irAResultadoReporte() {
  const tipoObj = tipos.value.find((t) => t.id === selectedTipo.value) || tipos.value[0]
  reporteConfigState.value = {
    tipoId: tipoObj.id,
    tipoTitulo: tipoObj.titulo,
    periodo: selectedPeriodo.value,
    fechaDesde: fechaDesde.value,
    fechaHasta: fechaHasta.value
  }
  router.push('/admin/reportes/resultado')
}
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:4px">
    <h1 style="font-size:22px;font-weight:600">Reportes</h1>
    <p class="sub">Elige qué quieres consultar y de qué fechas. El nombre de exportación se generará automáticamente según tu selección.</p>
  </div>

  <section class="card sel-card">
    <h2 style="font-size:16px;font-weight:600">1. Tipo de reporte</h2>
    <div class="rep-opts-grid">
      <div
        v-for="tipo in tipos"
        :key="tipo.id"
        :class="['opt', { on: selectedTipo === tipo.id }]"
        @click="elegirTipoReporte(tipo)"
      >
        <div class="row" style="justify-content:space-between">
          <span class="ico sel-ico">
            <svg
              v-if="tipo.id === 'ventas_periodo'"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M4 20V10M10 20V4M16 20v-7M22 20H2"></path>
            </svg>
            <svg
              v-else-if="tipo.id === 'productos_mas_vendidos'"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"></path>
            </svg>
            <svg
              v-else
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 3a9 9 0 1 0 9 9h-9z"></path>
              <path d="M15 3.5A9 9 0 0 1 20.5 9H15z"></path>
            </svg>
          </span>
          <span class="rad"></span>
        </div>
        <span style="font-size:15px;font-weight:600">{{ tipo.titulo }}</span>
        <span class="sub">{{ tipo.descripcion }}</span>
      </div>
    </div>
  </section>

  <section class="card sel-card">
    <h2 style="font-size:16px;font-weight:600">2. Periodo</h2>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <a
        v-for="p in periodos"
        :key="p"
        href="#"
        :class="['chip', 'sel-chip', { on: selectedPeriodo === p }]"
        @click.prevent="elegirPeriodo(p)"
      >{{ p }}</a>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px;max-width:520px">
      <div>
        <label class="lbl" for="d1">Desde</label>
        <input id="d1" v-model="fechaDesde" class="inp" type="text" />
      </div>
      <div>
        <label class="lbl" for="d2">Hasta</label>
        <input id="d2" v-model="fechaHasta" class="inp" type="text" />
      </div>
    </div>
    <div class="sub" style="font-size:12px">
      Nombre sugerido de archivo:
      <strong style="color:var(--tx)">
        {{
          generarNombreArchivoReporte({
            tipoTitulo: tipos.find((t) => t.id === selectedTipo)?.titulo,
            fechaDesde,
            fechaHasta
          })
        }}.pdf
      </strong>
    </div>
  </section>

  <div class="row" style="justify-content:flex-end;gap:12px">
    <RouterLink class="btn s sel-btn" to="/admin/inicio">Cancelar</RouterLink>
    <a class="btn p sel-btn" href="/admin/reportes/resultado" @click.prevent="irAResultadoReporte">
      Generar reporte →
    </a>
  </div>
</template>

<style scoped>
.sel-card {
  gap: 14px;
}

.rep-opts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.opt {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px;
  border: 1px solid var(--bd);
  border-radius: 14px;
  background: var(--sf);
  cursor: pointer;
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.18s ease, background-color 0.18s ease;
  user-select: none;
}

.opt:hover {
  border-color: var(--ac);
  transform: translateY(-2px);
}

.opt:active {
  transform: scale(0.98);
}

.opt.on {
  border-color: var(--btn);
  background: var(--acs);
}

.rad {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid var(--bd);
  flex: none;
}

.opt.on .rad {
  border-color: var(--btn);
  background: radial-gradient(circle, var(--btn) 45%, transparent 50%);
}

.sel-ico {
  width: 40px;
  height: 40px;
  border-radius: 10px;
}

.opt.on .sel-ico {
  background: var(--sf);
}

.sel-chip {
  height: 36px;
  padding: 0 16px;
  border-radius: 18px;
}

.sel-btn {
  padding: 0 22px;
}
</style>
