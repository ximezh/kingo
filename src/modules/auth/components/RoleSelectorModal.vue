<script setup>
import { computed } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatusTag from '@/components/ui/StatusTag.vue'
import { empleadosState } from '@/services/empleados.service'

defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'select-role'])

const empleadosActivos = computed(() => empleadosState.value.filter((e) => e.activo))

function chooseEmpleado(emp) {
  emit('select-role', emp.rol, emp)
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    aria-label="Seleccionar perfil de acceso"
    width="480px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <h2 style="font-size:19px;font-weight:600">Elegir perfil</h2>

    <div class="role-list-scroll">
      <button
        v-for="emp in empleadosActivos"
        :key="emp.id"
        type="button"
        class="role-option-btn"
        @click="chooseEmpleado(emp)"
      >
        <span
          class="role-avatar"
          style="width:40px;height:40px;border-radius:50%;background:var(--acs);color:var(--act);font-weight:600;font-size:13px;display:flex;align-items:center;justify-content:center;flex:none"
        >
          {{ emp.iniciales }}
        </span>
        <span style="display:flex;flex-direction:column;gap:1px;flex:1;min-width:0">
          <span style="font-size:14px;font-weight:600">{{ emp.nombre }}</span>
          <span class="sub" style="font-size:12px">@{{ emp.usuario }}</span>
        </span>
        <StatusTag :variant="emp.rol === 'admin' ? '' : emp.rol === 'cajero' ? 'ok' : 'off'">
          {{ emp.rolLabel }}
        </StatusTag>
      </button>
    </div>

    <div style="display:flex;justify-content:flex-end;padding-top:4px">
      <BaseButton variant="s" class="cancel-role-btn" @click="emit('update:modelValue', false)">
        Cancelar
      </BaseButton>
    </div>
  </BaseModal>
</template>

<style scoped>
.role-list-scroll {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 360px;
  overflow-y: auto;
  padding: 8px 10px;
  margin: -6px -10px;
}

.role-option-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  border: 1.5px solid var(--bd);
  border-radius: 12px;
  background: var(--sf);
  color: var(--tx);
  cursor: pointer;
  text-align: left;
  font-family: 'Poppins', sans-serif;
  position: relative;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
}

.role-option-btn:hover {
  transform: translateY(-2px) scale(1.01);
  border-color: var(--btn) !important;
  background: var(--acs) !important;
  box-shadow: 0 6px 14px rgba(201, 76, 8, 0.14);
  z-index: 2;
}

.role-option-btn:hover .role-avatar {
  background: var(--sf) !important;
  transform: scale(1.08);
}

.role-option-btn:active {
  transform: scale(0.98);
}

.role-avatar {
  transition: transform 0.2s ease, background-color 0.2s ease;
}
</style>
