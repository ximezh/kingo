<script setup>
import { RouterLink } from 'vue-router'
import StatusTag from '@/components/ui/StatusTag.vue'

defineProps({
  promociones: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['eliminar'])
</script>

<template>
  <section class="card" style="padding:0;gap:0;overflow:hidden">
    <div class="th">
      <span>Promoción</span>
      <span>Día</span>
      <span>Descuento</span>
      <span>Vigencia</span>
      <span>Estado</span>
      <span>Acciones</span>
    </div>
    <div v-for="promo in promociones" :key="promo.id" class="tr">
      <span style="font-weight:500">{{ promo.nombre }}</span>
      <span>{{ promo.dia }}</span>
      <span>{{ promo.descuento }}</span>
      <span class="sub">{{ promo.vigencia }}</span>
      <span>
        <StatusTag :variant="promo.activa ? 'ok' : 'off'">
          {{ promo.activa ? 'Activa' : 'Inactiva' }}
        </StatusTag>
      </span>
      <div class="row" style="gap:14px">
        <RouterLink class="edit" :to="`/admin/promociones/editar?id=${promo.id}`">{{ promo.accionTexto || 'Editar' }}</RouterLink>
        <a
          href="#"
          class="del-link"
          @click.prevent="emit('eliminar', promo)"
        >Eliminar</a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.th,
.tr {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1.2fr 1fr 0.8fr 0.9fr;
  gap: 12px;
  align-items: center;
  padding: 0 22px;
}

.del-link {
  font-size: 13px;
  font-weight: 500;
  color: #b42318;
  text-decoration: none;
}

.del-link:hover {
  text-decoration: underline;
}

.th {
  height: 44px;
  background: var(--bg2);
  font-size: 12px;
  font-weight: 500;
  color: var(--tx2);
  border-bottom: 1px solid var(--bd);
}

.tr {
  height: 62px;
  font-size: 14px;
  border-bottom: 1px solid var(--bd);
}

.tr:last-child {
  border-bottom: 0;
}
</style>
