import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import {
  HISTORIAL_VENTAS_MOCK,
  guardarVentasStorage,
  obtenerFechaISOLocal,
  formatearFechaHoraVenta
} from '@/services/ventas.service'
import { PEDIDOS_POR_ASIGNAR_MOCK, guardarEntregasStorage } from '@/services/entregas.service'
import { sincronizarConNube } from '@/services/cloudSync'
import { useAuthStore } from '@/stores/auth'

export const TIPO_PEDIDO_INFO = {
  local: {
    etiqueta: 'En local',
    tituloDatos: 'Mesa del cliente'
  },
  llevar: {
    etiqueta: 'Para llevar',
    tituloDatos: 'Datos de recolección'
  },
  domicilio: {
    etiqueta: 'A domicilio',
    tituloDatos: 'Datos de entrega'
  }
}

export const useCartStore = defineStore('cart', () => {
  // Paso actual de la venta (1: Tipo, 2: Productos, 3: Datos, 4: Pago)
  const pasoActual = ref(1)

  // Paso 1: Tipo de pedido ('local' | 'llevar' | 'domicilio')
  const tipoPedido = ref('local')

  // Paso 3: Datos del pedido inicializados limpios
  const datosCliente = ref({
    mesa: 'Mesa 1',
    notaCocina: '',
    nombreLlevar: '',
    horaRecoleccion: '14:30',
    nombreRecibe: '',
    telefono: '',
    direccion: '',
    referencia: '',
    costoEnvioTexto: '$35.00',
    costoEnvio: 35
  })

  // Paso 2: Productos en el carrito (inicializado vacío para agregar desde cero)
  const items = ref([])

  // Paso 4: Método de pago ('Efectivo' | 'Transferencia' | 'Tarjeta')
  const metodoPago = ref('Efectivo')
  const ultimaVentaRegistrada = ref(null)

  const tipoEtiqueta = computed(() => TIPO_PEDIDO_INFO[tipoPedido.value]?.etiqueta || 'A domicilio')
  const tituloDatos = computed(() => TIPO_PEDIDO_INFO[tipoPedido.value]?.tituloDatos || 'Datos de entrega')

  const subtotalSinPostreGratis = computed(() =>
    items.value.reduce((acc, item) => {
      if (item.esPostreGratisPromo) return acc
      return acc + item.subtotal - (item.promocion?.descuento || 0)
    }, 0)
  )

  const tienePostreGratisEnCarrito = computed(() =>
    items.value.some((item) => item.esPostreGratisPromo)
  )

  function revalidarPromocionesCondicionadas() {
    if (tienePostreGratisEnCarrito.value && subtotalSinPostreGratis.value < 400) {
      items.value = items.value.filter((i) => !i.esPostreGratisPromo)
    }
  }

  const subtotal = computed(() =>
    items.value.reduce((acc, item) => acc + item.subtotal, 0)
  )

  const descuento = computed(() =>
    items.value.reduce((acc, item) => acc + (item.promocion?.descuento || 0), 0)
  )

  const envio = computed(() => {
    if (tipoPedido.value !== 'domicilio') return 0
    const parsed = Number(String(datosCliente.value.costoEnvioTexto || datosCliente.value.costoEnvio).replace(/[^0-9.]/g, ''))
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 35
  })

  const total = computed(() => Math.max(0, subtotal.value - descuento.value + envio.value))

  function setTipoPedido(tipo) {
    if (['local', 'llevar', 'domicilio'].includes(tipo)) {
      tipoPedido.value = tipo
    }
  }

  function setPaso(paso) {
    pasoActual.value = paso
  }

  function updateDatosCliente(parcial) {
    datosCliente.value = { ...datosCliente.value, ...parcial }
  }

  function cambiarCantidadItem(itemId, delta) {
    const idx = items.value.findIndex((i) => i.id === itemId)
    if (idx === -1) return
    const item = items.value[idx]
    const nueva = item.cantidad + delta
    if (nueva <= 0) {
      items.value.splice(idx, 1)
      revalidarPromocionesCondicionadas()
      return
    }
    const factor = nueva / item.cantidad
    item.cantidad = nueva
    item.subtotal = Math.round(nueva * item.precioUnitario)
    if (item.promocion) {
      if (item.descuentoUnitarioPromo) {
        item.promocion.descuento = nueva * item.descuentoUnitarioPromo
      } else if (item.etiquetaPromo?.includes('2x1')) {
        const pares = Math.floor(nueva / 2)
        item.promocion.descuento = pares * item.precioUnitario
      } else {
        item.promocion.descuento = Math.round(item.promocion.descuento * factor)
      }
    }
    revalidarPromocionesCondicionadas()
  }

  function eliminarItem(itemId) {
    items.value = items.value.filter((i) => i.id !== itemId)
    revalidarPromocionesCondicionadas()
  }

  function vaciarCarrito() {
    items.value = []
  }

  function agregarPromo2x1Configurable(numPromos, rollosElegidos) {
    if (!rollosElegidos || rollosElegidos.length === 0) return
    const ordenados = [...rollosElegidos].sort((a, b) => b.precioNum - a.precioNum)
    let subtotalBruto = 0
    let descuentoTotalPromo = 0

    for (let i = 0; i < ordenados.length; i += 2) {
      const mayor = ordenados[i]
      const menor = ordenados[i + 1]
      subtotalBruto += mayor ? mayor.precioNum : 0
      if (menor) {
        subtotalBruto += menor.precioNum
        descuentoTotalPromo += menor.precioNum
      }
    }

    items.value.push({
      id: Date.now() + Math.random(),
      nombre: numPromos === 1 ? 'Promoción 2x1' : `Promoción 2x1 (${numPromos})`,
      etiquetaPromo: '2x1',
      detalle: rollosElegidos.map((r) => r.nombre).join(', '),
      extrasSeleccionados: [],
      cantidad: 1,
      precioBase: subtotalBruto,
      precioUnitario: subtotalBruto,
      subtotal: subtotalBruto,
      descuentoUnitarioPromo: descuentoTotalPromo,
      promocion: {
        nombre: '2x1',
        descuento: descuentoTotalPromo
      }
    })
  }

  function agregarPaqueteSushi5x4(rollosElegidos) {
    if (!rollosElegidos || rollosElegidos.length < 5) return
    const ordenados = [...rollosElegidos].sort((a, b) => a.precioNum - b.precioNum)
    const gratis = ordenados[0]
    const subtotalBruto = ordenados.reduce((acc, r) => acc + r.precioNum, 0)
    const descuentoMenor = gratis.precioNum

    items.value.push({
      id: Date.now() + Math.random(),
      nombre: 'Paquete Sushi',
      etiquetaPromo: 'Paga 4, lleva 5',
      detalle: rollosElegidos.map((r) => r.nombre).join(', '),
      extrasSeleccionados: [],
      cantidad: 1,
      precioBase: subtotalBruto,
      precioUnitario: subtotalBruto,
      subtotal: subtotalBruto,
      descuentoUnitarioPromo: descuentoMenor,
      promocion: {
        nombre: 'Paquete Sushi',
        descuento: descuentoMenor
      }
    })
  }

  function agregarPromoGeneralAlCarrito(promoData, platilloElegido) {
    if (!promoData || !platilloElegido) return
    const esPostreGratis =
      (promoData.nombre || '').toLowerCase().includes('postre') ||
      (promoData.descuento || '').toLowerCase().includes('gratis')

    if (esPostreGratis) {
      if (subtotalSinPostreGratis.value < 400 || tienePostreGratisEnCarrito.value) {
        return false
      }
    }

    const precioNormal = Math.max(0, Number(platilloElegido.precioOriginal) || 0)
    const descuentoMonto = Math.max(0, Math.min(precioNormal, Number(platilloElegido.descuentoMonto) || 0))

    items.value.push({
      id: Date.now() + Math.random(),
      nombre: `${platilloElegido.nombre} (${promoData.nombre})`,
      etiquetaPromo: platilloElegido.etiquetaCorto || 'Promo',
      detalle: `${promoData.descuento} · Precio normal $${precioNormal}`,
      extrasSeleccionados: [],
      esPostreGratisPromo: esPostreGratis,
      cantidad: 1,
      precioBase: precioNormal,
      precioUnitario: precioNormal,
      subtotal: precioNormal,
      descuentoUnitarioPromo: descuentoMonto,
      promocion: {
        nombre: promoData.nombre,
        descuento: descuentoMonto
      }
    })
    return true
  }

  function agregarProducto(prod, opciones = {}) {
    // Si viene de variante (ej. Té verde Chico o Grande / Kalpis Chico o Grande)
    if (opciones.variante) {
      const v = opciones.variante
      const detalleVar = v.nombreVar || v.label
      const precioVar = v.precio || 40
      const existente = items.value.find((i) => i.nombre === prod.nombre && i.detalle === detalleVar)
      if (existente) {
        cambiarCantidadItem(existente.id, 1)
      } else {
        items.value.push({
          id: Date.now() + Math.random(),
          nombre: prod.nombre,
          etiquetaPromo: null,
          detalle: detalleVar,
          extrasSeleccionados: [],
          cantidad: 1,
          precioBase: precioVar,
          precioUnitario: precioVar,
          subtotal: precioVar
        })
      }
      return
    }

    // Construir etiqueta de carnes elegidas (Pollo, Cerdo, Res) si aplica
    const carnesElegidas = Array.isArray(opciones.carnes) && opciones.carnes.length > 0 ? [...opciones.carnes] : []
    const textoCarnes =
      carnesElegidas.length === 1
        ? `Carne: ${carnesElegidas[0]}`
        : carnesElegidas.length > 1
          ? `Carnes: ${carnesElegidas.join(', ')}`
          : ''

    // Si viene con extras personalizados desde el modal de extras
    if (opciones.extras && opciones.extras.length > 0) {
      const precioProdBase = Number(prod.precio) || 0
      const costoExtras = opciones.extras.reduce(
        (acc, ex) => acc + (Number(ex.costo) || Number(String(ex.precio).replace(/[^0-9.]/g, '')) || 0),
        0
      )
      const nombresExtras = opciones.extras
        .map((ex) => {
          const c = Number(ex.costo) || Number(String(ex.precio).replace(/[^0-9.]/g, '')) || 0
          return `${ex.nombre} (+$${c})`
        })
        .join(', ')
      const partesDetalle = []
      if (textoCarnes) partesDetalle.push(textoCarnes)
      partesDetalle.push(`Extra: ${nombresExtras}`)
      if (opciones.notaCocina) partesDetalle.push(`Nota: ${opciones.notaCocina}`)
      const detalleCompleto = partesDetalle.join(' · ')
      const precioUnit = precioProdBase + costoExtras

      items.value.push({
        id: Date.now() + Math.random(),
        nombre: prod.nombre,
        etiquetaPromo: null,
        detalle: detalleCompleto,
        carnesSeleccionadas: carnesElegidas,
        extrasSeleccionados: opciones.extras.map((e) => e.nombre),
        cantidad: opciones.cantidad || 1,
        precioBase: precioProdBase,
        precioUnitario: precioUnit,
        subtotal: precioUnit * (opciones.cantidad || 1)
      })
      return
    }

    // Producto normal, platillo con carnes o paquete fijo sin extras
    const partesNormal = []
    if (textoCarnes) partesNormal.push(textoCarnes)
    if (opciones.notaCocina) {
      partesNormal.push(`Nota: ${opciones.notaCocina}`)
    } else if (!textoCarnes && prod.subtitulo && prod.tipoCard === 'paquete') {
      partesNormal.push(prod.subtitulo)
    }
    const notaDetalle = partesNormal.length > 0 ? partesNormal.join(' · ') : null

    const existente = items.value.find(
      (i) => i.nombre === prod.nombre && i.detalle === notaDetalle && !i.promocion
    )
    if (existente) {
      cambiarCantidadItem(existente.id, opciones.cantidad || 1)
    } else {
      items.value.push({
        id: Date.now() + Math.random(),
        nombre: prod.nombre,
        etiquetaPromo: prod.etiquetaPromo || null,
        detalle: notaDetalle,
        carnesSeleccionadas: carnesElegidas,
        extrasSeleccionados: [],
        cantidad: opciones.cantidad || 1,
        precioBase: prod.precio,
        precioUnitario: prod.precio,
        subtotal: prod.precio * (opciones.cantidad || 1)
      })
    }
  }

  function actualizarExtrasItem(itemId, listaExtras, notaCocina = '', nuevasCarnes = null) {
    const item = items.value.find((i) => i.id === itemId)
    if (!item) return
    const base = Number(item.precioBase || item.precioUnitario || 0)
    const costoExtras = listaExtras.reduce(
      (acc, ex) => acc + (Number(ex.costo) || Number(String(ex.precio).replace(/[^0-9.]/g, '')) || 0),
      0
    )
    const nombresExtras = listaExtras
      .map((ex) => {
        const c = Number(ex.costo) || Number(String(ex.precio).replace(/[^0-9.]/g, '')) || 0
        return `${ex.nombre} (+$${c})`
      })
      .join(', ')
    const carnes = Array.isArray(nuevasCarnes) ? nuevasCarnes : item.carnesSeleccionadas || []
    const textoCarnes =
      carnes.length === 1
        ? `Carne: ${carnes[0]}`
        : carnes.length > 1
          ? `Carnes: ${carnes.join(', ')}`
          : ''

    const partes = []
    if (textoCarnes) partes.push(textoCarnes)
    if (nombresExtras) partes.push(`Extra: ${nombresExtras}`)
    if (notaCocina) partes.push(`Nota: ${notaCocina}`)

    item.detalle = partes.length > 0 ? partes.join(' · ') : null
    item.carnesSeleccionadas = carnes
    item.extrasSeleccionados = listaExtras.map((e) => e.nombre)
    item.precioBase = base
    item.precioUnitario = base + costoExtras
    item.subtotal = item.cantidad * item.precioUnitario
  }

  function setMetodoPago(metodo) {
    if (['Efectivo', 'Transferencia', 'Tarjeta'].includes(metodo)) {
      metodoPago.value = metodo
    }
  }

  function registrarVentaActual(datosPagoExtra = {}) {
    const authStore = useAuthStore()
    const mapTipo = {
      local: 'En local',
      llevar: 'Para llevar',
      domicilio: 'Domicilio'
    }
    const clienteMesa =
      tipoPedido.value === 'local'
        ? datosCliente.value.mesa
        : tipoPedido.value === 'llevar'
          ? datosCliente.value.nombreLlevar || 'Cliente mostrador'
          : datosCliente.value.nombreRecibe || 'Laura Méndez'

    const maxFolioActual = HISTORIAL_VENTAS_MOCK.reduce((max, v) => {
      const n = Number(String(v.folio || '').replace(/\D/g, '')) || 0
      return Math.max(max, n)
    }, 6)
    const nuevoFolioNum = maxFolioActual + 1
    const folioNuevo = `#${String(nuevoFolioNum).padStart(4, '0')}`
    const ahora = new Date()
    const tsAhora = Date.now()
    const fechaISO = obtenerFechaISOLocal(ahora)
    const horaStr = ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
    const cajeroAtendio =
      datosPagoExtra.atendio ||
      authStore.user?.fullName ||
      authStore.userName ||
      'Sofía Ramírez'

    const lineasPedido = items.value.map((it) => ({
      label: `${it.cantidad} × ${it.nombre}${it.detalle ? ` (${it.detalle})` : ''}`,
      importe: `$${it.subtotal}`,
      promo: Boolean(it.promocion)
    }))

    const nuevaVenta = {
      folio: folioNuevo,
      fechaISO,
      hora: horaStr,
      fechaHora: formatearFechaHoraVenta(fechaISO, horaStr),
      tipo: mapTipo[tipoPedido.value],
      tipoCodigo: tipoPedido.value,
      clienteMesa,
      mesa: tipoPedido.value === 'local' ? datosCliente.value.mesa : null,
      horaRecoleccion: tipoPedido.value === 'llevar' ? datosCliente.value.horaRecoleccion : null,
      notaCocina: datosCliente.value.notaCocina || '',
      telefono: datosCliente.value.telefono,
      direccion: datosCliente.value.direccion,
      referencia: datosCliente.value.referencia,
      atendio: cajeroAtendio,
      pago: metodoPago.value,
      subtotal: subtotal.value,
      descuento: descuento.value,
      envio: envio.value,
      totalNum: total.value,
      total: `$${total.value}`,
      montoRecibido:
        metodoPago.value === 'Efectivo'
          ? Number(datosPagoExtra.montoRecibido) || total.value
          : total.value,
      cambio:
        metodoPago.value === 'Efectivo'
          ? Math.max(0, (Number(datosPagoExtra.montoRecibido) || total.value) - total.value)
          : 0,
      cantidadProductos: items.value.reduce((acc, it) => acc + it.cantidad, 0),
      itemsSnapshot: items.value.map((it) => ({ ...it })),
      estado: tipoPedido.value === 'domicilio' ? 'Por asignar' : 'Completada',
      estadoVariant: tipoPedido.value === 'domicilio' ? '' : 'ok',
      _updatedAt: tsAhora
    }

    ultimaVentaRegistrada.value = nuevaVenta
    HISTORIAL_VENTAS_MOCK.unshift(nuevaVenta)
    guardarVentasStorage()

    if (tipoPedido.value === 'domicilio') {
      PEDIDOS_POR_ASIGNAR_MOCK.unshift({
        folio: folioNuevo,
        cliente: clienteMesa,
        telefono: datosCliente.value.telefono,
        direccion: datosCliente.value.direccion,
        total: `$${total.value}`,
        metodoPago: `Total · ${metodoPago.value}`,
        envio: `$${envio.value}`,
        lineas: lineasPedido,
        telefonoDireccion: `${datosCliente.value.telefono} · ${datosCliente.value.direccion}`,
        referencia: datosCliente.value.referencia ? `Referencia: ${datosCliente.value.referencia}` : '',
        _updatedAt: tsAhora
      })
      guardarEntregasStorage()
    }

    sincronizarConNube(true)

    // Guardar en PostgreSQL (base de datos 'kingo') a través del Backend Node.js
    fetch('http://localhost:3000/api/ventas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cajeroId: 2,
        tipoPedido: tipoPedido.value,
        numeroMesa: datosCliente.value.mesa,
        notaCocina: datosCliente.value.notaCocina,
        nombreCliente: clienteMesa,
        horaRecoleccion: datosCliente.value.horaRecoleccion,
        telefonoCliente: datosCliente.value.telefono,
        direccionEntrega: datosCliente.value.direccion,
        referenciaEntrega: datosCliente.value.referencia,
        subtotal: subtotal.value,
        descuentoTotal: descuento.value,
        costoEnvio: envio.value,
        total: total.value,
        metodoPago: metodoPago.value,
        items: items.value.map((it) => ({
          productoId: typeof it.id === 'number' && Number.isInteger(it.id) ? it.id : null,
          esPromo2x1: Boolean(it.etiquetaPromo?.includes('2x1')),
          nombre: it.nombre,
          detalle: it.detalle,
          etiquetaPromo: it.etiquetaPromo,
          cantidad: it.cantidad,
          precioUnitario: it.precioUnitario,
          subtotal: it.subtotal,
          promocion: it.promocion
        }))
      })
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.ok && data.folio) {
          nuevaVenta.folio = data.folio
          guardarVentasStorage()
        }
      })
      .catch(() => {
        // Fallback local si el servidor backend no está encendido
      })

    // Limpiar inmediatamente el pedido actual para que la siguiente venta inicie desde cero
    iniciarNuevaVentaLimpia()

    return nuevaVenta
  }

  function iniciarNuevaVentaLimpia() {
    pasoActual.value = 1
    items.value = []
    metodoPago.value = 'Efectivo'
    datosCliente.value = {
      mesa: 'Mesa 1',
      notaCocina: '',
      nombreLlevar: '',
      horaRecoleccion: '14:30',
      nombreRecibe: '',
      telefono: '',
      direccion: '',
      referencia: '',
      costoEnvioTexto: '$35.00',
      costoEnvio: 35
    }
  }

  return {
    pasoActual,
    tipoPedido,
    tipoEtiqueta,
    tituloDatos,
    datosCliente,
    items,
    metodoPago,
    ultimaVentaRegistrada,
    subtotal,
    subtotalSinPostreGratis,
    tienePostreGratisEnCarrito,
    descuento,
    envio,
    total,
    setTipoPedido,
    setPaso,
    updateDatosCliente,
    cambiarCantidadItem,
    eliminarItem,
    vaciarCarrito,
    agregarPromo2x1Configurable,
    agregarPaqueteSushi5x4,
    agregarPromoGeneralAlCarrito,
    agregarProducto,
    actualizarExtrasItem,
    setMetodoPago,
    registrarVentaActual,
    iniciarNuevaVentaLimpia
  }
})
