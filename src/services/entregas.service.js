import { ref, reactive } from 'vue'
import { HISTORIAL_VENTAS_MOCK } from '@/services/ventas.service'

const STORAGE_POR_ASIGNAR_KEY = 'kingo_pedidos_por_asignar_v2'
const STORAGE_REPARTIDOR_KEY = 'kingo_pedidos_repartidor_v2'

function normalizarPedidosRepartidor(lista) {
  if (!Array.isArray(lista)) return []
  return lista.map((p) => {
    const venta = HISTORIAL_VENTAS_MOCK.find((v) => v.folio === p.folio)
    // Si la venta en el historial ya está Completada, Entregado, No entregado o es semilla histórica, no debe seguir "Por entregar"
    if (
      p.estado === 'Por entregar' &&
      (!venta ||
        venta.esSemillaHistorica ||
        ['Completada', 'Entregado', 'No entregado'].includes(venta.estado))
    ) {
      return {
        ...p,
        estado: venta?.estado === 'No entregado' ? 'No entregado' : 'Entregado'
      }
    }
    return p
  })
}

function cargarPorAsignar() {
  try {
    const saved = localStorage.getItem(STORAGE_POR_ASIGNAR_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    // ignore
  }
  return []
}

function cargarRepartidorPedidos() {
  try {
    const saved = localStorage.getItem(STORAGE_REPARTIDOR_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) return normalizarPedidosRepartidor(parsed)
    }
  } catch {
    // ignore
  }
  return []
}

export const PEDIDOS_POR_ASIGNAR_MOCK = reactive(cargarPorAsignar())
export const pedidosRepartidorState = ref(cargarRepartidorPedidos())

export function depurarEstadoEntregas() {
  pedidosRepartidorState.value = normalizarPedidosRepartidor(pedidosRepartidorState.value)
  guardarEntregasStorage()
}

export function guardarEntregasStorage() {
  try {
    localStorage.setItem(STORAGE_POR_ASIGNAR_KEY, JSON.stringify(PEDIDOS_POR_ASIGNAR_MOCK))
    localStorage.setItem(STORAGE_REPARTIDOR_KEY, JSON.stringify(pedidosRepartidorState.value))
  } catch {
    // ignore
  }
}

export const REPARTIDORES_MOCK = [
  {
    iniciales: 'RP',
    nombre: 'Carlos R.',
    subtitulo: 'Sin pedidos en ruta',
    estado: 'Disponible',
    tagVariant: 'ok'
  }
]

export async function sincronizarEntregasDesdeDB() {
  try {
    const res = await fetch('http://localhost:3000/api/entregas/pedidos')
    if (res.ok) {
      const lista = await res.json()
      if (Array.isArray(lista) && lista.length > 0) {
        const porAsignar = lista
          .filter((p) => p.estado === 'Por asignar')
          .map((p) => ({
            folio: p.folio,
            cliente: p.cliente,
            telefono: p.telefono,
            direccion: p.direccion,
            total: p.total,
            telefonoDireccion: `${p.telefono} · ${p.direccion}`,
            referencia: p.referencia,
            metodoPago: p.metodoPago,
            lineas: p.lineas,
            envio: p.envio
          }))
        PEDIDOS_POR_ASIGNAR_MOCK.splice(0, PEDIDOS_POR_ASIGNAR_MOCK.length, ...porAsignar)
        pedidosRepartidorState.value = normalizarPedidosRepartidor(
          lista.filter((p) => p.estado !== 'Por asignar')
        )
        guardarEntregasStorage()
      }
    }
  } catch {
    // Mantiene estado local si el backend no está activo
  }
}

sincronizarEntregasDesdeDB()

export async function getPedidosPorAsignar() {
  await sincronizarEntregasDesdeDB()
  return PEDIDOS_POR_ASIGNAR_MOCK
}

export async function getRepartidores() {
  return REPARTIDORES_MOCK
}

export async function getPedidosDomicilio() {
  await sincronizarEntregasDesdeDB()
  return pedidosRepartidorState.value
}
