import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const CLOUD_SYNC_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a1e0f817ef33ff'
const TMP_FILE = path.join(os.tmpdir(), 'kingo_cloud_sync_v1.json')

function rangoEstadoPedido(estado) {
  const e = String(estado || '').trim().toLowerCase()
  if (e === 'entregado' || e === 'no entregado' || e === 'completada') return 3
  if (e === 'por entregar' || e === 'en ruta') return 2
  if (e === 'por asignar' || e === 'pendiente') return 1
  return 0
}

function leerEstadoLocal() {
  if (globalThis.__KINGO_CLOUD_STATE__) {
    return globalThis.__KINGO_CLOUD_STATE__
  }
  try {
    if (fs.existsSync(TMP_FILE)) {
      const raw = fs.readFileSync(TMP_FILE, 'utf8')
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        globalThis.__KINGO_CLOUD_STATE__ = parsed
        return parsed
      }
    }
  } catch {
    // ignore
  }
  globalThis.__KINGO_CLOUD_STATE__ = {
    ventas: [],
    pedidosPorAsignar: [],
    pedidosRepartidor: [],
    empleados: [],
    updatedAt: 0
  }
  return globalThis.__KINGO_CLOUD_STATE__
}

function guardarEstadoLocal(state) {
  globalThis.__KINGO_CLOUD_STATE__ = state
  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(state), 'utf8')
  } catch {
    // ignore
  }
}

async function leerEstadoPersistente() {
  try {
    const res = await fetch(CLOUD_SYNC_URL, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(3500)
    })
    if (res.ok) {
      const json = await res.json()
      if (json?.data && typeof json.data === 'object') {
        globalThis.__KINGO_CLOUD_STATE__ = json.data
        guardarEstadoLocal(json.data)
        return json.data
      }
    }
  } catch {
    // Si falla la red remota, recurrir a la caché local
  }
  return leerEstadoLocal()
}

async function guardarEstadoPersistente(state) {
  guardarEstadoLocal(state)
  try {
    await fetch(CLOUD_SYNC_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'kingo_sync', data: state }),
      signal: AbortSignal.timeout(4000)
    })
  } catch {
    // ignore network put errors
  }
}

export function fusionarEstadoKinGo(actual, entrante) {
  const base = actual || {
    ventas: [],
    pedidosPorAsignar: [],
    pedidosRepartidor: [],
    empleados: [],
    updatedAt: 0
  }

  // 1. Fusionar pedidosRepartidor por folio
  const mapaRep = new Map()
  for (const item of [...(base.pedidosRepartidor || []), ...(entrante?.pedidosRepartidor || [])]) {
    if (!item || !item.folio) continue
    const prev = mapaRep.get(item.folio)
    if (!prev) {
      mapaRep.set(item.folio, { ...item })
      continue
    }
    const tsPrev = Number(prev._updatedAt) || 0
    const tsNew = Number(item._updatedAt) || 0
    if (tsNew > tsPrev) {
      mapaRep.set(item.folio, { ...prev, ...item })
    } else if (tsNew === tsPrev) {
      const rPrev = rangoEstadoPedido(prev.estado)
      const rNew = rangoEstadoPedido(item.estado)
      if (rNew >= rPrev) {
        mapaRep.set(item.folio, { ...prev, ...item })
      }
    }
  }
  const pedidosRepartidor = [...mapaRep.values()]

  // 2. Fusionar ventas por folio y sincronizar con estado de repartidor
  const mapaVentas = new Map()
  for (const v of [...(base.ventas || []), ...(entrante?.ventas || [])]) {
    if (!v || !v.folio) continue
    const prev = mapaVentas.get(v.folio)
    if (!prev) {
      mapaVentas.set(v.folio, { ...v })
      continue
    }
    const tsPrev = Number(prev._updatedAt) || 0
    const tsNew = Number(v._updatedAt) || 0
    if (tsNew > tsPrev) {
      mapaVentas.set(v.folio, { ...prev, ...v })
    } else if (tsNew === tsPrev) {
      const rPrev = rangoEstadoPedido(prev.estado)
      const rNew = rangoEstadoPedido(v.estado)
      if (rNew >= rPrev) {
        mapaVentas.set(v.folio, { ...prev, ...v })
      }
    }
  }

  // Asegurar que si un pedido ya está en pedidosRepartidor, la venta refleje ese mismo avance
  for (const ped of pedidosRepartidor) {
    const v = mapaVentas.get(ped.folio)
    if (v && rangoEstadoPedido(ped.estado) >= rangoEstadoPedido(v.estado)) {
      v.estado = ped.estado
      v.estadoVariant = ped.estado === 'Entregado' ? 'ok' : ped.estado === 'No entregado' ? 'off' : ''
      if (ped.repartidor) v.repartidorAsignado = ped.repartidor
    }
  }

  const ventas = [...mapaVentas.values()].sort((a, b) => {
    const numA = Number(String(a.folio || '').replace(/\D/g, '')) || 0
    const numB = Number(String(b.folio || '').replace(/\D/g, '')) || 0
    return numB - numA
  })

  // 3. Fusionar pedidosPorAsignar (excluyendo los que ya fueron asignados o entregados)
  const foliosYaAsignados = new Set(pedidosRepartidor.map((p) => p.folio))
  for (const v of ventas) {
    if (rangoEstadoPedido(v.estado) >= 2) {
      foliosYaAsignados.add(v.folio)
    }
  }

  const mapaPorAsignar = new Map()
  for (const p of [...(base.pedidosPorAsignar || []), ...(entrante?.pedidosPorAsignar || [])]) {
    if (!p || !p.folio || foliosYaAsignados.has(p.folio)) continue
    mapaPorAsignar.set(p.folio, { ...(mapaPorAsignar.get(p.folio) || {}), ...p })
  }
  const pedidosPorAsignar = [...mapaPorAsignar.values()]

  // 4. Fusionar empleados por usuario y recalcular estadoRuta según pedidosRepartidor activos
  const mapaEmp = new Map()
  for (const emp of [...(base.empleados || []), ...(entrante?.empleados || [])]) {
    if (!emp || !emp.usuario) continue
    const key = String(emp.usuario).toLowerCase()
    const prev = mapaEmp.get(key)
    const tsPrev = Number(prev?._updatedAt) || 0
    const tsNew = Number(emp._updatedAt) || 0
    if (!prev || tsNew >= tsPrev) {
      mapaEmp.set(key, { ...(prev || {}), ...emp })
    }
  }

  const empleados = [...mapaEmp.values()].map((e) => {
    if (e.rol === 'repartidor') {
      const enRuta = pedidosRepartidor.filter(
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

  return {
    ventas,
    pedidosPorAsignar,
    pedidosRepartidor,
    empleados,
    updatedAt: Date.now()
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const estadoActual = await leerEstadoPersistente()

  if (req.method === 'POST') {
    let body = req.body
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch {
        body = {}
      }
    }
    const nuevoEstado = fusionarEstadoKinGo(estadoActual, body || {})
    await guardarEstadoPersistente(nuevoEstado)
    return res.status(200).json({ ok: true, state: nuevoEstado })
  }

  return res.status(200).json({ ok: true, state: estadoActual })
}
