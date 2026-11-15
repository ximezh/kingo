import { ref } from 'vue'
import { formatearFechaCortaEs, obtenerFechaISOLocal } from '@/services/ventas.service'

const STORAGE_EMPLEADOS_KEY = 'kingo_empleados_v2_tres'

const EMPLEADOS_INICIALES = [
  {
    id: 1,
    nombre: 'Laura Gómez',
    usuario: 'admin',
    password: '123',
    rol: 'admin',
    rolLabel: 'Administrador',
    iniciales: 'AD',
    telefono: '2291104500',
    turno: 'Completo (13:00 - 21:00)',
    activo: true,
    fechaAlta: '10 ene 2026'
  },
  {
    id: 2,
    nombre: 'Sofía Ramírez',
    usuario: 'cajero',
    password: '123',
    rol: 'cajero',
    rolLabel: 'Cajero',
    iniciales: 'CJ',
    telefono: '2292458810',
    turno: 'Completo (13:00 - 21:00)',
    activo: true,
    fechaAlta: '15 feb 2026'
  },
  {
    id: 3,
    nombre: 'Carlos R.',
    usuario: 'repartidor',
    password: '123',
    rol: 'repartidor',
    rolLabel: 'Repartidor',
    iniciales: 'RP',
    telefono: '2294012233',
    turno: 'Completo (13:00 - 21:00)',
    activo: true,
    estadoRuta: 'Disponible',
    pedidosEnRuta: 0,
    fechaAlta: '20 ene 2026'
  }
]

function cargarEmpleados() {
  try {
    const guardado = localStorage.getItem(STORAGE_EMPLEADOS_KEY)
    if (guardado) {
      const parsed = JSON.parse(guardado)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // ignore storage errors
  }
  return EMPLEADOS_INICIALES.map((e) => ({ ...e }))
}

export const empleadosState = ref(cargarEmpleados())

export async function sincronizarEmpleadosDesdeDB() {
  try {
    const res = await fetch('http://localhost:3000/api/empleados')
    if (res.ok) {
      const lista = await res.json()
      if (Array.isArray(lista) && lista.length > 0) {
        // Conservar contraseñas locales y estadoRuta si ya estaban en memoria
        const mapaPrevio = new Map(empleadosState.value.map((e) => [e.usuario.toLowerCase(), e]))
        empleadosState.value = lista.map((dbEmp) => {
          const prev = mapaPrevio.get(String(dbEmp.usuario || '').toLowerCase())
          return {
            ...dbEmp,
            password: prev?.password || '123',
            estadoRuta: prev?.estadoRuta || dbEmp.estadoRuta || 'Disponible',
            pedidosEnRuta: prev?.pedidosEnRuta ?? dbEmp.pedidosEnRuta ?? 0
          }
        })
        guardarEmpleadosStorage()
      }
    }
  } catch {
    // Usa copia local si el backend no está activo
  }
}

sincronizarEmpleadosDesdeDB()

export function guardarEmpleadosStorage() {
  try {
    localStorage.setItem(STORAGE_EMPLEADOS_KEY, JSON.stringify(empleadosState.value))
  } catch {
    // ignore storage errors
  }
}

export function obtenerIniciales(nombre) {
  const partes = String(nombre || '').trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return 'KG'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[1][0]).toUpperCase()
}

export function validarFormularioEmpleado(datos, editandoId = null) {
  const errores = {}
  const nombre = String(datos.nombre || '').trim()
  const usuario = String(datos.usuario || '').trim()
  const password = String(datos.password || '').trim()
  const digitosTel = String(datos.telefono || '').replace(/\D/g, '')
  const rol = datos.rol

  if (!nombre || nombre.length < 3) {
    errores.nombre = 'El nombre completo debe tener al menos 3 letras.'
  } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ.\s]+$/.test(nombre)) {
    errores.nombre = 'El nombre solo debe contener letras y espacios.'
  }

  if (!usuario || usuario.length < 3) {
    errores.usuario = 'El usuario debe tener al menos 3 caracteres.'
  } else if (!/^[a-zA-Z0-9._-]+$/.test(usuario)) {
    errores.usuario = 'Sin espacios; usa solo letras, números, punto o guion.'
  } else {
    const dupUsr = empleadosState.value.find(
      (e) => e.id !== editandoId && e.usuario.trim().toLowerCase() === usuario.toLowerCase()
    )
    if (dupUsr) {
      errores.usuario = `El usuario "${usuario}" ya está asignado a ${dupUsr.nombre}.`
    }
  }

  if (!password || password.length < 3) {
    errores.password = 'La contraseña debe tener al menos 3 caracteres.'
  }

  if (digitosTel.length !== 10) {
    errores.telefono = 'Ingresa exactamente los 10 dígitos del número celular.'
  } else {
    const dupTel = empleadosState.value.find(
      (e) => e.id !== editandoId && String(e.telefono || '').replace(/\D/g, '') === digitosTel
    )
    if (dupTel) {
      errores.telefono = `Este teléfono ya está registrado con ${dupTel.nombre}.`
    }
  }

  if (!['admin', 'cajero', 'repartidor'].includes(rol)) {
    errores.rol = 'Selecciona un rol válido.'
  }

  const listaMensajes = Object.values(errores)
  return {
    valido: listaMensajes.length === 0,
    errores,
    mensajePrincipal: listaMensajes[0] || ''
  }
}

export async function agregarEmpleado(datos) {
  const rolLabels = {
    admin: 'Administrador',
    cajero: 'Cajero',
    repartidor: 'Repartidor'
  }
  const fechaHoy = formatearFechaCortaEs(obtenerFechaISOLocal(new Date()), true)
  const tempId = Date.now()
  const nuevo = {
    id: tempId,
    nombre: datos.nombre.trim(),
    usuario: datos.usuario.trim(),
    password: datos.password || '123',
    rol: datos.rol,
    rolLabel: rolLabels[datos.rol] || 'Cajero',
    iniciales: obtenerIniciales(datos.nombre),
    telefono: datos.telefono.trim(),
    turno: datos.turno || 'Completo (13:00 - 21:00)',
    activo: datos.activo !== false,
    estadoRuta: 'Disponible',
    pedidosEnRuta: 0,
    fechaAlta: fechaHoy
  }
  empleadosState.value.unshift(nuevo)
  guardarEmpleadosStorage()

  try {
    const res = await fetch('http://localhost:3000/api/empleados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: nuevo.nombre,
        usuario: nuevo.usuario,
        password: nuevo.password,
        rol: nuevo.rol,
        telefono: nuevo.telefono,
        activo: nuevo.activo
      })
    })
    if (res.ok) {
      const creadoDB = await res.json()
      const idx = empleadosState.value.findIndex((e) => e.id === tempId)
      if (idx !== -1 && creadoDB?.id) {
        empleadosState.value[idx].id = creadoDB.id
        guardarEmpleadosStorage()
      }
    }
  } catch {
    // Mantiene persistencia en localStorage si el backend no está encendido
  }

  return nuevo
}

export async function actualizarEmpleado(id, datos) {
  const idx = empleadosState.value.findIndex((e) => e.id === id)
  if (idx === -1) return null
  const rolLabels = {
    admin: 'Administrador',
    cajero: 'Cajero',
    repartidor: 'Repartidor'
  }
  empleadosState.value[idx] = {
    ...empleadosState.value[idx],
    nombre: datos.nombre.trim(),
    usuario: datos.usuario.trim(),
    password: datos.password || empleadosState.value[idx].password,
    rol: datos.rol,
    rolLabel: rolLabels[datos.rol] || 'Cajero',
    iniciales: obtenerIniciales(datos.nombre),
    telefono: datos.telefono.trim(),
    turno: datos.turno || empleadosState.value[idx].turno,
    activo: Boolean(datos.activo)
  }
  guardarEmpleadosStorage()

  try {
    await fetch(`http://localhost:3000/api/empleados/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: empleadosState.value[idx].nombre,
        usuario: empleadosState.value[idx].usuario,
        password: empleadosState.value[idx].password,
        rol: empleadosState.value[idx].rol,
        telefono: empleadosState.value[idx].telefono,
        activo: empleadosState.value[idx].activo
      })
    })
  } catch {
    // Fallback local
  }

  return empleadosState.value[idx]
}

export async function toggleEstadoEmpleado(id) {
  const emp = empleadosState.value.find((e) => e.id === id)
  if (!emp) return
  emp.activo = !emp.activo
  guardarEmpleadosStorage()

  try {
    await fetch(`http://localhost:3000/api/empleados/${id}/toggle`, {
      method: 'PATCH'
    })
  } catch {
    // Fallback local
  }
}

export function actualizarEstadoRutaRepartidor(identificador, enRuta = true) {
  const q = String(identificador || '').trim().toLowerCase()
  const rep = empleadosState.value.find(
    (e) =>
      e.rol === 'repartidor' &&
      (String(e.id) === q ||
        e.nombre.toLowerCase() === q ||
        e.usuario.toLowerCase() === q)
  ) || empleadosState.value.find((e) => e.rol === 'repartidor' && e.activo)

  if (!rep) return
  if (enRuta) {
    rep.estadoRuta = 'En ruta'
    rep.pedidosEnRuta = Math.max(1, (rep.pedidosEnRuta || 0) + 1)
  } else {
    rep.pedidosEnRuta = Math.max(0, (rep.pedidosEnRuta || 1) - 1)
    rep.estadoRuta = rep.pedidosEnRuta > 0 ? 'En ruta' : 'Disponible'
  }
  guardarEmpleadosStorage()
}
