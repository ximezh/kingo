<script setup>
import { ref, computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  PRODUCTOS_MOCK,
  VARIANTES_TE_VERDE_MOCK,
  EXTRAS_DISPONIBLES_MOCK,
  guardarVariantesExtrasStorage,
  guardarProductosStorage
} from '@/services/catalogo.service'
import { reconstruirMenuVenta } from '@/services/ventas.service'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'

const route = useRoute()
const router = useRouter()

const productoActual = computed(() => {
  const qId = Number(route.query.id)
  if (Number.isFinite(qId) && qId > 0) {
    return PRODUCTOS_MOCK.find((p) => Number(p.id) === qId) || null
  }
  return PRODUCTOS_MOCK.find((p) => p.id === 131) || PRODUCTOS_MOCK[0] || null
})

const rutaRegreso = computed(() =>
  route.query.id ? `/admin/productos/editar?id=${route.query.id}` : '/admin/productos/editar'
)

const variantesIniciales =
  productoActual.value?.variantes && productoActual.value.variantes.length > 0
    ? productoActual.value.variantes.map((v, idx) => ({
        id: v.id || idx + 1,
        nombre: v.nombre || 'Chico',
        precio: String(v.precio).startsWith('$') ? String(v.precio) : `$${v.precio}`
      }))
    : VARIANTES_TE_VERDE_MOCK.map((v) => ({ ...v }))

const variantes = ref(variantesIniciales)
const extras = ref(
  EXTRAS_DISPONIBLES_MOCK.map((e) => ({
    ...e,
    seleccionado: e.seleccionado !== false
  }))
)

const nuevaVarianteNombre = ref('')
const nuevaVariantePrecio = ref('')

const nuevoExtraNombre = ref('')
const nuevoExtraPrecio = ref('')

function agregarVariante() {
  const nombre = nuevaVarianteNombre.value.trim()
  if (!nombre) return
  const rawPrecio = nuevaVariantePrecio.value.trim() || '$0'
  const precio = rawPrecio.startsWith('$') ? rawPrecio : `$${rawPrecio}`
  variantes.value.push({
    id: Date.now(),
    nombre,
    precio
  })
  nuevaVarianteNombre.value = ''
  nuevaVariantePrecio.value = ''
}

function quitarVariante(id) {
  variantes.value = variantes.value.filter((v) => v.id !== id)
}

function agregarExtra() {
  const nombre = nuevoExtraNombre.value.trim()
  if (!nombre) return
  const numCosto = Number(String(nuevoExtraPrecio.value).replace(/[^0-9.]/g, '')) || 20
  extras.value.unshift({
    id: Date.now(),
    nombre,
    subcategoria: 'Complementos',
    descripcion: 'Complemento extra',
    precio: `+$${numCosto}`,
    costo: numCosto,
    tipo: 'complemento',
    seleccionado: true
  })
  nuevoExtraNombre.value = ''
  nuevoExtraPrecio.value = ''
}

function quitarExtra(id) {
  extras.value = extras.value.filter((e) => e.id !== id)
}

function guardarCambiosVariantes() {
  guardarVariantesExtrasStorage(variantes.value, extras.value)
  if (productoActual.value && variantes.value.length > 0) {
    productoActual.value.variantes = variantes.value.map((v) => ({
      nombre: v.nombre,
      precio: Number(String(v.precio).replace(/[^0-9.]/g, '')) || 40
    }))
    guardarProductosStorage()
  }
  reconstruirMenuVenta()
  router.push(rutaRegreso.value)
}
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:4px">
    <RouterLink class="back" :to="rutaRegreso">Volver al producto</RouterLink>
    <div class="row" style="gap:10px">
      <h1 style="font-size:22px;font-weight:600">Variantes y extras</h1>
      <span class="tag">{{ productoActual?.nombre || 'Catálogo' }}</span>
    </div>
  </div>

  <div class="var-extras-grid">
    <section class="card" style="gap:12px">
      <h2 style="font-size:16px;font-weight:600">Tamaños / Variantes</h2>

      <div v-for="v in variantes" :key="v.id" class="item">
        <span>{{ v.nombre }}</span>
        <span class="row">
          <span class="pr">{{ v.precio }}</span>
          <a class="back" href="#" @click.prevent="quitarVariante(v.id)">Quitar</a>
        </span>
      </div>

      <div style="display:grid;grid-template-columns:1fr 110px auto;gap:10px;align-items:end;padding-top:6px">
        <BaseInput
          id="vn"
          v-model="nuevaVarianteNombre"
          label="Nueva variante"
          type="text"
          placeholder="Ej. Mediano"
          @keyup.enter="agregarVariante"
        />
        <BaseInput
          id="vp"
          v-model="nuevaVariantePrecio"
          label="Precio"
          type="text"
          placeholder="$55"
          @keyup.enter="agregarVariante"
        />
        <BaseButton variant="s" href="#" @click.prevent="agregarVariante">Agregar</BaseButton>
      </div>
    </section>

    <section class="card" style="gap:12px">
      <h2 style="font-size:16px;font-weight:600">Extras permitidos</h2>

      <div style="display:grid;grid-template-columns:1fr 110px auto;gap:10px;align-items:end;padding-bottom:4px">
        <BaseInput
          id="en"
          v-model="nuevoExtraNombre"
          label="Nuevo extra"
          type="text"
          placeholder="Ej. Aguacate extra"
          @keyup.enter="agregarExtra"
        />
        <BaseInput
          id="ep"
          v-model="nuevoExtraPrecio"
          label="Precio (+$)"
          type="text"
          placeholder="25"
          @keyup.enter="agregarExtra"
        />
        <BaseButton variant="s" href="#" @click.prevent="agregarExtra">Agregar</BaseButton>
      </div>

      <div style="display:flex;flex-direction:column;gap:8px;max-height:320px;overflow-y:auto;padding-right:4px">
        <label v-for="ex in extras" :key="ex.id" class="item">
          <span class="row">
            <input
              v-model="ex.seleccionado"
              type="checkbox"
              style="width:18px;height:18px;accent-color:#C94C08"
            >
            {{ ex.nombre }}
          </span>
          <span class="row" style="gap:10px">
            <span class="pr">{{ ex.precio }}</span>
            <a class="back" href="#" style="font-size:12px" @click.prevent="quitarExtra(ex.id)">Quitar</a>
          </span>
        </label>
      </div>
    </section>
  </div>

  <div style="display:flex;gap:12px;justify-content:flex-end">
    <BaseButton variant="s" :to="rutaRegreso">Cancelar</BaseButton>
    <BaseButton variant="p" href="#" @click.prevent="guardarCambiosVariantes">Guardar cambios</BaseButton>
  </div>
</template>

<style scoped>
.var-extras-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  align-items: start;
}

@media (max-width: 900px) {
  .var-extras-grid {
    grid-template-columns: 1fr;
  }
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 46px;
  padding: 0 14px;
  border: 1px solid var(--bd);
  border-radius: 10px;
  font-size: 14px;
}
</style>
