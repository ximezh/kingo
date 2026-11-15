<script setup>
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import ReporteKpiCard from '@/modules/reportes/components/ReporteKpiCard.vue'
import GraficaVentasDia from '@/modules/reportes/components/GraficaVentasDia.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import {
  TIPOS_REPORTE_MOCK,
  PERIODOS_REPORTE_MOCK,
  reporteConfigState,
  obtenerDatosReporteDinamico,
  obtenerRangoFechasPeriodo,
  generarNombreArchivoReporte,
  generarDashboardXlsxBlob,
  generarCSVReporteKinGo
} from '@/services/reportes.service'

const reporte = computed(() => obtenerDatosReporteDinamico(reporteConfigState.value))

const showModalExportar = ref(false)
const formatoExportar = ref('pdf') // 'pdf' | 'excel'
const tipoArchivoExcel = ref('xlsx') // 'xlsx' | 'csv'
const nombreArchivoPersonalizado = ref('')

const subtituloDinamico = computed(() => {
  const cfg = reporteConfigState.value
  if (cfg.fechaDesde === cfg.fechaHasta) {
    return `${cfg.fechaDesde} · ${cfg.periodo}`
  }
  return `${cfg.fechaDesde} al ${cfg.fechaHasta} · ${cfg.periodo}`
})

function cambiarTipoRapido(tipo) {
  reporteConfigState.value.tipoId = tipo.id
  reporteConfigState.value.tipoTitulo = tipo.titulo
}

function cambiarPeriodoRapido(per) {
  reporteConfigState.value.periodo = per
  if (per !== 'Personalizado') {
    const rango = obtenerRangoFechasPeriodo(per)
    reporteConfigState.value.fechaDesde = rango.fechaDesde
    reporteConfigState.value.fechaHasta = rango.fechaHasta
    reporteConfigState.value.desdeISO = rango.desdeISO
    reporteConfigState.value.hastaISO = rango.hastaISO
  }
}

function abrirModalExportacion(formato) {
  formatoExportar.value = formato
  nombreArchivoPersonalizado.value = generarNombreArchivoReporte(reporteConfigState.value)
  showModalExportar.value = true
}

function regenerarNombreAutomatico() {
  nombreArchivoPersonalizado.value = generarNombreArchivoReporte(reporteConfigState.value)
}

function confirmarDescargaReporte() {
  const baseName = (nombreArchivoPersonalizado.value || '').trim() || generarNombreArchivoReporte(reporteConfigState.value)
  const cleanName = baseName.replace(/\.(pdf|csv|xls|xlsx)$/i, '')

  if (formatoExportar.value === 'excel') {
    if (tipoArchivoExcel.value === 'csv') {
      const csvData = generarCSVReporteKinGo(reporte.value, reporteConfigState.value)
      const blobCsv = new Blob(['\uFEFF' + csvData], {
        type: 'text/csv;charset=utf-8;'
      })
      const urlCsv = URL.createObjectURL(blobCsv)
      const linkCsv = document.createElement('a')
      linkCsv.href = urlCsv
      linkCsv.download = `${cleanName}.csv`
      linkCsv.click()
      URL.revokeObjectURL(urlCsv)
      showModalExportar.value = false
      return
    }

    const blobXlsx = generarDashboardXlsxBlob(reporte.value, reporteConfigState.value)
    const url = URL.createObjectURL(blobXlsx)
    const link = document.createElement('a')
    link.href = url
    link.download = `${cleanName}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
    showModalExportar.value = false
    return
  }

  // Exportar PDF asignando el nombre personalizado al documento antes de imprimir/guardar PDF
  const prevTitle = document.title
  document.title = cleanName
  showModalExportar.value = false
  setTimeout(() => {
    window.print()
    setTimeout(() => {
      document.title = prevTitle
    }, 1000)
  }, 180)
}
</script>

<template>
  <div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:12px">
    <div style="display:flex;flex-direction:column;gap:2px">
      <h1 style="font-size:22px;font-weight:600">{{ reporte.titulo }}</h1>
      <p class="sub">{{ subtituloDinamico }}</p>
    </div>
    <div class="row" style="gap:8px;flex-wrap:wrap">
      <RouterLink class="btn s res-btn" to="/admin/reportes">Cambiar filtros</RouterLink>
      <a class="btn s res-btn" href="#" @click.prevent="abrirModalExportacion('excel')">Exportar Excel</a>
      <a class="btn p res-btn" href="#" @click.prevent="abrirModalExportacion('pdf')">Exportar PDF</a>
    </div>
  </div>

  <!-- Barra interactiva rápida para alternar el tipo de reporte o periodo en tiempo real -->
  <div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:10px">
    <div class="row" style="gap:6px;flex-wrap:wrap">
      <span class="sub" style="font-size:12px;margin-right:4px">Tipo:</span>
      <a
        v-for="t in TIPOS_REPORTE_MOCK"
        :key="t.id"
        href="#"
        :class="['chip', 'chip-sm', { on: reporteConfigState.tipoId === t.id }]"
        @click.prevent="cambiarTipoRapido(t)"
      >
        {{ t.titulo }}
      </a>
    </div>
    <div class="row" style="gap:6px;flex-wrap:wrap">
      <span class="sub" style="font-size:12px;margin-right:4px">Periodo:</span>
      <a
        v-for="p in PERIODOS_REPORTE_MOCK"
        :key="p"
        href="#"
        :class="['chip', 'chip-sm', { on: reporteConfigState.periodo === p }]"
        @click.prevent="cambiarPeriodoRapido(p)"
      >
        {{ p }}
      </a>
    </div>
  </div>

  <div class="res-kpi-grid">
    <ReporteKpiCard
      v-for="kpi in reporte.kpis"
      :key="kpi.label"
      :label="kpi.label"
      :valor="kpi.valor"
    />
  </div>

  <div class="res-charts-layout">
    <GraficaVentasDia
      :barras="reporte.ventasPorDia"
      :titulo="reporte.graficaTitulo"
      :subtitulo="reporte.graficaSubtitulo"
    />

    <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:16px">
      <section class="card res-card">
        <h2 style="font-size:15px;font-weight:600">{{ reporte.tituloPanel1 || 'Por tipo de pedido' }}</h2>
        <div
          v-for="item in reporte.porTipoPedido"
          :key="item.label"
          class="hb"
        >
          <div class="row" style="justify-content:space-between">
            <span>{{ item.label }}</span>
            <span style="font-weight:500">{{ item.detalle }}</span>
          </div>
          <div class="tr">
            <i :style="{ width: item.porcentaje }"></i>
          </div>
        </div>
      </section>

      <section class="card res-card" style="gap:4px">
        <h2 style="font-size:15px;font-weight:600;padding-bottom:6px">{{ reporte.tituloPanel2 || 'Más vendidos' }}</h2>
        <div
          v-for="prod in reporte.masVendidos"
          :key="prod.nombre"
          class="pr res-pr"
        >
          <span>{{ prod.nombre }}</span>
          <span style="font-weight:500">{{ prod.piezas }}</span>
        </div>
      </section>
    </div>
  </div>

  <!-- Modal para asignar o confirmar el nombre del archivo PDF / Excel -->
  <BaseModal
    v-model="showModalExportar"
    aria-label="Exportar reporte con nombre personalizado"
    width="480px"
  >
    <h2 style="font-size:19px;font-weight:600">
      Exportar {{ formatoExportar === 'pdf' ? 'PDF' : 'Excel' }}
    </h2>

    <div v-if="formatoExportar === 'excel'" class="note" style="font-size:12.5px;padding:10px 12px">
      Se descargará un archivo de Excel con el reporte.
    </div>

    <div v-if="formatoExportar === 'excel'" style="display:flex;flex-direction:column;gap:6px">
      <span class="lbl" style="margin:0">Formato de hoja de cálculo</span>
      <div class="seg" style="height:38px">
        <span :class="{ on: tipoArchivoExcel === 'xlsx' }" style="cursor:pointer" @click="tipoArchivoExcel = 'xlsx'">
          Dashboard Excel (.xlsx)
        </span>
        <span :class="{ on: tipoArchivoExcel === 'csv' }" style="cursor:pointer" @click="tipoArchivoExcel = 'csv'">
          CSV clásico (.csv)
        </span>
      </div>
    </div>

    <div style="display:flex;flex-direction:column;gap:8px">
      <BaseInput
        id="rep-fname"
        v-model="nombreArchivoPersonalizado"
        :label="`Nombre del archivo (${formatoExportar === 'pdf' ? '.pdf' : tipoArchivoExcel === 'csv' ? '.csv' : '.xlsx'})`"
        type="text"
      />
      <div class="row" style="justify-content:flex-end">
        <a href="#" class="edit" style="font-size:12px" @click.prevent="regenerarNombreAutomatico">
          Restaurar nombre automático
        </a>
      </div>
    </div>

    <div style="display:flex;justify-content:flex-end;gap:10px;padding-top:6px">
      <BaseButton variant="s" href="#" @click.prevent="showModalExportar = false">Cancelar</BaseButton>
      <BaseButton variant="p" href="#" @click.prevent="confirmarDescargaReporte">
        Descargar {{ formatoExportar === 'pdf' ? 'PDF' : 'Excel' }}
      </BaseButton>
    </div>
  </BaseModal>
</template>

<style scoped>
.res-btn {
  height: 40px;
  padding: 0 18px;
}

.chip-sm {
  height: 30px;
  padding: 0 12px;
  border-radius: 15px;
  font-size: 12px;
}

.res-kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
}

.res-charts-layout {
  display: flex;
  gap: 16px;
  align-items: stretch;
  flex: 1;
  min-height: 0;
}

@media (max-width: 900px) {
  .res-charts-layout {
    flex-direction: column;
  }
}

.res-card {
  padding: 18px 20px;
  gap: 12px;
}

.hb {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
}

.hb .tr {
  height: 8px;
  border-radius: 4px;
  background: var(--bg2);
  border: 1px solid var(--bd);
  overflow: hidden;
}

.hb .tr i {
  display: block;
  height: 100%;
  background: #F26A1B !important;
  box-shadow: inset 0 0 0 1000px #F26A1B !important;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
  transition: width 0.25s ease;
}

.res-pr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 30px;
  font-size: 13px;
  font-weight: 400;
  color: var(--tx);
  border-bottom: 1px solid var(--bd);
}

.res-pr:last-child {
  border-bottom: 0;
}
</style>
