import { ref } from 'vue'

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
        empleadosState.value = lista
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

export function agregarEmpleado(datos) {
  const rolLabels = {
    admin: 'Administrador',
    cajero: 'Cajero',
    repartidor: 'Repartidor'
  }
  const nuevo = {
    id: Date.now(),
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
    fechaAlta: '25 oct 2026'
  }
  empleadosState.value.unshift(nuevo)
  guardarEmpleadosStorage()
  return nuevo
}

export function actualizarEmpleado(id, datos) {
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
  return empleadosState.value[idx]
}

export function toggleEstadoEmpleado(id) {
  const emp = empleadosState.value.find((e) => e.id === id)
  if (!emp) return
  emp.activo = !emp.activo
  guardarEmpleadosStorage()
}
