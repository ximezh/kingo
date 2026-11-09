<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  ariaLabel: {
    type: String,
    default: 'Diálogo'
  },
  width: {
    type: String,
    default: '480px'
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

function onBackdropClick(e) {
  if (e.target === e.currentTarget) {
    emit('update:modelValue', false)
    emit('close')
  }
}
</script>

<template>
  <div
    v-if="modelValue"
    style="position:fixed;inset:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:999;padding:20px"
    @click="onBackdropClick"
  >
    <div
      role="dialog"
      :aria-label="ariaLabel"
      :style="{
        width: '100%',
        maxWidth: width,
        maxHeight: '90vh',
        overflowY: 'auto',
        background: 'var(--sf)',
        border: '1px solid var(--bd)',
        borderRadius: '18px',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.22)'
      }"
    >
      <slot />
    </div>
  </div>
</template>
