<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  currentStep: {
    type: Number,
    default: 1
  },
  steps: {
    type: Array,
    default: null
  }
})

const PASOS_VENTA = [
  { number: 1, label: 'Tipo', to: '/cajero/nueva-venta' },
  { number: 2, label: 'Productos', to: '/cajero/nueva-venta/productos' },
  { number: 3, label: 'Datos', to: '/cajero/nueva-venta/datos' },
  { number: 4, label: 'Pago', to: '/cajero/nueva-venta/pago' }
]

const listaPasos = computed(() => props.steps || PASOS_VENTA)

const router = useRouter()

function irAPaso(step) {
  if (step.to) {
    router.push(step.to)
  }
}
</script>

<template>
  <div class="stp">
    <template v-for="(step, idx) in listaPasos" :key="`${step.number}-${step.label}`">
      <span
        :class="[
          'dot',
          {
            on: step.number === currentStep,
            done: step.number < currentStep
          }
        ]"
        style="cursor:pointer"
        @click="irAPaso(step)"
      >{{ step.number }}</span>
      <span
        :class="['stl', { on: step.number === currentStep }]"
        style="cursor:pointer"
        @click="irAPaso(step)"
      >{{ step.label }}</span>
      <span v-if="idx < listaPasos.length - 1" class="bar"></span>
    </template>
  </div>
</template>
