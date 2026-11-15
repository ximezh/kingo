<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import StatusTag from '@/components/ui/StatusTag.vue'
import { formatearFechaHoraVenta } from '@/services/ventas.service'

defineProps({
  ventas: {
    type: Array,
    required: true
  }
})

const route = useRoute()
const rutaDomicilios = computed(() =>
  route.path.startsWith('/admin') ? '/admin/domicilios' : '/cajero/domicilios'
)

function etiquetaFecha(v) {
  if (v.fechaISO) {
    return formatearFechaHoraVenta(v.fechaISO, v.hora)
  }
  return v.fechaHora || 'Hoy'
}
</script>

<template>
  <section class="card" style="padding:0;gap:0;overflow:hidden">
    <div class="th">
      <span>Folio</span>
      <span>Fecha y hora</span>
      <span>Tipo</span>
      <span>Cliente o mesa</span>
      <span>Pago</span>
      <span>Total</span>
      <span>Estado</span>
    </div>
    <div v-for="v in ventas" :key="v.folio" class="tr">
      <span style="font-weight:600">{{ v.folio }}</span>
      <span class="fecha-cell">
        <span :class="['fecha-badge', { hoy: etiquetaFecha(v).startsWith('Hoy') }]">
          {{ etiquetaFecha(v) }}
        </span>
      </span>
      <span>{{ v.tipo }}</span>
      <span style="font-weight:500">{{ v.clienteMesa }}</span>
      <span>{{ v.pago }}</span>
      <span style="font-weight:700">{{ v.total }}</span>
      <span>
        <RouterLink
          v-if="v.estado === 'Por asignar'"
          :to="{ path: rutaDomicilios, query: { folio: v.folio } }"
          class="asignar-pill"
          title="Ir a seleccionar repartidor"
        >
          Por asignar
        </RouterLink>
        <StatusTag v-else :variant="v.estadoVariant">{{ v.estado }}</StatusTag>
      </span>
    </div>
  </section>
</template>

<style scoped>
.asignar-pill {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border-radius: 14px;
  background: var(--acs);
  color: var(--act);
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  border: 1px solid var(--ac);
  transition: transform 0.15s ease, background-color 0.15s ease;
}

.asignar-pill:hover {
  background: var(--btn);
  color: #fff;
  transform: translateY(-1px);
}

.fecha-cell {
  display: flex;
  align-items: center;
}

.fecha-badge {
  font-size: 13px;
  color: var(--tx2);
  font-weight: 500;
}

.fecha-badge.hoy {
  color: var(--act);
  font-weight: 600;
}

.th,
.tr {
  display: grid;
  grid-template-columns: 0.7fr 1.3fr 1fr 1.3fr 1fr 0.8fr 1fr;
  gap: 12px;
  align-items: center;
  padding: 0 20px;
}

.th {
  height: 44px;
  background: var(--bg2);
  font-size: 12px;
  font-weight: 600;
  color: var(--tx2);
  border-bottom: 1px solid var(--bd);
}

.tr {
  height: 56px;
  font-size: 14px;
  border-bottom: 1px solid var(--bd);
}

.tr:last-child {
  border-bottom: 0;
}
</style>
