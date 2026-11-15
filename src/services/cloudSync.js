import {
  HISTORIAL_VENTAS_MOCK,
  normalizarVentaFecha
} from '@/services/ventas.service'
import {
  PEDIDOS_POR_ASIGNAR_MOCK,
  pedidosRepartidorState
} from '@/services/entregas.service'
import { empleadosState } from '@/services/empleados.service'

const STORAGE_VENTAS_KEY = 'kingo_ventas_v2'
const STORAGE_POR_ASIGNAR_KEY = 'kingo_pedidos_por_asignar_v2'
const STORAGE_REPARTIDOR_KEY = 'kingo_pedidos_repartidor_v2'
const STORAGE_EMPLEADOS_KEY = 'kingo_empleados_v2_tres'

let syncEnCurso = false
let intervaloId = null

function rangoEstado(estado) {
  const e = String(estado || '').trim().toLowerCase()
  if (e === 'entregado' || e === 'no entregado' || e === 'completada') return 3
  if (e === 'por entregar' || e === 'en ruta') return 2
  if (e === 'por asignar' || e === 'pendiente') return 1
  return 0
}

function guardarLocalSilencioso() {
  try {
    localStorage.setItem(STORAGE_VENTAS_KEY, JSON.stringify(HISTORIAL_VENTAS_MOCK))
    localStorage.setItem(STORAGE_POR_ASIGNAR_KEY, JSON.stringify(PEDIDOS_POR_ASIGNAR_MOCK))
    localStorage.setItem(STORAGE_REPARTIDOR_KEY, JSON.stringify(pedidosRepartidorState.value))
    localStorage.setItem(STORAGE_EMPLEADOS_KEY, JSON.stringify(empleadosState.value))
  } catch {
    // ignore storage errors
  }
}

function aplicarEstadoRemoto(remoto) {
  if (!remoto || typeof remoto !== 'object') return

  // 1. Fusionar pedidosRepartidor
  if (Array.isArray(remoto.pedidosRepartidor)) {
    const mapaRep = new Map()
    for (const p of [...pedidosRepartidorState.value, ...remoto.pedidosRepartidor]) {
      if (!p || !p.folio) continue
      const prev = mapaRep.get(p.folio)
      if (!prev) {
        mapaRep.set(p.folio, { ...p })
        continue
      }
      const rPrev = rangoEstado(prev.estado)
      const rNew = rangoEstado(p.estado)
      const tsPrev = Number(prev._updatedAt) || 0
      const tsNew = Number(p._updatedAt) || 0
      if (rNew > rPrev || (rNew === rPrev && tsNew >= tsPrev)) {
        mapaRep.set(p.folio, { ...prev, ...p })
      }
    }
    pedidosRepartidorState.value = [...mapaRep.values()]
  }

  // 2. Fusionar ventas (HISTORIAL_VENTAS_MOCK)
  if (Array.isArray(remoto.ventas) && remoto.ventas.length > 0) {
    const mapaVentas = new Map()
    for (const v of [...HISTORIAL_VENTAS_MOCK, ...remoto.ventas]) {
      if (!v || !v.folio) continue
      const prev = mapaVentas.get(v.folio)
      if (!prev) {
        mapaVentas.set(v.folio, normalizarVentaFecha(v))
        continue
      }
      const rPrev = rangoEstado(prev.estado)
      const rNew = rangoEstado(v.estado)
      const tsPrev = Number(prev._updatedAt) || 0
      const tsNew = Number(v._updatedAt) || 0
      if (rNew > rPrev || (rNew === rPrev && tsNew >= tsPrev)) {
        mapaVentas.set(v.folio, normalizarVentaFecha({ ...prev, ...v }))
      }
    }

    // Sincronizar estado de ventas con pedidosRepartidor
    for (const ped of pedidosRepartidorState.value) {
      const v = mapaVentas.get(ped.folio)
      if (v && rangoEstado(ped.estado) > rangoEstado(v.estado)) {
        v.estado = ped.estado
        v.estadoVariant = ped.estado === 'Entregado' ? 'ok' : ped.estado === 'No entregado' ? 'off' : ''
        if (ped.repartidor) v.repartidorAsignado = ped.repartidor
      }
    }

    const fusionVentas = [...mapaVentas.values()].sort((a, b) => {
      const numA = Number(String(a.folio || '').replace(/\D/g, '')) || 0
      const numB = Number(String(b.folio || '').replace(/\D/g, '')) || 0
      return numB - numA
    })
    HISTORIAL_VENTAS_MOCK.splice(0, HISTORIAL_VENTAS_MOCK.length, ...fusionVentas)
  }

  // 3. Fusionar pedidosPorAsignar (quitando los que ya están en ruta o entregados)
  const foliosAsignados = new Set(pedidosRepartidorState.value.map((p) => p.folio))
  for (const v of HISTORIAL_VENTAS_MOCK) {
    if (rangoEstado(v.estado) >= 2) {
      foliosAsignados.add(v.folio)
    }
  }

  const mapaPorAsignar = new Map()
  const listaCombinadaAsignar = [
    ...PEDIDOS_POR_ASIGNAR_MOCK,
    ...(Array.isArray(remoto.pedidosPorAsignar) ? remoto.pedidosPorAsignar : [])
  ]
  for (const p of listaCombinadaAsignar) {
    if (!p || !p.folio || foliosAsignados.has(p.folio)) continue
    mapaPorAsignar.set(p.folio, { ...(mapaPorAsignar.get(p.folio) || {}), ...p })
  }
  PEDIDOS_POR_ASIGNAR_MOCK.splice(0, PEDIDOS_POR_ASIGNAR_MOCK.length, ...mapaPorAsignar.values())

  // 4. Fusionar empleados y recalcular disponibilidad de repartidores
  if (Array.isArray(remoto.empleados) && remoto.empleados.length > 0) {
    const mapaEmp = new Map()
    for (const e of [...empleadosState.value, ...remoto.empleados]) {
      if (!e || !e.usuario) continue
      const key = String(e.usuario).toLowerCase()
      const prev = mapaEmp.get(key)
      const tsPrev = Number(prev?._updatedAt) || 0
      const tsNew = Number(e._updatedAt) || 0
      if (!prev || tsNew >= tsPrev) {
        mapaEmp.set(key, { ...(prev || {}), ...e })
      }
    }
    empleadosState.value = [...mapaEmp.values()]
  }

  // Actualizar estadoRuta de repartidores según pedidosRepartidor activos
  empleadosState.value = empleadosState.value.map((e) => {
    if (e.rol === 'repartidor') {
      const enRuta = pedidosRepartidorState.value.filter(
        (p) =>
          p.estado === 'Por entregar' &&
          (!p.repartidor || p.repartidor.toLowerCase() === String(e.nombre || '').toLowerCase())
      )
      return {
        ...e,
        pedidosEnRuta: enRuta.length,
        estadoRuta: enRuta.length > 0 ? 'En ruta' : 'Disponible'
      }
    }
    return e
  })

  guardarLocalSilencioso()
}

/**
 * Envía y recibe el estado compartido desde `/api/sync` (funciona en Vercel y en local)
 * para mantener sincronizados en tiempo real la laptop (Cajero/Admin) y el celular (Repartidor).
 */
export async function sincronizarConNube(pushLocal = true) {
  if (syncEnCurso) return
  syncEnCurso = true
  try {
    const payload = {
      ventas: HISTORIAL_VENTAS_MOCK.filter((v) => !v.esSemillaHistorica),
      pedidosPorAsignar: [...PEDIDOS_POR_ASIGNAR_MOCK],
      pedidosRepartidor: [...pedidosRepartidorState.value],
      empleados: [...empleadosState.value]
    }

    const tieneDatosLocales =
      payload.ventas.length > 0 ||
      payload.pedidosPorAsignar.length > 0 ||
      payload.pedidosRepartidor.length > 0

    const res = await fetch('/api/sync', {
      method: pushLocal && tieneDatosLocales ? 'POST' : 'GET',
      headers: pushLocal && tieneDatosLocales ? { 'Content-Type': 'application/json' } : undefined,
      body: pushLocal && tieneDatosLocales ? JSON.stringify(payload) : undefined,
      cache: 'no-store'
    })

    if (res.ok) {
      const data = await res.json()
      if (data?.state) {
        aplicarEstadoRemoto(data.state)
      }
    }
  } catch {
    // Silencioso si no hay red momentáneamente
  } finally {
    syncEnCurso = false
  }
}

export function iniciarSincronizacionTiempoReal() {
  if (typeof window === 'undefined') return
  sincronizarConNube(true)

  if (!intervaloId) {
    intervaloId = window.setInterval(() => {
      sincronizarConNube(true)
    }, 2500)

    window.addEventListener('focus', () => sincronizarConNube(true))
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        sincronizarConNube(true)
      }
    })
  }
}
