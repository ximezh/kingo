<script setup>
import { RouterLink } from 'vue-router'
import StatusTag from '@/components/ui/StatusTag.vue'

defineProps({
  promociones: {
    type: Array,
    required: true
  }
})
</script>

<template>
  <section class="card" style="padding:0;gap:0;overflow:hidden">
    <div class="th">
      <span>Promoción</span>
      <span>Día</span>
      <span>Descuento</span>
      <span>Vigencia</span>
      <span>Estado</span>
      <span></span>
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
      <RouterLink class="edit" :to="promo.accionRuta">{{ promo.accionTexto }}</RouterLink>
    </div>
  </section>
</template>

<style scoped>
.th,
.tr {
  display: grid;
  grid-template-columns: 1.6fr 1.1fr 1.3fr 1.1fr 0.8fr 0.6fr;
  gap: 12px;
  align-items: center;
  padding: 0 22px;
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
