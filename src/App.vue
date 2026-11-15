<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const route = useRoute()

const showThemeButton = computed(() => route.query.sinBotonTema !== '1')
const showSplash = ref(true)
const splashLeaving = ref(false)
let timerLeave = null
let timerHide = null

function iniciarAnimacionEntrada() {
  clearTimeout(timerLeave)
  clearTimeout(timerHide)
  splashLeaving.value = false
  showSplash.value = true

  // Duración equilibrada (2.65s de coreografía + 0.55s de salida suave)
  timerLeave = setTimeout(() => {
    splashLeaving.value = true
    timerHide = setTimeout(() => {
      showSplash.value = false
    }, 550)
  }, 2650)
}

watch(
  () => route.path,
  (newPath, oldPath) => {
    const entraAlLogin = newPath === '/login' && oldPath && oldPath !== '/login'
    const entraAlRepartidor =
      newPath.startsWith('/repartidor') && (!oldPath || !oldPath.startsWith('/repartidor'))
    if (entraAlLogin || entraAlRepartidor) {
      iniciarAnimacionEntrada()
    }
  }
)

onMounted(() => {
  iniciarAnimacionEntrada()
  window.addEventListener('kingo:replay-intro', iniciarAnimacionEntrada)
})

onUnmounted(() => {
  clearTimeout(timerLeave)
  clearTimeout(timerHide)
  window.removeEventListener('kingo:replay-intro', iniciarAnimacionEntrada)
})
</script>

<template>
  <!-- Animación de entrada KinGo donde la "o" es un rollo de sushi animado -->
  <div
    v-if="showSplash"
    :class="['kg-intro-overlay', { 'is-leaving': splashLeaving }]"
    aria-hidden="true"
  >
    <!-- Círculos y ondas decorativas de fondo -->
    <div class="kg-intro-bg-shapes">
      <span class="kg-bg-orb orb-1"></span>
      <span class="kg-bg-orb orb-2"></span>
      <span class="kg-bg-ring ring-1"></span>
      <span class="kg-bg-ring ring-2"></span>
    </div>

    <div class="kg-intro-stage">
      <!-- Palillos japoneses que acompañan al rollo "o" -->
      <div class="kg-chopsticks-wrap">
        <svg class="kg-chopsticks-svg" width="170" height="90" viewBox="0 0 170 90" fill="none">
          <rect x="18" y="22" width="145" height="7" rx="3.5" transform="rotate(-18 18 22)" fill="#1F1A17" />
          <rect x="22" y="42" width="145" height="7" rx="3.5" transform="rotate(-8 22 42)" fill="#FFF3E6" />
        </svg>
      </div>

      <!-- Palabra KinGo donde la "o" es un rollo de sushi -->
      <div class="kg-wordmark" aria-label="KinGo">
        <span class="kg-char c-k">K</span>
        <span class="kg-char c-i">
          i
          <i class="kg-ikura-dot"></i>
        </span>
        <span class="kg-char c-n">n</span>
        <span class="kg-char c-g">G</span>

        <!-- La letra "o" es un rollo de sushi que entra rodando y rebota -->
        <span class="kg-sushi-o-wrap">
          <!-- Destellos juguetones alrededor del rollo al encajar -->
          <i class="kg-spark sp-1"></i>
          <i class="kg-spark sp-2"></i>
          <i class="kg-spark sp-3"></i>

          <svg class="kg-sushi-o-svg" viewBox="-100 -100 200 200" fill="none">
            <!-- Alga nori exterior -->
            <circle r="86" fill="#1F1A17" />

            <!-- Arroz de sushi blanco esponjoso -->
            <circle r="68" fill="#FFFFFF" stroke="#FFE4CC" stroke-width="4" />

            <!-- Granitos sutiles de ajonjolí en el arroz -->
            <circle cx="-44" cy="-32" r="3.5" fill="#F26A1B" fill-opacity="0.5" />
            <circle cx="44" cy="-28" r="3.5" fill="#1F1A17" fill-opacity="0.35" />
            <circle cx="40" cy="36" r="3.5" fill="#F26A1B" fill-opacity="0.5" />
            <circle cx="-42" cy="34" r="3.5" fill="#1F1A17" fill-opacity="0.35" />

            <!-- Relleno central simplificado y limpio (salmón y queso crema) -->
            <circle r="36" fill="#F26A1B" />
            <path d="M0 -26 A26 26 0 0 1 26 0 L0 0 Z" fill="#CF520A" />
            <circle r="13" fill="#FFFFFF" />
          </svg>

          <!-- Sombra dinámica debajo del rollo "o" -->
          <span class="kg-sushi-shadow"></span>
        </span>
      </div>

      <!-- Subtítulo y barra de progreso suave -->
      <div class="kg-intro-sub-wrap">
        <span class="kg-intro-pill">Kin Sushi</span>
        <div class="kg-intro-loader">
          <span class="kg-intro-loader-bar"></span>
        </div>
      </div>
    </div>
  </div>

  <div class="kg-app-stage">
    <RouterView />
  </div>

  <button
    v-if="showThemeButton"
    type="button"
    :title="authStore.darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
    style="position:fixed;right:12px;bottom:12px;z-index:9999;height:30px;padding:0 10px;border-radius:8px;border:1px solid #ECE5DE;background:#1F1A17;color:#FFFFFF;font:500 11px 'Poppins',sans-serif;cursor:pointer;opacity:0.85;display:inline-flex;align-items:center;gap:5px"
    @click="authStore.toggleDarkMode()"
  >
    <svg v-if="authStore.darkMode" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5"></circle>
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
    </svg>
    <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
    <span>{{ authStore.darkMode ? 'Claro' : 'Oscuro' }}</span>
  </button>
</template>

<style scoped>
.kg-intro-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: linear-gradient(155deg, #CF520A 0%, #F26A1B 65%, #FA7B2B 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-family: 'Poppins', sans-serif !important;
  transition: opacity 0.55s cubic-bezier(0.4, 0, 0.2, 1), transform 0.55s cubic-bezier(0.4, 0, 0.2, 1);
}

.kg-intro-overlay.is-leaving {
  opacity: 0;
  transform: scale(1.06);
  pointer-events: none;
}

.kg-intro-bg-shapes {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.kg-bg-orb {
  position: absolute;
  border-radius: 50%;
}

.kg-bg-orb.orb-1 {
  width: 440px;
  height: 440px;
  top: -140px;
  right: -100px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 70%);
}

.kg-bg-orb.orb-2 {
  width: 400px;
  height: 400px;
  bottom: -130px;
  left: -90px;
  background: radial-gradient(circle, rgba(31, 26, 23, 0.16) 0%, rgba(31, 26, 23, 0) 70%);
}

.kg-bg-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px dashed rgba(255, 255, 255, 0.26);
  animation: slowSpinRing 16s linear infinite;
}

.kg-bg-ring.ring-1 {
  width: 360px;
  height: 360px;
}

.kg-bg-ring.ring-2 {
  width: 520px;
  height: 520px;
  border-style: solid;
  border-color: rgba(255, 255, 255, 0.14);
}

.kg-intro-stage {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 22px;
  padding: 68px 24px 24px;
  font-family: 'Poppins', sans-serif !important;
}

.kg-chopsticks-wrap {
  position: absolute;
  top: 20px;
  right: -52px;
  pointer-events: none;
  animation: chopsticksSwoop 2.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

/* Contenedor de la palabra KinGo */
.kg-wordmark {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 3px;
  user-select: none;
  font-family: 'Poppins', sans-serif !important;
}

.kg-char {
  display: inline-block;
  font-family: 'Poppins', sans-serif !important;
  font-size: 112px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -3px;
  color: #FFFFFF;
  text-shadow: 0 14px 28px rgba(120, 38, 0, 0.28);
  animation: charPopBounce 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.kg-char.c-k {
  animation-delay: 0.12s;
}

.kg-char.c-i {
  position: relative;
  animation-delay: 0.24s;
}

/* Punto juguetón sobre la "i" */
.kg-ikura-dot {
  position: absolute;
  top: 7px;
  left: 50%;
  transform: translateX(-50%);
  width: 19px;
  height: 19px;
  border-radius: 50%;
  background: #1F1A17;
  box-shadow: 0 0 0 3.5px #FFFFFF;
  animation: ikuraHop 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) 0.9s both;
}

.kg-char.c-n {
  animation-delay: 0.36s;
}

.kg-char.c-g {
  color: #FFF3E6;
  animation: charPopBounce 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.48s both,
             gBumpReaction 0.45s ease-out 1.22s;
}

/* La "o" hecha un rollo de sushi */
.kg-sushi-o-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 98px;
  height: 98px;
  margin-left: 5px;
  align-self: center;
  transform: translateY(7px);
}

.kg-sushi-o-svg {
  width: 98px;
  height: 98px;
  filter: drop-shadow(0 12px 22px rgba(31, 26, 23, 0.32));
  animation:
    sushiRollEnter 0.85s cubic-bezier(0.22, 1, 0.36, 1) 0.55s both,
    sushiJellySquish 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) 1.25s;
}

.kg-sushi-shadow {
  position: absolute;
  bottom: -11px;
  width: 72px;
  height: 11px;
  border-radius: 50%;
  background: rgba(31, 26, 23, 0.25);
  filter: blur(3px);
  animation: shadowFadeIn 0.8s ease 0.65s both;
}

/* Destellos juguetones cuando la "o" de sushi llega a su lugar */
.kg-spark {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #FFFFFF;
  opacity: 0;
}

.kg-spark.sp-1 {
  top: -14px;
  right: -6px;
  animation: sparkBurst1 0.7s ease-out 1.26s both;
}

.kg-spark.sp-2 {
  top: -18px;
  left: 8px;
  width: 8px;
  height: 8px;
  background: #1F1A17;
  animation: sparkBurst2 0.7s ease-out 1.3s both;
}

.kg-spark.sp-3 {
  bottom: -8px;
  right: -14px;
  width: 8px;
  height: 8px;
  animation: sparkBurst3 0.7s ease-out 1.32s both;
}

.kg-intro-sub-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  animation: subFadeUp 0.65s ease 1.15s both;
}

.kg-intro-pill {
  padding: 0;
  background: transparent;
  border: none;
  color: #FFFFFF;
  font-family: 'Poppins', sans-serif !important;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-shadow: 0 6px 18px rgba(120, 38, 0, 0.25);
}

.kg-intro-loader {
  width: 170px;
  height: 6px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.26);
  overflow: hidden;
}

.kg-intro-loader-bar {
  display: block;
  height: 100%;
  width: 100%;
  border-radius: 99px;
  background: #FFFFFF;
  transform-origin: left center;
  animation: loaderFill 2.2s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both;
}

.kg-app-stage {
  width: 100%;
  min-height: 100vh;
}

@keyframes charPopBounce {
  0% {
    opacity: 0;
    transform: translateY(42px) scale(0.5);
  }
  70% {
    opacity: 1;
    transform: translateY(-8px) scale(1.06);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes sushiRollEnter {
  0% {
    opacity: 0;
    transform: translateX(180px) rotate(520deg) scale(0.4);
  }
  78% {
    opacity: 1;
    transform: translateX(-8px) rotate(-18deg) scale(1.06);
  }
  100% {
    opacity: 1;
    transform: translateX(0) rotate(0deg) scale(1);
  }
}

@keyframes sushiJellySquish {
  0% {
    transform: scale(1, 1);
  }
  30% {
    transform: scale(1.18, 0.84);
  }
  60% {
    transform: scale(0.92, 1.1);
  }
  80% {
    transform: scale(1.04, 0.97);
  }
  100% {
    transform: scale(1, 1);
  }
}

@keyframes gBumpReaction {
  0% {
    transform: translateX(0);
  }
  35% {
    transform: translateX(-7px) rotate(-4deg);
  }
  75% {
    transform: translateX(2px) rotate(1deg);
  }
  100% {
    transform: translateX(0) rotate(0);
  }
}

@keyframes ikuraHop {
  0%, 100% {
    transform: translateX(-50%) translateY(0) scale(1);
  }
  45% {
    transform: translateX(-50%) translateY(-12px) scale(1.25);
  }
}

@keyframes chopsticksSwoop {
  0% {
    opacity: 0;
    transform: translate(90px, -60px) rotate(18deg);
  }
  45% {
    opacity: 1;
    transform: translate(0, 0) rotate(0deg);
  }
  65% {
    opacity: 1;
    transform: translate(-6px, 8px) rotate(-5deg);
  }
  100% {
    opacity: 0;
    transform: translate(70px, -45px) rotate(12deg);
  }
}

@keyframes sparkBurst1 {
  0% {
    opacity: 0;
    transform: translate(-10px, 10px) scale(0.3);
  }
  50% {
    opacity: 1;
    transform: translate(6px, -10px) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: translate(12px, -16px) scale(0.4);
  }
}

@keyframes sparkBurst2 {
  0% {
    opacity: 0;
    transform: translate(6px, 10px) scale(0.3);
  }
  50% {
    opacity: 1;
    transform: translate(-8px, -12px) scale(1.15);
  }
  100% {
    opacity: 0;
    transform: translate(-14px, -18px) scale(0.4);
  }
}

@keyframes sparkBurst3 {
  0% {
    opacity: 0;
    transform: translate(-8px, -6px) scale(0.3);
  }
  50% {
    opacity: 1;
    transform: translate(10px, 6px) scale(1.15);
  }
  100% {
    opacity: 0;
    transform: translate(16px, 10px) scale(0.4);
  }
}

@keyframes shadowFadeIn {
  0% {
    opacity: 0;
    transform: scaleX(0.3);
  }
  100% {
    opacity: 1;
    transform: scaleX(1);
  }
}

@keyframes subFadeUp {
  0% {
    opacity: 0;
    transform: translateY(12px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes loaderFill {
  0% {
    transform: scaleX(0);
  }
  100% {
    transform: scaleX(1);
  }
}

@keyframes slowSpinRing {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@media (max-width: 600px) {
  .kg-intro-stage {
    padding: 48px 18px 20px;
    gap: 18px;
  }
  .kg-bg-ring.ring-1 {
    width: 260px;
    height: 260px;
  }
  .kg-bg-ring.ring-2 {
    width: 350px;
    height: 350px;
  }
  .kg-chopsticks-wrap {
    top: 8px;
    right: -18px;
  }
  .kg-chopsticks-svg {
    width: 126px;
    height: 68px;
  }
  .kg-char {
    font-size: 72px;
    letter-spacing: -2px;
  }
  .kg-sushi-o-wrap,
  .kg-sushi-o-svg {
    width: 64px;
    height: 64px;
  }
  .kg-sushi-shadow {
    width: 48px;
    height: 8px;
    bottom: -8px;
  }
  .kg-ikura-dot {
    width: 13px;
    height: 13px;
    top: 5px;
    box-shadow: 0 0 0 2.5px #FFFFFF;
  }
}
</style>
