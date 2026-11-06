-- =============================================================================
-- SISTEMA KINGO · KIN SUSHI
-- Diseño Completo de Base de Datos Relacional en PostgreSQL (DDL + Reglas DBA)
-- =============================================================================

BEGIN;

-- 1. EXTENSIONES Y TIPOS ENUMERADOS (DOMINIOS DEL NEGOCIO)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE rol_usuario AS ENUM ('admin', 'cajero', 'repartidor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE estado_repartidor AS ENUM ('disponible', 'en_ruta', 'inactivo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tipo_pedido_enum AS ENUM ('local', 'llevar', 'domicilio');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE metodo_pago_enum AS ENUM ('Efectivo', 'Transferencia', 'Tarjeta');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE estado_venta_enum AS ENUM (
    'completada',
    'por_asignar',
    'por_entregar',
    'entregado',
    'no_entregado',
    'cancelada'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tipo_precio_paquete AS ENUM ('fijo', 'regla');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tipo_descuento_promo AS ENUM ('2x1', 'Porcentaje', 'Precio fijo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- 2. MÓDULO DE EMPLEADOS Y AUTENTICACIÓN (Administrador, Cajeros, Repartidores)
-- =============================================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id                SERIAL PRIMARY KEY,
  nombre_completo   VARCHAR(120) NOT NULL,
  username          VARCHAR(50)  NOT NULL UNIQUE,
  password_hash     TEXT         NOT NULL,
  rol               rol_usuario  NOT NULL,
  iniciales         CHAR(2)      NOT NULL,
  telefono          CHAR(10)     CHECK (telefono IS NULL OR telefono ~ '^[0-9]{10}$'),
  estado_operativo  estado_repartidor DEFAULT 'disponible',
  activo            BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_en         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  actualizado_en    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_rol_activo ON usuarios(rol, activo);

-- =============================================================================
-- 3. MÓDULO DE CATÁLOGO (Categorías, 155 Productos Oficiales, Variantes y Extras)
-- =============================================================================
CREATE TABLE IF NOT EXISTS categorias (
  id              SERIAL PRIMARY KEY,
  nombre          VARCHAR(80)  NOT NULL UNIQUE,
  nota            VARCHAR(180),
  permite_extras  BOOLEAN      NOT NULL DEFAULT TRUE,
  orden_visual    SMALLINT     NOT NULL DEFAULT 1,
  activa          BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS productos (
  id              SERIAL PRIMARY KEY,
  categoria_id    INT           NOT NULL REFERENCES categorias(id) ON UPDATE CASCADE,
  subcategoria    VARCHAR(80),
  nombre          VARCHAR(140)  NOT NULL,
  presentacion    VARCHAR(100),
  descripcion     TEXT,
  precio          NUMERIC(10,2) CHECK (precio IS NULL OR precio >= 0),
  tiene_foto      BOOLEAN       NOT NULL DEFAULT TRUE,
  imagen_url      TEXT,
  es_orden_extra  BOOLEAN       NOT NULL DEFAULT FALSE,
  activo          BOOLEAN       NOT NULL DEFAULT TRUE, -- Baja lógica
  creado_en       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_productos_categoria_activo ON productos(categoria_id, activo);
CREATE INDEX IF NOT EXISTS idx_productos_nombre_busqueda ON productos(LOWER(nombre));

-- Tamaños / Variantes por producto (ej. Té Verde Chico $40 / Grande $70, Kalpis Chico $50 / Grande $90)
CREATE TABLE IF NOT EXISTS producto_variantes (
  id              SERIAL PRIMARY KEY,
  producto_id     INT           NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  nombre          VARCHAR(60)   NOT NULL, -- 'Chico', 'Grande'
  abreviatura     VARCHAR(15)   NOT NULL, -- 'CH', 'GRDE'
  precio          NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  activa          BOOLEAN       NOT NULL DEFAULT TRUE,
  UNIQUE (producto_id, nombre)
);

-- =============================================================================
-- 4. MÓDULO DE PAQUETES (Paquetes A-H, Paquete 1, Paquete 2 y Paquete Sushi 5x4)
-- =============================================================================
CREATE TABLE IF NOT EXISTS paquetes (
  id                SERIAL PRIMARY KEY,
  producto_id       INT UNIQUE REFERENCES productos(id) ON DELETE SET NULL,
  nombre            VARCHAR(120)        NOT NULL UNIQUE,
  descripcion       TEXT,
  tipo_precio       tipo_precio_paquete NOT NULL DEFAULT 'fijo',
  precio_fijo       NUMERIC(10,2)       CHECK (precio_fijo IS NULL OR precio_fijo >= 0),
  producto_gratis   BOOLEAN             NOT NULL DEFAULT FALSE,
  se_eligen         SMALLINT            NOT NULL DEFAULT 1 CHECK (se_eligen >= 1),
  se_pagan          SMALLINT            NOT NULL DEFAULT 1 CHECK (se_pagan >= 1 AND se_pagan <= se_eligen),
  activo            BOOLEAN             NOT NULL DEFAULT TRUE,
  creado_en         TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paquete_items (
  id              SERIAL PRIMARY KEY,
  paquete_id      INT          NOT NULL REFERENCES paquetes(id) ON DELETE CASCADE,
  producto_id     INT          REFERENCES productos(id) ON DELETE RESTRICT,
  nombre_platillo VARCHAR(140) NOT NULL,
  subtitulo       VARCHAR(160),
  cantidad        SMALLINT     NOT NULL DEFAULT 1 CHECK (cantidad > 0)
);

-- =============================================================================
-- 5. MÓDULO DE PROMOCIONES (2x1 Lunes y Martes cobrando el de mayor precio)
-- =============================================================================
CREATE TABLE IF NOT EXISTS promociones (
  id                  SERIAL PRIMARY KEY,
  nombre              VARCHAR(120)         NOT NULL,
  tipo_descuento      tipo_descuento_promo NOT NULL DEFAULT '2x1',
  cobra_mayor_precio  BOOLEAN              NOT NULL DEFAULT TRUE,
  valor_descripcion   VARCHAR(140)         NOT NULL, -- ej. 'Lleva 2, paga el mayor'
  porcentaje_desc     NUMERIC(5,2)         CHECK (porcentaje_desc IS NULL OR (porcentaje_desc > 0 AND porcentaje_desc <= 100)),
  fecha_inicio        DATE                 NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin           DATE,
  activa              BOOLEAN              NOT NULL DEFAULT TRUE,
  creado_en           TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

-- Días válidos de la promoción: 0=Dom, 1=Lun, 2=Mar, 4=Jue, 5=Vie, 6=Sáb
-- Restricción DBA: 3 (Miércoles) bloqueado porque Kin Sushi cierra los miércoles
CREATE TABLE IF NOT EXISTS promocion_dias (
  promocion_id    INT      NOT NULL REFERENCES promociones(id) ON DELETE CASCADE,
  dia_semana      SMALLINT NOT NULL CHECK (dia_semana IN (0, 1, 2, 4, 5, 6)),
  codigo_dia       VARCHAR(5) NOT NULL, -- 'Lun', 'Mar', 'Jue', 'Vie', 'Sab', 'Dom'
  PRIMARY KEY (promocion_id, dia_semana)
);

CREATE TABLE IF NOT EXISTS promocion_productos (
  promocion_id    INT NOT NULL REFERENCES promociones(id) ON DELETE CASCADE,
  producto_id     INT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  PRIMARY KEY (promocion_id, producto_id)
);

-- =============================================================================
-- 6. MÓDULO DE VENTAS Y PEDIDOS (4 Pasos: Tipo -> Productos -> Datos -> Pago)
-- =============================================================================
CREATE SEQUENCE IF NOT EXISTS seq_folio_venta START WITH 1;

CREATE TABLE IF NOT EXISTS ventas (
  id                  BIGSERIAL PRIMARY KEY,
  folio               VARCHAR(15)       NOT NULL UNIQUE DEFAULT ('#' || LPAD(nextval('seq_folio_venta')::TEXT, 4, '0')),
  cajero_id           INT               NOT NULL REFERENCES usuarios(id),
  tipo_pedido         tipo_pedido_enum  NOT NULL,
  estado              estado_venta_enum NOT NULL DEFAULT 'completada',

  -- Datos condicionales según modalidad (En local / Para llevar / A domicilio)
  numero_mesa         VARCHAR(25),
  nota_cocina         TEXT,
  nombre_cliente      VARCHAR(120),
  hora_recoleccion    TIME,
  telefono_cliente    CHAR(10),
  direccion_entrega   TEXT,
  referencia_entrega  TEXT,

  -- Importes monetarios
  subtotal            NUMERIC(10,2)     NOT NULL CHECK (subtotal >= 0),
  descuento_total     NUMERIC(10,2)     NOT NULL DEFAULT 0 CHECK (descuento_total >= 0),
  costo_envio         NUMERIC(10,2)     NOT NULL DEFAULT 0 CHECK (costo_envio >= 0),
  total               NUMERIC(10,2)     NOT NULL CHECK (total >= 0),

  -- Pago
  metodo_pago         metodo_pago_enum  NOT NULL,
  monto_recibido      NUMERIC(10,2),
  cambio_entregado    NUMERIC(10,2),

  fecha_hora          TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

  -- REGLAS ESTRICTAS DE NEGOCIO A NIVEL DBA:
  -- 1) Si es en local, exige número de mesa.
  CONSTRAINT chk_venta_local_mesa CHECK (
    tipo_pedido <> 'local' OR (numero_mesa IS NOT NULL AND LENGTH(TRIM(numero_mesa)) > 0)
  ),
  -- 2) Si es para llevar, exige nombre del cliente y hora de recolección.
  CONSTRAINT chk_venta_llevar_datos CHECK (
    tipo_pedido <> 'llevar' OR (
      nombre_cliente IS NOT NULL AND LENGTH(TRIM(nombre_cliente)) >= 3
      AND hora_recoleccion IS NOT NULL
    )
  ),
  -- 3) Si es a domicilio, exige nombre de quien recibe, celular de 10 dígitos, dirección y costo de envío > 0.
  CONSTRAINT chk_venta_domicilio_datos CHECK (
    tipo_pedido <> 'domicilio' OR (
      nombre_cliente IS NOT NULL AND LENGTH(TRIM(nombre_cliente)) >= 3
      AND telefono_cliente IS NOT NULL AND telefono_cliente ~ '^[0-9]{10}$'
      AND direccion_entrega IS NOT NULL AND LENGTH(TRIM(direccion_entrega)) >= 8
      AND costo_envio > 0
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_ventas_fecha_hora ON ventas(fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_ventas_tipo_estado ON ventas(tipo_pedido, estado);

-- Líneas del carrito en cada venta
CREATE TABLE IF NOT EXISTS venta_detalles (
  id                  BIGSERIAL PRIMARY KEY,
  venta_id            BIGINT        NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id         INT           REFERENCES productos(id) ON DELETE RESTRICT,
  variante_id         INT           REFERENCES producto_variantes(id) ON DELETE RESTRICT,
  paquete_id          INT           REFERENCES paquetes(id) ON DELETE RESTRICT,
  promocion_id        INT           REFERENCES promociones(id) ON DELETE RESTRICT,
  nombre_snapshot     VARCHAR(160)  NOT NULL,
  detalle_snapshot    TEXT,
  etiqueta_promo      VARCHAR(60),
  cantidad            SMALLINT      NOT NULL CHECK (cantidad > 0),
  precio_unitario     NUMERIC(10,2) NOT NULL CHECK (precio_unitario >= 0),
  subtotal            NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  descuento_aplicado  NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (descuento_aplicado >= 0)
);

CREATE INDEX IF NOT EXISTS idx_venta_detalles_venta ON venta_detalles(venta_id);
CREATE INDEX IF NOT EXISTS idx_venta_detalles_producto ON venta_detalles(producto_id);

-- Extras agregados a un platillo específico dentro de una venta (ej. Extra Camarón +$60 en Yakimeshi)
CREATE TABLE IF NOT EXISTS venta_detalle_extras (
  id                  BIGSERIAL PRIMARY KEY,
  venta_detalle_id    BIGINT        NOT NULL REFERENCES venta_detalles(id) ON DELETE CASCADE,
  extra_producto_id   INT           NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  nombre_extra        VARCHAR(100)  NOT NULL,
  costo_extra         NUMERIC(10,2) NOT NULL CHECK (costo_extra >= 0)
);

-- Rollos individuales elegidos dentro de una Promoción 2x1 o Paquete Sushi (5x4)
-- Permite saber cuál rollo se cobró (mayor precio), cuál salió gratis (menor precio) y contabilizar piezas reales en reportes
CREATE TABLE IF NOT EXISTS venta_detalle_rollos (
  id                  BIGSERIAL PRIMARY KEY,
  venta_detalle_id    BIGINT        NOT NULL REFERENCES venta_detalles(id) ON DELETE CASCADE,
  rollo_producto_id   INT           NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  nombre_rollo        VARCHAR(120)  NOT NULL,
  precio_normal       NUMERIC(10,2) NOT NULL CHECK (precio_normal >= 0),
  es_gratis           BOOLEAN       NOT NULL DEFAULT FALSE,
  monto_cobrado       NUMERIC(10,2) NOT NULL CHECK (monto_cobrado >= 0)
);

CREATE INDEX IF NOT EXISTS idx_venta_detalle_rollos_prod ON venta_detalle_rollos(rollo_producto_id);

-- =============================================================================
-- 7. MÓDULO DE ENTREGAS A DOMICILIO Y REPARTIDORES
-- =============================================================================
CREATE TABLE IF NOT EXISTS entregas_domicilio (
  id                  BIGSERIAL PRIMARY KEY,
  venta_id            BIGINT            NOT NULL UNIQUE REFERENCES ventas(id) ON DELETE CASCADE,
  repartidor_id       INT               NOT NULL REFERENCES usuarios(id),
  asignado_por_id     INT               REFERENCES usuarios(id),
  estado              estado_venta_enum NOT NULL DEFAULT 'por_entregar'
                      CHECK (estado IN ('por_entregar', 'entregado', 'no_entregado')),
  motivo_no_entrega   VARCHAR(180),
  asignado_en         TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  finalizado_en       TIMESTAMPTZ,

  -- Si no se pudo entregar, el motivo es obligatorio
  CONSTRAINT chk_entrega_motivo_obligatorio CHECK (
    estado <> 'no_entregado' OR (motivo_no_entrega IS NOT NULL AND LENGTH(TRIM(motivo_no_entrega)) > 0)
  )
);

CREATE INDEX IF NOT EXISTS idx_entregas_repartidor_estado ON entregas_domicilio(repartidor_id, estado);

-- =============================================================================
-- 8. TRIGGERS Y FUNCIONES DE NEGOCIO (DBA)
-- =============================================================================

-- Regla DBA #1: Impedir el borrado físico de un producto si tiene ventas o está en un paquete (forzar baja lógica)
CREATE OR REPLACE FUNCTION fn_proteger_eliminacion_producto()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM venta_detalles WHERE producto_id = OLD.id)
     OR EXISTS (SELECT 1 FROM venta_detalle_rollos WHERE rollo_producto_id = OLD.id)
     OR EXISTS (SELECT 1 FROM paquete_items WHERE producto_id = OLD.id) THEN
    RAISE EXCEPTION 'Regla de negocio KinGo: El producto "%" tiene ventas registradas o pertenece a un paquete. Usa baja lógica (activo = FALSE).', OLD.nombre;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_proteger_eliminacion_producto ON productos;
CREATE TRIGGER trg_proteger_eliminacion_producto
BEFORE DELETE ON productos
FOR EACH ROW EXECUTE FUNCTION fn_proteger_eliminacion_producto();

-- Regla DBA #2: Función de cálculo en Backend para Promoción 2x1 (Se cobra el rollo de mayor precio de cada par)
CREATE OR REPLACE FUNCTION fn_calcular_promo_2x1(p_rollos_ids INT[])
RETURNS TABLE (
  subtotal_bruto   NUMERIC(10,2),
  descuento_2x1    NUMERIC(10,2),
  total_a_cobrar   NUMERIC(10,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH rollos_elegidos AS (
    SELECT
      u.ord,
      p.id,
      p.precio,
      ROW_NUMBER() OVER (ORDER BY p.precio DESC, u.ord ASC) AS rn
    FROM unnest(p_rollos_ids) WITH ORDINALITY AS u(id_rollo, ord)
    JOIN productos p ON p.id = u.id_rollo
  )
  SELECT
    COALESCE(SUM(precio), 0)::NUMERIC(10,2) AS subtotal_bruto,
    COALESCE(SUM(CASE WHEN rn % 2 = 0 THEN precio ELSE 0 END), 0)::NUMERIC(10,2) AS descuento_2x1,
    COALESCE(SUM(CASE WHEN rn % 2 = 1 THEN precio ELSE 0 END), 0)::NUMERIC(10,2) AS total_a_cobrar
  FROM rollos_elegidos;
END;
$$ LANGUAGE plpgsql STABLE;

-- Regla DBA #3: Función de cálculo en Backend para Paquete Sushi (Elige 5 barras, paga 4, gratis la de menor precio)
CREATE OR REPLACE FUNCTION fn_calcular_paquete_sushi_5x4(p_rollos_ids INT[])
RETURNS TABLE (
  subtotal_bruto   NUMERIC(10,2),
  descuento_menor  NUMERIC(10,2),
  total_a_cobrar   NUMERIC(10,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH cinco_barras AS (
    SELECT
      p.precio,
      ROW_NUMBER() OVER (ORDER BY p.precio ASC, u.ord ASC) AS rn
    FROM unnest(p_rollos_ids) WITH ORDINALITY AS u(id_rollo, ord)
    JOIN productos p ON p.id = u.id_rollo
  )
  SELECT
    COALESCE(SUM(precio), 0)::NUMERIC(10,2) AS subtotal_bruto,
    COALESCE(SUM(CASE WHEN rn = 1 THEN precio ELSE 0 END), 0)::NUMERIC(10,2) AS descuento_menor,
    COALESCE(SUM(CASE WHEN rn > 1 THEN precio ELSE 0 END), 0)::NUMERIC(10,2) AS total_a_cobrar
  FROM cinco_barras;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- 9. VISTAS SQL PARA EL MÓDULO DE REPORTES (/admin/reportes)
-- =============================================================================

-- Reporte 1: Ventas por día
CREATE OR REPLACE VIEW vw_reporte_ventas_por_dia AS
SELECT
  DATE(fecha_hora AT TIME ZONE 'America/Mexico_City') AS fecha,
  COUNT(*) AS total_pedidos,
  SUM(total) AS total_vendido,
  ROUND(AVG(total), 2) AS ticket_promedio
FROM ventas
WHERE estado <> 'cancelada'
GROUP BY DATE(fecha_hora AT TIME ZONE 'America/Mexico_City')
ORDER BY fecha DESC;

-- Reporte 2: Productos más vendidos (suma platillos directos + rollos dentro de promos 2x1 y Paquete Sushi)
CREATE OR REPLACE VIEW vw_reporte_productos_mas_vendidos AS
WITH piezas_directas AS (
  SELECT
    vd.producto_id,
    SUM(vd.cantidad) AS piezas,
    SUM(vd.subtotal - vd.descuento_aplicado) AS ingresos
  FROM venta_detalles vd
  JOIN ventas v ON v.id = vd.venta_id
  WHERE v.estado <> 'cancelada' AND vd.producto_id IS NOT NULL
  GROUP BY vd.producto_id
),
piezas_en_promos AS (
  SELECT
    vdr.rollo_producto_id AS producto_id,
    COUNT(*) AS piezas,
    SUM(vdr.monto_cobrado) AS ingresos
  FROM venta_detalle_rollos vdr
  JOIN venta_detalles vd ON vd.id = vdr.venta_detalle_id
  JOIN ventas v ON v.id = vd.venta_id
  WHERE v.estado <> 'cancelada'
  GROUP BY vdr.rollo_producto_id
),
consolidado AS (
  SELECT producto_id, piezas, ingresos FROM piezas_directas
  UNION ALL
  SELECT producto_id, piezas, ingresos FROM piezas_en_promos
)
SELECT
  p.id AS producto_id,
  p.nombre AS platillo,
  c.nombre AS categoria,
  SUM(con.piezas)::BIGINT AS total_piezas_vendidas,
  SUM(con.ingresos)::NUMERIC(10,2) AS ingresos_generados
FROM consolidado con
JOIN productos p ON p.id = con.producto_id
JOIN categorias c ON c.id = p.categoria_id
GROUP BY p.id, p.nombre, c.nombre
ORDER BY total_piezas_vendidas DESC, ingresos_generados DESC;

-- Reporte 3: Ventas por tipo de pedido (En local, Para llevar, A domicilio)
CREATE OR REPLACE VIEW vw_reporte_ventas_tipo_pedido AS
SELECT
  tipo_pedido,
  COUNT(*) AS cantidad_pedidos,
  SUM(total) AS monto_total,
  ROUND(
    (SUM(total) * 100.0) / NULLIF(SUM(SUM(total)) OVER (), 0),
    1
  ) AS porcentaje_ingresos
FROM ventas
WHERE estado <> 'cancelada'
GROUP BY tipo_pedido
ORDER BY monto_total DESC;

COMMIT;
