<script setup>
defineProps({
  barras: {
    type: Array,
    required: true
  },
  titulo: {
    type: String,
    default: 'Ventas por día'
  },
  subtitulo: {
    type: String,
    default: 'Miércoles cerrado'
  }
})
</script>

<template>
  <section class="card res-card" style="flex:1.5;min-width:0">
    <div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:6px">
      <h2 style="font-size:15px;font-weight:600">{{ titulo }}</h2>
      <span class="sub">{{ subtitulo }}</span>
    </div>
    <div style="display:flex;gap:12px;align-items:flex-end;height:250px;padding-top:24px">
      <div
        v-for="(b, idx) in barras"
        :key="b.nombreCompleto || b.dia || idx"
        class="col"
        :title="`${b.nombreCompleto || b.dia}: ${b.valorDetalle || b.valor}`"
      >
        <div class="bar-tooltip" role="tooltip">
          <strong>{{ b.nombreCompleto || b.dia }}</strong>
          <span>{{ b.valorDetalle || b.valor }}</span>
        </div>
        <span class="v">{{ b.valor }}</span>
        <span class="b" :style="{ height: b.altura }"></span>
        <span class="d">{{ b.dia }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.res-card {
  padding: 18px 20px;
  gap: 12px;
}

.col {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  height: 100%;
  cursor: pointer;
}

.bar-tooltip {
  position: absolute;
  bottom: calc(100% - 14px);
  left: 50%;
  transform: translateX(-50%) translateY(6px);
  background: #1F1A17;
  color: #FFFFFF;
  padding: 6px 11px;
  border-radius: 9px;
  font-family: 'Poppins', sans-serif;
  font-size: 11.5px;
  line-height: 1.3;
  white-space: nowrap;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  box-shadow: 0 8px 20px rgba(31, 26, 23, 0.24);
  opacity: 0;
  pointer-events: none;
  z-index: 20;
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.bar-tooltip strong {
  font-weight: 600;
  color: #FFFFFF;
}

.bar-tooltip span {
  font-size: 11px;
  color: #FFAD75;
  font-weight: 500;
}

.bar-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 5px;
  border-style: solid;
  border-color: #1F1A17 transparent transparent transparent;
}

.col:hover .bar-tooltip {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.col span.v {
  font-size: 12px;
  font-weight: 500;
  text-align: center;
}

.col span.b {
  width: 100%;
  max-width: 56px;
  border-radius: 8px 8px 0 0;
  background: #F26A1B !important;
  box-shadow: inset 0 0 0 1000px #F26A1B !important;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
  transition: height 0.25s ease, transform 0.18s ease, filter 0.18s ease;
}

.col:hover span.b {
  filter: brightness(1.08);
  transform: scaleX(1.06);
}

.col span.d {
  font-size: 12px;
  color: var(--tx2);
  text-align: center;
}
</style>
