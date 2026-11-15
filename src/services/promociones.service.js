import { reactive } from 'vue'
import { ROLLOS_PROMO_MOCK } from '@/services/catalogo.service'

const STORAGE_PROMOCIONES_KEY = 'kingo_promociones_v4'

export function obtenerNombresTodosLosRollos() {
  return ROLLOS_PROMO_MOCK.map((r) => r.nombre)
}

const PROMOCIONES_BASE = [
  {
    id: 1,
    nombre: '2x1 en Rollos',
    dia: 'Lunes y Martes',
    diasKeys: ['Lun', 'Mar'],
    productosIncluidos: obtenerNombresTodosLosRollos(),
    aplicaTodosLosRollos: true,
    tipoDescuento: '2x1',
    descuento: '2x1 en todos los rollos (se cobra el de mayor precio)',
    vigencia: 'Sin fecha final',
    inicio: '01/10/2026',
    fin: '',
    activa: true,
    accionTexto: 'Editar',
    accionRuta: '/admin/promociones/editar?id=1'
  },
  {
    id: 2,
    nombre: 'Combos con descuento',
    dia: 'Jueves',
    diasKeys: ['Jue'],
    productosIncluidos: ['Paquete A', 'Paquete B', 'Paquete 1', 'Paquete 2'],
    tipoDescuento: 'Porcentaje',
    descuento: '10% en paquetes',
    vigencia: 'Sin fecha final',
    inicio: '01/10/2026',
    fin: '',
    activa: true,
    accionTexto: 'Editar',
    accionRuta: '/admin/promociones/editar?id=2'
  },
  {
    id: 3,
    nombre: 'Especial de fin de semana',
    dia: 'Sáb y dom',
    diasKeys: ['Sab', 'Dom'],
    productosIncluidos: ['Paquete 2', 'Paquete Sushi'],
    tipoDescuento: 'Precio fijo',
    descuento: 'Precio especial en combos',
    vigencia: 'Hasta 30 nov',
    inicio: '01/10/2026',
    fin: '30/11/2026',
    activa: true,
    accionTexto: 'Editar',
    accionRuta: '/admin/promociones/editar?id=3'
  },
  {
    id: 4,
    nombre: 'Paga 4, lleva 5',
    dia: 'Todos los días',
    diasKeys: ['Lun', 'Mar', 'Jue', 'Vie', 'Sab', 'Dom'],
    productosIncluidos: ['Paquete Sushi'],
    tipoDescuento: 'Precio fijo',
    descuento: 'Regla del Paquete Sushi',
    vigencia: 'Sin fecha final',
    inicio: '01/10/2026',
    fin: '',
    activa: true,
    accionTexto: 'Ver',
    accionRuta: '/admin/paquetes'
  },
  {
    id: 5,
    nombre: 'Postre gratis',
    dia: 'Viernes',
    diasKeys: ['Vie'],
    productosIncluidos: ['Helado de vainilla', 'Tempura Helado', 'Banana Ice'],
    tipoDescuento: 'Precio fijo',
    descuento: 'Postre en compras desde $400',
    vigencia: 'Sin fecha final',
    inicio: '01/10/2026',
    fin: '',
    activa: true,
    accionTexto: 'Editar',
    accionRuta: '/admin/promociones/editar?id=5'
  }
]

function cargarPromocionesIniciales() {
  try {
    const saved = localStorage.getItem(STORAGE_PROMOCIONES_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p) => {
          if (p.id === 1 && (!Array.isArray(p.productosIncluidos) || p.productosIncluidos.length <= 3)) {
            return {
              ...p,
              aplicaTodosLosRollos: true,
              productosIncluidos: obtenerNombresTodosLosRollos()
            }
          }
          return p
        })
      }
    }
  } catch {
    // ignore
  }
  return PROMOCIONES_BASE.map((p) => ({
    ...p,
    diasKeys: [...(p.diasKeys || [])],
    productosIncluidos: [...(p.productosIncluidos || [])]
  }))
}

export const PROMOCIONES_MOCK = reactive(cargarPromocionesIniciales())

export function guardarPromocionesStorage() {
  try {
    localStorage.setItem(STORAGE_PROMOCIONES_KEY, JSON.stringify(PROMOCIONES_MOCK))
  } catch {
    // ignore
  }
}

export const DIAS_SEMANA_PROMO = [
  { key: 'Lun', label: 'Lun', cerrado: false },
  { key: 'Mar', label: 'Mar', cerrado: false },
  { key: 'Mie', label: 'Mié · cerrado', cerrado: true },
  { key: 'Jue', label: 'Jue', cerrado: false },
  { key: 'Vie', label: 'Vie', cerrado: false },
  { key: 'Sab', label: 'Sáb', cerrado: false },
  { key: 'Dom', label: 'Dom', cerrado: false }
]

const MAPA_GETDAY_A_KEY = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']

export function esPromo2x1ValidaHoy() {
  const promo2x1 = PROMOCIONES_MOCK.find((p) => p.id === 1)
  if (promo2x1 && !promo2x1.activa) return false

  const diaActualNum = new Date().getDay()
  const diaKeyActual = MAPA_GETDAY_A_KEY[diaActualNum]
  const diasValidos = promo2x1?.diasKeys || ['Lun', 'Mar']

  return diasValidos.includes(diaKeyActual)
}

export async function getPromociones() {
  return PROMOCIONES_MOCK
}
