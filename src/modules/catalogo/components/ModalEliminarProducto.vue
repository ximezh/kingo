<script setup>
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatusTag from '@/components/ui/StatusTag.vue'

defineProps({
  modelValue: {
    type: Boolean,
    default: true
  },
  nombreProducto: {
    type: String,
    default: 'Acapulco Roll'
  },
  paqueteIncluido: {
    type: String,
    default: 'Paquete 1'
  }
})

const emit = defineEmits(['update:modelValue', 'cancel', 'deactivate'])
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    aria-label="No se puede eliminar el producto"
    width="480px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div
      style="width:44px;height:44px;border-radius:50%;background:var(--acs);color:var(--act);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:600"
    >
      !
    </div>
    <h2 style="font-size:19px;font-weight:600">No se puede eliminar {{ nombreProducto }}</h2>
    <p style="font-size:13.5px;line-height:1.55;color:var(--tx2)">
      Forma parte de un paquete activo. Puedes desactivarlo para ocultarlo del menú sin afectar el historial.
    </p>
    <div class="row" style="gap:8px">
      <span class="sub">Incluido en:</span>
      <StatusTag style="height:26px;padding:0 12px;border-radius:13px">{{ paqueteIncluido }}</StatusTag>
    </div>
    <div style="display:flex;gap:12px;justify-content:flex-end;padding-top:6px">
      <BaseButton variant="s" to="/admin/productos" @click="emit('cancel')">
        Cancelar
      </BaseButton>
      <BaseButton variant="p" to="/admin/productos" @click="emit('deactivate')">
        Desactivar producto
      </BaseButton>
    </div>
  </BaseModal>
</template>
