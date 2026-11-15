import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import MainLayout from '@/layouts/MainLayout.vue'
import MobileLayout from '@/layouts/MobileLayout.vue'
import LoginView from '@/modules/auth/views/LoginView.vue'
import PrincipalView from '@/modules/auth/views/PrincipalView.vue'
import ProductosView from '@/modules/catalogo/views/ProductosView.vue'
import ProductoFormView from '@/modules/catalogo/views/ProductoFormView.vue'
import VariantesExtrasView from '@/modules/catalogo/views/VariantesExtrasView.vue'
import EliminarProductoView from '@/modules/catalogo/views/EliminarProductoView.vue'
import PaquetesView from '@/modules/catalogo/views/PaquetesView.vue'
import PromocionesView from '@/modules/promociones/views/PromocionesView.vue'
import PromocionFormView from '@/modules/promociones/views/PromocionFormView.vue'
import VentaTipoView from '@/modules/ventas/views/VentaTipoView.vue'
import VentaDatosView from '@/modules/ventas/views/VentaDatosView.vue'
import VentaProductosView from '@/modules/ventas/views/VentaProductosView.vue'
import VentaPagoView from '@/modules/ventas/views/VentaPagoView.vue'
import HistorialView from '@/modules/ventas/views/HistorialView.vue'
import AsignarRepartidorView from '@/modules/entregas/views/AsignarRepartidorView.vue'
import RepartidorPedidosView from '@/modules/entregas/views/RepartidorPedidosView.vue'
import RepartidorEntregaView from '@/modules/entregas/views/RepartidorEntregaView.vue'
import ReporteSeleccionView from '@/modules/reportes/views/ReporteSeleccionView.vue'
import ReporteResultadoView from '@/modules/reportes/views/ReporteResultadoView.vue'
import EmpleadosView from '@/modules/empleados/views/EmpleadosView.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { public: true, title: 'Inicio de sesión' }
  },
  {
    path: '/admin',
    component: MainLayout,
    meta: { roles: ['admin'] },
    redirect: '/admin/inicio',
    children: [
      {
        path: 'inicio',
        name: 'admin-inicio',
        component: PrincipalView,
        meta: { roles: ['admin'], title: 'Pantalla principal' }
      },
      {
        path: 'productos',
        name: 'admin-productos',
        component: ProductosView,
        meta: { roles: ['admin'], title: 'Listado de productos', mainGap: '20px' }
      },
      {
        path: 'productos/nuevo',
        name: 'admin-productos-nuevo',
        component: ProductoFormView,
        meta: { roles: ['admin'], title: 'Formulario de producto', mainGap: '20px' }
      },
      {
        path: 'productos/editar',
        name: 'admin-productos-editar',
        component: ProductoFormView,
        meta: { roles: ['admin'], title: 'Formulario de producto', mainGap: '20px' }
      },
      {
        path: 'productos/variantes-extras',
        name: 'admin-productos-variantes-extras',
        component: VariantesExtrasView,
        meta: { roles: ['admin'], title: 'Variantes y extras', mainGap: '20px' }
      },
      {
        path: 'productos/eliminar',
        name: 'admin-productos-eliminar',
        component: EliminarProductoView,
        meta: {
          roles: ['admin'],
          title: 'Confirmación de eliminación',
          mainGap: '20px',
          hideSidebarFooter: true
        }
      },
      {
        path: 'paquetes',
        name: 'admin-paquetes',
        component: PaquetesView,
        meta: { roles: ['admin'], title: 'Gestión de paquetes', mainGap: '20px' }
      },
      {
        path: 'promociones',
        name: 'admin-promociones',
        component: PromocionesView,
        meta: { roles: ['admin'], title: 'Listado de promociones', mainGap: '20px' }
      },
      {
        path: 'promociones/nueva',
        name: 'admin-promociones-nueva',
        component: PromocionFormView,
        meta: { roles: ['admin'], title: 'Formulario de promoción', mainGap: '20px' }
      },
      {
        path: 'promociones/editar',
        name: 'admin-promociones-editar',
        component: PromocionFormView,
        meta: { roles: ['admin'], title: 'Formulario de promoción', mainGap: '20px' }
      },
      {
        path: 'empleados',
        name: 'admin-empleados',
        component: EmpleadosView,
        meta: { roles: ['admin'], title: 'Gestión de empleados', mainGap: '20px' }
      },
      {
        path: 'historial',
        name: 'admin-historial',
        component: HistorialView,
        meta: { roles: ['admin'], title: 'Historial de ventas', mainGap: '18px' }
      },
      {
        path: 'domicilios',
        name: 'admin-domicilios',
        component: AsignarRepartidorView,
        meta: { roles: ['admin'], title: 'Asignación de repartidor', mainGap: '20px' }
      },
      {
        path: 'reportes',
        name: 'admin-reportes',
        component: ReporteSeleccionView,
        meta: { roles: ['admin'], title: 'Selección de reporte', mainGap: '22px' }
      },
      {
        path: 'reportes/resultado',
        name: 'admin-reportes-resultado',
        component: ReporteResultadoView,
        meta: {
          roles: ['admin'],
          title: 'Resultado del reporte',
          mainGap: '16px',
          mainPadding: '24px 32px'
        }
      }
    ]
  },
  {
    path: '/cajero',
    component: MainLayout,
    meta: { roles: ['cajero'] },
    redirect: '/cajero/inicio',
    children: [
      {
        path: 'inicio',
        name: 'cajero-inicio',
        component: PrincipalView,
        meta: { roles: ['cajero'], title: 'Pantalla principal' }
      },
      {
        path: 'nueva-venta',
        name: 'cajero-nueva-venta',
        component: VentaTipoView,
        meta: { roles: ['cajero'], title: 'Nueva venta: tipo de pedido', mainGap: '22px' }
      },
      {
        path: 'nueva-venta/productos',
        name: 'cajero-nueva-venta-productos',
        component: VentaProductosView,
        meta: { roles: ['cajero'], title: 'Selección de productos', mainGap: '18px' }
      },
      {
        path: 'nueva-venta/datos',
        name: 'cajero-nueva-venta-datos',
        component: VentaDatosView,
        meta: { roles: ['cajero'], title: 'Datos del pedido', mainGap: '20px' }
      },
      {
        path: 'nueva-venta/pago',
        name: 'cajero-nueva-venta-pago',
        component: VentaPagoView,
        meta: { roles: ['cajero'], title: 'Resumen y pago', mainGap: '20px' }
      },
      {
        path: 'domicilios',
        name: 'cajero-domicilios',
        component: AsignarRepartidorView,
        meta: { roles: ['cajero'], title: 'Asignación de repartidor', mainGap: '20px' }
      },
      {
        path: 'catalogo',
        name: 'cajero-catalogo',
        component: ProductosView,
        meta: { roles: ['cajero'], title: 'Listado de productos', mainGap: '20px' }
      },
      {
        path: 'historial',
        name: 'cajero-historial',
        component: HistorialView,
        meta: { roles: ['cajero'], title: 'Historial de ventas', mainGap: '18px' }
      }
    ]
  },
  {
    path: '/repartidor',
    component: MobileLayout,
    meta: { roles: ['repartidor'] },
    redirect: '/repartidor/pedidos',
    children: [
      {
        path: 'pedidos',
        name: 'repartidor-pedidos',
        component: RepartidorPedidosView,
        meta: { roles: ['repartidor'], title: 'Mis pedidos asignados' }
      },
      {
        path: 'entrega/:id?',
        name: 'repartidor-entrega',
        component: RepartidorEntregaView,
        meta: { roles: ['repartidor'], title: 'Confirmación de entrega' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (to.query.modo === 'oscuro') {
    authStore.setDarkMode(true)
  } else if (to.query.modo === 'claro') {
    authStore.setDarkMode(false)
  }

  if (to.query.rol && ['admin', 'cajero', 'repartidor'].includes(to.query.rol)) {
    authStore.setRole(to.query.rol)
  }

  if (to.meta.title && typeof document !== 'undefined') {
    document.title = to.meta.title
  }

  const allowedRoles = to.meta.roles
  if (allowedRoles && allowedRoles.length > 0) {
    if (!authStore.isAuthenticated) {
      return { name: 'login' }
    }
    if (!allowedRoles.includes(authStore.role)) {
      return authStore.homePath
    }
  }

  return true
})

export default router
