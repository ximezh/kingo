import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const TMP_FILE = path.join(os.tmpdir(), 'kingo_cloud_sync_v1.json')

function rangoEstadoPedido(estado) {
  const e = String(estado || '').trim().toLowerCase()
  if (e === 'entregado' || e === 'no entregado' || e === 'completada') return 3
  if (e === 'por entregar' || e === 'en ruta') return 2
  if (e === 'por asignar' || e === 'pendiente') return 1
  return 0
}

function leerEstadoInicial() {
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
    // ignore read errors
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

function guardarEstadoPersistente(state) {
  globalThis.__KINGO_CLOUD_STATE__ = state
  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(state), 'utf8')
  } catch {
    // ignore write errors
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
    const rPrev = rangoEstadoPedido(prev.estado)
    const rNew = rangoEstadoPedido(item.estado)
    const tsPrev = Number(prev._updatedAt) || 0
    const tsNew = Number(item._updatedAt) || 0
    if (rNew > rPrev || (rNew === rPrev && tsNew >= tsPrev)) {
      mapaRep.set(item.folio, { ...prev, ...item, _updatedAt: Math.max(tsPrev, tsNew, Date.now()) })
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
    const rPrev = rangoEstadoPedido(prev.estado)
    const rNew = rangoEstadoPedido(v.estado)
    const tsPrev = Number(prev._updatedAt) || 0
    const tsNew = Number(v._updatedAt) || 0
    if (rNew > rPrev || (rNew === rPrev && tsNew >= tsPrev)) {
      mapaVentas.set(v.folio, { ...prev, ...v, _updatedAt: Math.max(tsPrev, tsNew, Date.now()) })
    }
  }

  // Asegurar que si un pedido ya está en pedidosRepartidor, la venta refleje ese mismo avance
  for (const ped of pedidosRepartidor) {
    const v = mapaVentas.get(ped.folio)
    if (v && rangoEstadoPedido(ped.estado) > rangoEstadoPedido(v.estado)) {
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

  const estadoActual = leerEstadoInicial()

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
    guardarEstadoPersistente(nuevoEstado)
    return res.status(200).json({ ok: true, state: nuevoEstado })
  }

  return res.status(200).json({ ok: true, state: estadoActual })
}
