<script setup>
defineProps({
  id: {
    type: String,
    required: true
  },
  label: {
    type: String,
    default: ''
  },
  modelValue: {
    type: [String, Number],
    default: ''
  },
  type: {
    type: String,
    default: 'text'
  },
  placeholder: {
    type: String,
    default: ''
  },
  hideLabel: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div>
    <label
      v-if="label"
      :class="hideLabel ? '' : 'lbl'"
      :style="hideLabel ? 'position:absolute;left:-9999px' : undefined"
      :for="id"
    >
      {{ label }}
    </label>
    <input
      :id="id"
      class="inp"
      :type="type"
      :placeholder="placeholder"
      :value="modelValue"
      @input="emit('update:modelValue', $event.target.value)"
    >
  </div>
</template>
