<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import RoleSelectorModal from '@/modules/auth/components/RoleSelectorModal.vue'

const router = useRouter()
const authStore = useAuthStore()

const usuario = ref('')
const password = ref('')
const showPassword = ref(false)
const errorCredenciales = ref('')
const showRoleModal = ref(false)
const isSushiPopping = ref(false)
const isLogoPopping = ref(false)

function triggerSushiPop() {
  isSushiPopping.value = false
  requestAnimationFrame(() => {
    isSushiPopping.value = true
  })
}

function triggerLogoPop() {
  isLogoPopping.value = false
  requestAnimationFrame(() => {
    isLogoPopping.value = true
  })
  window.dispatchEvent(new Event('kingo:replay-intro'))
}

async function onSubmitLogin(e) {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault()
  }
  errorCredenciales.value = ''

  if (usuario.value.trim()) {
    const profile = await authStore.loginDirectCredentials(usuario.value, password.value)
    if (profile) {
      router.push(profile.homePath)
      return
    }
    errorCredenciales.value = 'Usuario o contraseña incorrectos'
    return
  }

  showRoleModal.value = true
}

async function handleSelectRole(roleKey, empleado = null) {
  const profile = await authStore.login(roleKey, {
    username: usuario.value,
    empleado
  })
  router.push(profile.homePath)
}
</script>

<template>
  <div :class="['kg', 'login-view', { dark: authStore.darkMode }]">
    <div class="login-hero">
      <svg
        width="620"
        height="620"
        viewBox="-310 -310 620 620"
        fill="none"
        :class="['sushi-roll', { 'is-popping': isSushiPopping }]"
        aria-hidden="true"
        @click="triggerSushiPop"
        @animationend="isSushiPopping = false"
      >
        <circle class="sushi-ring ring-1" r="300" stroke="#fff" stroke-opacity=".14" stroke-width="1.5" />
        <circle class="sushi-ring ring-2" r="250" stroke="#fff" stroke-opacity=".18" stroke-width="1.5" />
        <circle class="sushi-ring ring-3" r="205" stroke="#fff" stroke-opacity=".24" stroke-width="1.5" />
        <g class="sushi-core">
          <circle r="165" fill="#1F1A17" />
          <circle r="140" fill="#FFFFFF" />
          <circle r="140" stroke="#FFE3D0" stroke-width="3" />
          <g transform="scale(1.9)">
            <path
              d="M4.0 0.0 L4.3 0.4 L4.6 0.8 L4.8 1.3 L5.0 1.9 L5.1 2.5 L5.1 3.1 L5.1 3.7 L4.9 4.4 L4.8 5.1 L4.5 5.7 L4.1 6.4 L3.7 7.0 L3.1 7.6 L2.5 8.2 L1.9 8.7 L1.1 9.2 L0.3 9.6 L-0.6 9.9 L-1.6 10.1 L-2.5 10.2 L-3.6 10.3 L-4.6 10.2 L-5.7 10.0 L-6.8 9.7 L-7.8 9.3 L-8.9 8.8 L-9.9 8.2 L-10.8 7.4 L-11.8 6.6 L-12.6 5.6 L-13.4 4.6 L-14.0 3.4 L-14.6 2.2 L-15.1 0.8 L-15.4 -0.5 L-15.6 -2.0 L-15.7 -3.5 L-15.6 -5.0 L-15.4 -6.5 L-15.1 -8.0 L-14.6 -9.5 L-13.9 -11.0 L-13.1 -12.4 L-12.1 -13.8 L-11.0 -15.1 L-9.7 -16.3 L-8.4 -17.5 L-6.9 -18.4 L-5.2 -19.3 L-3.5 -20.0 L-1.7 -20.6 L0.1 -21.0 L2.1 -21.2 L4.1 -21.3 L6.1 -21.1 L8.1 -20.8 L10.1 -20.3 L12.0 -19.5 L13.9 -18.6 L15.8 -17.5 L17.6 -16.3 L19.2 -14.8 L20.8 -13.2 L22.2 -11.4 L23.4 -9.5 L24.5 -7.4 L25.4 -5.2 L26.1 -2.9 L26.5 -0.6 L26.8 1.9 L26.8 4.3 L26.7 6.8 L26.2 9.3 L25.6 11.8 L24.7 14.3 L23.6 16.6 L22.2 18.9 L20.6 21.1 L18.8 23.1 L16.9 25.0 L14.7 26.7 L12.3 28.2 L9.8 29.5 L7.2 30.6 L4.4 31.5 L1.6 32.1 L-1.4 32.4 L-4.3 32.5 L-7.3 32.3 L-10.3 31.8 L-13.3 31.0 L-16.2 30.0 L-19.0 28.6 L-21.8 27.1 L-24.3 25.2 L-26.8 23.1 L-29.0 20.8 L-31.1 18.2 L-32.9 15.5 L-34.5 12.5 L-35.8 9.5 L-36.8 6.2 L-37.5 2.9 L-38.0 -0.5 L-38.1 -4.0 L-37.9 -7.5 L-37.4 -11.0 L-36.5 -14.5 L-35.4 -17.9 L-33.9 -21.2 L-32.1 -24.3 L-30.0 -27.4 L-27.6 -30.2 L-24.9 -32.9 L-22.0 -35.3 L-18.9 -37.4 L-15.5 -39.3 L-12.0 -40.8 L-8.3 -42.1 L-4.5 -43.0 L-0.6 -43.5 L3.4 -43.7 L7.4 -43.6 L11.4 -43.0 L15.3 -42.1 L19.2 -40.9 L23.0 -39.2 L26.7 -37.3 L30.2 -34.9 L33.4 -32.3 L36.5 -29.3 L39.3 -26.1 L41.7 -22.6 L43.9 -18.8 L45.8 -14.9 L47.2 -10.7 L48.3 -6.4 L49.0 -2.1 L49.4 2.4 L49.3 6.9 L48.7 11.4 L47.8 15.9 L46.5 20.3 L44.7 24.6 L42.6 28.7 L40.1 32.7 L37.2 36.4 L33.9 39.9 L30.4 43.0 L26.5 45.9 L22.4 48.4 L18.0 50.6 L13.4 52.3 L8.7 53.6 L3.8 54.5 L-1.2 55.0 L-6.2 55.0 L-11.2 54.5 L-16.2 53.6 L-21.1 52.2 L-25.9 50.3 L-30.5 48.1 L-34.9 45.4 L-39.1 42.3 L-43.0 38.7 L-46.6 34.9 L-49.9 30.7 L-52.7 26.2 L-55.2 21.4 L-57.2 16.4 L-58.8 11.2 L-59.9 5.9 L-60.5 0.4 L-60.6 -5.1 L-60.2 -10.6 L-59.4 -16.1 L-58.0 -21.6 L-56.1 -26.9 L-53.7 -32.0 L-50.8 -36.9"
              stroke="#F26A1B"
              stroke-opacity=".55"
              stroke-width="2.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </g>
          <circle r="9" fill="#F26A1B" />
        </g>
      </svg>

      <div
        class="row login-brand"
        style="position:relative"
        @click="triggerLogoPop"
      >
        <div
          :class="['login-logo-badge', { 'is-popping': isLogoPopping }]"
          style="width:40px;height:40px;border-radius:12px;background:#fff;color:#C94C08;font-weight:600;font-size:18px;display:flex;align-items:center;justify-content:center"
          @animationend="isLogoPopping = false"
        >
          K
        </div>
        <div style="font-weight:600;font-size:22px">KinGo</div>
      </div>

      <div class="login-hero-copy">
        <h1 class="login-hero-title">
          Cada pedido, en su lugar.
        </h1>
        <span class="login-hero-sub">
          Kin Sushi · Punto de venta y entregas
        </span>
      </div>
    </div>

    <div class="login-form-panel">
      <!-- Círculos decorativos sutiles en la esquina superior derecha -->
      <svg
        class="login-right-art"
        width="360"
        height="360"
        viewBox="-180 -180 360 360"
        fill="none"
        aria-hidden="true"
      >
        <circle r="165" stroke="currentColor" stroke-opacity="0.07" stroke-width="1.5" />
        <circle r="125" stroke="currentColor" stroke-opacity="0.1" stroke-width="1.5" />
        <circle r="85" stroke="currentColor" stroke-opacity="0.13" stroke-width="1.5" />
        <circle r="48" fill="currentColor" fill-opacity="0.04" />
      </svg>

      <form
        class="login-form"
        @submit.prevent="onSubmitLogin"
      >
        <div class="login-header">
          <h2 class="login-title">Iniciar sesión</h2>
          <p class="login-subtitle">
            Ingresa tus credenciales de empleado o elige un perfil activo.
          </p>
        </div>

        <div class="login-fields">
          <div class="login-field-group">
            <label class="lbl" for="usr">Usuario</label>
            <div class="login-input-wrap">
              <svg class="login-input-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <input
                id="usr"
                v-model="usuario"
                class="inp login-inp"
                type="text"
                autocomplete="username"
                placeholder="Ej. cajero, admin o repartidor"
                @keydown.enter.prevent="onSubmitLogin"
              >
            </div>
          </div>

          <div class="login-field-group">
            <label class="lbl" for="pwd">Contraseña</label>
            <div class="login-input-wrap">
              <svg class="login-input-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input
                id="pwd"
                v-model="password"
                class="inp login-inp login-inp--pwd"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="••••••••"
                @keydown.enter.prevent="onSubmitLogin"
              >
              <button
                type="button"
                class="login-pwd-toggle"
                :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                :title="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                @click="showPassword = !showPassword"
              >
                <svg v-if="!showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div
          v-if="errorCredenciales"
          style="padding:12px 16px;border-radius:12px;background:var(--acs);color:var(--act);font-size:13.5px;font-weight:500;border:1px solid var(--ac)"
        >
          {{ errorCredenciales }}
        </div>

        <div class="login-actions">
          <button
            type="submit"
            class="btn p login-submit-btn"
          >
            Entrar al sistema
          </button>

          <div class="login-divider">
            <span>o acceso rápido</span>
          </div>

          <button
            type="button"
            class="btn s login-quick-btn"
            @click="showRoleModal = true"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span>Elegir perfil rápido</span>
          </button>
        </div>
      </form>
    </div>

    <RoleSelectorModal
      v-model="showRoleModal"
      @select-role="handleSelectRole"
    />
  </div>
</template>

<style scoped>
.login-view {
  width: 100%;
  min-height: 100vh;
}

.login-hero {
  width: 460px;
  flex: none;
  background: linear-gradient(155deg, #CF520A 0%, #F26A1B 100%);
  padding: 48px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 32px;
  color: #fff;
}

.sushi-roll {
  position: absolute;
  right: -190px;
  bottom: -190px;
  cursor: pointer;
  transform-origin: center center;
}

.login-hero-copy {
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
  z-index: 1;
}

.login-hero-title {
  font-size: 36px;
  line-height: 1.18;
  font-weight: 600;
  max-width: 360px;
  letter-spacing: -0.4px;
}

.login-hero-sub {
  font-size: 14px;
  opacity: 0.92;
  font-weight: 500;
}

.login-form-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 36px;
  position: relative;
  overflow: hidden;
}

.login-right-art {
  position: absolute;
  top: -110px;
  right: -110px;
  color: var(--ac);
  pointer-events: none;
}

.login-form {
  width: 100%;
  max-width: 470px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: relative;
  z-index: 1;
}

.login-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.login-title {
  font-size: 36px;
  font-weight: 600;
  letter-spacing: -0.6px;
  line-height: 1.15;
  color: var(--tx);
}

.login-subtitle {
  font-size: 15px;
  line-height: 1.5;
  color: var(--tx2);
}

.login-fields {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.login-field-group {
  display: flex;
  flex-direction: column;
}

.login-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.login-input-ico {
  position: absolute;
  left: 15px;
  z-index: 2;
  color: var(--tx2);
  pointer-events: none;
  transition: color 0.2s ease;
}

.login-inp {
  position: relative;
  z-index: 1;
  height: 50px;
  padding: 0 16px 0 44px !important;
  border-radius: 12px;
  font-size: 14.5px;
  background: var(--sf);
  border: 1.5px solid var(--bd);
  box-shadow: 0 2px 6px rgba(31, 26, 23, 0.03);
}

.login-inp--pwd {
  padding-right: 46px !important;
}

.login-pwd-toggle {
  position: absolute;
  right: 10px;
  z-index: 2;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--tx2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color 0.18s ease, background-color 0.18s ease;
}

.login-pwd-toggle:hover {
  color: var(--act);
  background: var(--bg2);
}

.login-input-wrap:focus-within .login-input-ico {
  color: var(--ac);
}

.login-actions {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 2px;
}

.login-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--tx2);
  font-size: 12.5px;
  font-weight: 500;
}

.login-divider::before,
.login-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--bd);
}

.login-quick-btn {
  width: 100%;
  height: 48px;
  font-size: 14px;
  border-radius: 12px;
  background: var(--sf);
  border: 1.5px solid var(--bd);
  box-shadow: 0 2px 6px rgba(31, 26, 23, 0.03);
}

.login-submit-btn {
  width: 100%;
  height: 50px;
  font-size: 15px;
  border-radius: 12px;
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.22s ease, background-color 0.2s ease;
}

@media (max-width: 900px) {
  .login-view {
    flex-direction: column;
  }
  .login-hero {
    width: 100%;
    min-height: 210px;
    padding: 28px 24px;
    gap: 16px;
  }
  .sushi-roll {
    width: 420px;
    height: 420px;
    right: -135px;
    bottom: -145px;
  }
}

/* Versión móvil simplificada y compacta para celular (ideal para Repartidor) */
@media (max-width: 600px) {
  .login-hero {
    min-height: auto;
    padding: 20px 20px 22px;
    gap: 10px;
    border-bottom-left-radius: 24px;
    border-bottom-right-radius: 24px;
    box-shadow: 0 8px 24px rgba(201, 76, 8, 0.18);
  }
  .sushi-roll {
    width: 240px;
    height: 240px;
    right: -75px;
    bottom: -85px;
  }
  .login-hero-title {
    font-size: 22px;
    max-width: 240px;
  }
  .login-hero-sub {
    font-size: 12.5px;
  }
  .login-form-panel {
    padding: 26px 20px 32px;
    align-items: flex-start;
  }
  .login-form {
    gap: 18px;
  }
  .login-title {
    font-size: 26px;
  }
  .login-subtitle {
    font-size: 13.5px;
  }
  .login-fields {
    gap: 14px;
  }
  .login-inp {
    height: 48px;
    font-size: 14px;
  }
}

/* Animación e interactividad del rollo de sushi */
.sushi-core {
  transform-origin: 0px 0px;
  transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.sushi-ring {
  transform-origin: 0px 0px;
  transition: transform 0.5s ease, stroke-opacity 0.4s ease;
}

.sushi-roll:hover .sushi-core {
  transform: rotate(22deg) scale(1.06);
}

.sushi-roll:hover .ring-1 {
  transform: scale(1.03);
  stroke-opacity: 0.26;
}

.sushi-roll:hover .ring-2 {
  transform: scale(1.045);
  stroke-opacity: 0.32;
}

.sushi-roll:hover .ring-3 {
  transform: scale(1.06);
  stroke-opacity: 0.4;
}

.sushi-roll:active .sushi-core {
  transform: rotate(12deg) scale(0.95);
}

.sushi-roll.is-popping .sushi-core {
  animation: sushiPopSpin 0.75s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.sushi-roll.is-popping .ring-1,
.sushi-roll.is-popping .ring-2,
.sushi-roll.is-popping .ring-3 {
  animation: ringPulse 0.75s ease-out;
}

@keyframes sushiPopSpin {
  0% {
    transform: rotate(0deg) scale(1);
  }
  30% {
    transform: rotate(140deg) scale(1.16);
  }
  65% {
    transform: rotate(375deg) scale(0.95);
  }
  85% {
    transform: rotate(356deg) scale(1.04);
  }
  100% {
    transform: rotate(360deg) scale(1);
  }
}

@keyframes ringPulse {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.08);
    stroke-opacity: 0.48;
  }
  100% {
    transform: scale(1);
  }
}

/* Interactividad en el badge del logo K */
.login-brand {
  cursor: pointer;
  width: fit-content;
  z-index: 1;
}

.login-logo-badge {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
}

.login-brand:hover .login-logo-badge {
  transform: scale(1.1) rotate(-6deg);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.16);
}

.login-logo-badge.is-popping {
  animation: logoPop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes logoPop {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.24) rotate(-10deg);
  }
  75% {
    transform: scale(0.92) rotate(4deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
  }
}

/* Animaciones en inputs y botón Entrar del formulario */
.login-form :deep(.inp) {
  transition: border-color 0.22s ease, box-shadow 0.22s ease;
}

.login-form :deep(.inp:hover) {
  border-color: var(--ac);
}

.login-form :deep(.inp:focus) {
  outline: none;
  border-color: var(--ac);
  box-shadow: 0 0 0 3px var(--acs);
}

.login-submit-btn:hover {
  transform: translateY(-2px) scale(1.015);
  box-shadow: 0 8px 20px rgba(201, 76, 8, 0.32);
  background: #d8560e;
}

.login-submit-btn:active {
  transform: translateY(1px) scale(0.97);
  box-shadow: 0 2px 8px rgba(201, 76, 8, 0.22);
}
</style>
