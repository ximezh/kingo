import { reactive } from 'vue'
import { PRODUCTOS_MOCK, CATEGORIAS_NOTAS_MAP } from '@/services/catalogo.service'

const STORAGE_VENTAS_KEY = 'kingo_ventas_v2'

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
  const lista = [
    {
      id: 'promo-2x1-unica',
      nombre: 'Promoción 2x1',
      categoria: 'Promociones',
      subtitulo: 'Aplica en Barra de Sushi, Empanizados y Afrutados. Se cobra el rollo de mayor precio.',
      descripcion: 'Aplica en Barra de Sushi, Empanizados y Afrutados. Se cobra el rollo de mayor precio.',
      presentacion: 'Lunes y Martes',
      precio: null,
      imagenUrl: '/img/productos/promo-2x1.jpg?v=2',
      tieneFoto: true,
      tipoCard: 'promo_2x1',
      textoBoton: 'Elegir rollos'
    }
  ]

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
        imagenUrl: p.imagenUrl || null,
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
        imagenUrl: p.imagenUrl || null,
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

function cargarVentasGuardadas() {
  try {
    const saved = localStorage.getItem(STORAGE_VENTAS_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    // ignore storage errors
  }
  return []
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
      if (Array.isArray(lista) && lista.length >= HISTORIAL_VENTAS_MOCK.length) {
        HISTORIAL_VENTAS_MOCK.splice(0, HISTORIAL_VENTAS_MOCK.length, ...lista)
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
