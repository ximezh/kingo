<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import RoleSelectorModal from '@/modules/auth/components/RoleSelectorModal.vue'

const router = useRouter()
const authStore = useAuthStore()

const usuario = ref('')
const password = ref('')
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
}

async function onSubmitLogin(e) {
  e.preventDefault()
  errorCredenciales.value = ''

  if (usuario.value.trim()) {
    const profile = await authStore.loginDirectCredentials(usuario.value, password.value)
    if (profile) {
      router.push(profile.homePath)
      return
    }
    errorCredenciales.value = 'Usuario o contraseña incorrectos, o cuenta dada de baja.'
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
        style="position:absolute;right:-190px;bottom:-190px"
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
      <h1 style="position:relative;font-size:34px;line-height:1.2;font-weight:600;max-width:340px">
        Cada pedido, en su lugar.
      </h1>
      <p style="position:relative;font-size:13px;opacity:0.9;max-width:320px;line-height:1.5">
        Toca el rollo de sushi para girarlo o inicia sesión con tu cuenta de empleado.
      </p>
    </div>

    <div class="login-form-panel">
      <form
        class="login-form"
        style="width:100%;max-width:380px;display:flex;flex-direction:column;gap:22px"
        @submit="onSubmitLogin"
      >
        <div style="display:flex;flex-direction:column;gap:4px">
          <h2 style="font-size:26px;font-weight:600">Iniciar sesión</h2>
          <p class="sub">Ingresa tus credenciales o pulsa Entrar para elegir un perfil.</p>
        </div>
        <BaseInput
          id="usr"
          v-model="usuario"
          label="Usuario"
          type="text"
          placeholder="Ej. sofia.caja, carlos.rep o admin"
        />
        <BaseInput
          id="pwd"
          v-model="password"
          label="Contraseña"
          type="password"
          placeholder="Contraseña (por defecto: 123)"
        />
        <div
          v-if="errorCredenciales"
          style="padding:10px 14px;border-radius:10px;background:var(--acs);color:var(--act);font-size:13px;font-weight:500"
        >
          {{ errorCredenciales }}
        </div>
        <BaseButton
          variant="p"
          href="02-Principal.html"
          class="login-submit-btn"
          style="width:100%"
          @click.prevent="onSubmitLogin"
        >
          Entrar
        </BaseButton>
        <button
          type="button"
          class="btn s"
          style="width:100%;font-size:13px"
          @click="showRoleModal = true"
        >
          Acceso rápido por empleado / rol
        </button>
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
  background: #F26A1B;
  padding: 48px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 32px;
  color: #fff;
}

.login-form-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
}

@media (max-width: 900px) {
  .login-view {
    flex-direction: column;
  }
  .login-hero {
    width: 100%;
    min-height: 240px;
    padding: 32px 24px;
    gap: 16px;
  }
}

/* Animación e interactividad del rollo de sushi */
.sushi-roll {
  cursor: pointer;
  transform-origin: center center;
}

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
  transition: border-color 0.22s ease, box-shadow 0.22s ease, transform 0.2s ease;
}

.login-form :deep(.inp:hover) {
  border-color: var(--ac);
}

.login-form :deep(.inp:focus) {
  outline: none;
  border-color: var(--ac);
  box-shadow: 0 0 0 3px var(--acs);
  transform: translateY(-1px);
}

.login-submit-btn {
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.22s ease, background-color 0.2s ease;
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
