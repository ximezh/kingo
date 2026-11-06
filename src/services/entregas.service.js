import { ref, reactive } from 'vue'

// Inicializado vacío: se agregan pedidos conforme se registran ventas a domicilio
export const PEDIDOS_POR_ASIGNAR_MOCK = reactive([])

export const REPARTIDORES_MOCK = [
  {
    iniciales: 'RP',
    nombre: 'Carlos R.',
    subtitulo: 'Sin pedidos en ruta',
    estado: 'Disponible',
    tagVariant: 'ok'
  }
]

export const pedidosRepartidorState = ref([])

export async function sincronizarEntregasDesdeDB() {
  try {
    const res = await fetch('http://localhost:3000/api/entregas/pedidos')
    if (res.ok) {
      const lista = await res.json()
      if (Array.isArray(lista)) {
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
        pedidosRepartidorState.value = lista.filter((p) => p.estado !== 'Por asignar')
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
