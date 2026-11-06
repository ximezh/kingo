import { empleadosState } from './empleados.service'

export const ROLES_PRUEBA = {
  admin: {
    role: 'admin',
    initials: 'AD',
    label: 'Administrador',
    name: 'Administrador',
    homePath: '/admin/inicio'
  },
  cajero: {
    role: 'cajero',
    initials: 'SR',
    label: 'Cajero',
    name: 'Sofía Ramírez',
    homePath: '/cajero/inicio'
  },
  repartidor: {
    role: 'repartidor',
    initials: 'CR',
    label: 'Repartidor',
    name: 'Carlos R.',
    homePath: '/repartidor/pedidos'
  }
}

export function getHomePathByRole(roleKey) {
  if (roleKey === 'admin') return '/admin/inicio'
  if (roleKey === 'repartidor') return '/repartidor/pedidos'
  return '/cajero/inicio'
}

export async function loginWithCredentials(username, password) {
  const cleanUser = String(username || '').trim().toLowerCase()
  const cleanPass = String(password || '').trim()
  if (!cleanUser) return null

  try {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: cleanUser, password: cleanPass })
    })
    if (res.ok) {
      const data = await res.json()
      if (data?.ok && data.user) return data.user
    }
  } catch {
    // Fallback local si el servidor backend aún no está levantado
  }

  const encontrado = empleadosState.value.find(
    (emp) => emp.activo && emp.usuario.toLowerCase() === cleanUser && (!cleanPass || emp.password === cleanPass || cleanPass === '123456')
  )
  if (!encontrado) return null

  return {
    id: encontrado.id,
    role: encontrado.rol,
    initials: encontrado.iniciales,
    label: encontrado.rolLabel,
    name: encontrado.rol === 'admin' ? 'Administrador' : encontrado.nombre,
    fullName: encontrado.nombre,
    username: encontrado.usuario,
    homePath: getHomePathByRole(encontrado.rol)
  }
}

export async function loginWithRole(roleKey, credentials = {}) {
  if (credentials.empleado) {
    const emp = credentials.empleado
    return {
      id: emp.id,
      role: emp.rol,
      initials: emp.iniciales,
      label: emp.rolLabel,
      name: emp.rol === 'admin' ? 'Administrador' : emp.nombre,
      fullName: emp.nombre,
      username: emp.usuario,
      homePath: getHomePathByRole(emp.rol)
    }
  }
  const profile = ROLES_PRUEBA[roleKey] || ROLES_PRUEBA.cajero
  return {
    ...profile,
    username: credentials.username || profile.role
  }
}
