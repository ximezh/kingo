<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  producto: {
    type: Object,
    required: true
  },
  editable: {
    type: Boolean,
    default: true
  },
  hidePhotoText: {
    type: Boolean,
    default: false
  }
})

const precioTexto = computed(() => {
  if (props.producto.variantes && props.producto.variantes.length > 0) {
    return props.producto.variantes.map((v) => `${v.nombre} $${v.precio}`).join(' / ')
  }
  if (props.producto.precioNulo) {
    return 'Paga 4, lleva 5'
  }
  return `$${props.producto.precio}`
})
</script>

<template>
  <div class="card" style="padding:12px;gap:8px">
    <div :class="['ph', { no: !producto.tieneFoto && !hidePhotoText }]">
      <template v-if="!hidePhotoText">
        {{ producto.tieneFoto ? 'Foto' : 'Sin foto' }}
      </template>
    </div>
    <div style="font-size:14px;font-weight:600">{{ producto.nombre }}</div>
    <div v-if="editable" class="row" style="justify-content:space-between;margin-top:auto">
      <span style="font-size:14px;font-weight:600;color:var(--act)">{{ precioTexto }}</span>
      <RouterLink class="edit" to="/admin/productos/editar">Editar</RouterLink>
    </div>
    <div v-else style="font-size:14px;font-weight:600;color:var(--act);margin-top:auto">
      {{ precioTexto }}
    </div>
  </div>
</template>

<style scoped>
.ph {
  background: var(--acs);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--act);
  font-size: 12px;
  font-weight: 500;
  height: 92px;
}

.ph.no {
  background: transparent;
  border: 1px dashed var(--bd);
  color: var(--tx2);
}
</style>
