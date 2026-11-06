<script setup>
defineProps({
  label: {
    type: String,
    required: true
  },
  valor: {
    type: String,
    required: true
  }
})
</script>

<template>
  <div class="kpi">
    <span class="sub">{{ label }}</span>
    <b>{{ valor }}</b>
  </div>
</template>

<style scoped>
.kpi {
  flex: 1;
  background: var(--bg2);
  border: 1px solid var(--bd);
  border-radius: 14px;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.kpi b {
  font-size: 24px;
  font-weight: 600;
}
</style>
