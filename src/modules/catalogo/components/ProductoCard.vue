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

const emit = defineEmits(['ver-info'])

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
  <div :class="['card', 'prod-card', { 'is-off': producto.activo === false }]">
    <div :class="['ph', { no: !producto.imagenUrl && !producto.tieneFoto, 'has-img': Boolean(producto.imagenUrl) }]">
      <img
        v-if="producto.imagenUrl"
        :src="producto.imagenUrl"
        :alt="producto.nombre"
        loading="lazy"
        class="prod-img"
      >
      <svg
        v-else
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
      </svg>

      <button
        type="button"
        class="prod-info-btn"
        title="Ver ingredientes y descripción"
        aria-label="Ver ingredientes y descripción"
        @click.stop="emit('ver-info', producto)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      </button>
    </div>
    <div style="display:flex;flex-direction:column;gap:2px">
      <div style="font-size:14px;font-weight:600;line-height:1.3">{{ producto.nombre }}</div>
      <span v-if="producto.categoria" class="sub" style="font-size:11.5px">
        {{ producto.categoria }}{{ producto.activo === false ? ' · Inactivo' : '' }}
      </span>
    </div>
    <div v-if="editable" class="row" style="justify-content:space-between;margin-top:auto;padding-top:4px">
      <span style="font-size:14.5px;font-weight:600;color:var(--act)">{{ precioTexto }}</span>
      <RouterLink class="edit" :to="`/admin/productos/editar?id=${producto.id}`">Editar</RouterLink>
    </div>
    <div v-else style="font-size:14.5px;font-weight:600;color:var(--act);margin-top:auto;padding-top:4px">
      {{ precioTexto }}
    </div>
  </div>
</template>

<style scoped>
.prod-card {
  padding: 14px;
  gap: 8px;
  border-radius: 16px;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.prod-card:hover {
  transform: translateY(-2px);
  border-color: var(--ac);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.04);
}

.prod-card.is-off {
  opacity: 0.58;
}

.ph {
  background: var(--acs);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--act);
  height: 112px;
  overflow: hidden;
  position: relative;
}

.ph.no {
  background: var(--bg2);
  color: var(--tx2);
  opacity: 0.7;
}

.ph.has-img {
  padding: 0;
  opacity: 1;
}

.prod-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.prod-info-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1px solid rgba(31, 26, 23, 0.14);
  background: rgba(255, 255, 255, 0.92);
  color: #1F1A17;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  transition: transform 0.16s ease, background-color 0.16s ease, color 0.16s ease, border-color 0.16s ease;
}

.prod-info-btn:hover {
  transform: scale(1.1);
  background: var(--btn);
  color: #ffffff;
  border-color: var(--btn);
}
</style>
