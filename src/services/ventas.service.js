import { reactive } from 'vue'
import { MENU_OFICIAL_JSON, CATEGORIAS_NOTAS_MAP } from '@/services/catalogo.service'

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

function construirProductosMenuVenta() {
  const lista = [
    {
      id: 'promo-2x1-unica',
      nombre: 'Promoción 2x1',
      categoria: 'Promociones',
      precio: null,
      tieneFoto: true,
      tipoCard: 'promo_2x1',
      textoBoton: 'Elegir rollos'
    }
  ]

  const categoriasSinExtras = ['Bebidas', 'Postres', 'Orden Extra', 'Paquetes']
  const listaCategorias = MENU_OFICIAL_JSON.categorias || MENU_OFICIAL_JSON.menu || []

  // Determina cuántas carnes (Pollo, Cerdo o Res) debe elegir el cliente según el platillo
  function detectarNumCarnes(prod, nombreCategoria) {
    const n = prod.nombre.toLowerCase()
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
      (nombreCategoria === 'Especialidades' && n.startsWith('teppanyaki') && !n.includes('sencillo') && !n.includes('camarón') && !n.includes('salmón') && !n.includes('atún')) ||
      d.includes('pollo, cerdo o res')
    ) {
      return 1
    }
    return 0
  }

  for (const cat of listaCategorias) {
    const notaCat = CATEGORIAS_NOTAS_MAP[cat.categoria] || null
    for (const p of cat.productos) {
      const tieneFoto = p.id % 5 !== 0

      // Paquete Sushi (5 barras y paga 4, gratis la de menor precio)
      if (p.id === 123 || p.precio === null || p.regla_especial) {
        lista.push({
          id: p.id,
          nombre: p.nombre,
          categoria: cat.categoria,
          subtitulo: '5 barras, paga 4',
          precio: null,
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
          categoria: cat.categoria,
          tieneFoto,
          tipoCard: 'variantes',
          variantes: p.variantes.map((v, idx) => {
            const nombreTam = v.nombre || v.tamano || 'Chico'
            const corto = nombreTam.toLowerCase().startsWith('ch') ? 'CH' : 'GRDE'
            return {
              label: `${corto} $${Number(v.precio).toFixed(0)}`,
              nombreVar: `Tamaño ${nombreTam.toLowerCase()}`,
              precio: v.precio,
              activa: idx === 0
            }
          })
        })
        continue
      }

      const numCarnes = detectarNumCarnes(p, cat.categoria)

      // Paquetes fijos
      if (cat.categoria === 'Paquetes') {
        lista.push({
          id: p.id,
          nombre: p.nombre,
          categoria: cat.categoria,
          subtitulo: p.descripcion,
          precio: p.precio,
          tieneFoto,
          numCarnes,
          tipoCard: 'paquete',
          permiteExtras: false,
          textoBoton: numCarnes > 0 ? 'Elegir carne' : 'Agregar'
        })
        continue
      }

      // Todos los demás platillos
      lista.push({
        id: p.id,
        nombre: p.nombre,
        categoria: cat.categoria,
        subtitulo: p.descripcion || notaCat || '',
        precio: p.precio,
        tieneFoto,
        numCarnes,
        permiteExtras: !categoriasSinExtras.includes(cat.categoria),
        tipoCard: 'normal',
        textoBoton: numCarnes > 0 ? 'Elegir carne' : 'Agregar'
      })
    }
  }

  return lista
}

export const PRODUCTOS_MENU_VENTA_MOCK = construirProductosMenuVenta()

export const VENTA_EJEMPLO_0143 = {
  folio: '#0143',
  cliente: 'Laura Méndez',
  telefono: '2290000000',
  direccion: 'Av. Reforma 412, Col. Centro',
  referencia: 'Casa de rejas negras',
  tipo: 'domicilio',
  metodoPago: 'Efectivo',
  items: [
    {
      id: 1,
      nombre: 'Tampico Roll',
      etiquetaPromo: '2x1',
      detalle: null,
      extrasSeleccionados: [],
      cantidad: 2,
      precioUnitario: 120,
      subtotal: 240,
      promocion: { nombre: '2x1 en Rollos', descuento: 120 }
    },
    {
      id: 131,
      nombre: 'Té verde',
      etiquetaPromo: null,
      detalle: 'Tamaño grande',
      extrasSeleccionados: [],
      cantidad: 1,
      precioUnitario: 70,
      subtotal: 70
    },
    {
      id: 88,
      nombre: 'Yakimeshi sencillo',
      etiquetaPromo: null,
      detalle: 'Extra: camarón +$60',
      extrasSeleccionados: ['Camarón'],
      cantidad: 1,
      precioBase: 60,
      precioUnitario: 120,
      subtotal: 120
    }
  ],
  descuentoTotal: 120,
  envio: 35,
  total: 345
}

// Historial de ventas inicializado en vacío (se llena conforme se registran ventas reales)
export const HISTORIAL_VENTAS_MOCK = reactive([])

export async function sincronizarVentasDesdeDB() {
  try {
    const res = await fetch('http://localhost:3000/api/ventas')
    if (res.ok) {
      const lista = await res.json()
      if (Array.isArray(lista)) {
        HISTORIAL_VENTAS_MOCK.splice(0, HISTORIAL_VENTAS_MOCK.length, ...lista)
      }
    }
  } catch {
    // Mantiene estado en memoria si el backend no está activo
  }
}

sincronizarVentasDesdeDB()

export async function getHistorialVentas() {
  await sincronizarVentasDesdeDB()
  return HISTORIAL_VENTAS_MOCK
}
