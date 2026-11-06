<script setup>
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import StepIndicator from '@/components/ui/StepIndicator.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const router = useRouter()
const cartStore = useCartStore()

function elegirTipo(tipo) {
  cartStore.setTipoPedido(tipo)
}

function irAPasoDatos(tipo = null) {
  if (tipo) cartStore.setTipoPedido(tipo)
  cartStore.setPaso(2)
  router.push('/cajero/nueva-venta/productos')
}
</script>

<template>
  <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
    <div style="display:flex;flex-direction:column;gap:4px">
      <h1 style="font-size:22px;font-weight:600">Nueva venta</h1>
      <p class="sub">¿Cómo es el pedido?</p>
    </div>
    <StepIndicator :current-step="1" />
  </div>

  <div class="tipo-grid">
    <!-- En local -->
    <div
      :class="['tipo-card', { on: cartStore.tipoPedido === 'local' }]"
      @click="elegirTipo('local')"
      @dblclick="irAPasoDatos('local')"
    >
      <svg class="tipo-bg-art" width="180" height="180" viewBox="0 0 160 160" fill="none" aria-hidden="true">
        <circle cx="130" cy="30" r="70" stroke="currentColor" stroke-width="14" />
      </svg>

      <div class="row" style="justify-content:space-between;position:relative;z-index:1">
        <div class="ico-lg">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 9h16M6 9v10M18 9v10M5 5h14"></path>
          </svg>
        </div>
        <span class="sel-dot">
          <svg v-if="cartStore.tipoPedido === 'local'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6L9 17l-5-5"></path>
          </svg>
        </span>
      </div>

      <div class="tipo-title-block">
        <h2>En local</h2>
        <p class="sub">Servicio en mesa</p>
      </div>

      <span
        class="btn tipo-btn"
        :class="cartStore.tipoPedido === 'local' ? 'p' : 's'"
        @click.stop="irAPasoDatos('local')"
      >
        {{ cartStore.tipoPedido === 'local' ? 'Seleccionado · Continuar' : 'Elegir' }}
      </span>
    </div>

    <!-- Para llevar -->
    <div
      :class="['tipo-card', { on: cartStore.tipoPedido === 'llevar' }]"
      @click="elegirTipo('llevar')"
      @dblclick="irAPasoDatos('llevar')"
    >
      <svg class="tipo-bg-art" width="180" height="180" viewBox="0 0 160 160" fill="none" aria-hidden="true">
        <rect x="85" y="-20" width="90" height="90" rx="24" transform="rotate(18 85 -20)" stroke="currentColor" stroke-width="14" />
      </svg>

      <div class="row" style="justify-content:space-between;position:relative;z-index:1">
        <div class="ico-lg">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 8h14l-1 12H6zM9 8a3 3 0 016 0"></path>
          </svg>
        </div>
        <span class="sel-dot">
          <svg v-if="cartStore.tipoPedido === 'llevar'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6L9 17l-5-5"></path>
          </svg>
        </span>
      </div>

      <div class="tipo-title-block">
        <h2>Para llevar</h2>
        <p class="sub">Recolección en mostrador</p>
      </div>

      <span
        class="btn tipo-btn"
        :class="cartStore.tipoPedido === 'llevar' ? 'p' : 's'"
        @click.stop="irAPasoDatos('llevar')"
      >
        {{ cartStore.tipoPedido === 'llevar' ? 'Seleccionado · Continuar' : 'Elegir' }}
      </span>
    </div>

    <!-- A domicilio -->
    <div
      :class="['tipo-card', { on: cartStore.tipoPedido === 'domicilio' }]"
      @click="elegirTipo('domicilio')"
      @dblclick="irAPasoDatos('domicilio')"
    >
      <svg class="tipo-bg-art" width="180" height="180" viewBox="0 0 160 160" fill="none" aria-hidden="true">
        <circle cx="125" cy="35" r="55" stroke="currentColor" stroke-width="11" stroke-dasharray="12 8" />
      </svg>

      <div class="row" style="justify-content:space-between;position:relative;z-index:1">
        <div class="ico-lg">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"></path>
            <circle cx="7" cy="18" r="1.6"></circle>
            <circle cx="17" cy="18" r="1.6"></circle>
          </svg>
        </div>
        <span class="sel-dot">
          <svg v-if="cartStore.tipoPedido === 'domicilio'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6L9 17l-5-5"></path>
          </svg>
        </span>
      </div>

      <div class="tipo-title-block">
        <h2>A domicilio</h2>
        <p class="sub">Envío con repartidor</p>
      </div>

      <span
        class="btn tipo-btn"
        :class="cartStore.tipoPedido === 'domicilio' ? 'p' : 's'"
        @click.stop="irAPasoDatos('domicilio')"
      >
        {{ cartStore.tipoPedido === 'domicilio' ? 'Seleccionado · Continuar' : 'Elegir' }}
      </span>
    </div>
  </div>

  <div class="note" style="justify-content:space-between;flex-wrap:wrap">
    <div class="row" style="gap:10px">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9"></circle>
        <path d="M12 7v5l3 2"></path>
      </svg>
      <span>Los pedidos a domicilio se reciben de 13:00 a 21:00. Los miércoles no hay servicio.</span>
    </div>
    <BaseButton variant="p" href="#" @click.prevent="irAPasoDatos()">
      Continuar
    </BaseButton>
  </div>
</template>

<style scoped>
.tipo-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px;
  max-height: 320px;
  flex: 1;
}

@media (max-width: 980px) {
  .tipo-grid {
    grid-template-columns: 1fr;
    max-height: none;
  }
}

.tipo-card {
  position: relative;
  overflow: hidden;
  background: var(--sf);
  border: 2px solid var(--bd);
  border-radius: 20px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 18px;
  color: var(--tx);
  cursor: pointer;
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;
}

.tipo-card:hover {
  transform: translateY(-4px);
  border-color: var(--ac);
  box-shadow: 0 12px 26px rgba(242, 106, 27, 0.12);
}

.tipo-card.on {
  border-width: 2.5px;
  border-color: #F26A1B;
  background: linear-gradient(155deg, var(--acs) 0%, var(--sf) 75%);
  box-shadow: 0 16px 34px rgba(242, 106, 27, 0.2);
  transform: translateY(-4px);
}

.tipo-bg-art {
  position: absolute;
  right: -24px;
  top: -24px;
  color: var(--ac);
  opacity: 0.1;
  pointer-events: none;
  transition: transform 0.35s ease, opacity 0.25s ease;
}

.tipo-card:hover .tipo-bg-art,
.tipo-card.on .tipo-bg-art {
  transform: scale(1.15) rotate(8deg);
  opacity: 0.22;
}

.ico-lg {
  width: 68px;
  height: 68px;
  border-radius: 18px;
  background: var(--acs);
  color: var(--act);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.22s ease, color 0.22s ease, box-shadow 0.22s ease;
}

.tipo-card.on .ico-lg,
.tipo-card:hover .ico-lg {
  background: #F26A1B;
  color: #fff;
  transform: scale(1.06);
  box-shadow: 0 8px 18px rgba(242, 106, 27, 0.28);
}

.sel-dot {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px solid var(--bd);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.tipo-card.on .sel-dot {
  border-color: #F26A1B;
  background: #F26A1B;
  color: #fff;
  transform: scale(1.08);
}

.tipo-title-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  z-index: 1;
}

.tipo-title-block h2 {
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.3px;
}

.tipo-title-block .sub {
  font-size: 15px;
  font-weight: 500;
}

.tipo-card.on .tipo-title-block h2 {
  color: var(--act);
}

.tipo-btn {
  height: 48px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 12px;
  margin-top: auto;
}
</style>
