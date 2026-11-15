<script setup>
import { ref, computed } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import StatusTag from '@/components/ui/StatusTag.vue'
import {
  empleadosState,
  agregarEmpleado,
  actualizarEmpleado,
  toggleEstadoEmpleado,
  validarFormularioEmpleado
} from '@/services/empleados.service'

const busqueda = ref('')
const filtroRol = ref('Todos')
const filtros = ['Todos', 'Cajeros', 'Repartidores', 'Administradores', 'Dados de baja']

const mostrarPasswords = ref({})
const showModal = ref(false)
const editandoId = ref(null)
const errorForm = ref('')
const erroresCampos = ref({})
const mensajeExito = ref('')

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
  erroresCampos.value = {}
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
  erroresCampos.value = {}
  form.value = {
    nombre: emp.nombre,
    rol: emp.rol,
    usuario: emp.usuario,
    password: emp.password,
    telefono: String(emp.telefono || '').replace(/\D/g, '').slice(0, 10),
    turno: emp.turno,
    activo: emp.activo
  }
  showModal.value = true
}

function onNombreInput(e) {
  const limpio = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ.\s]/g, '')
  e.target.value = limpio
  form.value.nombre = limpio
  erroresCampos.value.nombre = ''
  errorForm.value = ''
}

function onUsuarioInput(e) {
  const limpio = e.target.value.replace(/\s+/g, '').replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase()
  e.target.value = limpio
  form.value.usuario = limpio
  erroresCampos.value.usuario = ''
  errorForm.value = ''
}

function onPasswordInput() {
  erroresCampos.value.password = ''
  errorForm.value = ''
}

function onTelefonoInput(e) {
  const soloDigitos = e.target.value.replace(/\D/g, '').slice(0, 10)
  e.target.value = soloDigitos
  form.value.telefono = soloDigitos
  erroresCampos.value.telefono = ''
  errorForm.value = ''
}

const hayErrores = computed(() => Object.values(erroresCampos.value).some(Boolean))

async function guardarEmpleado() {
  errorForm.value = ''
  const resultado = validarFormularioEmpleado(form.value, editandoId.value)
  erroresCampos.value = resultado.errores

  if (!resultado.valido) {
    errorForm.value = 'Completa los campos marcados antes de continuar.'
    return
  }

  const digitosTel = form.value.telefono.replace(/\D/g, '')
  const telFormateado = `${digitosTel.slice(0, 3)} ${digitosTel.slice(3, 6)} ${digitosTel.slice(6, 10)}`

  if (editandoId.value) {
    await actualizarEmpleado(editandoId.value, {
      ...form.value,
      telefono: telFormateado
    })
    mensajeExito.value = `Datos de "${form.value.nombre.trim()}" validados y actualizados en base de datos.`
  } else {
    await agregarEmpleado({
      ...form.value,
      telefono: telFormateado
    })
    mensajeExito.value = `Usuario "${form.value.usuario.trim()}" validado y registrado en base de datos.`
  }
  showModal.value = false
  setTimeout(() => {
    mensajeExito.value = ''
  }, 3500)
}
</script>

<template>
  <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
    <h1 style="font-size:22px;font-weight:600">Empleados</h1>
    <BaseButton variant="p" href="#" @click.prevent="abrirModalNuevo">
      + Nuevo empleado
    </BaseButton>
  </div>

  <div v-if="mensajeExito" class="note" style="background:var(--oks);color:var(--ok)">
    ✓ {{ mensajeExito }}
  </div>

  <div class="emp-kpi-grid">
    <div class="emp-kpi emp-kpi-active">
      <div style="display:flex;flex-direction:column;gap:4px;position:relative;z-index:1">
        <span class="emp-kpi-active-lbl">Personal activo</span>
        <b>{{ totalActivos }}</b>
      </div>
      <div class="emp-kpi-active-ico" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      </div>
    </div>
    <div class="emp-kpi">
      <div style="display:flex;flex-direction:column;gap:4px">
        <span class="sub">Cajeros</span>
        <b>{{ totalCajeros }}</b>
      </div>
      <div class="emp-kpi-soft-ico" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2"></rect>
          <line x1="6" y1="12" x2="18" y2="12"></line>
        </svg>
      </div>
    </div>
    <div class="emp-kpi">
      <div style="display:flex;flex-direction:column;gap:4px">
        <span class="sub">Repartidores</span>
        <b>{{ totalRepartidores }}</b>
      </div>
      <div class="emp-kpi-soft-ico" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="5.5" cy="17.5" r="3.5"></circle>
          <circle cx="18.5" cy="17.5" r="3.5"></circle>
          <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"></path>
        </svg>
      </div>
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
    <h2 style="font-size:19px;font-weight:600">
      {{ editandoId ? 'Editar empleado' : 'Nuevo empleado' }}
    </h2>

    <div style="display:flex;flex-direction:column;gap:14px">
      <div>
        <label class="lbl" for="emp-nom">Nombre completo *</label>
        <input
          id="emp-nom"
          v-model="form.nombre"
          class="inp"
          type="text"
          placeholder="Ej. Sofía Ramírez"
          :style="erroresCampos.nombre ? 'border-color:#C94C08' : ''"
          @input="onNombreInput"
        >
        <span v-if="erroresCampos.nombre" class="field-err">{{ erroresCampos.nombre }}</span>
      </div>

      <div>
        <span class="lbl">Rol *</span>
        <div class="seg">
          <span :class="{ on: form.rol === 'cajero' }" @click="form.rol = 'cajero'">Cajero</span>
          <span :class="{ on: form.rol === 'repartidor' }" @click="form.rol = 'repartidor'">Repartidor</span>
          <span :class="{ on: form.rol === 'admin' }" @click="form.rol = 'admin'">Administrador</span>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:12px">
        <div>
          <label class="lbl" for="emp-usr">Usuario (único, sin espacios) *</label>
          <input
            id="emp-usr"
            v-model="form.usuario"
            class="inp"
            type="text"
            placeholder="Ej. sofia.caja"
            :style="erroresCampos.usuario ? 'border-color:#C94C08' : ''"
            @input="onUsuarioInput"
          >
          <span v-if="erroresCampos.usuario" class="field-err">{{ erroresCampos.usuario }}</span>
        </div>
        <div>
          <label class="lbl" for="emp-pwd">Contraseña *</label>
          <input
            id="emp-pwd"
            v-model="form.password"
            class="inp"
            type="text"
            placeholder="Mínimo 3 caracteres"
            :style="erroresCampos.password ? 'border-color:#C94C08' : ''"
            @input="onPasswordInput"
          >
          <span v-if="erroresCampos.password" class="field-err">{{ erroresCampos.password }}</span>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:12px">
        <div>
          <div class="row" style="justify-content:space-between;margin-bottom:6px">
            <label class="lbl" for="emp-tel" style="margin:0">Teléfono (10 dígitos) *</label>
            <span
              style="font-size:11px;font-weight:600"
              :style="{ color: form.telefono.length === 10 ? 'var(--ok)' : 'var(--tx2)' }"
            >
              {{ form.telefono.length }}/10
            </span>
          </div>
          <input
            id="emp-tel"
            :value="form.telefono"
            class="inp"
            type="tel"
            inputmode="numeric"
            maxlength="10"
            placeholder="Ej. 2292458810"
            :style="erroresCampos.telefono ? 'border-color:#C94C08' : ''"
            @input="onTelefonoInput"
          >
          <span v-if="erroresCampos.telefono" class="field-err">{{ erroresCampos.telefono }}</span>
        </div>
        <div>
          <label class="lbl" for="emp-turno">Turno</label>
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
        Cuenta activa
      </label>

      <div v-if="hayErrores || errorForm" class="note">
        {{ errorForm || 'Completa los campos marcados antes de continuar.' }}
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
  background: var(--sf);
  border: 1.5px solid var(--bd);
  border-radius: 14px;
  padding: 16px 20px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(31, 26, 23, 0.04);
}

.emp-kpi b {
  font-size: 26px;
  font-weight: 700;
  color: var(--tx);
  line-height: 1.1;
}

.emp-kpi-active {
  background: linear-gradient(135deg, #CF520A 0%, #F26A1B 68%, #FA8237 100%);
  border-color: #CF520A;
  color: #FFFFFF;
  box-shadow: 0 8px 20px rgba(242, 106, 27, 0.24);
}

.emp-kpi-active::before {
  content: '';
  position: absolute;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  right: -24px;
  top: -32px;
  pointer-events: none;
}

.emp-kpi-active::after {
  content: '';
  position: absolute;
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  right: 36px;
  bottom: -28px;
  pointer-events: none;
}

.emp-kpi-active-lbl {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.92);
}

.emp-kpi-active b {
  color: #FFFFFF;
}

.emp-kpi-active-ico {
  position: relative;
  z-index: 1;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.22);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.emp-kpi-soft-ico {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--acs);
  color: var(--act);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
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

.field-err {
  display: block;
  margin-top: 4px;
  font-size: 11.5px;
  font-weight: 600;
  color: #C94C08;
}
</style>
