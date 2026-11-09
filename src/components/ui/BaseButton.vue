<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  variant: {
    type: String,
    default: 'p', // 'p' (primary) | 's' (secondary) | 'd' (danger)
    validator: (v) => ['p', 's', 'd'].includes(v)
  },
  to: {
    type: [String, Object],
    default: null
  },
  href: {
    type: String,
    default: null
  },
  type: {
    type: String,
    default: 'button'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const tagComponent = computed(() => {
  if (props.disabled) return 'button'
  if (props.to) return RouterLink
  if (props.href) return 'a'
  return 'button'
})

const componentProps = computed(() => {
  if (props.disabled) return { type: 'button', disabled: true }
  if (props.to) return { to: props.to }
  if (props.href) return { href: props.href }
  return { type: props.type }
})
</script>

<template>
  <component
    :is="tagComponent"
    v-bind="componentProps"
    :class="['btn', variant, { 'is-disabled': disabled }]"
  >
    <slot />
  </component>
</template>

<style scoped>
.btn.is-disabled,
.btn:disabled {
  opacity: 0.48;
  cursor: not-allowed;
  pointer-events: none;
  transform: none !important;
  box-shadow: none !important;
}
</style>
