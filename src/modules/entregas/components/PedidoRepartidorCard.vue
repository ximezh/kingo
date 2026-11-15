<script setup>
import { RouterLink } from 'vue-router'

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
  <div :class="['card', 'rep-card', { pendiente: pedido.estado === 'Por entregar' }]">
    <!-- Encabezado grande y claro: Folio + Estado -->
    <div class="rep-card-header">
      <span class="rep-folio">Pedido {{ pedido.folio }}</span>
      <span :class="['rep-estado-badge', pedido.estado === 'Entregado' ? 'ok' : pedido.estado === 'No entregado' ? 'err' : 'pend']">
        {{ pedido.estado }}
      </span>
    </div>

    <!-- Nombre del cliente en letra grande -->
    <div class="rep-cliente">
      {{ pedido.cliente }}
    </div>

    <!-- Dirección muy legible y de alto contraste -->
    <div class="rep-direccion-box">
      <div class="rep-direccion">{{ pedido.direccion }}</div>
      <div v-if="pedido.referencia" class="rep-referencia">
        {{ pedido.referencia }}
      </div>
    </div>

    <!-- Nota de hora si ya fue finalizado -->
    <div v-if="pedido.horaEntrega" class="rep-hora-nota" :class="{ err: pedido.estado === 'No entregado' }">
      {{ pedido.horaEntrega }}
    </div>

    <!-- Total a cobrar grande y claro -->
    <div class="rep-cobro-row">
      <span class="rep-metodo">{{ pedido.metodoPago }}</span>
      <strong class="rep-total">{{ pedido.total }}</strong>
    </div>

    <!-- Un solo botón grande y fácil de tocar -->
    <RouterLink
      :class="['btn', pedido.estado === 'Por entregar' ? 'p' : 's', 'rep-open-btn']"
      :to="to"
    >
      {{ pedido.estado === 'Por entregar' ? 'Abrir pedido' : 'Ver resumen' }}
    </RouterLink>
  </div>
</template>

<style scoped>
.rep-card {
  border-radius: 20px;
  padding: 20px;
  gap: 14px;
  border: 2px solid var(--bd);
}

.rep-card.pendiente {
  border-color: #F26A1B;
}

.rep-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.rep-folio {
  font-size: 18px;
  font-weight: 800;
  color: var(--act);
}

.rep-estado-badge {
  padding: 6px 14px;
  border-radius: 99px;
  font-size: 15px;
  font-weight: 700;
}

.rep-estado-badge.pend {
  background: #FFF0E0;
  color: #C94C08;
}

.rep-estado-badge.ok {
  background: var(--oks);
  color: var(--ok);
}

.rep-estado-badge.err {
  background: var(--bg2);
  color: var(--tx2);
}

.rep-cliente {
  font-size: 22px;
  font-weight: 800;
  color: var(--tx);
  line-height: 1.25;
}

.rep-direccion-box {
  background: var(--bg2);
  border: 1.5px solid var(--bd);
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rep-direccion {
  font-size: 18px;
  font-weight: 600;
  color: var(--tx);
  line-height: 1.4;
}

.rep-referencia {
  font-size: 16px;
  color: var(--tx2);
  line-height: 1.35;
}

.rep-hora-nota {
  font-size: 16px;
  font-weight: 700;
  color: var(--ok);
  background: var(--oks);
  padding: 10px 14px;
  border-radius: 12px;
}

.rep-hora-nota.err {
  color: #9A3412;
  background: #FFF3E8;
}

.rep-cobro-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 2px;
}

.rep-metodo {
  font-size: 17px;
  font-weight: 600;
  color: var(--tx2);
}

.rep-total {
  font-size: 26px;
  font-weight: 800;
  color: var(--tx);
}

.rep-open-btn {
  width: 100%;
  height: 58px;
  border-radius: 14px;
  font-size: 18px;
  font-weight: 700;
}
</style>
