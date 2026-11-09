import { ref } from 'vue'
import { HISTORIAL_VENTAS_MOCK } from '@/services/ventas.service'

export const TIPOS_REPORTE_MOCK = [
  {
    id: 'ventas_periodo',
    titulo: 'Ventas por periodo',
    descripcion: 'Ingresos y pedidos por día'
  },
  {
    id: 'productos_mas_vendidos',
    titulo: 'Productos más vendidos',
    descripcion: 'Ranking por unidades'
  },
  {
    id: 'ventas_tipo_pedido',
    titulo: 'Ventas por modalidad',
    descripcion: 'Local, llevar y domicilio'
  }
]

export const PERIODOS_REPORTE_MOCK = ['Hoy', 'Esta semana', 'Este mes', 'Personalizado']

export const reporteConfigState = ref({
  tipoId: 'ventas_periodo',
  tipoTitulo: 'Ventas por periodo',
  periodo: 'Esta semana',
  fechaDesde: '19 oct 2026',
  fechaHasta: '25 oct 2026'
})

export function generarNombreArchivoReporte(config = reporteConfigState.value) {
  const limpiar = (str) =>
    String(str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_|_$/g, '')

  const tipoSlug = limpiar(config.tipoTitulo || 'Ventas_por_periodo')
  const desdeSlug = limpiar(config.fechaDesde || '19_oct_2026')
  const hastaSlug = limpiar(config.fechaHasta || '25_oct_2026')

  if (desdeSlug === hastaSlug) {
    return `KinGo_${tipoSlug}_${desdeSlug}`
  }
  return `KinGo_${tipoSlug}_${desdeSlug}_al_${hastaSlug}`
}

const fmtMoneda = (n) => `$${Math.round(n).toLocaleString('es-MX')}`

export function obtenerDatosReporteDinamico(config = reporteConfigState.value) {
  const periodo = config.periodo || 'Esta semana'
  const tipoId = config.tipoId || 'ventas_periodo'

  const numVentasReales = HISTORIAL_VENTAS_MOCK.length
  const montoVentasReales = HISTORIAL_VENTAS_MOCK.reduce(
    (acc, v) => acc + (Number(String(v.total).replace(/[^0-9.]/g, '')) || 0),
    0
  )

  // Si aún no hay ninguna venta registrada, mostrar el reporte inicializado en $0
  if (numVentasReales === 0) {
    return {
      titulo:
        tipoId === 'productos_mas_vendidos'
          ? 'Productos más vendidos'
          : tipoId === 'ventas_tipo_pedido'
            ? 'Ventas por tipo de pedido'
            : `Ventas por periodo (${periodo})`,
      graficaTitulo: 'Sin ventas registradas aún',
      graficaSubtitulo: 'Los datos se actualizarán al registrar la primera venta',
      tituloPanel1: 'Por tipo de pedido',
      tituloPanel2: 'Platillos vendidos',
      kpis: [
        { label: 'Total vendido', valor: '$0' },
        { label: 'Pedidos registrados', valor: '0' },
        { label: 'Ticket promedio', valor: '$0' },
        { label: 'Estado', valor: 'Sin registros' }
      ],
      ventasPorDia: [
        { dia: 'Lun', valor: '$0', altura: '14px' },
        { dia: 'Mar', valor: '$0', altura: '14px' },
        { dia: 'Jue', valor: '$0', altura: '14px' },
        { dia: 'Vie', valor: '$0', altura: '14px' },
        { dia: 'Sáb', valor: '$0', altura: '14px' },
        { dia: 'Dom', valor: '$0', altura: '14px' }
      ],
      porTipoPedido: [
        { label: 'A domicilio', detalle: '$0 · 0%', porcentaje: '0%' },
        { label: 'En local', detalle: '$0 · 0%', porcentaje: '0%' },
        { label: 'Para llevar', detalle: '$0 · 0%', porcentaje: '0%' }
      ],
      masVendidos: [
        { nombre: 'Aún no se han vendido productos', piezas: '0 pzas' }
      ]
    }
  }

  // Cálculo real a partir de las ventas registradas en el sistema
  const ticketPromReal = Math.round(montoVentasReales / numVentasReales)
  const domVentas = HISTORIAL_VENTAS_MOCK.filter((v) => v.tipo === 'Domicilio')
  const locVentas = HISTORIAL_VENTAS_MOCK.filter((v) => v.tipo === 'En local')
  const lleVentas = HISTORIAL_VENTAS_MOCK.filter((v) => v.tipo === 'Para llevar')

  const sumLista = (arr) =>
    arr.reduce((acc, v) => acc + (Number(String(v.total).replace(/[^0-9.]/g, '')) || 0), 0)

  const montoDom = sumLista(domVentas)
  const montoLoc = sumLista(locVentas)
  const montoLle = sumLista(lleVentas)

  const pctDom = montoVentasReales > 0 ? Math.round((montoDom / montoVentasReales) * 100) : 0
  const pctLoc = montoVentasReales > 0 ? Math.round((montoLoc / montoVentasReales) * 100) : 0
  const pctLle = Math.max(0, 100 - pctDom - pctLoc)

  // Contabilizar platillos reales vendidos
  const mapaPlatillos = new Map()
  for (const v of HISTORIAL_VENTAS_MOCK) {
    if (Array.isArray(v.itemsSnapshot)) {
      for (const it of v.itemsSnapshot) {
        const prev = mapaPlatillos.get(it.nombre) || { cantidad: 0, importe: 0 }
        prev.cantidad += Number(it.cantidad) || 1
        prev.importe += Number(it.subtotal) || 0
        mapaPlatillos.set(it.nombre, prev)
      }
    }
  }

  const topPlatillos = [...mapaPlatillos.entries()]
    .sort((a, b) => b[1].cantidad - a[1].cantidad)
    .slice(0, 6)
    .map(([nombre, info], i) => ({
      nombre: `${i + 1}. ${nombre}`,
      piezas: `${info.cantidad} pzas · ${fmtMoneda(info.importe)}`,
      dia: nombre.slice(0, 12),
      valor: `${info.cantidad} pzas`,
      altura: `${Math.max(40, Math.min(200, info.cantidad * 35))}px`
    }))

  if (tipoId === 'productos_mas_vendidos') {
    const totalPiezas = [...mapaPlatillos.values()].reduce((a, b) => a + b.cantidad, 0)
    return {
      titulo: 'Productos más vendidos',
      graficaTitulo: 'Platillos por unidades vendidas',
      graficaSubtitulo: `Periodo: ${periodo}`,
      tituloPanel1: 'Por tipo de pedido',
      tituloPanel2: 'Ranking de platillos vendidos',
      kpis: [
        { label: 'Platillos vendidos', valor: `${totalPiezas} pzas` },
        { label: 'Platillo #1', valor: topPlatillos[0]?.dia || '-' },
        { label: 'Pedidos totales', valor: String(numVentasReales) },
        { label: 'Total vendido', valor: fmtMoneda(montoVentasReales) }
      ],
      ventasPorDia:
        topPlatillos.length > 0
          ? topPlatillos.map((p) => ({ dia: p.dia, valor: p.valor, altura: p.altura }))
          : [{ dia: 'Hoy', valor: '1 pza', altura: '100px' }],
      porTipoPedido: [
        { label: 'A domicilio', detalle: `${fmtMoneda(montoDom)} · ${pctDom}%`, porcentaje: `${pctDom}%` },
        { label: 'En local', detalle: `${fmtMoneda(montoLoc)} · ${pctLoc}%`, porcentaje: `${pctLoc}%` },
        { label: 'Para llevar', detalle: `${fmtMoneda(montoLle)} · ${pctLle}%`, porcentaje: `${pctLle}%` }
      ],
      masVendidos:
        topPlatillos.length > 0
          ? topPlatillos.map((p) => ({ nombre: p.nombre, piezas: p.piezas }))
          : [{ nombre: '1. Pedido registrado', piezas: fmtMoneda(montoVentasReales) }]
    }
  }

  if (tipoId === 'ventas_tipo_pedido') {
    return {
      titulo: 'Ventas por tipo de pedido',
      graficaTitulo: 'Comparativo de ingresos por modalidad',
      graficaSubtitulo: `Periodo: ${periodo}`,
      tituloPanel1: 'Participación por modalidad',
      tituloPanel2: 'Desglose de pedidos',
      kpis: [
        { label: `A domicilio (${pctDom}%)`, valor: fmtMoneda(montoDom) },
        { label: `En local (${pctLoc}%)`, valor: fmtMoneda(montoLoc) },
        { label: `Para llevar (${pctLle}%)`, valor: fmtMoneda(montoLle) },
        { label: 'Total de pedidos', valor: `${numVentasReales} pedidos` }
      ],
      ventasPorDia: [
        { dia: 'A domicilio', valor: fmtMoneda(montoDom), altura: `${Math.max(24, pctDom * 2)}px` },
        { dia: 'En local', valor: fmtMoneda(montoLoc), altura: `${Math.max(24, pctLoc * 2)}px` },
        { dia: 'Para llevar', valor: fmtMoneda(montoLle), altura: `${Math.max(24, pctLle * 2)}px` }
      ],
      porTipoPedido: [
        { label: 'A domicilio', detalle: `${fmtMoneda(montoDom)} · ${pctDom}%`, porcentaje: `${pctDom}%` },
        { label: 'En local', detalle: `${fmtMoneda(montoLoc)} · ${pctLoc}%`, porcentaje: `${pctLoc}%` },
        { label: 'Para llevar', detalle: `${fmtMoneda(montoLle)} · ${pctLle}%`, porcentaje: `${pctLle}%` }
      ],
      masVendidos: [
        { nombre: 'Pedidos a domicilio', piezas: `${domVentas.length} pedidos` },
        { nombre: 'Pedidos en local (comedor)', piezas: `${locVentas.length} pedidos` },
        { nombre: 'Pedidos para llevar', piezas: `${lleVentas.length} pedidos` }
      ]
    }
  }

  return {
    titulo: `Ventas por periodo (${periodo})`,
    graficaTitulo: 'Ventas registradas',
    graficaSubtitulo: `${numVentasReales} pedido(s) registrado(s)`,
    tituloPanel1: 'Por tipo de pedido',
    tituloPanel2: 'Platillos más vendidos',
    kpis: [
      { label: 'Total vendido', valor: fmtMoneda(montoVentasReales) },
      { label: 'Pedidos', valor: String(numVentasReales) },
      { label: 'Ticket promedio', valor: fmtMoneda(ticketPromReal) },
      { label: 'Último folio', valor: HISTORIAL_VENTAS_MOCK[0]?.folio || '#0001' }
    ],
    ventasPorDia: HISTORIAL_VENTAS_MOCK.slice(0, 6)
      .reverse()
      .map((v) => ({
        dia: v.folio,
        valor: v.total,
        altura: '140px'
      })),
    porTipoPedido: [
      { label: 'A domicilio', detalle: `${fmtMoneda(montoDom)} · ${pctDom}%`, porcentaje: `${pctDom}%` },
      { label: 'En local', detalle: `${fmtMoneda(montoLoc)} · ${pctLoc}%`, porcentaje: `${pctLoc}%` },
      { label: 'Para llevar', detalle: `${fmtMoneda(montoLle)} · ${pctLle}%`, porcentaje: `${pctLle}%` }
    ],
    masVendidos:
      topPlatillos.length > 0
        ? topPlatillos.map((p) => ({ nombre: p.nombre, piezas: p.piezas }))
        : HISTORIAL_VENTAS_MOCK.map((v) => ({ nombre: `${v.folio} · ${v.clienteMesa}`, piezas: v.total }))
  }
}

export const REPORTE_RESULTADO_MOCK = obtenerDatosReporteDinamico()

export async function getReporteVentas() {
  return obtenerDatosReporteDinamico(reporteConfigState.value)
}
