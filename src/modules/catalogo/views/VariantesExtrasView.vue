<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { VARIANTES_TE_VERDE_MOCK, EXTRAS_DISPONIBLES_MOCK } from '@/services/catalogo.service'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'

const variantes = ref(VARIANTES_TE_VERDE_MOCK.map((v) => ({ ...v })))
const extras = ref(EXTRAS_DISPONIBLES_MOCK.map((e) => ({ ...e })))

const nuevaVarianteNombre = ref('')
const nuevaVariantePrecio = ref('')

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
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:6px">
    <RouterLink class="back" to="/admin/productos/editar">Volver al producto</RouterLink>
    <h1 style="font-size:22px;font-weight:600">Variantes y extras</h1>
    <p class="sub">Té verde · Bebidas</p>
  </div>

  <div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:20px;align-items:start">
    <section class="card" style="gap:14px">
      <div>
        <h2 style="font-size:16px;font-weight:600">Variantes</h2>
        <p class="sub" style="margin-top:4px">Tamaños u opciones, cada una con su precio.</p>
      </div>

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
          placeholder="Nombre"
        />
        <BaseInput
          id="vp"
          v-model="nuevaVariantePrecio"
          label="Precio"
          type="text"
          placeholder="$0"
        />
        <BaseButton variant="s" href="#" @click.prevent="agregarVariante">Agregar</BaseButton>
      </div>
    </section>

    <section class="card" style="gap:14px">
      <div>
        <h2 style="font-size:16px;font-weight:600">Extras disponibles</h2>
        <p class="sub" style="margin-top:4px">Marca los que se pueden agregar a este producto.</p>
      </div>

      <label v-for="ex in extras" :key="ex.id" class="item">
        <span class="row">
          <input
            v-model="ex.seleccionado"
            type="checkbox"
            style="width:18px;height:18px;accent-color:#C94C08"
          >
          {{ ex.nombre }}
        </span>
        <span class="pr">{{ ex.precio }}</span>
      </label>
    </section>
  </div>

  <div style="display:flex;gap:12px;justify-content:flex-end">
    <BaseButton variant="s" to="/admin/productos/editar">Cancelar</BaseButton>
    <BaseButton variant="p" to="/admin/productos/editar">Guardar cambios</BaseButton>
  </div>
</template>

<style scoped>
.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 46px;
  padding: 0 14px;
  border: 1px solid var(--bd);
  border-radius: 10px;
  font-size: 14px;
}
</style>
