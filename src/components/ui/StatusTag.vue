<script setup>
defineProps({
  variant: {
    type: String,
    default: '', // '' | 'ok' | 'off'
    validator: (v) => ['', 'ok', 'off'].includes(v)
  }
})
</script>

<template>
  <span :class="['tag', variant || undefined]">
    <slot />
  </span>
</template>
