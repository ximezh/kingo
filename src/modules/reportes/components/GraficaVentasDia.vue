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
    <div style="display:flex;gap:12px;align-items:flex-end;height:250px;padding-top:8px">
      <div v-for="b in barras" :key="b.dia" class="col">
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
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  height: 100%;
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
  transition: height 0.25s ease;
}

.col span.d {
  font-size: 12px;
  color: var(--tx2);
  text-align: center;
}
</style>
