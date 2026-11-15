import { ref } from 'vue'
import {
  HISTORIAL_VENTAS_MOCK,
  obtenerFechaISOLocal,
  parsearFechaISO,
  formatearFechaCortaEs
} from '@/services/ventas.service'
import { PRODUCTOS_MOCK, CATEGORIAS_SOLO_PLATILLOS } from '@/services/catalogo.service'
import { construirLibroXlsx, fechaISOaSerialExcel } from '@/services/excelDashboard'

export const TIPOS_REPORTE_MOCK = [
  {
    id: 'ventas_periodo',
    titulo: 'Ventas por periodo',
    descripcion: 'Ingresos y pedidos por día'
  },
  {
    id: 'productos_mas_vendidos',
    titulo: 'Platillos más vendidos',
    descripcion: 'Rollos, yakimeshis, sopas y especialidades'
  },
  {
    id: 'ventas_tipo_pedido',
    titulo: 'Ventas por modalidad',
    descripcion: 'Local, llevar y domicilio'
  }
]

export const PERIODOS_REPORTE_MOCK = ['Hoy', 'Esta semana', 'Este mes', 'Personalizado']

export function obtenerRangoFechasPeriodo(periodo = 'Esta semana') {
  const ahora = new Date()
  const hoyISO = obtenerFechaISOLocal(ahora)

  if (periodo === 'Hoy') {
    const txt = formatearFechaCortaEs(hoyISO, true)
    return {
      fechaDesde: txt,
      fechaHasta: txt,
      desdeISO: hoyISO,
      hastaISO: hoyISO
    }
  }

  if (periodo === 'Esta semana') {
    const d = parsearFechaISO(hoyISO)
    const diaSem = d.getDay() // 0 dom .. 6 sab
    const diffLunes = diaSem === 0 ? -6 : 1 - diaSem
    const lunes = new Date(d)
    lunes.setDate(d.getDate() + diffLunes)
    const domingo = new Date(lunes)
    domingo.setDate(lunes.getDate() + 6)
    const desdeISO = obtenerFechaISOLocal(lunes)
    const hastaISO = obtenerFechaISOLocal(domingo)
    return {
      fechaDesde: formatearFechaCortaEs(desdeISO, true),
      fechaHasta: formatearFechaCortaEs(hastaISO, true),
      desdeISO,
      hastaISO
    }
  }

  if (periodo === 'Este mes') {
    const d = parsearFechaISO(hoyISO)
    const primerDia = new Date(d.getFullYear(), d.getMonth(), 1, 12, 0, 0)
    const ultimoDia = new Date(d.getFullYear(), d.getMonth() + 1, 0, 12, 0, 0)
    const desdeISO = obtenerFechaISOLocal(primerDia)
    const hastaISO = obtenerFechaISOLocal(ultimoDia)
    return {
      fechaDesde: formatearFechaCortaEs(desdeISO, true),
      fechaHasta: formatearFechaCortaEs(hastaISO, true),
      desdeISO,
      hastaISO
    }
  }

  // Personalizado: mantener rango de la semana actual por defecto
  const d = parsearFechaISO(hoyISO)
  const diaSem = d.getDay()
  const diffLunes = diaSem === 0 ? -6 : 1 - diaSem
  const lunes = new Date(d)
  lunes.setDate(d.getDate() + diffLunes)
  const desdeISO = obtenerFechaISOLocal(lunes)
  return {
    fechaDesde: formatearFechaCortaEs(desdeISO, true),
    fechaHasta: formatearFechaCortaEs(hoyISO, true),
    desdeISO,
    hastaISO: hoyISO
  }
}

const rangoInicialSemana = obtenerRangoFechasPeriodo('Esta semana')

export const reporteConfigState = ref({
  tipoId: 'ventas_periodo',
  tipoTitulo: 'Ventas por periodo',
  periodo: 'Esta semana',
  fechaDesde: rangoInicialSemana.fechaDesde,
  fechaHasta: rangoInicialSemana.fechaHasta,
  desdeISO: rangoInicialSemana.desdeISO,
  hastaISO: rangoInicialSemana.hastaISO
})

export function generarNombreArchivoReporte(config = reporteConfigState.value) {
  const limpiar = (str) =>
    String(str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_|_$/g, '')

  const rango = obtenerRangoFechasPeriodo(config.periodo || 'Esta semana')
  const fechaDesde = config.periodo === 'Personalizado' ? config.fechaDesde : rango.fechaDesde
  const fechaHasta = config.periodo === 'Personalizado' ? config.fechaHasta : rango.fechaHasta

  const tipoSlug = limpiar(config.tipoTitulo || 'Ventas_por_periodo')
  const desdeSlug = limpiar(fechaDesde)
  const hastaSlug = limpiar(fechaHasta)

  if (desdeSlug === hastaSlug) {
    return `KinGo_${tipoSlug}_${desdeSlug}`
  }
  return `KinGo_${tipoSlug}_${desdeSlug}_al_${hastaSlug}`
}

const fmtMoneda = (n) => `$${Math.round(n).toLocaleString('es-MX')}`

/**
 * Determina si un ítem vendido corresponde a un platillo real del menú
 * (Rollos, Empanizados, Afrutados, Especialidades, Plato Kin, Yakimeshi, Sopas, Kushiages, Ensaladas)
 * excluyendo Paquetes, Promociones, Salsas/Orden Extra, Bebidas y Postres.
 */
function esPlatilloValidoParaRanking(item) {
  if (!item || !item.nombre) return false
  const nombreNorm = item.nombre.trim().toLowerCase()

  // Excluir paquetes, promociones, salsas y extras por nombre
  if (
    nombreNorm.startsWith('paquete') ||
    nombreNorm.startsWith('promoción') ||
    nombreNorm.startsWith('promocion') ||
    nombreNorm.startsWith('salsa') ||
    nombreNorm.startsWith('soya') ||
    nombreNorm.startsWith('orden extra') ||
    nombreNorm.startsWith('extra ') ||
    nombreNorm === 'aguacate' ||
    nombreNorm === 'queso philadelphia' ||
    nombreNorm === 'tampico' ||
    nombreNorm === 'camarón' ||
    nombreNorm === 'chiles toreados'
  ) {
    return false
  }

  if (item.categoria && CATEGORIAS_SOLO_PLATILLOS.includes(item.categoria)) {
    return true
  }

  // Buscar en catálogo por nombre
  const enCatalogo = PRODUCTOS_MOCK.find(
    (p) => p.nombre.toLowerCase() === nombreNorm
  )
  if (enCatalogo) {
    return CATEGORIAS_SOLO_PLATILLOS.includes(enCatalogo.categoria)
  }

  // Por defecto incluir si es rollo, yakimeshi, ramen, sopa, teppanyaki, plato kin, kushiage, gohan
  return /(roll|yakimeshi|ramen|sopa|miso|udon|yakisoba|teppanyaki|plato kin|kushiage|gohan|ensalada|brocheta)/i.test(
    nombreNorm
  )
}

function filtrarVentasPorPeriodo(ventas, config) {
  const periodo = config?.periodo || 'Esta semana'
  if (periodo === 'Personalizado') return ventas

  const { desdeISO, hastaISO } = obtenerRangoFechasPeriodo(periodo)
  const hoyISO = obtenerFechaISOLocal(new Date())

  return ventas.filter((v) => {
    const vISO = v.fechaISO || hoyISO
    return vISO >= desdeISO && vISO <= hastaISO
  })
}

export function obtenerDatosReporteDinamico(config = reporteConfigState.value) {
  const periodo = config.periodo || 'Esta semana'
  const tipoId = config.tipoId || 'ventas_periodo'
  const rangoActual = obtenerRangoFechasPeriodo(periodo)

  if (periodo !== 'Personalizado') {
    config.fechaDesde = rangoActual.fechaDesde
    config.fechaHasta = rangoActual.fechaHasta
    config.desdeISO = rangoActual.desdeISO
    config.hastaISO = rangoActual.hastaISO
  }

  const ventasPeriodo = filtrarVentasPorPeriodo(HISTORIAL_VENTAS_MOCK, config)
  const numVentasReales = ventasPeriodo.length
  const montoVentasReales = ventasPeriodo.reduce(
    (acc, v) => acc + (Number(v.totalNum) || Number(String(v.total).replace(/[^0-9.]/g, '')) || 0),
    0
  )

  if (numVentasReales === 0) {
    return {
      titulo:
        tipoId === 'productos_mas_vendidos'
          ? 'Platillos más vendidos'
          : tipoId === 'ventas_tipo_pedido'
            ? 'Ventas por tipo de pedido'
            : `Ventas por periodo (${periodo})`,
      graficaTitulo: 'Sin ventas registradas en este periodo',
      graficaSubtitulo: `${rangoActual.fechaDesde} al ${rangoActual.fechaHasta}`,
      tituloPanel1: 'Por tipo de pedido',
      tituloPanel2: 'Platillos vendidos (sin extras ni paquetes)',
      kpis: [
        { label: 'Total vendido', valor: '$0' },
        { label: 'Pedidos registrados', valor: '0' },
        { label: 'Ticket promedio', valor: '$0' },
        { label: 'Periodo activo', valor: periodo }
      ],
      ventasPorDia: [
        { dia: 'Lun', valor: '$0', montoNum: 0, porcentajeNum: 8, altura: '14px' },
        { dia: 'Mar', valor: '$0', montoNum: 0, porcentajeNum: 8, altura: '14px' },
        { dia: 'Jue', valor: '$0', montoNum: 0, porcentajeNum: 8, altura: '14px' },
        { dia: 'Vie', valor: '$0', montoNum: 0, porcentajeNum: 8, altura: '14px' },
        { dia: 'Sáb', valor: '$0', montoNum: 0, porcentajeNum: 8, altura: '14px' },
        { dia: 'Dom', valor: '$0', montoNum: 0, porcentajeNum: 8, altura: '14px' }
      ],
      porTipoPedido: [
        { label: 'A domicilio', detalle: '$0 · 0%', porcentaje: '0%', porcentajeNum: 0 },
        { label: 'En local', detalle: '$0 · 0%', porcentaje: '0%', porcentajeNum: 0 },
        { label: 'Para llevar', detalle: '$0 · 0%', porcentaje: '0%', porcentajeNum: 0 }
      ],
      masVendidos: [
        { nombre: 'Aún no se han vendido platillos en este periodo', piezas: '0 pzas', cantidadNum: 0 }
      ]
    }
  }

  const ticketPromReal = Math.round(montoVentasReales / numVentasReales)
  const domVentas = ventasPeriodo.filter((v) => v.tipo === 'Domicilio')
  const locVentas = ventasPeriodo.filter((v) => v.tipo === 'En local')
  const lleVentas = ventasPeriodo.filter((v) => v.tipo === 'Para llevar')

  const sumLista = (arr) =>
    arr.reduce((acc, v) => acc + (Number(v.totalNum) || Number(String(v.total).replace(/[^0-9.]/g, '')) || 0), 0)

  const montoDom = sumLista(domVentas)
  const montoLoc = sumLista(locVentas)
  const montoLle = sumLista(lleVentas)

  const pctDom = montoVentasReales > 0 ? Math.round((montoDom / montoVentasReales) * 100) : 0
  const pctLoc = montoVentasReales > 0 ? Math.round((montoLoc / montoVentasReales) * 100) : 0
  const pctLle = Math.max(0, 100 - pctDom - pctLoc)

  // Contabilizar exclusivamente PLATILLOS (Rollos, Yakimeshis, Plato Kin, Sopas, Kushiages, Especialidades)
  const mapaPlatillos = new Map()
  for (const v of ventasPeriodo) {
    if (Array.isArray(v.itemsSnapshot)) {
      for (const it of v.itemsSnapshot) {
        if (!esPlatilloValidoParaRanking(it)) continue
        const prev = mapaPlatillos.get(it.nombre) || {
          cantidad: 0,
          importe: 0,
          categoria: it.categoria || 'Platillo'
        }
        prev.cantidad += Number(it.cantidad) || 1
        prev.importe += Number(it.subtotal) || 0
        mapaPlatillos.set(it.nombre, prev)
      }
    }
  }

  const maxUnidadesPlatillo = Math.max(
    1,
    ...[...mapaPlatillos.values()].map((x) => x.cantidad)
  )

  const topPlatillos = [...mapaPlatillos.entries()]
    .sort((a, b) => b[1].cantidad - a[1].cantidad || b[1].importe - a[1].importe)
    .slice(0, 6)
    .map(([nombre, info], i) => {
      const pct = Math.round((info.cantidad / maxUnidadesPlatillo) * 100)
      return {
        nombre: `${i + 1}. ${nombre}`,
        nombreLimpio: nombre,
        nombreCompleto: nombre,
        categoria: info.categoria,
        cantidadNum: info.cantidad,
        importeNum: info.importe,
        porcentajeNum: pct,
        piezas: `${info.cantidad} pzas · ${fmtMoneda(info.importe)}`,
        dia: nombre.length > 13 ? `${nombre.slice(0, 12)}…` : nombre,
        valor: `${info.cantidad} pzas`,
        valorDetalle: `${info.cantidad} pzas · ${fmtMoneda(info.importe)}`,
        altura: `${Math.max(44, Math.min(195, Math.round((info.cantidad / maxUnidadesPlatillo) * 185)))}px`
      }
    })

  if (tipoId === 'productos_mas_vendidos') {
    const totalPiezas = [...mapaPlatillos.values()].reduce((a, b) => a + b.cantidad, 0)
    return {
      titulo: 'Platillos más vendidos',
      graficaTitulo: 'Ranking de platillos (sin paquetes ni extras)',
      graficaSubtitulo: `${rangoActual.fechaDesde} al ${rangoActual.fechaHasta} · Rollos, Yakimeshi, Sopas y Especialidades`,
      tituloPanel1: 'Por modalidad de pedido',
      tituloPanel2: 'Top platillos por unidades',
      kpis: [
        { label: 'Platillos servidos', valor: `${totalPiezas} pzas` },
        { label: 'Platillo #1', valor: topPlatillos[0]?.nombreLimpio || '-' },
        { label: 'Pedidos del periodo', valor: String(numVentasReales) },
        { label: 'Ingresos periodo', valor: fmtMoneda(montoVentasReales) }
      ],
      ventasPorDia:
        topPlatillos.length > 0
          ? topPlatillos.map((p) => ({
              dia: p.dia,
              nombreCompleto: p.nombreCompleto || p.nombreLimpio,
              valor: p.valor,
              valorDetalle: p.valorDetalle || p.piezas,
              porcentajeNum: p.porcentajeNum,
              altura: p.altura
            }))
          : [{ dia: 'Sin datos', nombreCompleto: 'Sin datos', valor: '0 pzas', porcentajeNum: 10, altura: '40px' }],
      porTipoPedido: [
        { label: 'A domicilio', detalle: `${fmtMoneda(montoDom)} · ${pctDom}%`, porcentaje: `${pctDom}%`, porcentajeNum: pctDom },
        { label: 'En local', detalle: `${fmtMoneda(montoLoc)} · ${pctLoc}%`, porcentaje: `${pctLoc}%`, porcentajeNum: pctLoc },
        { label: 'Para llevar', detalle: `${fmtMoneda(montoLle)} · ${pctLle}%`, porcentaje: `${pctLle}%`, porcentajeNum: pctLle }
      ],
      masVendidos:
        topPlatillos.length > 0
          ? topPlatillos
          : [{ nombre: 'Sin platillos en este rango', piezas: '0 pzas', cantidadNum: 0, porcentajeNum: 0 }]
    }
  }

  if (tipoId === 'ventas_tipo_pedido') {
    return {
      titulo: 'Ventas por modalidad de pedido',
      graficaTitulo: 'Comparativo de ingresos por modalidad',
      graficaSubtitulo: `${rangoActual.fechaDesde} al ${rangoActual.fechaHasta}`,
      tituloPanel1: 'Participación por modalidad',
      tituloPanel2: 'Desglose de pedidos',
      kpis: [
        { label: `A domicilio (${pctDom}%)`, valor: fmtMoneda(montoDom) },
        { label: `En local (${pctLoc}%)`, valor: fmtMoneda(montoLoc) },
        { label: `Para llevar (${pctLle}%)`, valor: fmtMoneda(montoLle) },
        { label: 'Total de pedidos', valor: `${numVentasReales} pedidos` }
      ],
      ventasPorDia: [
        { dia: 'A domicilio', nombreCompleto: 'Pedidos a domicilio', valor: fmtMoneda(montoDom), valorDetalle: `${fmtMoneda(montoDom)} (${pctDom}%)`, porcentajeNum: pctDom, altura: `${Math.max(28, pctDom * 1.9)}px` },
        { dia: 'En local', nombreCompleto: 'Pedidos en local (comedor)', valor: fmtMoneda(montoLoc), valorDetalle: `${fmtMoneda(montoLoc)} (${pctLoc}%)`, porcentajeNum: pctLoc, altura: `${Math.max(28, pctLoc * 1.9)}px` },
        { dia: 'Para llevar', nombreCompleto: 'Pedidos para llevar', valor: fmtMoneda(montoLle), valorDetalle: `${fmtMoneda(montoLle)} (${pctLle}%)`, porcentajeNum: pctLle, altura: `${Math.max(28, pctLle * 1.9)}px` }
      ],
      porTipoPedido: [
        { label: 'A domicilio', detalle: `${fmtMoneda(montoDom)} · ${pctDom}%`, porcentaje: `${pctDom}%`, porcentajeNum: pctDom },
        { label: 'En local', detalle: `${fmtMoneda(montoLoc)} · ${pctLoc}%`, porcentaje: `${pctLoc}%`, porcentajeNum: pctLoc },
        { label: 'Para llevar', detalle: `${fmtMoneda(montoLle)} · ${pctLle}%`, porcentaje: `${pctLle}%`, porcentajeNum: pctLle }
      ],
      masVendidos: [
        { nombre: 'Pedidos a domicilio', piezas: `${domVentas.length} pedidos · ${fmtMoneda(montoDom)}`, porcentajeNum: pctDom },
        { nombre: 'Pedidos en local (comedor)', piezas: `${locVentas.length} pedidos · ${fmtMoneda(montoLoc)}`, porcentajeNum: pctLoc },
        { nombre: 'Pedidos para llevar', piezas: `${lleVentas.length} pedidos · ${fmtMoneda(montoLle)}`, porcentajeNum: pctLle }
      ]
    }
  }

  // Agrupar ventas por fecha para la gráfica de ventas por periodo
  const mapaFechas = new Map()
  for (const v of ventasPeriodo) {
    const fKey = v.fechaISO ? formatearFechaCortaEs(v.fechaISO, false) : v.folio
    const montoV = Number(v.totalNum) || Number(String(v.total).replace(/[^0-9.]/g, '')) || 0
    mapaFechas.set(fKey, (mapaFechas.get(fKey) || 0) + montoV)
  }

  const maxDiaMonto = Math.max(1, ...[...mapaFechas.values()])
  const barrasPeriodo = [...mapaFechas.entries()]
    .slice(0, 7)
    .reverse()
    .map(([etiquetaDia, montoDia]) => {
      const pct = Math.round((montoDia / maxDiaMonto) * 100)
      return {
        dia: etiquetaDia,
        nombreCompleto: etiquetaDia,
        valor: fmtMoneda(montoDia),
        valorDetalle: fmtMoneda(montoDia),
        porcentajeNum: pct,
        altura: `${Math.max(36, Math.round((montoDia / maxDiaMonto) * 180))}px`
      }
    })

  return {
    titulo: `Ventas por periodo (${periodo})`,
    graficaTitulo: 'Ingresos registrados por fecha',
    graficaSubtitulo: `${rangoActual.fechaDesde} al ${rangoActual.fechaHasta} · ${numVentasReales} pedido(s)`,
    tituloPanel1: 'Por modalidad de pedido',
    tituloPanel2: 'Platillos más vendidos (solo platillos)',
    kpis: [
      { label: 'Total vendido', valor: fmtMoneda(montoVentasReales) },
      { label: 'Pedidos', valor: String(numVentasReales) },
      { label: 'Ticket promedio', valor: fmtMoneda(ticketPromReal) },
      { label: 'Último folio', valor: ventasPeriodo[0]?.folio || '#0001' }
    ],
    ventasPorDia: barrasPeriodo,
    porTipoPedido: [
      { label: 'A domicilio', detalle: `${fmtMoneda(montoDom)} · ${pctDom}%`, porcentaje: `${pctDom}%`, porcentajeNum: pctDom },
      { label: 'En local', detalle: `${fmtMoneda(montoLoc)} · ${pctLoc}%`, porcentaje: `${pctLoc}%`, porcentajeNum: pctLoc },
      { label: 'Para llevar', detalle: `${fmtMoneda(montoLle)} · ${pctLle}%`, porcentaje: `${pctLle}%`, porcentajeNum: pctLle }
    ],
    masVendidos:
      topPlatillos.length > 0
        ? topPlatillos
        : ventasPeriodo.map((v) => ({ nombre: `${v.folio} · ${v.clienteMesa}`, piezas: v.total, porcentajeNum: 60 }))
  }
}

// ---------------------------------------------------------------------------
// Exportación a Excel (.xlsx nativo con gráficas de Excel)
// ---------------------------------------------------------------------------

const DIAS_CORTOS_ES = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

const MODALIDADES_EXCEL = [
  { tipo: 'Domicilio', label: 'A domicilio' },
  { tipo: 'En local', label: 'En local' },
  { tipo: 'Para llevar', label: 'Para llevar' }
]

function montoDeVenta(v) {
  return Number(v.totalNum) || Number(String(v.total ?? '').replace(/[^0-9.]/g, '')) || 0
}

function etiquetaFechaExcel(fechaISO) {
  const d = parsearFechaISO(fechaISO)
  return `${DIAS_CORTOS_ES[d.getDay()]} ${formatearFechaCortaEs(fechaISO, false)}`
}

function clasificarLineaVenta(item, categoria) {
  if (item?.promocion || item?.etiquetaPromo) return 'Promoción'
  if (categoria === 'Paquetes') return 'Paquete'
  if (categoria === 'Bebidas') return 'Bebida'
  if (categoria === 'Postres') return 'Postre'
  if (categoria === 'Orden Extra') return 'Extra / Salsa'
  if (CATEGORIAS_SOLO_PLATILLOS.includes(categoria) || esPlatilloValidoParaRanking(item)) return 'Platillo'
  return 'Otro'
}

/**
 * Datos numéricos del periodo listos para Excel (importes, cantidades y detalle de ventas).
 */
export function obtenerDatosExcelReporte(config = reporteConfigState.value) {
  const hoyISO = obtenerFechaISOLocal(new Date())
  const ventas = filtrarVentasPorPeriodo(HISTORIAL_VENTAS_MOCK, config)

  const mapaFechas = new Map()
  const mapaPagos = new Map()
  const mapaPlatillos = new Map()
  const mapaCategorias = new Map()
  const lineas = []

  for (const v of ventas) {
    const iso = v.fechaISO || hoyISO
    const monto = montoDeVenta(v)

    const f = mapaFechas.get(iso) || { fechaISO: iso, pedidos: 0, monto: 0 }
    f.pedidos += 1
    f.monto += monto
    mapaFechas.set(iso, f)

    const metodo = v.pago || 'Sin especificar'
    const p = mapaPagos.get(metodo) || { metodo, pedidos: 0, monto: 0 }
    p.pedidos += 1
    p.monto += monto
    mapaPagos.set(metodo, p)

    for (const it of Array.isArray(v.itemsSnapshot) ? v.itemsSnapshot : []) {
      const cantLinea = Number(it.cantidad) || 1
      const enCatLinea = PRODUCTOS_MOCK.find((x) => x.nombre.toLowerCase() === String(it.nombre).toLowerCase())
      const catLinea = it.categoria || enCatLinea?.categoria || (it.promocion ? 'Promociones' : 'Sin categoría')
      const descLinea = Number(it.promocion?.descuento) || 0
      const importeLinea = Number(it.subtotal) || cantLinea * (Number(it.precioUnitario) || 0)
      lineas.push({
        folio: v.folio || '',
        fechaISO: iso,
        hora: v.hora || '',
        tipo: v.tipo || '',
        pago: v.pago || '',
        producto: it.nombre || '',
        categoria: catLinea,
        clase: clasificarLineaVenta(it, catLinea),
        detalle: it.detalle || '',
        cantidad: cantLinea,
        precioUnitario: Number(it.precioUnitario) || (cantLinea ? importeLinea / cantLinea : 0),
        importe: importeLinea,
        descuento: descLinea,
        neto: importeLinea - descLinea
      })

      if (!esPlatilloValidoParaRanking(it)) continue
      const cant = Number(it.cantidad) || 1
      const imp = Number(it.subtotal) || 0
      const enCatalogo = PRODUCTOS_MOCK.find((x) => x.nombre.toLowerCase() === String(it.nombre).toLowerCase())
      const categoria = it.categoria || enCatalogo?.categoria || 'Platillo'

      const pl = mapaPlatillos.get(it.nombre) || { nombre: it.nombre, categoria, cantidad: 0, importe: 0 }
      pl.cantidad += cant
      pl.importe += imp
      mapaPlatillos.set(it.nombre, pl)

      const cat = mapaCategorias.get(categoria) || { categoria, cantidad: 0, importe: 0 }
      cat.cantidad += cant
      cat.importe += imp
      mapaCategorias.set(categoria, cat)
    }
  }

  const porFecha = [...mapaFechas.values()]
    .sort((a, b) => a.fechaISO.localeCompare(b.fechaISO))
    .map((f) => ({ ...f, etiqueta: etiquetaFechaExcel(f.fechaISO) }))

  const modalidades = MODALIDADES_EXCEL.map((m) => {
    const lista = ventas.filter((v) => v.tipo === m.tipo)
    return { label: m.label, pedidos: lista.length, monto: lista.reduce((a, v) => a + montoDeVenta(v), 0) }
  })

  const platillos = [...mapaPlatillos.values()].sort((a, b) => b.cantidad - a.cantidad || b.importe - a.importe)
  const categorias = [...mapaCategorias.values()].sort((a, b) => b.importe - a.importe)
  const pagos = [...mapaPagos.values()].sort((a, b) => b.monto - a.monto)

  const detalle = [...ventas]
    .sort((a, b) => `${b.fechaISO || hoyISO} ${b.hora || ''}`.localeCompare(`${a.fechaISO || hoyISO} ${a.hora || ''}`))
    .map((v) => ({
      folio: v.folio || '',
      fechaISO: v.fechaISO || hoyISO,
      hora: v.hora || '',
      tipo: v.tipo || '',
      cliente: v.clienteMesa || v.mesa || '',
      atendio: v.atendio || '',
      pago: v.pago || '',
      articulos: Number(v.cantidadProductos) || 0,
      subtotal: Number(v.subtotal) || 0,
      descuento: Number(v.descuento) || 0,
      envio: Number(v.envio) || 0,
      total: montoDeVenta(v)
    }))

  const montoTotal = ventas.reduce((a, v) => a + montoDeVenta(v), 0)

  // Desglose por tipo de artículo (platillo, bebida, postre, paquete, promoción, extras)
  const mapaClases = new Map()
  for (const l of lineas) {
    const c = mapaClases.get(l.clase) || { clase: l.clase, cantidad: 0, importe: 0, descuento: 0 }
    c.cantidad += l.cantidad
    c.importe += l.importe
    c.descuento += l.descuento
    mapaClases.set(l.clase, c)
  }
  const clases = [...mapaClases.values()].sort((a, b) => b.importe - a.importe)

  // Desglose por franja horaria
  const mapaHoras = new Map()
  for (const v of ventas) {
    const h = Number(String(v.hora || '').split(':')[0])
    if (!Number.isFinite(h)) continue
    const etq = `${String(h).padStart(2, '0')}:00 - ${String(h).padStart(2, '0')}:59`
    const x = mapaHoras.get(h) || { hora: h, etiqueta: etq, pedidos: 0, monto: 0 }
    x.pedidos += 1
    x.monto += montoDeVenta(v)
    mapaHoras.set(h, x)
  }
  const porHora = [...mapaHoras.values()].sort((a, b) => a.hora - b.hora)

  const totalDescuentos = ventas.reduce((a, v) => a + (Number(v.descuento) || 0), 0)
  const totalEnvios = ventas.reduce((a, v) => a + (Number(v.envio) || 0), 0)

  lineas.sort((a, b) => `${b.fechaISO} ${b.hora}`.localeCompare(`${a.fechaISO} ${a.hora}`) || a.folio.localeCompare(b.folio))

  return {
    porFecha,
    modalidades,
    platillos,
    categorias,
    pagos,
    clases,
    porHora,
    lineas,
    detalle,
    totales: {
      monto: montoTotal,
      pedidos: ventas.length,
      ticket: ventas.length ? montoTotal / ventas.length : 0,
      platillos: platillos.reduce((a, p) => a + p.cantidad, 0),
      articulos: lineas.reduce((a, l) => a + l.cantidad, 0),
      descuentos: totalDescuentos,
      envios: totalEnvios,
      neto: montoTotal - totalEnvios
    }
  }
}

const COLUMNAS_PEDIDOS_INGRESOS = (concepto) => [
  { titulo: concepto, formato: 'texto' },
  { titulo: 'Pedidos', formato: 'entero' },
  { titulo: 'Ingresos', formato: 'moneda' },
  { titulo: 'Participación', formato: 'porcentaje', porcentajeDe: 2 }
]

const COLUMNAS_PLATILLOS = (concepto) => [
  { titulo: concepto, formato: 'texto' },
  { titulo: 'Unidades', formato: 'entero' },
  { titulo: 'Importe', formato: 'moneda' },
  { titulo: 'Participación', formato: 'porcentaje', porcentajeDe: 1 }
]

/**
 * Genera el reporte en Excel (.xlsx) con diseño corporativo naranja de Kin Sushi:
 * hoja "Resumen" con indicadores, tablas y gráficas nativas de Excel (barras y pastel)
 * vinculadas a los datos, y hoja "Detalle de ventas" con filtros y subtotales.
 */
export function generarDashboardXlsxBlob(reporte, config = reporteConfigState.value) {
  const datos = obtenerDatosExcelReporte(config)
  const tipoId = config.tipoId || 'ventas_periodo'
  const ahora = new Date()
  const fechaEmision = `${formatearFechaCortaEs(obtenerFechaISOLocal(ahora), true)}, ${ahora.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })}`
  const rangoTexto =
    config.fechaDesde === config.fechaHasta ? config.fechaDesde : `${config.fechaDesde} al ${config.fechaHasta}`

  const filasFechas = datos.porFecha.map((f) => [f.etiqueta, f.pedidos, f.monto])
  const filasModalidad = datos.modalidades.map((m) => [m.label, m.pedidos, m.monto])
  const filasPagos = datos.pagos.map((p) => [p.metodo, p.pedidos, p.monto])
  const filasTopPlatillos = datos.platillos.slice(0, 10).map((p) => [p.nombre, p.cantidad, p.importe])
  const filasCategorias = datos.categorias.map((c) => [c.categoria, c.cantidad, c.importe])

  const bloqueFechas = {
    titulo: 'Ingresos por fecha',
    columnas: COLUMNAS_PEDIDOS_INGRESOS('Fecha'),
    filas: filasFechas,
    textoSinDatos: 'Sin ventas en el periodo',
    grafica: { tipo: 'columna', titulo: 'Ingresos por fecha', columnaValor: 2 }
  }
  const bloqueModalidad = {
    titulo: 'Ventas por modalidad de pedido',
    columnas: COLUMNAS_PEDIDOS_INGRESOS('Modalidad'),
    filas: filasModalidad,
    grafica: { tipo: 'pastel', titulo: 'Participación por modalidad', columnaValor: 2 }
  }
  const bloquePlatillos = {
    titulo: 'Platillos más vendidos (Top 10)',
    columnas: COLUMNAS_PLATILLOS('Platillo'),
    filas: filasTopPlatillos,
    textoSinDatos: 'Sin platillos vendidos en el periodo',
    grafica: { tipo: 'barra', titulo: 'Unidades vendidas por platillo', columnaValor: 1 }
  }
  const bloqueCategorias = {
    titulo: 'Ventas por categoría del menú',
    columnas: COLUMNAS_PLATILLOS('Categoría'),
    filas: filasCategorias,
    textoSinDatos: 'Sin platillos vendidos en el periodo',
    grafica: { tipo: 'pastel', titulo: 'Importe por categoría', columnaValor: 2 }
  }
  const bloquePagos = {
    titulo: 'Ventas por método de pago',
    columnas: COLUMNAS_PEDIDOS_INGRESOS('Método de pago'),
    filas: filasPagos,
    textoSinDatos: 'Sin ventas en el periodo',
    grafica: { tipo: 'columna', titulo: 'Ingresos por método de pago', columnaValor: 2 }
  }
  const bloqueClases = {
    titulo: 'Ventas por tipo de artículo',
    columnas: [
      { titulo: 'Tipo de artículo', formato: 'texto' },
      { titulo: 'Unidades', formato: 'entero' },
      { titulo: 'Importe', formato: 'moneda' },
      { titulo: 'Participación', formato: 'porcentaje', porcentajeDe: 2 }
    ],
    filas: datos.clases.map((c) => [c.clase, c.cantidad, c.importe]),
    textoSinDatos: 'Sin artículos vendidos en el periodo',
    grafica: { tipo: 'pastel', titulo: 'Importe por tipo de artículo', columnaValor: 2 }
  }
  const bloqueHoras = {
    titulo: 'Ventas por franja horaria',
    columnas: COLUMNAS_PEDIDOS_INGRESOS('Horario'),
    filas: datos.porHora.map((h) => [h.etiqueta, h.pedidos, h.monto]),
    textoSinDatos: 'Sin ventas en el periodo',
    grafica: { tipo: 'columna', titulo: 'Pedidos por horario', columnaValor: 1 }
  }

  let bloques
  let kpis
  if (tipoId === 'productos_mas_vendidos') {
    bloques = [bloquePlatillos, bloqueCategorias, bloqueClases, bloqueModalidad]
    kpis = [
      { etiqueta: 'Platillos vendidos', valor: datos.totales.platillos, formato: 'entero' },
      { etiqueta: 'Platillo más vendido', valor: datos.platillos[0]?.nombre || 'Sin datos', formato: 'texto' },
      { etiqueta: 'Pedidos', valor: datos.totales.pedidos, formato: 'entero' },
      { etiqueta: 'Total vendido', valor: datos.totales.monto, formato: 'moneda' }
    ]
  } else if (tipoId === 'ventas_tipo_pedido') {
    bloques = [bloqueModalidad, bloquePagos, bloqueHoras, bloqueFechas]
    kpis = datos.modalidades
      .map((m) => ({ etiqueta: m.label, valor: m.monto, formato: 'moneda' }))
      .concat([{ etiqueta: 'Pedidos', valor: datos.totales.pedidos, formato: 'entero' }])
  } else {
    bloques = [bloqueFechas, bloqueModalidad, bloquePagos, bloquePlatillos, bloqueClases, bloqueHoras]
    kpis = [
      { etiqueta: 'Total vendido', valor: datos.totales.monto, formato: 'moneda' },
      { etiqueta: 'Pedidos', valor: datos.totales.pedidos, formato: 'entero' },
      { etiqueta: 'Ticket promedio', valor: datos.totales.ticket, formato: 'moneda' },
      { etiqueta: 'Platillos vendidos', valor: datos.totales.platillos, formato: 'entero' }
    ]
  }

  const bytes = construirLibroXlsx({
    titulo: 'KIN SUSHI',
    subtitulo: `Reporte: ${reporte?.titulo || config.tipoTitulo || 'Ventas'}`,
    meta: `Periodo: ${rangoTexto} (${config.periodo})     |     Emitido: ${fechaEmision}     |     Av. La Bamba 5, Geovillas del Puerto, 91777 Veracruz, Ver.`,
    kpis,
    bloques,
    pie: 'Documento generado por KinGo para Kin Sushi. Importes en pesos mexicanos (MXN). Tel. +52 229 925 3443',
    detalles: [
      {
        nombreHoja: 'Detalle de ventas',
        titulo: 'KIN SUSHI · Detalle de ventas',
        subtitulo: `Periodo: ${rangoTexto} (${config.periodo})  ·  ${datos.totales.pedidos} pedido(s)`,
        textoSinDatos: 'Sin ventas registradas en el periodo',
        columnas: [
          { titulo: 'Folio', formato: 'centro', ancho: 10 },
          { titulo: 'Fecha', formato: 'fecha', ancho: 12 },
          { titulo: 'Hora', formato: 'centro', ancho: 9 },
          { titulo: 'Modalidad', formato: 'texto', ancho: 14 },
          { titulo: 'Cliente / Mesa', formato: 'texto', ancho: 24 },
          { titulo: 'Atendió', formato: 'texto', ancho: 18 },
          { titulo: 'Método de pago', formato: 'texto', ancho: 16 },
          { titulo: 'Artículos', formato: 'entero', ancho: 11 },
          { titulo: 'Subtotal', formato: 'moneda', ancho: 13 },
          { titulo: 'Descuento', formato: 'moneda', ancho: 13 },
          { titulo: 'Envío', formato: 'moneda', ancho: 11 },
          { titulo: 'Total', formato: 'moneda', ancho: 14 }
        ],
        filas: datos.detalle.map((v) => [
          v.folio,
          fechaISOaSerialExcel(v.fechaISO),
          v.hora,
          v.tipo,
          v.cliente,
          v.atendio,
          v.pago,
          v.articulos,
          v.subtotal,
          v.descuento,
          v.envio,
          v.total
        ]),
        columnasSuma: [7, 8, 9, 10, 11],
        notaTotales: 'Los totales se recalculan automáticamente al aplicar filtros en los encabezados.'
      },
      {
        nombreHoja: 'Productos vendidos',
        titulo: 'KIN SUSHI · Desglose de productos vendidos',
        subtitulo: `Periodo: ${rangoTexto} (${config.periodo})  ·  ${datos.totales.articulos} artículo(s) en ${datos.totales.pedidos} pedido(s)`,
        textoSinDatos: 'Sin productos vendidos en el periodo',
        columnas: [
          { titulo: 'Folio', formato: 'centro', ancho: 10 },
          { titulo: 'Fecha', formato: 'fecha', ancho: 12 },
          { titulo: 'Hora', formato: 'centro', ancho: 9 },
          { titulo: 'Modalidad', formato: 'texto', ancho: 14 },
          { titulo: 'Producto', formato: 'texto', ancho: 30 },
          { titulo: 'Categoría', formato: 'texto', ancho: 17 },
          { titulo: 'Tipo', formato: 'texto', ancho: 13 },
          { titulo: 'Cantidad', formato: 'entero', ancho: 10 },
          { titulo: 'Precio unit.', formato: 'moneda', ancho: 13 },
          { titulo: 'Importe', formato: 'moneda', ancho: 13 },
          { titulo: 'Descuento', formato: 'moneda', ancho: 12 },
          { titulo: 'Neto', formato: 'moneda', ancho: 13 },
          { titulo: 'Detalle / extras', formato: 'texto', ancho: 34 }
        ],
        filas: datos.lineas.map((l) => [
          l.folio,
          fechaISOaSerialExcel(l.fechaISO),
          l.hora,
          l.tipo,
          l.producto,
          l.categoria,
          l.clase,
          l.cantidad,
          l.precioUnitario,
          l.importe,
          l.descuento,
          l.neto,
          l.detalle
        ]),
        columnasSuma: [7, 9, 10, 11],
        notaTotales: 'Filtra por Categoría o Tipo para analizar las ventas; los totales se ajustan automáticamente.'
      }
    ]
  })

  return new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
}

const DIAS_LARGOS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

/**
 * Genera el reporte en CSV con un desglose completo y "listo para analizar":
 * - Importes y cantidades como números puros (sin "$" ni separador de miles) para que
 *   Excel / Google Sheets los sumen, filtren y grafiquen directamente.
 * - Fechas en formato AAAA-MM-DD (reconocido como fecha por cualquier hoja de cálculo).
 * - Secciones: resumen, por día, modalidad, método de pago, horario, tipo de artículo,
 *   categoría, ranking de platillos, detalle de ventas y detalle de productos vendidos.
 */
export function generarCSVReporteKinGo(reporte, config = reporteConfigState.value) {
  const datos = obtenerDatosExcelReporte(config)
  const ahora = new Date()
  const fechaEmision = `${obtenerFechaISOLocal(ahora)} ${ahora.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })}`
  const rango = obtenerRangoFechasPeriodo(config.periodo || 'Esta semana')
  const desdeISO = config.periodo === 'Personalizado' ? config.desdeISO || rango.desdeISO : rango.desdeISO
  const hastaISO = config.periodo === 'Personalizado' ? config.hastaISO || rango.hastaISO : rango.hastaISO

  const txt = (v) => {
    let s = String(v ?? '')
    if (/^[=+\-@]/.test(s)) s = `'${s}`
    return `"${s.replace(/"/g, '""')}"`
  }
  const num = (v, dec = 2) => (Number.isFinite(Number(v)) ? Number(v).toFixed(dec) : (0).toFixed(dec))
  const ent = (v) => String(Math.round(Number(v) || 0))
  const pct = (parte, total) => (total > 0 ? ((parte / total) * 100).toFixed(1) : '0.0')
  const fila = (...celdas) => celdas.join(',')

  const salida = []
  const seccion = (titulo, encabezados) => {
    salida.push('')
    salida.push(fila(txt(titulo)))
    salida.push(fila(...encabezados.map(txt)))
  }

  const T = datos.totales

  // Encabezado
  salida.push(fila(txt('KIN SUSHI - REPORTE DE VENTAS')))
  salida.push(fila(txt('Reporte'), txt(reporte?.titulo || config.tipoTitulo || 'Ventas')))
  salida.push(fila(txt('Periodo'), txt(config.periodo || '')))
  salida.push(fila(txt('Desde'), desdeISO))
  salida.push(fila(txt('Hasta'), hastaISO))
  salida.push(fila(txt('Emitido'), txt(fechaEmision)))
  salida.push(fila(txt('Sucursal'), txt('Av. La Bamba 5, Geovillas del Puerto, 91777 Veracruz, Ver.')))
  salida.push(fila(txt('Moneda'), txt('MXN (pesos mexicanos)')))

  // 1. Resumen
  seccion('1. RESUMEN GENERAL', ['Indicador', 'Valor'])
  salida.push(fila(txt('Total vendido (MXN)'), num(T.monto)))
  salida.push(fila(txt('Pedidos registrados'), ent(T.pedidos)))
  salida.push(fila(txt('Ticket promedio (MXN)'), num(T.ticket)))
  salida.push(fila(txt('Artículos vendidos'), ent(T.articulos)))
  salida.push(fila(txt('Platillos vendidos'), ent(T.platillos)))
  salida.push(fila(txt('Descuentos por promociones (MXN)'), num(T.descuentos)))
  salida.push(fila(txt('Costos de envío cobrados (MXN)'), num(T.envios)))
  salida.push(fila(txt('Ventas sin envío (MXN)'), num(T.neto)))
  salida.push(fila(txt('Platillo más vendido'), txt(datos.platillos[0]?.nombre || 'Sin datos')))
  const mejorDia = [...datos.porFecha].sort((a, b) => b.monto - a.monto)[0]
  salida.push(fila(txt('Día con más ventas'), mejorDia ? mejorDia.fechaISO : txt('Sin datos')))
  const mejorHora = [...datos.porHora].sort((a, b) => b.pedidos - a.pedidos)[0]
  salida.push(fila(txt('Horario con más pedidos'), txt(mejorHora ? mejorHora.etiqueta : 'Sin datos')))

  // 2. Por día
  seccion('2. VENTAS POR DÍA', ['Fecha', 'Día', 'Pedidos', 'Ingresos (MXN)', 'Ticket promedio (MXN)', '% del total'])
  datos.porFecha.forEach((f) => {
    const dia = DIAS_LARGOS_ES[parsearFechaISO(f.fechaISO).getDay()]
    salida.push(fila(f.fechaISO, txt(dia), ent(f.pedidos), num(f.monto), num(f.pedidos ? f.monto / f.pedidos : 0), pct(f.monto, T.monto)))
  })
  salida.push(fila(txt('TOTAL'), '', ent(T.pedidos), num(T.monto), num(T.ticket), T.monto > 0 ? '100.0' : '0.0'))

  // 3. Por modalidad
  seccion('3. VENTAS POR MODALIDAD', ['Modalidad', 'Pedidos', 'Ingresos (MXN)', 'Ticket promedio (MXN)', '% de ingresos', '% de pedidos'])
  datos.modalidades.forEach((m) => {
    salida.push(
      fila(txt(m.label), ent(m.pedidos), num(m.monto), num(m.pedidos ? m.monto / m.pedidos : 0), pct(m.monto, T.monto), pct(m.pedidos, T.pedidos))
    )
  })
  salida.push(fila(txt('TOTAL'), ent(T.pedidos), num(T.monto), num(T.ticket), T.monto > 0 ? '100.0' : '0.0', T.pedidos > 0 ? '100.0' : '0.0'))

  // 4. Por método de pago
  seccion('4. VENTAS POR MÉTODO DE PAGO', ['Método de pago', 'Pedidos', 'Ingresos (MXN)', 'Ticket promedio (MXN)', '% de ingresos'])
  datos.pagos.forEach((p) => {
    salida.push(fila(txt(p.metodo), ent(p.pedidos), num(p.monto), num(p.pedidos ? p.monto / p.pedidos : 0), pct(p.monto, T.monto)))
  })
  salida.push(fila(txt('TOTAL'), ent(T.pedidos), num(T.monto), num(T.ticket), T.monto > 0 ? '100.0' : '0.0'))

  // 5. Por horario
  seccion('5. VENTAS POR FRANJA HORARIA', ['Horario', 'Pedidos', 'Ingresos (MXN)', '% de pedidos'])
  datos.porHora.forEach((h) => {
    salida.push(fila(txt(h.etiqueta), ent(h.pedidos), num(h.monto), pct(h.pedidos, T.pedidos)))
  })

  // 6. Por tipo de artículo
  const totalImporteClases = datos.clases.reduce((a, c) => a + c.importe, 0)
  seccion('6. VENTAS POR TIPO DE ARTÍCULO', ['Tipo de artículo', 'Unidades', 'Importe (MXN)', 'Descuento (MXN)', 'Neto (MXN)', '% del importe'])
  datos.clases.forEach((c) => {
    salida.push(fila(txt(c.clase), ent(c.cantidad), num(c.importe), num(c.descuento), num(c.importe - c.descuento), pct(c.importe, totalImporteClases)))
  })

  // 7. Por categoría de platillo
  const totalImporteCat = datos.categorias.reduce((a, c) => a + c.importe, 0)
  seccion('7. PLATILLOS POR CATEGORÍA DEL MENÚ', ['Categoría', 'Unidades', 'Importe (MXN)', '% del importe'])
  datos.categorias.forEach((c) => {
    salida.push(fila(txt(c.categoria), ent(c.cantidad), num(c.importe), pct(c.importe, totalImporteCat)))
  })

  // 8. Ranking de platillos
  seccion('8. RANKING DE PLATILLOS', ['Posición', 'Platillo', 'Categoría', 'Unidades', 'Importe (MXN)', 'Precio promedio (MXN)', '% de unidades'])
  datos.platillos.forEach((p, i) => {
    salida.push(
      fila(ent(i + 1), txt(p.nombre), txt(p.categoria), ent(p.cantidad), num(p.importe), num(p.cantidad ? p.importe / p.cantidad : 0), pct(p.cantidad, T.platillos))
    )
  })

  // 9. Detalle de ventas
  seccion('9. DETALLE DE VENTAS', [
    'Folio',
    'Fecha',
    'Hora',
    'Modalidad',
    'Cliente / Mesa',
    'Atendió',
    'Método de pago',
    'Artículos',
    'Subtotal (MXN)',
    'Descuento (MXN)',
    'Envío (MXN)',
    'Total (MXN)'
  ])
  datos.detalle.forEach((v) => {
    salida.push(
      fila(
        txt(v.folio),
        v.fechaISO,
        txt(v.hora),
        txt(v.tipo),
        txt(v.cliente),
        txt(v.atendio),
        txt(v.pago),
        ent(v.articulos),
        num(v.subtotal),
        num(v.descuento),
        num(v.envio),
        num(v.total)
      )
    )
  })

  // 10. Detalle de productos vendidos
  seccion('10. DETALLE DE PRODUCTOS VENDIDOS', [
    'Folio',
    'Fecha',
    'Hora',
    'Modalidad',
    'Método de pago',
    'Producto',
    'Categoría',
    'Tipo de artículo',
    'Cantidad',
    'Precio unitario (MXN)',
    'Importe (MXN)',
    'Descuento (MXN)',
    'Neto (MXN)',
    'Detalle / extras'
  ])
  datos.lineas.forEach((l) => {
    salida.push(
      fila(
        txt(l.folio),
        l.fechaISO,
        txt(l.hora),
        txt(l.tipo),
        txt(l.pago),
        txt(l.producto),
        txt(l.categoria),
        txt(l.clase),
        ent(l.cantidad),
        num(l.precioUnitario),
        num(l.importe),
        num(l.descuento),
        num(l.neto),
        txt(l.detalle)
      )
    )
  })

  salida.push('')
  salida.push(fila(txt('Documento generado por KinGo para Kin Sushi · Tel. +52 229 925 3443')))

  return salida.join('\r\n')
}

export const REPORTE_RESULTADO_MOCK = obtenerDatosReporteDinamico()

export async function getReporteVentas() {
  return obtenerDatosReporteDinamico(reporteConfigState.value)
}
