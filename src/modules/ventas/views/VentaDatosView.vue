<script setup>
import { ref, computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import StatusTag from '@/components/ui/StatusTag.vue'
import StepIndicator from '@/components/ui/StepIndicator.vue'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()

const errores = ref({})

watchEffect(() => {
  const qTipo = route.query.tipo
  if (qTipo && ['local', 'llevar', 'domicilio'].includes(qTipo)) {
    cartStore.setTipoPedido(qTipo)
  }
})

const digitosTelefono = computed(() => {
  return String(cartStore.datosCliente.telefono || '').replace(/\D/g, '')
})

function onTelefonoInput(val) {
  const soloDigitos = String(val || '').replace(/\D/g, '').slice(0, 10)
  cartStore.datosCliente.telefono = soloDigitos
  if (soloDigitos.length === 10 && errores.value.telefono) {
    delete errores.value.telefono
  }
}

function validarFormulario() {
  const errs = {}
  const tipo = cartStore.tipoPedido
  const d = cartStore.datosCliente

  if (tipo === 'local') {
    if (!d.mesa) {
      errs.mesa = 'Selecciona el número de mesa.'
    }
  } else if (tipo === 'llevar') {
    if (!d.nombreLlevar || d.nombreLlevar.trim().length < 3) {
      errs.nombreLlevar = 'El nombre del cliente es obligatorio (mínimo 3 letras).'
    }
    if (!d.horaRecoleccion || !d.horaRecoleccion.trim()) {
      errs.horaRecoleccion = 'Indica la hora estimada de recolección (entre 13:00 y 21:00).'
    }
  } else if (tipo === 'domicilio') {
    if (!d.nombreRecibe || d.nombreRecibe.trim().length < 3) {
      errs.nombreRecibe = 'El nombre de quien recibe es obligatorio para el repartidor.'
    }
    if (digitosTelefono.value.length !== 10) {
      errs.telefono = `El número de celular debe tener exactamente 10 dígitos (actual: ${digitosTelefono.value.length}/10).`
    }
    if (!d.direccion || d.direccion.trim().length < 8) {
      errs.direccion = 'La dirección completa (calle, número y colonia) es obligatoria.'
    }
    const numEnvio = Number(String(d.costoEnvioTexto || '').replace(/[^0-9.]/g, ''))
    if (!Number.isFinite(numEnvio) || numEnvio <= 0) {
      errs.costoEnvioTexto = 'Ingresa un costo de envío válido (ej. $35.00).'
    } else {
      d.costoEnvio = numEnvio
    }
  }

  errores.value = errs
  return Object.keys(errs).length === 0
}

function continuarAlPago(e) {
  if (e) e.preventDefault()
  if (!validarFormulario()) return
  cartStore.setPaso(4)
  router.push('/cajero/nueva-venta/pago')
}
</script>

<template>
  <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
    <div class="row" style="gap:10px;flex-wrap:wrap">
      <h1 style="font-size:22px;font-weight:600">Datos del pedido</h1>
      <div style="display:flex;gap:6px;flex-wrap:wrap;padding-left:6px">
        <a
          href="#"
          :class="['chip', { on: cartStore.tipoPedido === 'local' }]"
          style="height:32px;font-size:12.5px"
          @click.prevent="cartStore.setTipoPedido('local'); errores = {}"
        >En local</a>
        <a
          href="#"
          :class="['chip', { on: cartStore.tipoPedido === 'llevar' }]"
          style="height:32px;font-size:12.5px"
          @click.prevent="cartStore.setTipoPedido('llevar'); errores = {}"
        >Para llevar</a>
        <a
          href="#"
          :class="['chip', { on: cartStore.tipoPedido === 'domicilio' }]"
          style="height:32px;font-size:12.5px"
          @click.prevent="cartStore.setTipoPedido('domicilio'); errores = {}"
        >A domicilio</a>
      </div>
    </div>
    <StepIndicator :current-step="3" />
  </div>

  <div class="datos-layout">
    <form
      class="card"
      style="flex:1;display:flex;flex-direction:column;gap:16px"
      @submit="continuarAlPago"
    >
      <div class="row" style="justify-content:space-between">
        <h2 style="font-size:17px;font-weight:600">
          <span>{{ cartStore.tituloDatos }}</span>
        </h2>
        <StatusTag style="height:26px;padding:0 12px;border-radius:13px">
          <span>{{ cartStore.tipoEtiqueta }}</span>
        </StatusTag>
      </div>

      <!-- Modalidad: En local -->
      <div v-if="cartStore.tipoPedido === 'local'" style="display:contents">
        <div class="g2">
          <div>
            <label class="lbl" for="mesa">Mesa *</label>
            <select id="mesa" v-model="cartStore.datosCliente.mesa" class="inp">
              <option>Mesa 1</option>
              <option>Mesa 2</option>
              <option>Mesa 3</option>
              <option>Mesa 4</option>
              <option>Mesa 5</option>
            </select>
            <span v-if="errores.mesa" class="err-msg">{{ errores.mesa }}</span>
          </div>
          <BaseInput
            id="nota"
            v-model="cartStore.datosCliente.notaCocina"
            label="Nota para cocina (opcional)"
            type="text"
            placeholder="Sin cebolla, salsa aparte..."
          />
        </div>
      </div>

      <!-- Modalidad: Para llevar -->
      <div v-if="cartStore.tipoPedido === 'llevar'" style="display:contents">
        <div class="g2">
          <div>
            <BaseInput
              id="cn"
              v-model="cartStore.datosCliente.nombreLlevar"
              label="Nombre del cliente *"
              type="text"
              placeholder="¿A nombre de quién?"
            />
            <span v-if="errores.nombreLlevar" class="err-msg">{{ errores.nombreLlevar }}</span>
          </div>
          <div>
            <BaseInput
              id="hr"
              v-model="cartStore.datosCliente.horaRecoleccion"
              label="Hora de recolección *"
              type="text"
              placeholder="Ej. 14:30"
            />
            <span v-if="errores.horaRecoleccion" class="err-msg">{{ errores.horaRecoleccion }}</span>
          </div>
        </div>
      </div>

      <!-- Modalidad: A domicilio -->
      <div v-if="cartStore.tipoPedido === 'domicilio'" style="display:contents">
        <div class="g2">
          <div>
            <BaseInput
              id="dn"
              v-model="cartStore.datosCliente.nombreRecibe"
              label="Nombre de quien recibe *"
              type="text"
              placeholder="Ej. Laura Méndez"
            />
            <span v-if="errores.nombreRecibe" class="err-msg">{{ errores.nombreRecibe }}</span>
          </div>
          <div>
            <div class="row" style="justify-content:space-between;margin-bottom:6px">
              <label class="lbl" for="dt" style="margin-bottom:0">Teléfono (10 dígitos) *</label>
              <span
                :style="{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: digitosTelefono.length === 10 ? 'var(--ok)' : 'var(--act)'
                }"
              >
                {{ digitosTelefono.length }}/10
              </span>
            </div>
            <input
              id="dt"
              :value="cartStore.datosCliente.telefono"
              class="inp"
              type="tel"
              maxlength="10"
              placeholder="Ej. 2291234567"
              @input="onTelefonoInput($event.target.value)"
            >
            <span v-if="errores.telefono" class="err-msg">{{ errores.telefono }}</span>
          </div>
        </div>

        <div>
          <BaseInput
            id="dd"
            v-model="cartStore.datosCliente.direccion"
            label="Dirección *"
            type="text"
            placeholder="Calle, número y colonia"
          />
          <span v-if="errores.direccion" class="err-msg">{{ errores.direccion }}</span>
        </div>

        <BaseInput
          id="dr"
          v-model="cartStore.datosCliente.referencia"
          label="Referencia (opcional)"
          type="text"
          placeholder="Portón azul, frente a parque..."
        />

        <div class="g2" style="align-items:end">
          <div>
            <BaseInput
              id="de"
              v-model="cartStore.datosCliente.costoEnvioTexto"
              label="Costo de envío *"
              type="text"
            />
            <span v-if="errores.costoEnvioTexto" class="err-msg">{{ errores.costoEnvioTexto }}</span>
          </div>
          <div class="row" style="height:44px">
            <StatusTag variant="ok" style="height:26px;padding:0 12px;border-radius:13px">
              Horario activo (13:00–21:00)
            </StatusTag>
          </div>
        </div>
      </div>

      <div
        v-if="Object.keys(errores).length > 0"
        style="padding:12px 16px;border-radius:10px;background:var(--acs);color:var(--act);font-size:13px;font-weight:500"
      >
        Completa los campos marcados antes de continuar.
      </div>

      <div style="display:flex;gap:12px;justify-content:flex-end;padding-top:4px">
        <BaseButton variant="s" to="/cajero/nueva-venta/productos">Atrás</BaseButton>
        <BaseButton variant="p" href="#" @click.prevent="continuarAlPago">
          Continuar
        </BaseButton>
      </div>
    </form>

    <!-- Resumen compacto del pedido -->
    <aside
      class="card"
      style="width:300px;flex:none;display:flex;flex-direction:column;gap:10px;background:var(--bg2)"
    >
      <div class="row" style="justify-content:space-between">
        <h2 style="font-size:15px;font-weight:600">Resumen</h2>
        <span class="sub" style="font-size:12px">{{ cartStore.items.reduce((a, i) => a + i.cantidad, 0) }} pzas</span>
      </div>

      <div v-if="cartStore.items.length > 0" style="display:flex;flex-direction:column;gap:6px;max-height:180px;overflow-y:auto;font-size:13px">
        <div
          v-for="it in cartStore.items"
          :key="it.id"
          class="row"
          style="justify-content:space-between"
        >
          <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1">{{ it.cantidad }} × {{ it.nombre }}</span>
          <span style="font-weight:500">${{ it.subtotal }}</span>
        </div>
      </div>

      <div style="height:1px;background:var(--bd)"></div>

      <div class="row" style="justify-content:space-between;font-size:15px;font-weight:600">
        <span>Total actual</span>
        <span style="color:var(--act)">${{ cartStore.total }}</span>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.datos-layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.g2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 900px) {
  .datos-layout {
    flex-direction: column;
  }
  .g2 {
    grid-template-columns: 1fr;
  }
}

.err-msg {
  display: block;
  margin-top: 5px;
  font-size: 12px;
  font-weight: 500;
  color: #C94C08;
}
</style>
