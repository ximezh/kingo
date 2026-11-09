<script setup>
defineProps({
  nombrePromo: {
    type: String,
    default: 'Martes de 2x1'
  }
})
</script>

<template>
  <aside
    class="card"
    style="width:290px;flex:none;display:flex;flex-direction:column;gap:12px;background:var(--acs);border-color:transparent"
  >
    <h2 style="font-size:15px;font-weight:600">Vista previa</h2>
    <div
      style="background:var(--sf);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:10px;font-size:14px"
    >
      <div class="row" style="justify-content:space-between">
        <span>2 × Tampico Roll</span>
        <span>$240</span>
      </div>
      <div class="row" style="justify-content:space-between;color:var(--act);font-weight:500">
        <span>{{ nombrePromo || 'Martes de 2x1' }}</span>
        <span>-$120</span>
      </div>
      <div style="height:1px;background:var(--bd)"></div>
      <div class="row" style="justify-content:space-between;font-weight:600">
        <span>Subtotal</span>
        <span>$120</span>
      </div>
    </div>
  </aside>
</template>
