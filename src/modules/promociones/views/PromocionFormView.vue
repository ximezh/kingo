<script setup>
import { ref, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { DIAS_SEMANA_PROMO, PROMOCIONES_MOCK } from '@/services/promociones.service'
import { PRODUCTOS_MOCK } from '@/services/catalogo.service'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import StatusTag from '@/components/ui/StatusTag.vue'
import PromocionPreviewCard from '@/modules/promociones/components/PromocionPreviewCard.vue'

const router = useRouter()

const promoBase = PROMOCIONES_MOCK.find((p) => p.id === 1)

const form = ref({
  nombre: promoBase?.nombre || '2x1 en Rollos',
  diasSeleccionados: promoBase?.diasKeys ? [...promoBase.diasKeys] : ['Lun', 'Mar'],
  productosIncluidos: ['Tampico Roll', 'Acapulco Roll', 'California Roll'],
  tipoDescuento: '2x1',
  valor: 'Lleva 2, paga el mayor',
  inicio: '01/10/2026',
  fin: '',
  activa: promoBase ? promoBase.activa : true
})

const tiposDescuento = ['2x1', 'Porcentaje', 'Precio fijo']

const showModalProductos = ref(false)
const busquedaPromoProd = ref('')

const productosCatalogoFiltrados = computed(() => {
  const q = busquedaPromoProd.value.trim().toLowerCase()
  if (!q) return PRODUCTOS_MOCK
  return PRODUCTOS_MOCK.filter(
    (p) => p.nombre.toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q)
  )
})

function toggleDia(dia) {
  if (dia.cerrado) return
  const idx = form.value.diasSeleccionados.indexOf(dia.key)
  if (idx > -1) {
    form.value.diasSeleccionados.splice(idx, 1)
  } else {
    form.value.diasSeleccionados.push(dia.key)
  }
}

function toggleProductoEnPromo(nombreProd) {
  const idx = form.value.productosIncluidos.indexOf(nombreProd)
  if (idx > -1) {
    form.value.productosIncluidos.splice(idx, 1)
  } else {
    form.value.productosIncluidos.push(nombreProd)
  }
}

function quitarProductoPromo(nombreProd) {
  form.value.productosIncluidos = form.value.productosIncluidos.filter((p) => p !== nombreProd)
}

function guardarPromocion() {
  const existente =
    PROMOCIONES_MOCK.find((p) => p.nombre.toLowerCase() === form.value.nombre.trim().toLowerCase()) ||
    PROMOCIONES_MOCK[0]
  const diasTexto = form.value.diasSeleccionados.join(', ') || 'Lunes y Martes'
  if (existente) {
    existente.nombre = form.value.nombre.trim() || existente.nombre
    existente.dia = diasTexto
    existente.diasKeys = [...form.value.diasSeleccionados]
    existente.descuento = form.value.valor
    existente.activa = form.value.activa
  } else if (form.value.nombre.trim()) {
    PROMOCIONES_MOCK.unshift({
      id: Date.now(),
      nombre: form.value.nombre.trim(),
      dia: diasTexto,
      diasKeys: [...form.value.diasSeleccionados],
      descuento: form.value.valor || form.value.tipoDescuento,
      vigencia: form.value.fin ? `Hasta ${form.value.fin}` : 'Sin fecha final',
      activa: form.value.activa,
      accionTexto: 'Editar',
      accionRuta: '/admin/promociones/editar'
    })
  }
  router.push('/admin/promociones')
}

function handleSubmit(e) {
  e.preventDefault()
  guardarPromocion()
}
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:6px">
    <RouterLink class="back" to="/admin/promociones">Volver a promociones</RouterLink>
    <h1 style="font-size:22px;font-weight:600">Configurar promoción</h1>
  </div>

  <div class="promo-form-layout">
    <form
      class="card"
      style="flex:1;display:flex;flex-direction:column;gap:16px"
      @submit="handleSubmit"
    >
      <BaseInput
        id="pn"
        v-model="form.nombre"
        label="Nombre de la promoción"
        type="text"
      />

      <div>
        <span class="lbl">Días en que aplica</span>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <span
            v-for="dia in DIAS_SEMANA_PROMO"
            :key="dia.key"
            :class="[
              'chip',
              {
                on: !dia.cerrado && form.diasSeleccionados.includes(dia.key),
                off: dia.cerrado
              }
            ]"
            :style="dia.cerrado ? undefined : 'cursor:pointer'"
            @click="toggleDia(dia)"
          >
            {{ dia.label }}
          </span>
        </div>
      </div>

      <div>
        <span class="lbl">Productos o platillos incluidos (Sushi, Yakimeshi, Teppanyaki, Bebidas...)</span>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <StatusTag
            v-for="prod in form.productosIncluidos"
            :key="prod"
            style="height:32px;padding:0 12px;font-size:13px;gap:6px"
          >
            <span>{{ prod }}</span>
            <span
              style="cursor:pointer;font-weight:600;opacity:0.75;padding-left:4px"
              title="Quitar platillo"
              @click="quitarProductoPromo(prod)"
            >×</span>
          </StatusTag>
          <a
            class="chip"
            href="#"
            style="border-style:dashed;color:var(--act);font-weight:600"
            @click.prevent="showModalProductos = true"
          >+ Elegir platillos del menú</a>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:16px">
        <div>
          <span class="lbl">Tipo de descuento</span>
          <div class="seg">
            <span
              v-for="t in tiposDescuento"
              :key="t"
              :class="{ on: form.tipoDescuento === t }"
              style="cursor:pointer"
              @click="form.tipoDescuento = t"
            >
              {{ t }}
            </span>
          </div>
        </div>
        <BaseInput
          id="val"
          v-model="form.valor"
          label="Valor o descripción del beneficio"
          type="text"
        />
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:16px;align-items:end">
        <BaseInput
          id="ini"
          v-model="form.inicio"
          label="Inicio"
          type="text"
        />
        <BaseInput
          id="fin"
          v-model="form.fin"
          label="Fin (opcional)"
          type="text"
          placeholder="Sin fecha final"
        />
        <label class="row" style="height:44px;font-size:14px;cursor:pointer">
          <input
            v-model="form.activa"
            type="checkbox"
            style="width:18px;height:18px;accent-color:#C94C08"
          >
          Promoción activa
        </label>
      </div>

      <div style="display:flex;gap:12px;justify-content:flex-end;padding-top:4px">
        <BaseButton variant="s" to="/admin/promociones">Cancelar</BaseButton>
        <BaseButton variant="p" href="#" @click.prevent="guardarPromocion">Guardar promoción</BaseButton>
      </div>
    </form>

    <PromocionPreviewCard :nombre-promo="form.nombre" />
  </div>

  <!-- Modal para elegir cualquier producto del catálogo en la promoción -->
  <BaseModal
    v-model="showModalProductos"
    aria-label="Seleccionar platillos para la promoción"
    width="520px"
  >
    <div style="display:flex;flex-direction:column;gap:4px">
      <h2 style="font-size:19px;font-weight:600">Platillos participantes</h2>
      <p class="sub">Marca los platillos a los que aplicará "{{ form.nombre }}" (incluye Yakimeshi, Teppanyaki, Rollos, Bebidas...).</p>
    </div>

    <input
      v-model="busquedaPromoProd"
      class="inp"
      type="search"
      placeholder="Buscar platillo por nombre o categoría..."
    >

    <div style="display:flex;flex-direction:column;gap:6px;max-height:280px;overflow-y:auto;padding-right:4px">
      <label
        v-for="p in productosCatalogoFiltrados"
        :key="p.id"
        style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border:1px solid var(--bd);border-radius:10px;cursor:pointer"
      >
        <span class="row" style="gap:10px">
          <input
            type="checkbox"
            :checked="form.productosIncluidos.includes(p.nombre)"
            style="width:18px;height:18px;accent-color:#C94C08"
            @change="toggleProductoEnPromo(p.nombre)"
          >
          <span style="display:flex;flex-direction:column">
            <span style="font-weight:500;font-size:14px">{{ p.nombre }}</span>
            <span class="sub" style="font-size:12px">{{ p.categoria }} · ${{ p.precio }}</span>
          </span>
        </span>
        <StatusTag v-if="form.productosIncluidos.includes(p.nombre)" variant="ok">Incluido</StatusTag>
      </label>
    </div>

    <div style="display:flex;justify-content:space-between;align-items:center;padding-top:4px">
      <span class="sub">{{ form.productosIncluidos.length }} platillos seleccionados</span>
      <BaseButton variant="p" href="#" @click.prevent="showModalProductos = false">Listo</BaseButton>
    </div>
  </BaseModal>
</template>

<style scoped>
.promo-form-layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

@media (max-width: 900px) {
  .promo-form-layout {
    flex-direction: column;
  }
}
</style>
