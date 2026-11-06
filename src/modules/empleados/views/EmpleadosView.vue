<script setup>
import { ref, computed } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import StatusTag from '@/components/ui/StatusTag.vue'
import {
  empleadosState,
  agregarEmpleado,
  actualizarEmpleado,
  toggleEstadoEmpleado
} from '@/services/empleados.service'

const busqueda = ref('')
const filtroRol = ref('Todos')
const filtros = ['Todos', 'Cajeros', 'Repartidores', 'Administradores', 'Dados de baja']

const mostrarPasswords = ref({})
const showModal = ref(false)
const editandoId = ref(null)
const errorForm = ref('')

const form = ref({
  nombre: '',
  rol: 'cajero',
  usuario: '',
  password: '',
  telefono: '',
  turno: 'Completo (13:00 - 21:00)',
  activo: true
})

const totalActivos = computed(() => empleadosState.value.filter((e) => e.activo).length)
const totalCajeros = computed(() => empleadosState.value.filter((e) => e.activo && e.rol === 'cajero').length)
const totalRepartidores = computed(() => empleadosState.value.filter((e) => e.activo && e.rol === 'repartidor').length)

const empleadosFiltrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  return empleadosState.value.filter((e) => {
    if (filtroRol.value === 'Cajeros' && e.rol !== 'cajero') return false
    if (filtroRol.value === 'Repartidores' && e.rol !== 'repartidor') return false
    if (filtroRol.value === 'Administradores' && e.rol !== 'admin') return false
    if (filtroRol.value === 'Dados de baja' && e.activo) return false

    if (q) {
      const matchNombre = e.nombre.toLowerCase().includes(q)
      const matchUsuario = e.usuario.toLowerCase().includes(q)
      const matchTel = e.telefono.toLowerCase().includes(q)
      return matchNombre || matchUsuario || matchTel
    }
    return true
  })
})

function toggleVerPassword(id) {
  mostrarPasswords.value[id] = !mostrarPasswords.value[id]
}

function abrirModalNuevo() {
  editandoId.value = null
  errorForm.value = ''
  form.value = {
    nombre: '',
    rol: 'cajero',
    usuario: '',
    password: '',
    telefono: '',
    turno: 'Completo (13:00 - 21:00)',
    activo: true
  }
  showModal.value = true
}

function abrirModalEditar(emp) {
  editandoId.value = emp.id
  errorForm.value = ''
  form.value = {
    nombre: emp.nombre,
    rol: emp.rol,
    usuario: emp.usuario,
    password: emp.password,
    telefono: emp.telefono,
    turno: emp.turno,
    activo: emp.activo
  }
  showModal.value = true
}

function guardarEmpleado() {
  errorForm.value = ''
  if (!form.value.nombre.trim() || form.value.nombre.trim().length < 3) {
    errorForm.value = 'Ingresa el nombre completo del empleado (mínimo 3 letras).'
    return
  }
  if (!form.value.usuario.trim() || form.value.usuario.trim().length < 3) {
    errorForm.value = 'Ingresa un nombre de usuario válido (mínimo 3 caracteres).'
    return
  }
  const duplicado = empleadosState.value.find(
    (e) => e.id !== editandoId.value && e.usuario.toLowerCase() === form.value.usuario.trim().toLowerCase()
  )
  if (duplicado) {
    errorForm.value = 'Ese nombre de usuario ya está registrado por otro empleado.'
    return
  }
  if (!form.value.password.trim() || form.value.password.trim().length < 3) {
    errorForm.value = 'La contraseña debe tener al menos 3 caracteres.'
    return
  }
  const digitosTel = form.value.telefono.replace(/\D/g, '')
  if (digitosTel.length !== 10) {
    errorForm.value = 'El teléfono celular debe contener exactamente 10 dígitos.'
    return
  }

  const telFormateado = `${digitosTel.slice(0, 3)} ${digitosTel.slice(3, 6)} ${digitosTel.slice(6, 10)}`

  if (editandoId.value) {
    actualizarEmpleado(editandoId.value, {
      ...form.value,
      telefono: telFormateado
    })
  } else {
    agregarEmpleado({
      ...form.value,
      telefono: telFormateado
    })
  }
  showModal.value = false
}
</script>

<template>
  <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
    <div style="display:flex;flex-direction:column;gap:4px">
      <h1 style="font-size:22px;font-weight:600">Gestión de empleados</h1>
      <p class="sub">Da de alta, edita o da de baja a cajeros y repartidores con sus credenciales de acceso.</p>
    </div>
    <BaseButton variant="p" href="#" @click.prevent="abrirModalNuevo">
      + Dar de alta empleado
    </BaseButton>
  </div>

  <div class="emp-kpi-grid">
    <div class="emp-kpi">
      <span class="sub">Personal activo</span>
      <b>{{ totalActivos }}</b>
      <span class="sub" style="font-size:12px">De {{ empleadosState.length }} registrados</span>
    </div>
    <div class="emp-kpi">
      <span class="sub">Cajeros activos</span>
      <b>{{ totalCajeros }}</b>
      <span class="sub" style="font-size:12px">Atención en caja y mostrador</span>
    </div>
    <div class="emp-kpi">
      <span class="sub">Repartidores activos</span>
      <b>{{ totalRepartidores }}</b>
      <span class="sub" style="font-size:12px">Entregas a domicilio</span>
    </div>
  </div>

  <div style="display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap">
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <a
        v-for="f in filtros"
        :key="f"
        href="#"
        :class="['chip', { on: filtroRol === f }]"
        @click.prevent="filtroRol = f"
      >
        {{ f }}
      </a>
    </div>
    <input
      v-model="busqueda"
      class="inp"
      type="search"
      placeholder="Buscar por nombre, usuario o teléfono..."
      style="max-width:340px"
    >
  </div>

  <section v-if="empleadosFiltrados.length > 0" class="card" style="padding:0;gap:0;overflow-x:auto">
    <div class="emp-th">
      <span>Empleado</span>
      <span>Rol</span>
      <span>Usuario</span>
      <span>Contraseña</span>
      <span>Teléfono</span>
      <span>Estado</span>
      <span style="text-align:right">Acciones</span>
    </div>
    <div
      v-for="emp in empleadosFiltrados"
      :key="emp.id"
      :class="['emp-tr', { 'is-inactive': !emp.activo }]"
    >
      <div class="row" style="gap:10px;min-width:0">
        <span class="emp-av">{{ emp.iniciales }}</span>
        <div style="display:flex;flex-direction:column;min-width:0">
          <span style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ emp.nombre }}</span>
          <span class="sub" style="font-size:12px">{{ emp.turno }}</span>
        </div>
      </div>

      <span>
        <StatusTag :variant="emp.rol === 'admin' ? '' : emp.rol === 'cajero' ? 'ok' : 'off'">
          {{ emp.rolLabel }}
        </StatusTag>
      </span>

      <span style="font-family:monospace;font-size:13px;font-weight:600">{{ emp.usuario }}</span>

      <div class="row" style="gap:6px">
        <span style="font-family:monospace;font-size:13px">
          {{ mostrarPasswords[emp.id] ? emp.password : '••••••' }}
        </span>
        <a
          href="#"
          class="edit"
          style="font-size:11px"
          @click.prevent="toggleVerPassword(emp.id)"
        >
          {{ mostrarPasswords[emp.id] ? 'Ocultar' : 'Ver' }}
        </a>
      </div>

      <span class="sub">{{ emp.telefono }}</span>

      <span>
        <StatusTag :variant="emp.activo ? 'ok' : 'off'">
          {{ emp.activo ? 'Activo' : 'Dado de baja' }}
        </StatusTag>
      </span>

      <div class="row" style="justify-content:flex-end;gap:12px">
        <a href="#" class="edit" @click.prevent="abrirModalEditar(emp)">Editar</a>
        <a
          v-if="emp.rol !== 'admin' || empleadosState.filter((a) => a.rol === 'admin' && a.activo).length > 1"
          href="#"
          class="edit"
          :style="emp.activo ? 'color:#B91C1C' : 'color:var(--ok)'"
          @click.prevent="toggleEstadoEmpleado(emp.id)"
        >
          {{ emp.activo ? 'Dar de baja' : 'Reactivar' }}
        </a>
      </div>
    </div>
  </section>

  <div v-else class="card" style="align-items:center;justify-content:center;padding:48px 24px;text-align:center;gap:12px">
    <div class="ico" style="width:52px;height:52px;border-radius:50%">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="M21 21l-4.3-4.3"></path>
      </svg>
    </div>
    <h3 style="font-size:16px;font-weight:600">No se encontraron empleados</h3>
    <p class="sub">No hay empleados que coincidan con "{{ busqueda || filtroRol }}".</p>
    <BaseButton variant="s" href="#" @click.prevent="busqueda = ''; filtroRol = 'Todos'">
      Ver todos los empleados
    </BaseButton>
  </div>

  <BaseModal
    v-model="showModal"
    :aria-label="editandoId ? 'Editar empleado' : 'Dar de alta empleado'"
    width="520px"
  >
    <div style="display:flex;flex-direction:column;gap:4px">
      <h2 style="font-size:20px;font-weight:600">
        {{ editandoId ? 'Editar empleado' : 'Dar de alta nuevo empleado' }}
      </h2>
      <p class="sub">Configura sus datos personales, rol en el sistema y credenciales de acceso.</p>
    </div>

    <div style="display:flex;flex-direction:column;gap:14px">
      <BaseInput
        id="emp-nom"
        v-model="form.nombre"
        label="Nombre completo *"
        placeholder="Ej. Sofía Ramírez"
      />

      <div>
        <span class="lbl">Rol en KinGo *</span>
        <div class="seg">
          <span :class="{ on: form.rol === 'cajero' }" @click="form.rol = 'cajero'">Cajero</span>
          <span :class="{ on: form.rol === 'repartidor' }" @click="form.rol = 'repartidor'">Repartidor</span>
          <span :class="{ on: form.rol === 'admin' }" @click="form.rol = 'admin'">Administrador</span>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:12px">
        <BaseInput
          id="emp-usr"
          v-model="form.usuario"
          label="Usuario de acceso *"
          placeholder="Ej. sofia.caja"
        />
        <BaseInput
          id="emp-pwd"
          v-model="form.password"
          label="Contraseña *"
          type="text"
          placeholder="Mínimo 3 caracteres"
        />
      </div>

      <div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:12px">
        <BaseInput
          id="emp-tel"
          v-model="form.telefono"
          label="Teléfono celular (10 dígitos) *"
          placeholder="Ej. 2292458810"
        />
        <div>
          <label class="lbl" for="emp-turno">Turno asignado</label>
          <select id="emp-turno" v-model="form.turno" class="inp">
            <option>Completo (13:00 - 21:00)</option>
            <option>Vespertino (15:00 - 21:00)</option>
            <option>Fin de semana</option>
          </select>
        </div>
      </div>

      <label class="row" style="font-size:14px;cursor:pointer">
        <input
          v-model="form.activo"
          type="checkbox"
          style="width:18px;height:18px;accent-color:#C94C08"
        >
        Cuenta activa (puede iniciar sesión)
      </label>

      <div
        v-if="errorForm"
        style="padding:10px 14px;border-radius:10px;background:var(--acs);color:var(--act);font-size:13px;font-weight:500"
      >
        {{ errorForm }}
      </div>
    </div>

    <div style="display:flex;justify-content:flex-end;gap:10px;padding-top:6px">
      <BaseButton variant="s" href="#" @click.prevent="showModal = false">Cancelar</BaseButton>
      <BaseButton variant="p" href="#" @click.prevent="guardarEmpleado">
        {{ editandoId ? 'Guardar cambios' : 'Registrar empleado' }}
      </BaseButton>
    </div>
  </BaseModal>
</template>

<style scoped>
.emp-kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.emp-kpi {
  background: var(--bg2);
  border: 1px solid var(--bd);
  border-radius: 14px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.emp-kpi b {
  font-size: 26px;
  font-weight: 600;
  color: var(--tx);
}

.emp-th,
.emp-tr {
  display: grid;
  grid-template-columns: 1.8fr 1fr 1.1fr 1.1fr 1.1fr 0.9fr 1.1fr;
  gap: 12px;
  align-items: center;
  padding: 0 22px;
  min-width: 820px;
}

.emp-th {
  height: 44px;
  background: var(--bg2);
  font-size: 12px;
  font-weight: 500;
  color: var(--tx2);
  border-bottom: 1px solid var(--bd);
}

.emp-tr {
  height: 64px;
  font-size: 14px;
  border-bottom: 1px solid var(--bd);
  transition: background-color 0.16s ease;
}

.emp-tr:hover {
  background: var(--bg2);
}

.emp-tr.is-inactive {
  opacity: 0.65;
}

.emp-tr:last-child {
  border-bottom: 0;
}

.emp-av {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--acs);
  color: var(--act);
  font-weight: 600;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}
</style>
