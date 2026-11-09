<script setup>
import { useCartStore } from '@/stores/cart'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatusTag from '@/components/ui/StatusTag.vue'

const emit = defineEmits(['editar-extras'])
const cartStore = useCartStore()
</script>

<template>
  <aside class="carrito-aside">
    <div class="row" style="justify-content:space-between;padding-bottom:6px">
      <h2 style="font-size:16px;font-weight:600">Pedido actual</h2>
      <StatusTag style="height:22px;padding:0 8px;border-radius:11px;font-size:11px">
        {{ cartStore.tipoEtiqueta }}
      </StatusTag>
    </div>

    <div v-if="cartStore.items.length > 0" class="carrito-items-list">
      <div
        v-for="item in cartStore.items"
        :key="item.id"
        class="line"
      >
        <div style="display:flex;flex-direction:column;gap:4px;flex:1;min-width:0">
          <span style="font-weight:500">{{ item.nombre }}</span>
          <StatusTag
            v-if="item.etiquetaPromo"
            style="align-self:flex-start;height:22px;padding:0 8px;border-radius:11px;font-size:11px"
          >
            {{ item.etiquetaPromo }}
          </StatusTag>
          <span v-if="item.detalle" class="sub" style="font-size:12px">{{ item.detalle }}</span>
          <div class="row" style="gap:10px">
            <span class="qty">
              <b @click="cartStore.cambiarCantidadItem(item.id, -1)">-</b>
              {{ item.cantidad }}
              <b @click="cartStore.cambiarCantidadItem(item.id, 1)">+</b>
            </span>
            <a
              v-if="!item.promocion"
              href="#"
              class="edit"
              style="font-size:12px"
              @click.prevent="emit('editar-extras', item)"
            >
              Extras
            </a>
          </div>
        </div>
        <span style="font-weight:600">${{ item.subtotal }}</span>
      </div>
    </div>

    <div v-else class="sub" style="padding:24px 12px;text-align:center">
      Sin productos en el pedido.
    </div>

    <div style="display:flex;flex-direction:column;gap:8px;padding:14px 0;font-size:14px">
      <div class="row" style="justify-content:space-between">
        <span class="sub">Subtotal</span>
        <span>${{ cartStore.subtotal }}</span>
      </div>
      <div v-if="cartStore.descuento > 0" class="row" style="justify-content:space-between;color:var(--act);font-weight:500">
        <span>Promoción aplicada</span>
        <span>-${{ cartStore.descuento }}</span>
      </div>
      <div v-if="cartStore.tipoPedido === 'domicilio'" class="row" style="justify-content:space-between">
        <span class="sub">Envío</span>
        <span>${{ cartStore.envio }}</span>
      </div>
    </div>

    <div style="display:flex;flex-direction:column;gap:8px">
      <BaseButton
        variant="p"
        :to="cartStore.items.length > 0 ? '/cajero/nueva-venta/datos' : undefined"
        :disabled="cartStore.items.length === 0"
      >
        Continuar a datos
      </BaseButton>
      <BaseButton variant="s" to="/cajero/nueva-venta">
        Atrás
      </BaseButton>
    </div>
  </aside>
</template>

<style scoped>
.carrito-aside {
  width: 310px;
  flex: none;
  background: var(--sf);
  border: 1px solid var(--bd);
  border-radius: 14px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 20px;
}

@media (max-width: 960px) {
  .carrito-aside {
    width: 100%;
    position: relative;
    top: 0;
  }
}

.carrito-items-list {
  display: flex;
  flex-direction: column;
  max-height: 360px;
  overflow-y: auto;
  padding-right: 4px;
}

.line {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--bd);
  font-size: 14px;
}

.qty {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
}

.qty b {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid var(--bd);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  color: var(--tx2);
  cursor: pointer;
  transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.15s ease, background-color 0.15s ease;
  user-select: none;
}

.qty b:hover {
  border-color: var(--ac);
  background: var(--acs);
  color: var(--act);
}

.qty b:active {
  transform: scale(0.86);
}
</style>
