// Cliente base simulado para futuras llamadas al backend de KinGo
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export async function apiRequest(endpoint, options = {}) {
  // Por ahora las llamadas se resuelven mediante los servicios mock locales
  return {
    endpoint: `${API_BASE_URL}${endpoint}`,
    ...options
  }
}

export default {
  get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
  post: (endpoint, body) => apiRequest(endpoint, { method: 'POST', body }),
  put: (endpoint, body) => apiRequest(endpoint, { method: 'PUT', body }),
  patch: (endpoint, body) => apiRequest(endpoint, { method: 'PATCH', body }),
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' })
}
