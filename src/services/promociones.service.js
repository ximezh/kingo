import { ref } from 'vue'

export const PROMOCIONES_MOCK = ref([
  {
    id: 1,
    nombre: '2x1 en Rollos',
    dia: 'Lunes y Martes',
    diasKeys: ['Lun', 'Mar'],
    descuento: '2x1 (se cobra el de mayor precio)',
    vigencia: 'Sin fecha final',
    activa: true,
    accionTexto: 'Editar',
    accionRuta: '/admin/promociones/editar'
  },
  {
    id: 2,
    nombre: 'Combos con descuento',
    dia: 'Jueves',
    diasKeys: ['Jue'],
    descuento: '10% en paquetes',
    vigencia: 'Sin fecha final',
    activa: true,
    accionTexto: 'Editar',
    accionRuta: '/admin/promociones/editar'
  },
  {
    id: 3,
    nombre: 'Especial de fin de semana',
    dia: 'Sáb y dom',
    diasKeys: ['Sab', 'Dom'],
    descuento: 'Precio especial en combos',
    vigencia: 'Hasta 30 nov',
    activa: true,
    accionTexto: 'Editar',
    accionRuta: '/admin/promociones/editar'
  },
  {
    id: 4,
    nombre: 'Paga 4, lleva 5',
    dia: 'Todos los días',
    diasKeys: ['Lun', 'Mar', 'Jue', 'Vie', 'Sab', 'Dom'],
    descuento: 'Regla del Paquete Sushi',
    vigencia: 'Sin fecha final',
    activa: true,
    accionTexto: 'Ver',
    accionRuta: '/admin/paquetes'
  },
  {
    id: 5,
    nombre: 'Postre gratis',
    dia: 'Viernes',
    diasKeys: ['Vie'],
    descuento: 'Postre en compras desde $400',
    vigencia: 'Terminó 31 ago',
    activa: false,
    accionTexto: 'Editar',
    accionRuta: '/admin/promociones/editar'
  }
]).value

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

/**
 * Devuelve true únicamente si hoy es un día válido para la promoción 2x1 (por defecto Lunes y Martes).
 * Si es viernes, jueves, sábado, domingo o miércoles, devuelve false y no se muestra en ventas.
 */
export function esPromo2x1ValidaHoy() {
  const promo2x1 = PROMOCIONES_MOCK.find((p) => p.id === 1)
  if (promo2x1 && !promo2x1.activa) return false

  const diaActualNum = new Date().getDay() // 1 = Lunes, 2 = Martes
  const diaKeyActual = MAPA_GETDAY_A_KEY[diaActualNum]
  const diasValidos = promo2x1?.diasKeys || ['Lun', 'Mar']

  return diasValidos.includes(diaKeyActual)
}

export async function getPromociones() {
  return PROMOCIONES_MOCK
}
