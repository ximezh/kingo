import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { ROLES_PRUEBA, loginWithRole, loginWithCredentials } from '@/services/auth.service'

const STORAGE_ROLE_KEY = 'kingo_auth_role'
const STORAGE_USER_KEY = 'kingo_auth_user_profile'
const STORAGE_DARK_KEY = 'kingo_dark_mode'

export const useAuthStore = defineStore('auth', () => {
  function loadInitialUser() {
    try {
      const savedProfile = localStorage.getItem(STORAGE_USER_KEY)
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile)
        if (parsed && parsed.role) return parsed
      }
    } catch {
      // ignore
    }
    const savedRole = localStorage.getItem(STORAGE_ROLE_KEY)
    return savedRole && ROLES_PRUEBA[savedRole] ? { ...ROLES_PRUEBA[savedRole] } : null
  }

  const user = ref(loadInitialUser())
  const darkMode = ref(localStorage.getItem(STORAGE_DARK_KEY) === 'true')

  const isAuthenticated = computed(() => Boolean(user.value?.role))
  const role = computed(() => user.value?.role || null)
  const roleInitials = computed(() => user.value?.initials || 'CJ')
  const roleLabel = computed(() => user.value?.label || 'Cajero')
  const userName = computed(() => user.value?.name || user.value?.label || 'Usuario')
  const homePath = computed(() => user.value?.homePath || '/login')

  function applyBodyTheme(isDark) {
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('dark-body', isDark)
      document.body.style.background = isDark ? '#0D0D0D' : '#F3F0EC'
    }
  }

  applyBodyTheme(darkMode.value)

  function persistProfile(profile) {
    user.value = profile
    localStorage.setItem(STORAGE_ROLE_KEY, profile.role)
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(profile))
  }

  async function login(roleKey, credentials = {}) {
    const profile = await loginWithRole(roleKey, credentials)
    persistProfile(profile)
    return profile
  }

  async function loginDirectCredentials(username, password) {
    const profile = await loginWithCredentials(username, password)
    if (profile) {
      persistProfile(profile)
    }
    return profile
  }

  function setRole(roleKey) {
    if (ROLES_PRUEBA[roleKey]) {
      persistProfile({ ...ROLES_PRUEBA[roleKey] })
    }
  }

  function logout() {
    user.value = null
    localStorage.removeItem(STORAGE_ROLE_KEY)
    localStorage.removeItem(STORAGE_USER_KEY)
  }

  function setDarkMode(value) {
    darkMode.value = Boolean(value)
    localStorage.setItem(STORAGE_DARK_KEY, String(darkMode.value))
    applyBodyTheme(darkMode.value)
  }

  function toggleDarkMode() {
    setDarkMode(!darkMode.value)
  }

  return {
    user,
    darkMode,
    isAuthenticated,
    role,
    roleInitials,
    roleLabel,
    userName,
    homePath,
    login,
    loginDirectCredentials,
    setRole,
    logout,
    setDarkMode,
    toggleDarkMode
  }
})
