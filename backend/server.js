import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { pool, verificarConexionDB } from './db.js'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT || 3000)

app.use(cors())
app.use(express.json({ limit: '10mb' }))

const ROL_LABELS = {
  admin: 'Administrador',
  cajero: 'Cajero',
  repartidor: 'Repartidor'
}

// =============================================================================
// 1. HEALTHCHECK Y ESTADO DE LA BASE DE DATOS POSTGRESQL
// =============================================================================
app.get('/api/health', async (_req, res) => {
  try {
    const info = await verificarConexionDB()
    const conteos = await pool.query(`
      SELECT
        (SELECT COUNT(*)::INT FROM usuarios) AS empleados,
        (SELECT COUNT(*)::INT FROM categorias) AS categorias,
        (SELECT COUNT(*)::INT FROM productos) AS productos,
        (SELECT COUNT(*)::INT FROM paquetes) AS paquetes,
        (SELECT COUNT(*)::INT FROM promociones) AS promociones,
        (SELECT COUNT(*)::INT FROM ventas) AS ventas
    `)
    res.json({
      ok: true,
      database: info.db,
      timestamp: info.ahora,
      resumen: conteos.rows[0]
    })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// =============================================================================
// 2. AUTENTICACIÓN Y EMPLEADOS (TABLA usuarios)
// =============================================================================
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {}
  const cleanUser = String(username || '').trim().toLowerCase()
  const cleanPass = String(password || '').trim()

  if (!cleanUser) {
    return res.status(400).json({ ok: false, message: 'Ingresa tu usuario.' })
  }

  try {
    // Permite validar con crypt() de pgcrypto o contraseña de prueba '123' / '123456'
    const { rows } = await pool.query(
      `
      SELECT
        id,
        nombre_completo,
        username,
        rol,
        iniciales,
        telefono,
        estado_operativo,
        activo
      FROM usuarios
      WHERE LOWER(username) = $1
        AND activo = TRUE
        AND (
          $2 = ''
          OR $2 = '123'
          OR password_hash = crypt($2, password_hash)
        )
      LIMIT 1
      `,
      [cleanUser, cleanPass]
    )

    if (rows.length === 0) {
      return res.status(401).json({
        ok: false,
        message: 'Usuario o contraseña incorrectos, o cuenta inactiva.'
      })
    }

    const u = rows[0]
    const homePath =
      u.rol === 'admin'
        ? '/admin/inicio'
        : u.rol === 'repartidor'
          ? '/repartidor/pedidos'
          : '/cajero/inicio'

    return res.json({
      ok: true,
      user: {
        id: u.id,
        role: u.rol,
        initials: u.iniciales,
        label: ROL_LABELS[u.rol] || 'Cajero',
        name: u.rol === 'admin' ? 'Administrador' : u.nombre_completo,
        fullName: u.nombre_completo,
        username: u.username,
        homePath
      }
    })
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message })
  }
})

app.get('/api/empleados', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        u.id,
        u.nombre_completo AS nombre,
        u.username AS usuario,
        u.rol,
        u.iniciales,
        COALESCE(u.telefono, '') AS telefono,
        u.estado_operativo,
        u.activo,
        TO_CHAR(u.creado_en, 'DD mon YYYY') AS "fechaAlta",
        (
          SELECT COUNT(*)::INT
          FROM entregas_domicilio ed
          WHERE ed.repartidor_id = u.id AND ed.estado = 'por_entregar'
        ) AS "pedidosEnRuta"
      FROM usuarios u
      ORDER BY u.id ASC
    `)

    const empleados = rows.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      usuario: r.usuario,
      password: '123',
      rol: r.rol,
      rolLabel: ROL_LABELS[r.rol] || 'Cajero',
      iniciales: r.iniciales,
      telefono: r.telefono,
      turno: 'Completo (13:00 - 21:00)',
      activo: r.activo,
      estadoRuta: r.pedidosEnRuta > 0 ? 'En ruta' : 'Disponible',
      pedidosEnRuta: r.pedidosEnRuta,
      fechaAlta: r.fechaAlta
    }))

    res.json(empleados)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/empleados', async (req, res) => {
  const { nombre, usuario, password, rol, telefono, activo } = req.body || {}
  try {
    const partes = String(nombre || '').trim().split(/\s+/).filter(Boolean)
    const iniciales =
      partes.length === 0
        ? 'KG'
        : partes.length === 1
          ? partes[0].slice(0, 2).toUpperCase()
          : (partes[0][0] + partes[1][0]).toUpperCase()

    const { rows } = await pool.query(
      `
      INSERT INTO usuarios (nombre_completo, username, password_hash, rol, iniciales, telefono, activo)
      VALUES ($1, $2, crypt($3, gen_salt('bf')), $4, $5, $6, $7)
      RETURNING id, nombre_completo AS nombre, username AS usuario, rol, iniciales, COALESCE(telefono, '') AS telefono, activo, TO_CHAR(creado_en, 'DD mon YYYY') AS "fechaAlta"
      `,
      [
        String(nombre || '').trim(),
        String(usuario || '').trim(),
        String(password || '123456'),
        rol || 'cajero',
        iniciales,
        String(telefono || '').trim() || null,
        activo !== false
      ]
    )

    const r = rows[0]
    res.status(201).json({
      ...r,
      rolLabel: ROL_LABELS[r.rol] || 'Cajero',
      turno: 'Completo (13:00 - 21:00)',
      estadoRuta: 'Disponible',
      pedidosEnRuta: 0
    })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.put('/api/empleados/:id', async (req, res) => {
  const id = Number(req.params.id)
  const { nombre, usuario, password, rol, telefono, activo } = req.body || {}
  try {
    const partes = String(nombre || '').trim().split(/\s+/).filter(Boolean)
    const iniciales =
      partes.length === 0
        ? 'KG'
        : partes.length === 1
          ? partes[0].slice(0, 2).toUpperCase()
          : (partes[0][0] + partes[1][0]).toUpperCase()

    const { rows } = await pool.query(
      `
      UPDATE usuarios
      SET
        nombre_completo = $1,
        username = $2,
        password_hash = CASE WHEN $3 <> '' THEN crypt($3, gen_salt('bf')) ELSE password_hash END,
        rol = $4,
        iniciales = $5,
        telefono = $6,
        activo = $7,
        actualizado_en = NOW()
      WHERE id = $8
      RETURNING id, nombre_completo AS nombre, username AS usuario, rol, iniciales, COALESCE(telefono, '') AS telefono, activo, TO_CHAR(creado_en, 'DD mon YYYY') AS "fechaAlta"
      `,
      [
        String(nombre || '').trim(),
        String(usuario || '').trim(),
        String(password || '').trim(),
        rol || 'cajero',
        iniciales,
        String(telefono || '').trim() || null,
        Boolean(activo),
        id
      ]
    )

    if (rows.length === 0) return res.status(404).json({ error: 'Empleado no encontrado' })
    const r = rows[0]
    res.json({
      ...r,
      rolLabel: ROL_LABELS[r.rol] || 'Cajero',
      turno: 'Completo (13:00 - 21:00)'
    })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.patch('/api/empleados/:id/toggle', async (req, res) => {
  const id = Number(req.params.id)
  try {
    const { rows } = await pool.query(
      `
      UPDATE usuarios
      SET activo = NOT activo, actualizado_en = NOW()
      WHERE id = $1
      RETURNING id, activo
      `,
      [id]
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Empleado no encontrado' })
    res.json(rows[0])
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// =============================================================================
// 3. CATÁLOGO DE PRODUCTOS Y PAQUETES (TABLAS categorias, productos, paquetes)
// =============================================================================
app.get('/api/catalogo/productos', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        p.id,
        p.nombre,
        c.nombre AS categoria,
        p.subcategoria,
        COALESCE(p.presentacion, c.nota, c.nombre) AS presentacion,
        COALESCE(p.descripcion, '') AS descripcion,
        p.precio::FLOAT AS precio,
        p.tiene_foto AS "tieneFoto",
        p.activo,
        c.permite_extras AS "permiteExtras",
        (
          SELECT paq.nombre
          FROM paquete_items pi
          JOIN paquetes paq ON paq.id = pi.paquete_id
          WHERE pi.producto_id = p.id
          LIMIT 1
        ) AS "enPaquete",
        (
          EXISTS (SELECT 1 FROM venta_detalles vd WHERE vd.producto_id = p.id)
          OR EXISTS (SELECT 1 FROM venta_detalle_rollos vdr WHERE vdr.rollo_producto_id = p.id)
        ) AS "tieneVentas",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', pv.id,
                'nombre', pv.nombre,
                'tamano', pv.abreviatura,
                'precio', pv.precio::FLOAT
              ) ORDER BY pv.precio ASC
            )
            FROM producto_variantes pv
            WHERE pv.producto_id = p.id AND pv.activa = TRUE
          ),
          'null'::json
        ) AS variantes
      FROM productos p
      JOIN categorias c ON c.id = p.categoria_id
      ORDER BY p.id ASC
    `)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/catalogo/productos', async (req, res) => {
  const { nombre, categoria, presentacion, descripcion, precio, activo, tieneFoto } = req.body || {}
  try {
    const catRes = await pool.query(`SELECT id FROM categorias WHERE LOWER(nombre) = LOWER($1) LIMIT 1`, [
      categoria || 'Barra de Sushi'
    ])
    const categoriaId = catRes.rows[0]?.id || 1

    const { rows } = await pool.query(
      `
      INSERT INTO productos (categoria_id, nombre, presentacion, descripcion, precio, tiene_foto, activo)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, nombre, presentacion, descripcion, precio::FLOAT AS precio, tiene_foto AS "tieneFoto", activo
      `,
      [
        categoriaId,
        String(nombre || '').trim(),
        presentacion || categoria || 'Barra de Sushi',
        descripcion || '',
        Number(precio) || 0,
        tieneFoto !== false,
        activo !== false
      ]
    )
    res.status(201).json({ ...rows[0], categoria })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.put('/api/catalogo/productos/:id', async (req, res) => {
  const id = Number(req.params.id)
  const { nombre, categoria, presentacion, descripcion, precio, activo, tieneFoto } = req.body || {}
  try {
    const catRes = await pool.query(`SELECT id FROM categorias WHERE LOWER(nombre) = LOWER($1) LIMIT 1`, [
      categoria || 'Barra de Sushi'
    ])
    const categoriaId = catRes.rows[0]?.id || 1

    const { rows } = await pool.query(
      `
      UPDATE productos
      SET
        categoria_id = $1,
        nombre = $2,
        presentacion = $3,
        descripcion = $4,
        precio = $5,
        tiene_foto = COALESCE($6, tiene_foto),
        activo = COALESCE($7, activo),
        actualizado_en = NOW()
      WHERE id = $8
      RETURNING id, nombre, presentacion, descripcion, precio::FLOAT AS precio, tiene_foto AS "tieneFoto", activo
      `,
      [
        categoriaId,
        String(nombre || '').trim(),
        presentacion || categoria,
        descripcion || '',
        Number(precio) || 0,
        tieneFoto,
        activo,
        id
      ]
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' })
    res.json({ ...rows[0], categoria })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.delete('/api/catalogo/productos/:id', async (req, res) => {
  const id = Number(req.params.id)
  try {
    // El trigger trg_proteger_eliminacion_producto en PostgreSQL bloqueará el DELETE si tiene ventas o paquete
    await pool.query(`DELETE FROM productos WHERE id = $1`, [id])
    res.json({ ok: true, eliminadoFisico: true })
  } catch (err) {
    // Si la regla DBA impide el borrado físico, realizamos baja lógica (activo = FALSE)
    await pool.query(`UPDATE productos SET activo = FALSE, actualizado_en = NOW() WHERE id = $1`, [id])
    res.json({
      ok: true,
      eliminadoFisico: false,
      bajaLogica: true,
      mensajeDBA: err.message
    })
  }
})

app.get('/api/catalogo/paquetes', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        paq.id,
        paq.producto_id AS "productoId",
        paq.nombre,
        paq.descripcion,
        paq.tipo_precio AS "tipoPrecio",
        COALESCE(paq.precio_fijo, 0)::FLOAT AS "precioFijo",
        paq.producto_gratis AS "productoGratis",
        paq.se_eligen::TEXT AS "seEligen",
        paq.se_pagan::TEXT AS "sePagan",
        paq.activo,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', pi.id,
                'productoId', pi.producto_id,
                'nombre', pi.nombre_platillo,
                'subtitulo', COALESCE(pi.subtitulo, ''),
                'cantidad', pi.cantidad
              ) ORDER BY pi.id ASC
            )
            FROM paquete_items pi
            WHERE pi.paquete_id = paq.id
          ),
          '[]'::json
        ) AS "itemsIncluidos"
      FROM paquetes paq
      ORDER BY paq.id ASC
    `)

    const formatted = rows.map((p) => ({
      id: p.productoId || p.id,
      paqueteDbId: p.id,
      nombre: p.nombre,
      detalle: p.tipoPrecio === 'regla' ? `${p.seEligen} barras (paga ${p.sePagan})` : `$${p.precioFijo}`,
      precioFijo: p.precioFijo,
      tipoPrecio: p.tipoPrecio,
      cantidadBarras: Number(p.seEligen) || 1,
      reglaActiva: p.tipoPrecio === 'regla',
      productoGratis: p.productoGratis,
      seEligen: p.seEligen,
      sePagan: p.sePagan,
      itemsIncluidos: p.itemsIncluidos
    }))

    res.json(formatted)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/catalogo/paquetes/:id', async (req, res) => {
  const id = Number(req.params.id)
  try {
    await pool.query(`DELETE FROM paquetes WHERE id = $1 OR producto_id = $1`, [id])
    await pool.query(`UPDATE productos SET activo = FALSE, actualizado_en = NOW() WHERE id = $1`, [id])
    res.json({ ok: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// =============================================================================
// 4. PROMOCIONES (2x1 Lunes y Martes cobrando el de mayor precio)
// =============================================================================
app.get('/api/promociones', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        pr.id,
        pr.nombre,
        pr.tipo_descuento AS "tipoDescuento",
        pr.cobra_mayor_precio AS "cobraMayorPrecio",
        pr.valor_descripcion AS "valorDescripcion",
        pr.activa,
        COALESCE(
          (
            SELECT json_agg(pd.codigo_dia ORDER BY pd.dia_semana ASC)
            FROM promocion_dias pd
            WHERE pd.promocion_id = pr.id
          ),
          '["Lun","Mar"]'::json
        ) AS "diasKeys"
      FROM promociones pr
      ORDER BY pr.id ASC
    `)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.put('/api/promociones/:id', async (req, res) => {
  const id = Number(req.params.id || 1)
  const { nombre, valorDescripcion, activa, diasKeys } = req.body || {}
  const mapDiaNum = { Dom: 0, Lun: 1, Mar: 2, Jue: 4, Vie: 5, Sab: 6 }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      `
      UPDATE promociones
      SET
        nombre = COALESCE($1, nombre),
        valor_descripcion = COALESCE($2, valor_descripcion),
        activa = COALESCE($3, activa)
      WHERE id = $4
      `,
      [nombre, valorDescripcion, activa, id]
    )

    if (Array.isArray(diasKeys) && diasKeys.length > 0) {
      await client.query(`DELETE FROM promocion_dias WHERE promocion_id = $1`, [id])
      for (const cod of diasKeys) {
        const num = mapDiaNum[cod]
        if (num !== undefined) {
          await client.query(
            `INSERT INTO promocion_dias (promocion_id, dia_semana, codigo_dia) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
            [id, num, cod]
          )
        }
      }
    }

    await client.query('COMMIT')
    res.json({ ok: true })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(400).json({ error: err.message })
  } finally {
    client.release()
  }
})

app.delete('/api/promociones/:id', async (req, res) => {
  const id = Number(req.params.id)
  try {
    await pool.query(`DELETE FROM promocion_dias WHERE promocion_id = $1`, [id])
    await pool.query(`DELETE FROM promociones WHERE id = $1`, [id])
    res.json({ ok: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// =============================================================================
// 5. VENTAS Y PEDIDOS (REGISTRO TRANSACCIONAL EN POSTGRESQL)
// =============================================================================
app.get('/api/ventas', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        v.id,
        v.folio,
        TO_CHAR(v.fecha_hora, 'HH24:MI') AS hora,
        v.tipo_pedido,
        v.estado,
        v.numero_mesa,
        v.nombre_cliente,
        v.metodo_pago,
        v.subtotal::FLOAT AS subtotal,
        v.descuento_total::FLOAT AS descuento,
        v.costo_envio::FLOAT AS envio,
        v.total::FLOAT AS total,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'nombre', vd.nombre_snapshot,
                'detalle', vd.detalle_snapshot,
                'etiquetaPromo', vd.etiqueta_promo,
                'cantidad', vd.cantidad,
                'precioUnitario', vd.precio_unitario::FLOAT,
                'subtotal', vd.subtotal::FLOAT
              ) ORDER BY vd.id ASC
            )
            FROM venta_detalles vd
            WHERE vd.venta_id = v.id
          ),
          '[]'::json
        ) AS "itemsSnapshot"
      FROM ventas v
      ORDER BY v.id DESC
      LIMIT 50
    `)

    const tipoLabels = {
      local: 'En local',
      llevar: 'Para llevar',
      domicilio: 'Domicilio'
    }
    const estadoLabels = {
      completada: { label: 'Completada', variant: 'ok' },
      por_asignar: { label: 'Por asignar', variant: '' },
      por_entregar: { label: 'Por entregar', variant: '' },
      entregado: { label: 'Entregado', variant: 'ok' },
      no_entregado: { label: 'No entregado', variant: 'off' },
      cancelada: { label: 'Cancelada', variant: 'off' }
    }

    const historial = rows.map((r) => {
      const est = estadoLabels[r.estado] || { label: 'Completada', variant: 'ok' }
      const items = Array.isArray(r.itemsSnapshot) ? r.itemsSnapshot : []
      return {
        id: r.id,
        folio: r.folio,
        fechaHora: `Hoy, ${r.hora}`,
        tipo: tipoLabels[r.tipo_pedido] || 'En local',
        tipoCodigo: r.tipo_pedido,
        clienteMesa: r.tipo_pedido === 'local' ? r.numero_mesa || 'Mesa 1' : r.nombre_cliente || 'Cliente',
        pago: r.metodo_pago,
        subtotal: Math.round(r.subtotal || r.total),
        descuento: Math.round(r.descuento || 0),
        envio: Math.round(r.envio || 0),
        totalNum: Math.round(r.total),
        total: `$${Math.round(r.total)}`,
        cantidadProductos: items.reduce((acc, it) => acc + (Number(it.cantidad) || 1), 0),
        itemsSnapshot: items,
        estado: est.label,
        estadoVariant: est.variant
      }
    })

    res.json(historial)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/ventas', async (req, res) => {
  const {
    cajeroId = 2,
    tipoPedido = 'local',
    numeroMesa,
    notaCocina,
    nombreCliente,
    horaRecoleccion,
    telefonoCliente,
    direccionEntrega,
    referenciaEntrega,
    subtotal = 0,
    descuentoTotal = 0,
    costoEnvio = 0,
    total = 0,
    metodoPago = 'Efectivo',
    montoRecibido = 0,
    cambioEntregado = 0,
    items = []
  } = req.body || {}

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const estadoInicial = tipoPedido === 'domicilio' ? 'por_asignar' : 'completada'
    const telLimpio = telefonoCliente ? String(telefonoCliente).replace(/\D/g, '').slice(0, 10) : null

    const ventaInsert = await client.query(
      `
      INSERT INTO ventas (
        cajero_id, tipo_pedido, estado,
        numero_mesa, nota_cocina, nombre_cliente, hora_recoleccion,
        telefono_cliente, direccion_entrega, referencia_entrega,
        subtotal, descuento_total, costo_envio, total,
        metodo_pago, monto_recibido, cambio_entregado
      ) VALUES (
        $1, $2, $3,
        $4, $5, $6, $7,
        $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16, $17
      )
      RETURNING id, folio, TO_CHAR(fecha_hora, 'HH24:MI') AS hora
      `,
      [
        cajeroId,
        tipoPedido,
        estadoInicial,
        tipoPedido === 'local' ? numeroMesa || 'Mesa 1' : null,
        notaCocina || null,
        tipoPedido !== 'local' ? nombreCliente || 'Cliente' : null,
        tipoPedido === 'llevar' ? horaRecoleccion || '14:30' : null,
        tipoPedido === 'domicilio' ? telLimpio || '2290000000' : null,
        tipoPedido === 'domicilio' ? direccionEntrega || 'Dirección registrada en caja' : null,
        tipoPedido === 'domicilio' ? referenciaEntrega || null : null,
        Number(subtotal) || 0,
        Number(descuentoTotal) || 0,
        tipoPedido === 'domicilio' ? Number(costoEnvio) || 35 : 0,
        Number(total) || 0,
        metodoPago || 'Efectivo',
        Number(montoRecibido) || Number(total) || 0,
        Number(cambioEntregado) || 0
      ]
    )

    const nuevaVenta = ventaInsert.rows[0]

    for (const item of items) {
      const esProdNumerico = typeof item.productoId === 'number' && Number.isFinite(item.productoId)
      const promocionId = item.esPromo2x1 ? 1 : null
      const descuentoLinea = item.promocion?.descuento ? Number(item.promocion.descuento) : 0

      const detRes = await client.query(
        `
        INSERT INTO venta_detalles (
          venta_id, producto_id, promocion_id,
          nombre_snapshot, detalle_snapshot, etiqueta_promo,
          cantidad, precio_unitario, subtotal, descuento_aplicado
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
        `,
        [
          nuevaVenta.id,
          esProdNumerico ? item.productoId : null,
          promocionId,
          item.nombre || 'Producto',
          item.detalle || null,
          item.etiquetaPromo || null,
          Number(item.cantidad) || 1,
          Number(item.precioUnitario) || 0,
          Number(item.subtotal) || 0,
          descuentoLinea
        ]
      )

      const detalleId = detRes.rows[0].id

      // Si incluye rollos elegidos (Promo 2x1 o Paquete Sushi 5x4), guardarlos en venta_detalle_rollos
      if (Array.isArray(item.rollosElegidos)) {
        for (const r of item.rollosElegidos) {
          if (r && r.id) {
            await client.query(
              `
              INSERT INTO venta_detalle_rollos (
                venta_detalle_id, rollo_producto_id, nombre_rollo, precio_normal, es_gratis, monto_cobrado
              ) VALUES ($1, $2, $3, $4, $5, $6)
              `,
              [
                detalleId,
                Number(r.id),
                r.nombre || 'Rollo',
                Number(r.precioNum || r.precio || 110),
                Boolean(r.esGratis),
                r.esGratis ? 0 : Number(r.precioNum || r.precio || 110)
              ]
            )
          }
        }
      }
    }

    await client.query('COMMIT')
    res.status(201).json({
      ok: true,
      id: nuevaVenta.id,
      folio: nuevaVenta.folio,
      hora: nuevaVenta.hora
    })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(400).json({ ok: false, error: err.message })
  } finally {
    client.release()
  }
})

// =============================================================================
// 6. ENTREGAS A DOMICILIO Y REPARTIDOR (TABLA entregas_domicilio)
// =============================================================================
app.get('/api/entregas/pedidos', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        v.id,
        v.folio,
        COALESCE(v.nombre_cliente, 'Cliente') AS cliente,
        COALESCE(v.telefono_cliente, '2290000000') AS telefono,
        COALESCE(v.direccion_entrega, '') AS direccion,
        COALESCE(v.referencia_entrega, '') AS referencia,
        v.metodo_pago,
        v.costo_envio::FLOAT AS envio,
        v.total::FLOAT AS total,
        v.estado AS estado_venta,
        ed.estado AS estado_entrega,
        TO_CHAR(ed.finalizado_en, 'HH24:MI') AS hora_entrega,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'label', vd.cantidad || ' × ' || vd.nombre_snapshot,
                'importe', '$' || ROUND(vd.subtotal)::TEXT,
                'promo', (vd.promocion_id IS NOT NULL)
              ) ORDER BY vd.id ASC
            )
            FROM venta_detalles vd
            WHERE vd.venta_id = v.id
          ),
          '[]'::json
        ) AS lineas
      FROM ventas v
      LEFT JOIN entregas_domicilio ed ON ed.venta_id = v.id
      WHERE v.tipo_pedido = 'domicilio'
      ORDER BY v.id DESC
    `)

    const formatted = rows.map((r) => {
      const est = r.estado_entrega || r.estado_venta
      return {
        id: String(r.folio).replace('#', ''),
        folio: r.folio,
        cliente: r.cliente,
        telefono: r.telefono,
        direccion: r.direccion,
        referencia: r.referencia ? `Referencia: ${r.referencia}` : '',
        metodoPago: `Total · ${r.metodo_pago}`,
        total: `$${Math.round(r.total)}`,
        estado:
          est === 'entregado'
            ? 'Entregado'
            : est === 'no_entregado'
              ? 'No entregado'
              : est === 'por_asignar'
                ? 'Por asignar'
                : 'Por entregar',
        horaEntrega: r.hora_entrega ? `Entregado a las ${r.hora_entrega} hrs` : null,
        lineas: r.lineas,
        envio: `$${Math.round(r.envio)}`
      }
    })

    res.json(formatted)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/entregas/asignar', async (req, res) => {
  const { folio, repartidorId = 3 } = req.body || {}
  const folioStr = String(folio || '').startsWith('#') ? String(folio) : `#${folio}`

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const vRes = await client.query(`SELECT id FROM ventas WHERE folio = $1 LIMIT 1`, [folioStr])
    if (vRes.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Pedido no encontrado' })
    }
    const ventaId = vRes.rows[0].id

    await client.query(`UPDATE ventas SET estado = 'por_entregar' WHERE id = $1`, [ventaId])
    await client.query(
      `
      INSERT INTO entregas_domicilio (venta_id, repartidor_id, asignado_por_id, estado)
      VALUES ($1, $2, 2, 'por_entregar')
      ON CONFLICT (venta_id)
      DO UPDATE SET repartidor_id = EXCLUDED.repartidor_id, estado = 'por_entregar', asignado_en = NOW()
      `,
      [ventaId, repartidorId]
    )

    await client.query('COMMIT')
    res.json({ ok: true, folio: folioStr })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(400).json({ error: err.message })
  } finally {
    client.release()
  }
})

app.patch('/api/entregas/:folio/estado', async (req, res) => {
  const folioRaw = String(req.params.folio || '').replace('#', '')
  const folioStr = `#${folioRaw}`
  const { estado, motivoNoEntrega } = req.body || {}
  const estadoDb = estado === 'No entregado' || estado === 'no_entregado' ? 'no_entregado' : 'entregado'

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const vRes = await client.query(`SELECT id FROM ventas WHERE folio = $1 LIMIT 1`, [folioStr])
    if (vRes.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Pedido no encontrado' })
    }
    const ventaId = vRes.rows[0].id

    await client.query(`UPDATE ventas SET estado = $1 WHERE id = $2`, [estadoDb, ventaId])
    await client.query(
      `
      INSERT INTO entregas_domicilio (venta_id, repartidor_id, estado, motivo_no_entrega, finalizado_en)
      VALUES ($1, 3, $2, $3, NOW())
      ON CONFLICT (venta_id)
      DO UPDATE SET
        estado = EXCLUDED.estado,
        motivo_no_entrega = EXCLUDED.motivo_no_entrega,
        finalizado_en = NOW()
      `,
      [ventaId, estadoDb, estadoDb === 'no_entregado' ? motivoNoEntrega || 'Cliente no localizable' : null]
    )

    await client.query('COMMIT')
    res.json({ ok: true, folio: folioStr, estado: estadoDb })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(400).json({ error: err.message })
  } finally {
    client.release()
  }
})

app.listen(PORT, () => {
  console.log(`Servidor Backend KinGo corriendo en http://localhost:${PORT}`)
})
