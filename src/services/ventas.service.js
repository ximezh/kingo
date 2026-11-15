import { reactive } from 'vue'
import { PRODUCTOS_MOCK, CATEGORIAS_NOTAS_MAP } from '@/services/catalogo.service'
import { PROMOCIONES_MOCK } from '@/services/promociones.service'

const STORAGE_VENTAS_KEY = 'kingo_ventas_v2'
const STORAGE_SEED_MULTIDIA_KEY = 'kingo_ventas_multidia_v1'

const MESES_CORTOS_ES = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
]

export const MESES_LARGOS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export function obtenerFechaISOLocal(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parsearFechaISO(fechaISO) {
  if (!fechaISO || typeof fechaISO !== 'string') return new Date()
  const partes = fechaISO.split('-').map(Number)
  if (partes.length !== 3 || partes.some(Number.isNaN)) return new Date()
  return new Date(partes[0], partes[1] - 1, partes[2], 12, 0, 0)
}

export function sumarDiasISO(fechaISO, deltaDias) {
  const d = parsearFechaISO(fechaISO)
  d.setDate(d.getDate() + deltaDias)
  return obtenerFechaISOLocal(d)
}

export function formatearFechaCortaEs(fechaISO, incluirAnio = false) {
  const d = parsearFechaISO(fechaISO)
  const dia = d.getDate()
  const mes = MESES_CORTOS_ES[d.getMonth()] || 'ene'
  const anio = d.getFullYear()
  return incluirAnio ? `${dia} ${mes} ${anio}` : `${dia} ${mes}`
}

export function formatearFechaHoraVenta(fechaISO, hora = '14:00') {
  const isoEfectiva = fechaISO || obtenerFechaISOLocal(new Date())
  const horaLimpia = hora || '14:00'
  return `${formatearFechaCortaEs(isoEfectiva, true)}, ${horaLimpia}`
}

export const CATEGORIAS_VENTA_MOCK = [
  'Todo',
  'Promociones',
  'Barra de Sushi',
  'Empanizados',
  'Afrutados',
  'Especialidades',
  'Paquetes',
  'Plato Kin',
  'Yakimeshi',
  'Bebidas',
  'Kushiages',
  'Sopas',
  'Ensaladas',
  'Postres',
  'Orden Extra'
]

function detectarNumCarnes(prod, nombreCategoria) {
  const n = (prod.nombre || '').toLowerCase()
  const d = (prod.descripcion || '').toLowerCase()
  if (n.includes('3 carnes')) return 3
  if (n.includes('2 carnes') || n.includes('teppanyaki mixto')) return 2
  if (
    n.includes('1 carne') ||
    n.includes('una carne') ||
    n === 'plato kin con piña' ||
    n === 'ramen' ||
    n === 'yakisoba' ||
    n === 'orden extra de carne' ||
    n === 'paquete d' ||
    (nombreCategoria === 'Especialidades' &&
      n.startsWith('teppanyaki') &&
      !n.includes('sencillo') &&
      !n.includes('camarón') &&
      !n.includes('salmón') &&
      !n.includes('atún')) ||
    d.includes('pollo, cerdo o res')
  ) {
    return 1
  }
  return 0
}

function construirProductosMenuVenta() {
  const lista = []

  // Agregar todas las promociones activas a la categoría Promociones del punto de venta
  for (const pr of PROMOCIONES_MOCK) {
    if (pr.activa === false) continue
    const nomLow = (pr.nombre || '').toLowerCase()
    const descLow = (pr.descuento || '').toLowerCase()
    const esPromo2x1 = pr.id === 1 || pr.tipoDescuento === '2x1' || nomLow.includes('2x1')
    const participTxt = esPromo2x1
      ? 'Participan todos los rollos del menú (Barra de Sushi, Empanizados y Afrutados).'
      : Array.isArray(pr.productosIncluidos) && pr.productosIncluidos.length > 0
        ? `Participan: ${pr.productosIncluidos.join(', ')}.`
        : ''
    const descCompleta = `${pr.descuento}. Aplica: ${pr.dia}. ${participTxt}`.trim()

    if (esPromo2x1) {
      lista.push({
        id: `promo-pos-${pr.id}`,
        nombre: pr.nombre,
        categoria: 'Promociones',
        subtitulo: pr.descuento,
        descripcion: descCompleta,
        presentacion: pr.dia,
        precio: null,
        imagenUrl: null,
        esVector: true,
        tieneFoto: true,
        tipoCard: 'promo_2x1',
        etiquetaCorto: '2x1',
        promoData: pr,
        textoBoton: 'Elegir'
      })
    } else if (pr.id === 4 || nomLow.includes('paga 4') || nomLow.includes('5x4')) {
      lista.push({
        id: `promo-pos-${pr.id}`,
        nombre: pr.nombre,
        categoria: 'Promociones',
        subtitulo: pr.descuento,
        descripcion: descCompleta,
        presentacion: pr.dia,
        precio: null,
        imagenUrl: null,
        esVector: true,
        tieneFoto: true,
        tipoCard: 'paquete_sushi',
        etiquetaCorto: '5x4',
        promoData: pr,
        textoBoton: 'Elegir'
      })
    } else {
      const matchPct = (pr.descuento || pr.nombre || '').match(/(\d+\s*%)/)
      const etiquetaCorto =
        nomLow.includes('postre') || descLow.includes('gratis')
          ? 'Gratis'
          : matchPct
            ? `-${matchPct[1].replace(/\s+/g, '')}`
            : 'Promo'
      lista.push({
        id: `promo-pos-${pr.id}`,
        nombre: pr.nombre,
        categoria: 'Promociones',
        subtitulo: pr.descuento,
        descripcion: descCompleta,
        presentacion: pr.dia,
        precio: null,
        imagenUrl: null,
        esVector: true,
        tieneFoto: true,
        tipoCard: 'promo_general',
        etiquetaCorto,
        promoData: pr,
        textoBoton: 'Elegir'
      })
    }
  }

  const categoriasSinExtras = ['Bebidas', 'Postres', 'Orden Extra', 'Paquetes']

  for (const p of PRODUCTOS_MOCK) {
    if (p.activo === false) continue

    const catNombre = p.categoria || 'Barra de Sushi'
    const notaCat = CATEGORIAS_NOTAS_MAP[catNombre] || null
    const tieneFoto = Boolean(p.imagenUrl || p.tieneFoto)

    // Paquete Sushi (5 barras y paga 4, gratis la de menor precio)
    if (p.id === 123 || p.precioNulo || p.precio === null) {
      lista.push({
        id: p.id,
        nombre: p.nombre,
        categoria: catNombre,
        subtitulo: p.descripcion || 'Elige 5 barras de sushi y paga 4 (gratis la de menor precio).',
        descripcion: p.descripcion || 'Elige 5 barras de sushi y paga 4 (gratis la de menor precio).',
        presentacion: p.presentacion || '5 rollos a elegir',
        precio: null,
        imagenUrl: null,
        esVector: true,
        tieneFoto,
        tipoCard: 'paquete_sushi',
        textoBoton: 'Elegir'
      })
      continue
    }

    // Bebidas con variantes (Té Verde y Kalpis Chico / Grande)
    if (p.variantes && p.variantes.length > 0) {
      lista.push({
        id: p.id,
        nombre: p.nombre,
        categoria: catNombre,
        subtitulo: p.descripcion || 'Bebida disponible en tamaño chico y grande.',
        descripcion: p.descripcion || 'Bebida disponible en tamaño chico y grande.',
        presentacion: p.presentacion || 'Chico / Grande',
        imagenUrl: p.imagenUrl || null,
        tieneFoto,
        tipoCard: 'variantes',
        variantes: p.variantes.map((v, idx) => {
          const nombreTam = v.nombre || v.tamano || 'Chico'
          const corto = nombreTam.toLowerCase().startsWith('ch') ? 'CH' : 'GRDE'
          const numPrecio = Number(String(v.precio).replace(/[^0-9.]/g, '')) || 40
          return {
            label: `${corto} $${numPrecio.toFixed(0)}`,
            nombreVar: `Tamaño ${nombreTam.toLowerCase()}`,
            precio: numPrecio,
            activa: idx === 0
          }
        })
      })
      continue
    }

    const numCarnes = detectarNumCarnes(p, catNombre)

    if (catNombre === 'Paquetes') {
      lista.push({
        id: p.id,
        nombre: p.nombre,
        categoria: catNombre,
        subtitulo: p.descripcion,
        descripcion: p.descripcion || notaCat || '',
        presentacion: p.presentacion || notaCat || '',
        precio: p.precio,
        imagenUrl: null,
        esVector: true,
        tieneFoto,
        numCarnes,
        tipoCard: 'paquete',
        permiteExtras: false,
        textoBoton: numCarnes > 0 ? 'Elegir carne' : 'Agregar'
      })
      continue
    }

    lista.push({
      id: p.id,
      nombre: p.nombre,
      categoria: catNombre,
      subtitulo: p.descripcion || notaCat || '',
      descripcion: p.descripcion || notaCat || '',
      presentacion: p.presentacion || notaCat || '',
      precio: p.precio,
      imagenUrl: p.imagenUrl || null,
      esVector: !p.imagenUrl,
      tieneFoto,
      numCarnes,
      permiteExtras: !categoriasSinExtras.includes(catNombre),
      tipoCard: 'normal',
      textoBoton: numCarnes > 0 ? 'Elegir carne' : 'Agregar'
    })
  }

  return lista
}

export const PRODUCTOS_MENU_VENTA_MOCK = reactive(construirProductosMenuVenta())

export function reconstruirMenuVenta() {
  const actualizados = construirProductosMenuVenta()
  PRODUCTOS_MENU_VENTA_MOCK.splice(0, PRODUCTOS_MENU_VENTA_MOCK.length, ...actualizados)
}

function generarVentasSemillaMultidia() {
  const hoy = obtenerFechaISOLocal(new Date())
  const ayer = sumarDiasISO(hoy, -1)
  const hace2Dias = sumarDiasISO(hoy, -2)
  const hace4Dias = sumarDiasISO(hoy, -4)
  const hace9Dias = sumarDiasISO(hoy, -9)
  const hace16Dias = sumarDiasISO(hoy, -16)

  const semillas = [
    {
      folio: '#0006',
      fechaISO: hoy,
      hora: '14:25',
      tipo: 'En local',
      tipoCodigo: 'local',
      clienteMesa: 'Mesa 2',
      mesa: 'Mesa 2',
      atendio: 'Sofía Ramírez',
      pago: 'Efectivo',
      subtotal: 295,
      descuento: 0,
      envio: 0,
      totalNum: 295,
      total: '$295',
      montoRecibido: 300,
      cambio: 5,
      cantidadProductos: 3,
      itemsSnapshot: [
        { id: 1, nombre: 'Salmón Roll', categoria: 'Barra de Sushi', cantidad: 1, precioUnitario: 120, subtotal: 120 },
        { id: 132, nombre: 'Yakimeshi especial', categoria: 'Yakimeshi', cantidad: 1, precioUnitario: 130, subtotal: 130 },
        { id: 137, nombre: 'Calpis chico', categoria: 'Bebidas', cantidad: 1, precioUnitario: 45, subtotal: 45 }
      ],
      estado: 'Completada',
      estadoVariant: 'ok',
      esSemillaHistorica: true
    },
    {
      folio: '#0005',
      fechaISO: ayer,
      hora: '19:40',
      tipo: 'Domicilio',
      tipoCodigo: 'domicilio',
      clienteMesa: 'Roberto Alvarado',
      telefono: '951 234 8891',
      direccion: 'Av. Juárez 410, Centro',
      referencia: 'Portón café junto a farmacia',
      atendio: 'Sofía Ramírez',
      pago: 'Transferencia',
      subtotal: 340,
      descuento: 0,
      envio: 35,
      totalNum: 375,
      total: '$375',
      cantidadProductos: 3,
      itemsSnapshot: [
        { id: 32, nombre: 'Ebi Furai Roll', categoria: 'Empanizados', cantidad: 1, precioUnitario: 115, subtotal: 115 },
        { id: 52, nombre: 'Mango Roll', categoria: 'Afrutados', cantidad: 1, precioUnitario: 115, subtotal: 115 },
        { id: 128, nombre: 'Plato Kin 2 carnes', categoria: 'Plato Kin', detalle: 'Carnes: Pollo, Res', cantidad: 1, precioUnitario: 110, subtotal: 110 }
      ],
      estado: 'Completada',
      estadoVariant: 'ok',
      esSemillaHistorica: true
    },
    {
      folio: '#0004',
      fechaISO: ayer,
      hora: '15:10',
      tipo: 'Para llevar',
      tipoCodigo: 'llevar',
      clienteMesa: 'Mariana Torres',
      atendio: 'Sofía Ramírez',
      pago: 'Tarjeta',
      subtotal: 230,
      descuento: 0,
      envio: 0,
      totalNum: 230,
      total: '$230',
      cantidadProductos: 2,
      itemsSnapshot: [
        { id: 3, nombre: 'Tampico Roll', categoria: 'Barra de Sushi', cantidad: 1, precioUnitario: 120, subtotal: 120 },
        { id: 147, nombre: 'Ramen', categoria: 'Sopas', detalle: 'Carne: Cerdo', cantidad: 1, precioUnitario: 110, subtotal: 110 }
      ],
      estado: 'Completada',
      estadoVariant: 'ok',
      esSemillaHistorica: true
    },
    {
      folio: '#0003',
      fechaISO: hace2Dias,
      hora: '20:15',
      tipo: 'En local',
      tipoCodigo: 'local',
      clienteMesa: 'Mesa 4',
      mesa: 'Mesa 4',
      atendio: 'Sofía Ramírez',
      pago: 'Efectivo',
      subtotal: 410,
      descuento: 0,
      envio: 0,
      totalNum: 410,
      total: '$410',
      montoRecibido: 500,
      cambio: 90,
      cantidadProductos: 4,
      itemsSnapshot: [
        { id: 56, nombre: 'Kingo Roll', categoria: 'Afrutados', cantidad: 1, precioUnitario: 130, subtotal: 130 },
        { id: 35, nombre: 'Cordon Blue Roll', categoria: 'Empanizados', cantidad: 1, precioUnitario: 115, subtotal: 115 },
        { id: 142, nombre: 'Kushiage de queso', categoria: 'Kushiages', cantidad: 1, precioUnitario: 90, subtotal: 90 },
        { id: 135, nombre: 'Té verde grande', categoria: 'Bebidas', cantidad: 1, precioUnitario: 75, subtotal: 75 }
      ],
      estado: 'Completada',
      estadoVariant: 'ok',
      esSemillaHistorica: true
    },
    {
      folio: '#0002',
      fechaISO: hace4Dias,
      hora: '17:50',
      tipo: 'En local',
      tipoCodigo: 'local',
      clienteMesa: 'Mesa 1',
      mesa: 'Mesa 1',
      atendio: 'Sofía Ramírez',
      pago: 'Tarjeta',
      subtotal: 265,
      descuento: 0,
      envio: 0,
      totalNum: 265,
      total: '$265',
      cantidadProductos: 2,
      itemsSnapshot: [
        { id: 129, nombre: 'Plato Kin 3 carnes', categoria: 'Plato Kin', detalle: 'Carnes: Pollo, Cerdo, Res', cantidad: 1, precioUnitario: 150, subtotal: 150 },
        { id: 2, nombre: 'Philadelphia Roll', categoria: 'Barra de Sushi', cantidad: 1, precioUnitario: 115, subtotal: 115 }
      ],
      estado: 'Completada',
      estadoVariant: 'ok',
      esSemillaHistorica: true
    },
    {
      folio: '#0001',
      fechaISO: hace9Dias,
      hora: '16:05',
      tipo: 'Para llevar',
      tipoCodigo: 'llevar',
      clienteMesa: 'Daniela Cruz',
      atendio: 'Sofía Ramírez',
      pago: 'Efectivo',
      subtotal: 355,
      descuento: 0,
      envio: 0,
      totalNum: 355,
      total: '$355',
      montoRecibido: 400,
      cambio: 45,
      cantidadProductos: 3,
      itemsSnapshot: [
        { id: 133, nombre: 'Yakimeshi KinGo', categoria: 'Yakimeshi', cantidad: 1, precioUnitario: 140, subtotal: 140 },
        { id: 33, nombre: 'Camarón Empanizado Roll', categoria: 'Empanizados', cantidad: 1, precioUnitario: 115, subtotal: 115 },
        { id: 146, nombre: 'Sopa Miso', categoria: 'Sopas', cantidad: 1, precioUnitario: 100, subtotal: 100 }
      ],
      estado: 'Completada',
      estadoVariant: 'ok',
      esSemillaHistorica: true
    },
    {
      folio: '#0000',
      fechaISO: hace16Dias,
      hora: '18:30',
      tipo: 'Domicilio',
      tipoCodigo: 'domicilio',
      clienteMesa: 'Jorge Pineda',
      telefono: '951 412 0933',
      direccion: 'Calle Morelos 215, Centro',
      atendio: 'Sofía Ramírez',
      pago: 'Transferencia',
      subtotal: 290,
      descuento: 0,
      envio: 35,
      totalNum: 325,
      total: '$325',
      cantidadProductos: 2,
      itemsSnapshot: [
        { id: 62, nombre: 'Teppanyaki mixto', categoria: 'Especialidades', cantidad: 1, precioUnitario: 175, subtotal: 175 },
        { id: 4, nombre: 'California Roll', categoria: 'Barra de Sushi', cantidad: 1, precioUnitario: 115, subtotal: 115 }
      ],
      estado: 'Completada',
      estadoVariant: 'ok',
      esSemillaHistorica: true
    }
  ]

  return semillas.map((v) => ({
    ...v,
    fechaHora: formatearFechaHoraVenta(v.fechaISO, v.hora)
  }))
}

export function normalizarVentaFecha(venta, indexFallback = 0) {
  const hoyISO = obtenerFechaISOLocal(new Date())
  let hora = venta.hora || ''
  if (!hora && typeof venta.fechaHora === 'string') {
    const m = venta.fechaHora.match(/(\d{1,2}:\d{2})/)
    if (m) hora = m[1]
  }
  if (!hora) hora = '14:30'

  let fechaISO = venta.fechaISO || ''
  if (!fechaISO) {
    // Si viene una fecha previa o no tenía fechaISO, conservar hoy para las recientes o asignar escalonado si son antiguas sin fechaISO
    fechaISO = indexFallback === 0 ? hoyISO : sumarDiasISO(hoyISO, -Math.min(indexFallback, 10))
  }

  return {
    ...venta,
    hora,
    fechaISO,
    atendio: venta.atendio || 'Sofía Ramírez',
    fechaHora: formatearFechaHoraVenta(fechaISO, hora)
  }
}

function cargarVentasGuardadas() {
  try {
    const saved = localStorage.getItem(STORAGE_VENTAS_KEY)
    const yaSembrado = localStorage.getItem(STORAGE_SEED_MULTIDIA_KEY)
    let parsed = []
    if (saved) {
      const data = JSON.parse(saved)
      if (Array.isArray(data)) parsed = data
    }

    if (parsed.length === 0) {
      const iniciales = generarVentasSemillaMultidia()
      localStorage.setItem(STORAGE_SEED_MULTIDIA_KEY, '1')
      localStorage.setItem(STORAGE_VENTAS_KEY, JSON.stringify(iniciales))
      return iniciales
    }

    const normalizadas = parsed.map((v, idx) => normalizarVentaFecha(v, idx))

    // Si todas las ventas guardadas tenían la misma fecha porque antes no existía fechaISO, agregar respaldo histórico de días previos una sola vez
    const fechasUnicas = new Set(normalizadas.map((v) => v.fechaISO))
    if (!yaSembrado && fechasUnicas.size <= 1) {
      const semillasPrevias = generarVentasSemillaMultidia().filter(
        (s) => s.fechaISO !== obtenerFechaISOLocal(new Date())
      )
      const combinadas = [...normalizadas, ...semillasPrevias]
      localStorage.setItem(STORAGE_SEED_MULTIDIA_KEY, '1')
      localStorage.setItem(STORAGE_VENTAS_KEY, JSON.stringify(combinadas))
      return combinadas
    }

    return normalizadas
  } catch {
    return generarVentasSemillaMultidia()
  }
}

export const HISTORIAL_VENTAS_MOCK = reactive(cargarVentasGuardadas())

export function guardarVentasStorage() {
  try {
    localStorage.setItem(STORAGE_VENTAS_KEY, JSON.stringify(HISTORIAL_VENTAS_MOCK))
  } catch {
    // ignore storage errors
  }
}

export async function sincronizarVentasDesdeDB() {
  try {
    const res = await fetch('http://localhost:3000/api/ventas')
    if (res.ok) {
      const lista = await res.json()
      if (Array.isArray(lista) && lista.length > 0) {
        const normalizadasDB = lista.map((v, idx) => normalizarVentaFecha(v, idx))
        // Conservar ventas históricas de días previos si en DB solo hay registros de un día
        const foliosDB = new Set(normalizadasDB.map((v) => v.folio))
        const extrasLocales = HISTORIAL_VENTAS_MOCK.filter((v) => !foliosDB.has(v.folio))
        const fusion = [...normalizadasDB, ...extrasLocales]
        HISTORIAL_VENTAS_MOCK.splice(0, HISTORIAL_VENTAS_MOCK.length, ...fusion)
        guardarVentasStorage()
      }
    }
  } catch {
    // Mantiene estado en localStorage si el backend no está activo
  }
}

sincronizarVentasDesdeDB()

export async function getHistorialVentas() {
  await sincronizarVentasDesdeDB()
  return HISTORIAL_VENTAS_MOCK
}
