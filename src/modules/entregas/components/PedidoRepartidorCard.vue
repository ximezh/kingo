<script setup>
import { RouterLink } from 'vue-router'
import StatusTag from '@/components/ui/StatusTag.vue'

defineProps({
  pedido: {
    type: Object,
    required: true
  },
  to: {
    type: String,
    default: '/repartidor/entrega'
  }
})
</script>

<template>
  <div class="card rep-pedido-card">
    <div class="row" style="justify-content:space-between">
      <span style="font-size:15px;font-weight:600">{{ pedido.folio }} · {{ pedido.cliente }}</span>
      <StatusTag :variant="pedido.estado === 'Entregado' ? 'ok' : pedido.estado === 'No entregado' ? 'off' : ''">
        {{ pedido.estado }}
      </StatusTag>
    </div>
    <div style="font-size:14px;line-height:1.5">{{ pedido.direccion }}</div>
    <div class="sub">{{ pedido.referencia }}</div>
    <div v-if="pedido.horaEntrega" class="sub" style="color:var(--ok);font-weight:500">
      ✓ {{ pedido.horaEntrega }}
    </div>
    <div class="row" style="justify-content:space-between;padding:6px 0 4px">
      <span class="sub">{{ pedido.metodoPago }}</span>
      <span style="font-size:17px;font-weight:600">{{ pedido.total }}</span>
    </div>
    <RouterLink
      class="btn s rep-btn-48"
      :to="to"
    >
      {{ pedido.estado === 'Por entregar' ? 'Ver pedido' : 'Ver detalle de entrega' }}
    </RouterLink>
  </div>
</template>

<style scoped>
.rep-pedido-card {
  border-radius: 16px;
  padding: 18px;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.rep-pedido-card:hover {
  border-color: var(--ac);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
}

/* El botón empieza neutro (.btn.s) y se vuelve naranja (.btn.p) al pasar el cursor por encima */
.rep-btn-48 {
  height: 48px;
  border-radius: 12px;
  font: 500 15px 'Poppins', sans-serif;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
}

.rep-btn-48:hover {
  background: var(--btn) !important;
  color: #ffffff !important;
  border-color: var(--btn) !important;
  box-shadow: 0 6px 16px rgba(201, 76, 8, 0.28);
  transform: translateY(-1px);
}

.rep-btn-48:active {
  transform: scale(0.97);
}
</style>
