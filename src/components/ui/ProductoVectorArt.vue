<script setup>
import { computed } from 'vue'

const props = defineProps({
  nombre: {
    type: String,
    default: ''
  },
  categoria: {
    type: String,
    default: ''
  },
  subtitulo: {
    type: String,
    default: ''
  },
  tipo: {
    type: String,
    default: '' // 'promo_2x1' | 'paquete_sushi' | 'paquete' | 'platillo' | 'postre_promo' | 'descuento_promo'
  },
  compact: {
    type: Boolean,
    default: false
  }
})

const variante = computed(() => {
  const nom = (props.nombre || '').toLowerCase()
  const cat = (props.categoria || '').toLowerCase()
  const sub = (props.subtitulo || '').toLowerCase()
  const texto = `${nom} ${sub}`

  if (props.tipo === 'promo_2x1' || texto.includes('2x1')) return '2x1'
  if (
    props.tipo === 'paquete_sushi' ||
    nom.includes('paquete sushi') ||
    texto.includes('5x4') ||
    texto.includes('paga 4')
  ) {
    return '5x4'
  }
  if (
    props.tipo === 'postre_promo' ||
    texto.includes('postre') ||
    texto.includes('pastel') ||
    texto.includes('helado') ||
    texto.includes('dulce')
  ) {
    return 'postre_promo'
  }
  if (
    props.tipo === 'descuento_promo' ||
    texto.includes('descuento') ||
    texto.includes('%') ||
    texto.includes('porcentaje')
  ) {
    return 'descuento_promo'
  }
  if (props.tipo === 'paquete' || cat.includes('paquete') || nom.startsWith('paquete')) return 'paquete'
  if (cat.includes('promo') || nom.includes('promo') || nom.includes('especial')) return 'promo'
  return 'platillo'
})

const insigniaDescuento = computed(() => {
  const texto = `${props.nombre || ''} ${props.subtitulo || ''}`
  const matchPct = texto.match(/(\d+\s*%)/)
  if (matchPct && matchPct[1]) {
    return `-${matchPct[1].replace(/\s+/g, '')}`
  }
  return '% DESC'
})

const insigniaPaquete = computed(() => {
  const nom = (props.nombre || '').trim()
  const match = nom.match(/^paquete\s+([a-z0-9]+)/i)
  if (match && match[1]) {
    const suf = match[1].toUpperCase()
    if (suf.length <= 3) return `PAQ ${suf}`
  }
  return 'PAQUETE'
})
</script>

<template>
  <div :class="['kg-vec-art', `is-${variante}`, { 'is-compact': compact }]" aria-hidden="true">
    <!-- Fondo vectorial común de ondas y círculos concéntricos naranjas/blancos -->
    <svg class="kg-vec-bg" viewBox="0 0 240 140" fill="none" preserveAspectRatio="xMidYMid slice">
      <circle cx="210" cy="20" r="88" stroke="#FFFFFF" stroke-opacity="0.16" stroke-width="2" />
      <circle cx="210" cy="20" r="62" stroke="#FFFFFF" stroke-opacity="0.22" stroke-width="2" />
      <circle cx="210" cy="20" r="38" fill="#FFFFFF" fill-opacity="0.1" />
      <circle cx="24" cy="125" r="64" stroke="#FFFFFF" stroke-opacity="0.15" stroke-width="2" />
      <circle cx="24" cy="125" r="36" fill="#FFFFFF" fill-opacity="0.08" />
      <path d="M-10 112 C45 88, 95 132, 155 104 C195 86, 225 98, 255 82" stroke="#FFFFFF" stroke-opacity="0.18" stroke-width="2.5" stroke-linecap="round" />
    </svg>

    <!-- Variante 1: Promoción 2x1 -->
    <div v-if="variante === '2x1'" class="kg-vec-content">
      <div class="kg-vec-pill">PROMO 2×1</div>
      <div class="kg-vec-emblem-row">
        <span class="kg-vec-big-num">2×1</span>
        <svg width="34" height="34" viewBox="-40 -40 80 80" fill="none">
          <circle r="34" fill="#FFFFFF" />
          <circle r="26" stroke="#F26A1B" stroke-width="3" stroke-dasharray="10 6" />
          <circle r="11" fill="#F26A1B" />
        </svg>
      </div>
    </div>

    <!-- Variante 2: Paquete Sushi 5x4 / Paga 4, lleva 5 -->
    <div v-else-if="variante === '5x4'" class="kg-vec-content">
      <div class="kg-vec-pill">5 BARRAS</div>
      <div class="kg-vec-emblem-row">
        <span class="kg-vec-big-num">5×4</span>
        <svg width="42" height="32" viewBox="0 0 68 48" fill="none">
          <circle cx="16" cy="28" r="13" fill="#FFFFFF" />
          <circle cx="16" cy="28" r="5" fill="#F26A1B" />
          <circle cx="36" cy="18" r="13" fill="#FFFFFF" stroke="#CF520A" stroke-width="2" />
          <circle cx="36" cy="18" r="5" fill="#F26A1B" />
          <circle cx="52" cy="30" r="13" fill="#FFFFFF" stroke="#CF520A" stroke-width="2" />
          <circle cx="52" cy="30" r="5" fill="#F26A1B" />
        </svg>
      </div>
    </div>

    <!-- Variante 3: Postre gratis (Ilustración vectorial de pastelito con cereza) -->
    <div v-else-if="variante === 'postre_promo'" class="kg-vec-content">
      <div class="kg-vec-pill">POSTRE GRATIS</div>
      <div class="kg-vec-emblem-row">
        <span class="kg-vec-paq-code">GRATIS</span>
        <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
          <!-- Capacillo del pastelito -->
          <path d="M12 27L15 41H33L36 27H12Z" fill="#FFFFFF" />
          <line x1="18" y1="29" x2="19.5" y2="39" stroke="#F26A1B" stroke-width="2" stroke-linecap="round" />
          <line x1="24" y1="29" x2="24" y2="39" stroke="#F26A1B" stroke-width="2" stroke-linecap="round" />
          <line x1="30" y1="29" x2="28.5" y2="39" stroke="#F26A1B" stroke-width="2" stroke-linecap="round" />
          <!-- Betún esponjoso del pastelito -->
          <path d="M10 26C10 22.5 13 20 16.5 20C17.5 16.5 20.5 14 24 14C27.5 14 30.5 16.5 31.5 20C35 20 38 22.5 38 26C38 27.8 36.5 29 34.5 29H13.5C11.5 29 10 27.8 10 26Z" fill="#FFF3E6" stroke="#FFFFFF" stroke-width="1.5" />
          <!-- Cereza / fresa arriba del pastelito -->
          <circle cx="24" cy="11" r="4.5" fill="#FFFFFF" />
          <circle cx="24" cy="11" r="2.3" fill="#F26A1B" />
          <path d="M24 7C25.5 4 28 3 30 3.5" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" />
          <!-- Chispitas naranjas sobre el betún -->
          <circle cx="19" cy="23" r="1.4" fill="#F26A1B" />
          <circle cx="29" cy="23" r="1.4" fill="#F26A1B" />
          <circle cx="24" cy="20" r="1.4" fill="#F26A1B" />
        </svg>
      </div>
    </div>

    <!-- Variante 4: Promoción de Descuento (Etiqueta de descuento vectorial) -->
    <div v-else-if="variante === 'descuento_promo'" class="kg-vec-content">
      <div class="kg-vec-pill">DESCUENTO</div>
      <div class="kg-vec-emblem-row">
        <span class="kg-vec-big-num">{{ insigniaDescuento }}</span>
        <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
          <!-- Etiqueta de descuento inclinada -->
          <path d="M7 22V9C7 7.9 7.9 7 9 7H22L40 25C41.2 26.2 41.2 28.1 40 29.3L29.3 40C28.1 41.2 26.2 41.2 25 40L7 22Z" fill="#FFFFFF" />
          <!-- Orificio de la etiqueta -->
          <circle cx="14.5" cy="14.5" r="3" fill="#F26A1B" />
          <!-- Símbolo % dentro de la etiqueta -->
          <line x1="21" y1="30" x2="30" y2="21" stroke="#F26A1B" stroke-width="2.6" stroke-linecap="round" />
          <circle cx="21.5" cy="22.5" r="2.2" fill="#F26A1B" />
          <circle cx="29.5" cy="28.5" r="2.2" fill="#F26A1B" />
        </svg>
      </div>
    </div>

    <!-- Variante 5: Paquetes del menú (Paquete A, B, C, D, H, 1, 2 o nuevos) -->
    <div v-else-if="variante === 'paquete'" class="kg-vec-content">
      <div class="kg-vec-pill">COMBO KINGO</div>
      <div class="kg-vec-emblem-row">
        <span class="kg-vec-paq-code">{{ insigniaPaquete }}</span>
        <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
          <rect x="6" y="10" width="36" height="28" rx="7" fill="#FFFFFF" />
          <line x1="24" y1="10" x2="24" y2="38" stroke="#F26A1B" stroke-width="2.5" />
          <line x1="6" y1="24" x2="24" y2="24" stroke="#F26A1B" stroke-width="2.5" />
          <circle cx="33" cy="24" r="6" fill="#F26A1B" />
          <circle cx="33" cy="24" r="2.5" fill="#FFFFFF" />
          <circle cx="15" cy="17" r="3" fill="#F26A1B" />
          <rect x="11" y="28" width="8" height="5" rx="2" fill="#F26A1B" />
        </svg>
      </div>
    </div>

    <!-- Variante 6: Otras promociones especiales (ej. Especial de fin de semana) -->
    <div v-else-if="variante === 'promo'" class="kg-vec-content">
      <div class="kg-vec-pill">PROMO ESPECIAL</div>
      <div class="kg-vec-emblem-row">
        <span class="kg-vec-paq-code">ESPECIAL</span>
        <svg width="38" height="38" viewBox="0 0 48 48" fill="none">
          <path d="M8 22V10C8 8.9 8.9 8 10 8H22L39 25L25 39L8 22Z" fill="#FFFFFF" />
          <circle cx="15" cy="15" r="2.8" fill="#F26A1B" />
          <path d="M25 18L26.8 21.8L31 22.3L27.9 25.2L28.7 29.3L25 27.3L21.3 29.3L22.1 25.2L19 22.3L23.2 21.8L25 18Z" fill="#F26A1B" />
        </svg>
      </div>
    </div>

    <!-- Variante 5: Base vectorial para cualquier platillo nuevo sin foto -->
    <div v-else class="kg-vec-content is-dish">
      <svg width="56" height="56" viewBox="-50 -50 100 100" fill="none">
        <line x1="-42" y1="-28" x2="42" y2="-8" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" />
        <line x1="-42" y1="-14" x2="42" y2="-2" stroke="#FFE3D0" stroke-width="3.5" stroke-linecap="round" />
        <circle cx="0" cy="8" r="28" fill="#FFFFFF" />
        <circle cx="0" cy="8" r="21" stroke="#F26A1B" stroke-width="2.8" stroke-dasharray="9 5" />
        <circle cx="0" cy="8" r="9" fill="#F26A1B" />
      </svg>
      <span class="kg-vec-dish-tag">{{ categoria || 'Kin Sushi' }}</span>
    </div>
  </div>
</template>

<style scoped>
.kg-vec-art {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #CF520A 0%, #F26A1B 65%, #FF8538 100%);
  color: #ffffff;
  user-select: none;
  pointer-events: none;
}

.kg-vec-art.is-paquete {
  background: linear-gradient(135deg, #D9530A 0%, #F47425 60%, #FFA057 100%);
}

.kg-vec-art.is-platillo {
  background: linear-gradient(135deg, #E55E12 0%, #F7823B 100%);
}

.kg-vec-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.kg-vec-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  padding: 10px 14px;
  gap: 3px;
}

.kg-vec-content.is-dish {
  align-items: center;
  gap: 4px;
}

.kg-vec-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.7px;
}

.kg-vec-emblem-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 8px;
}

.kg-vec-big-num {
  font-size: 29px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -1px;
  color: #ffffff;
  text-shadow: 0 3px 10px rgba(120, 40, 0, 0.24);
}

.kg-vec-paq-code {
  font-size: 21px;
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.5px;
  color: #ffffff;
  text-shadow: 0 2px 8px rgba(120, 40, 0, 0.22);
}

.kg-vec-dish-tag {
  font-size: 10.5px;
  font-weight: 600;
  padding: 2px 9px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  letter-spacing: 0.2px;
}

.kg-vec-art.is-compact .kg-vec-content {
  padding: 6px 12px;
  gap: 2px;
}

.kg-vec-art.is-compact .kg-vec-big-num {
  font-size: 24px;
}

.kg-vec-art.is-compact .kg-vec-paq-code {
  font-size: 17px;
}
</style>
