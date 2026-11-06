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
    style="position:absolute;left:0;top:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:50"
    @click="onBackdropClick"
  >
    <div
      role="dialog"
      :aria-label="ariaLabel"
      :style="{
        width: width,
        background: 'var(--sf)',
        border: '1px solid var(--bd)',
        borderRadius: '18px',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }"
    >
      <slot />
    </div>
  </div>
</template>
