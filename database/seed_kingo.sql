-- =============================================================================
-- SISTEMA KINGO · KIN SUSHI
-- Script de Datos Iniciales (SEED) en PostgreSQL
-- Incluye:
--   • 3 Empleados únicos (admin, cajero, repartidor)
--   • 12 Categorías oficiales del menú de Kin Sushi
--   • 155 Productos oficiales del menú JSON + variantes de bebidas
--   • 8 Paquetes oficiales (Paquetes A-H, 1, 2 y Paquete Sushi 5x4)
--   • Promoción 2x1 en rollos (válida únicamente Lunes y Martes, cobra el mayor)
--   • Ventas y entregas iniciales (#0138 a #0143) para pruebas y reportes
-- =============================================================================

BEGIN;

-- Limpieza segura por si se vuelve a ejecutar el seed
TRUNCATE TABLE
  entregas_domicilio,
  venta_detalle_rollos,
  venta_detalle_extras,
  venta_detalles,
  ventas,
  promocion_productos,
  promocion_dias,
  promociones,
  paquete_items,
  paquetes,
  producto_variantes,
  productos,
  categorias,
  usuarios
RESTART IDENTITY CASCADE;

-- =============================================================================
-- 1. EMPLEADOS DEL SISTEMA (3 ROLES: ADMIN, CAJERO Y REPARTIDOR)
-- Contraseña inicial para los 3 usuarios: '123456' (cifrada con bcrypt/pgcrypto)
-- =============================================================================
INSERT INTO usuarios (id, nombre_completo, username, password_hash, rol, iniciales, telefono, estado_operativo, activo) VALUES
  (1, 'Laura Gómez',   'admin',      crypt('123456', gen_salt('bf')), 'admin',      'AD', '2291104500', 'disponible', TRUE),
  (2, 'Sofía Ramírez', 'cajero',     crypt('123456', gen_salt('bf')), 'cajero',     'CJ', '2292458810', 'disponible', TRUE),
  (3, 'Carlos R.',     'repartidor', crypt('123456', gen_salt('bf')), 'repartidor', 'RP', '2294012233', 'disponible', TRUE);

SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios));

-- =============================================================================
-- 2. CATEGORÍAS OFICIALES DEL MENÚ KIN SUSHI (12 CATEGORÍAS)
-- =============================================================================
INSERT INTO categorias (id, nombre, nota, permite_extras, orden_visual, activa) VALUES
  (1, 'Barra de Sushi', '10 piezas por rollo', TRUE, 1, TRUE),
  (2, 'Empanizados', '10 piezas por rollo', TRUE, 2, TRUE),
  (3, 'Afrutados', '10 piezas por rollo', TRUE, 3, TRUE),
  (4, 'Plato Kin', 'Ensalada de lechuga y zanahoria, arroz Yakimeshi y carne a la plancha en salsa dulce', TRUE, 4, TRUE),
  (5, 'Kushiages', 'Brochetas empanizadas (3 piezas)', FALSE, 5, TRUE),
  (6, 'Sopas', NULL, TRUE, 6, TRUE),
  (7, 'Yakimeshi', 'Arroz oriental con verduras y sazonado con soya', TRUE, 7, TRUE),
  (8, 'Ensaladas', NULL, TRUE, 8, TRUE),
  (9, 'Especialidades', NULL, TRUE, 9, TRUE),
  (10, 'Paquetes', 'Todos los paquetes incluyen 1 refresco (355 ml) a excepción del Paquete Sushi', FALSE, 10, TRUE),
  (11, 'Postres', NULL, FALSE, 11, TRUE),
  (12, 'Bebidas', 'CH = chico, GRDE = grande', FALSE, 12, TRUE),
  (13, 'Orden Extra', NULL, FALSE, 13, TRUE);

SELECT setval('categorias_id_seq', (SELECT MAX(id) FROM categorias));

-- =============================================================================
-- 3. CATÁLOGO OFICIAL DE 155 PRODUCTOS KIN SUSHI
-- =============================================================================
INSERT INTO productos (id, categoria_id, subcategoria, nombre, presentacion, descripcion, precio, tiene_foto, es_orden_extra, activo) VALUES
  (1, 1, NULL, 'Acapulco Roll', '10 piezas por rollo', 'Camarón, queso y pepino. Ajonjolí', 110.00, TRUE, FALSE, TRUE),
  (2, 1, NULL, 'Avocado Roll', '10 piezas por rollo', 'Anguila, queso y pepino. Cubierto de aguacate', 140.00, TRUE, FALSE, TRUE),
  (3, 1, NULL, 'Avocado Recargado', '10 piezas por rollo', 'Surimi philadelphia y pepino. Aguacate, Tampico y cebollín', 145.00, TRUE, FALSE, TRUE),
  (4, 1, NULL, 'California Roll', '10 piezas por rollo', 'Surimi, pepino y aguacate. Ajonjolí', 110.00, TRUE, FALSE, TRUE),
  (5, 1, NULL, 'California Especial', '10 piezas por rollo', 'Surimi, pepino y aguacate. Massago (hueva de pez)', 140.00, FALSE, FALSE, TRUE),
  (6, 1, NULL, 'Cani Roll', '10 piezas por rollo', 'Queso y pepino. Envuelto en cangrejo', 110.00, TRUE, FALSE, TRUE),
  (7, 1, NULL, 'Carrusel Roll', '10 piezas por rollo', 'Surimi y pepino. Salmón, queso, aguacate y massago', 135.00, TRUE, FALSE, TRUE),
  (8, 1, NULL, 'Eby Fry Roll', '10 piezas por rollo', 'Camarón empanizado, aguacate y queso. Ajonjolí', 125.00, TRUE, FALSE, TRUE),
  (9, 1, NULL, 'Futomaki Roll', '10 piezas por rollo', 'Camarón, pepino, queso, aguacate, zanahoria y ajonjolí. Alga marina', 140.00, TRUE, FALSE, TRUE),
  (10, 1, NULL, 'Futomaki Recargado', '10 piezas por rollo', 'Salmón, surimi, massago, camarón, queso, pepino, aguacate y zanahoria. Alga marina', 150.00, FALSE, FALSE, TRUE),
  (11, 1, NULL, 'Joshi Roll', '10 piezas por rollo', 'Surimi, aguacate y pepino. Envuelto en queso crema', 130.00, TRUE, FALSE, TRUE),
  (12, 1, NULL, 'Kakeage Roll', '10 piezas por rollo', 'Queso y pepino. Frituras de verdura', 120.00, TRUE, FALSE, TRUE),
  (13, 1, NULL, 'Kamikaze Roll', '10 piezas por rollo', 'Salmón, cebollín. Queso crema y massago', 145.00, TRUE, FALSE, TRUE),
  (14, 1, NULL, 'Kin Sushi Roll', '10 piezas por rollo', 'Salmón, pepino y aguacate. Envuelto en queso crema', 135.00, TRUE, FALSE, TRUE),
  (15, 1, NULL, 'Nemo Roll', '10 piezas por rollo', 'Camarón empanizado. Salmón, queso crema y salsa de anguila', 145.00, FALSE, FALSE, TRUE),
  (16, 1, NULL, 'Oishi Roll', '10 piezas por rollo', 'Salmón, cebollín y aguacate. Camarón, manchego y aguacate', 145.00, TRUE, FALSE, TRUE),
  (17, 1, NULL, 'Otoño Roll', '10 piezas por rollo', 'Philadelphia, camarón y aguacate. Kakeage y salsa de anguila', 145.00, TRUE, FALSE, TRUE),
  (18, 1, NULL, 'Sake Roll', '10 piezas por rollo', 'Pepino y queso. Salmón', 120.00, TRUE, FALSE, TRUE),
  (19, 1, NULL, 'Sake Recargado', '10 piezas por rollo', 'Pepino philadelphia y camarón. Salmón y pasta Tampico', 145.00, TRUE, FALSE, TRUE),
  (20, 1, NULL, 'Shinsen Roll', '10 piezas por rollo', 'Camarón empanizado, aguacate y philadelphia. Atún fresco, salsa spicy, cebollín y shishimi', 145.00, FALSE, FALSE, TRUE),
  (21, 1, NULL, 'Sunset Roll', '10 piezas por rollo', 'Camarón, pepino, aguacate y zanahoria. Queso crema y massago', 145.00, TRUE, FALSE, TRUE),
  (22, 1, NULL, 'Tampico Roll', '10 piezas por rollo', 'Pepino, aguacate. Pasta Tampico', 120.00, TRUE, FALSE, TRUE),
  (23, 1, NULL, 'Tofú Roll', '10 piezas por rollo', 'Relleno de tofu, aguacate y camarón. Ajonjolí y cebollín', 115.00, TRUE, FALSE, TRUE),
  (24, 1, NULL, 'Toreadito Roll', '10 piezas por rollo', 'Surimi, queso y chiles toreados. Ajonjolí', 110.00, TRUE, FALSE, TRUE),
  (25, 1, NULL, 'Tuna Roll', '10 piezas por rollo', 'Atún fresco, queso y cebollín. Ajonjolí', 145.00, FALSE, FALSE, TRUE),
  (26, 1, NULL, 'Vegetariano Roll', '10 piezas por rollo', 'Pepino, aguacate, queso y zanahoria. Ajonjolí', 110.00, TRUE, FALSE, TRUE),
  (27, 1, NULL, 'Volcán Roll', '10 piezas por rollo', 'Aguacate, carne de res y chiles toreados. Queso gratinado', 145.00, TRUE, FALSE, TRUE),
  (28, 2, NULL, 'Acapulco Recargado', '10 piezas por rollo', 'Camarón, queso philadelphia. Empanizado', 125.00, TRUE, FALSE, TRUE),
  (29, 2, NULL, 'Bananito Roll', '10 piezas por rollo', 'Plátano frito. Empanizado', 115.00, TRUE, FALSE, TRUE),
  (30, 2, NULL, 'Bull Roll', '10 piezas por rollo', 'Res, pepino y queso. Empanizado y con chile chipotle', 130.00, FALSE, FALSE, TRUE),
  (31, 2, NULL, 'Chicken Breast', '10 piezas por rollo', 'Queso manchego, champiñón, zanahoria y cebolla. Pechuga de pollo y empanizado', 150.00, TRUE, FALSE, TRUE),
  (32, 2, NULL, 'Gyun Roll', '10 piezas por rollo', 'Carne de res, queso manchego y cebollín. Empanizado y salsa spicy', 135.00, TRUE, FALSE, TRUE),
  (33, 2, NULL, 'Irresistible Roll', '10 piezas por rollo', 'Camarón empanizado y aguacate. Queso crema y empanizado', 140.00, TRUE, FALSE, TRUE),
  (34, 2, NULL, 'Larissa Roll', '10 piezas por rollo', 'Queso, pepino y aguacate. Empanizado y pasta Tampico', 130.00, TRUE, FALSE, TRUE),
  (35, 2, NULL, 'Kumano Roll', '10 piezas por rollo', 'Res, aguacate y pepino. Empanizado, queso manchego gratinado', 145.00, FALSE, FALSE, TRUE),
  (36, 2, NULL, 'Madan Roll', '10 piezas por rollo', 'Aguacate, queso philadelphia. Empanizado', 125.00, TRUE, FALSE, TRUE),
  (37, 2, NULL, 'Manchego Roll', '10 piezas por rollo', 'Queso manchego, pepino y aguacate. Empanizado', 125.00, TRUE, FALSE, TRUE),
  (38, 2, NULL, 'Mar y Tierra', '10 piezas por rollo', 'Camarón, carne de res y de crema. Empanizado', 140.00, TRUE, FALSE, TRUE),
  (39, 2, NULL, 'Philadelphia Roll', '10 piezas por rollo', 'Salmón y queso crema. Empanizado', 135.00, TRUE, FALSE, TRUE),
  (40, 2, NULL, 'Pollito Roll', '10 piezas por rollo', 'Pechuga de pollo, zanahoria y aguacate. Queso crema y empanizado', 145.00, FALSE, FALSE, TRUE),
  (41, 2, NULL, 'Sakawa Roll', '10 piezas por rollo', 'Camarón, res y pollo. Empanizado, queso manchego gratinado', 150.00, TRUE, FALSE, TRUE),
  (42, 2, NULL, 'Sushi Ball', '10 piezas por rollo', 'Camarón, surimi y queso crema. Empanizado y (pasta Tampico o salsa de anguila)', 145.00, TRUE, FALSE, TRUE),
  (43, 2, NULL, 'Tabatha Roll', '10 piezas por rollo', 'Relleno de camarón, aguacate y queso crema. Empanizado', 135.00, TRUE, FALSE, TRUE),
  (44, 3, NULL, 'Banana Roll', '10 piezas por rollo', 'Queso y pepino. Envuelto en plátano frito', 115.00, TRUE, FALSE, TRUE),
  (45, 3, NULL, 'Delicioso Roll', '10 piezas por rollo', 'Mango y camarón. Queso crema, nuez y salsa de anguila', 145.00, FALSE, FALSE, TRUE),
  (46, 3, NULL, 'Harakiri Roll', '10 piezas por rollo', 'Surimi, manzana y philadelphia. Kakeage y salsa de anguila', 140.00, TRUE, FALSE, TRUE),
  (47, 3, NULL, 'Hawaiian Roll', '10 piezas por rollo', 'Surimi, queso y piña. Ajonjolí', 135.00, TRUE, FALSE, TRUE),
  (48, 3, NULL, 'Kiwi Roll', '10 piezas por rollo', 'Surimi, queso philadelphia. Kiwi y salsa de fresa', 145.00, TRUE, FALSE, TRUE),
  (49, 3, NULL, 'Mango Recargado', '10 piezas por rollo', 'Relleno de camarón, empanizado, philadelphia y aguacate. Philadelphia, mango y salsa de tamarindo', 145.00, TRUE, FALSE, TRUE),
  (50, 3, NULL, 'Mango Roll', '10 piezas por rollo', 'Camarón empanizado. Ajonjolí, shishimi y salsa de tamarindo', 135.00, FALSE, FALSE, TRUE),
  (51, 3, NULL, 'Ringo Roll', '10 piezas por rollo', 'Queso philadelphia, manzana, salmón y cebollín. Queso crema y coco', 145.00, TRUE, FALSE, TRUE),
  (52, 3, NULL, 'Tropical Roll', '10 piezas por rollo', 'Piña, surimi y pepino. Queso philadelphia y coco', 145.00, TRUE, FALSE, TRUE),
  (53, 3, NULL, 'Afrutado', '10 piezas por rollo', 'Camarón empanizado y philadelphia. Mango, plátano, kiwi y salsa de tamarindo', 145.00, TRUE, FALSE, TRUE),
  (54, 3, NULL, 'Atami', '10 piezas por rollo', 'Camarón empanizado. Queso philadelphia, plátano frito, salsa de anguila', 135.00, TRUE, FALSE, TRUE),
  (55, 3, NULL, 'Banana Recargado', '10 piezas por rollo', 'Queso, pepino y camarón. Plátano frito y salsa de anguila', 135.00, FALSE, FALSE, TRUE),
  (56, 4, NULL, 'Plato Kin de 1 carne', 'Ensalada de lechuga y zanahoria, arroz Yakimeshi y carne a la plancha en salsa dulce', 'Pollo, cerdo o res', 95.00, TRUE, FALSE, TRUE),
  (57, 4, NULL, 'Plato Kin de 2 carnes', 'Ensalada de lechuga y zanahoria, arroz Yakimeshi y carne a la plancha en salsa dulce', 'Combinación de 2 carnes con arroz Yakimeshi y ensalada', 115.00, TRUE, FALSE, TRUE),
  (58, 4, NULL, 'Plato Kin Especial de 3 carnes', 'Ensalada de lechuga y zanahoria, arroz Yakimeshi y carne a la plancha en salsa dulce', 'Pollo, cerdo y res con arroz Yakimeshi y ensalada', 145.00, TRUE, FALSE, TRUE),
  (59, 4, NULL, 'Plato Kin de camarón', 'Ensalada de lechuga y zanahoria, arroz Yakimeshi y carne a la plancha en salsa dulce', 'Camarón a la plancha en salsa dulce con Yakimeshi', 155.00, TRUE, FALSE, TRUE),
  (60, 4, NULL, 'Plato Kin de camarón y piña', 'Ensalada de lechuga y zanahoria, arroz Yakimeshi y carne a la plancha en salsa dulce', 'Camarón y piña a la plancha con Yakimeshi', 170.00, FALSE, FALSE, TRUE),
  (61, 4, NULL, 'Plato Kin de salmón', 'Ensalada de lechuga y zanahoria, arroz Yakimeshi y carne a la plancha en salsa dulce', 'Salmón a la plancha con Yakimeshi y ensalada', 155.00, TRUE, FALSE, TRUE),
  (62, 4, NULL, 'Plato Kin Mariscos', 'Ensalada de lechuga y zanahoria, arroz Yakimeshi y carne a la plancha en salsa dulce', 'Combinación de mariscos a la plancha con Yakimeshi', 180.00, TRUE, FALSE, TRUE),
  (63, 4, NULL, 'Plato Kin con piña', 'Ensalada de lechuga y zanahoria, arroz Yakimeshi y carne a la plancha en salsa dulce', 'Carne a la plancha con piña, Yakimeshi y ensalada', 95.00, TRUE, FALSE, TRUE),
  (64, 4, NULL, 'Plato Kin Atún', 'Ensalada de lechuga y zanahoria, arroz Yakimeshi y carne a la plancha en salsa dulce', 'Atún a la plancha con Yakimeshi y ensalada', 155.00, TRUE, FALSE, TRUE),
  (65, 5, NULL, 'Kushiage Queso manchego', 'Brochetas empanizadas (3 piezas)', '3 brochetas empanizadas de queso manchego', 67.00, FALSE, FALSE, TRUE),
  (66, 5, NULL, 'Kushiage Plátano', 'Brochetas empanizadas (3 piezas)', '3 brochetas empanizadas de plátano', 67.00, TRUE, FALSE, TRUE),
  (67, 5, NULL, 'Kushiage Plátano con queso manchego', 'Brochetas empanizadas (3 piezas)', '3 brochetas empanizadas', 105.00, TRUE, FALSE, TRUE),
  (68, 5, NULL, 'Kushiage Philadelphia', 'Brochetas empanizadas (3 piezas)', '3 brochetas empanizadas de queso philadelphia', 105.00, TRUE, FALSE, TRUE),
  (69, 5, NULL, 'Kushiage Pollo', 'Brochetas empanizadas (3 piezas)', '3 brochetas empanizadas de pollo', 105.00, TRUE, FALSE, TRUE),
  (70, 5, NULL, 'Kushiage Camarón', 'Brochetas empanizadas (3 piezas)', '3 brochetas empanizadas de camarón', 95.00, FALSE, FALSE, TRUE),
  (71, 5, NULL, 'Kushiage Camarón con queso', 'Brochetas empanizadas (3 piezas)', '3 brochetas empanizadas de camarón con queso', 105.00, TRUE, FALSE, TRUE),
  (72, 5, NULL, 'Kushiage Surimi', 'Brochetas empanizadas (3 piezas)', '3 brochetas empanizadas de surimi', 95.00, TRUE, FALSE, TRUE),
  (73, 5, NULL, 'Kushiage Salmón', 'Brochetas empanizadas (3 piezas)', '3 brochetas empanizadas de salmón', 95.00, TRUE, FALSE, TRUE),
  (74, 5, NULL, 'Kushiage Salmón con queso', 'Brochetas empanizadas (3 piezas)', '3 brochetas empanizadas de salmón con queso', 105.00, TRUE, FALSE, TRUE),
  (75, 6, NULL, 'Misoshiro', 'Sopas', 'Pasta de soya, con queso de soya, y fideos transparentes', 48.00, FALSE, FALSE, TRUE),
  (76, 6, NULL, 'Wacame soup', 'Sopas', 'Alga marina con champiñones, fideos transparentes', 48.00, TRUE, FALSE, TRUE),
  (77, 6, NULL, 'Sumashi', 'Sopas', 'Marisco', 100.00, TRUE, FALSE, TRUE),
  (78, 6, NULL, 'Tori Soup', 'Sopas', 'Pollo, arroz, huevo, champiñón y cebollín', 90.00, TRUE, FALSE, TRUE),
  (79, 6, NULL, 'Tempura Udon', 'Sopas', 'Tallarines con camarón capeado', 125.00, TRUE, FALSE, TRUE),
  (80, 6, NULL, 'Ramen', 'Sopas', 'Fideos, verduras, cerdo o pollo', 100.00, FALSE, FALSE, TRUE),
  (81, 6, NULL, 'Yakisoba', 'Sopas', 'Sopa seca, cerdo o pollo', 125.00, TRUE, FALSE, TRUE),
  (82, 7, NULL, 'Gohan', 'Arroz oriental con verduras y sazonado con soya', 'Arroz al vapor', 55.00, TRUE, FALSE, TRUE),
  (83, 7, NULL, 'Yakimeshi sencillo', 'Arroz oriental con verduras y sazonado con soya', 'Arroz oriental con verduras y sazonado con soya', 60.00, TRUE, FALSE, TRUE),
  (84, 7, NULL, 'Yakimeshi con 1 carne', 'Arroz oriental con verduras y sazonado con soya', 'Pollo, cerdo o res', 75.00, TRUE, FALSE, TRUE),
  (85, 7, NULL, 'Yakimeshi con 2 carnes', 'Arroz oriental con verduras y sazonado con soya', 'Arroz oriental con 2 carnes a elegir', 90.00, FALSE, FALSE, TRUE),
  (86, 7, NULL, 'Yakimeshi con 3 carnes', 'Arroz oriental con verduras y sazonado con soya', 'Pollo, cerdo y res', 100.00, TRUE, FALSE, TRUE),
  (87, 7, NULL, 'Yakimeshi con pasta Tampico', 'Arroz oriental con verduras y sazonado con soya', 'Arroz oriental con pasta Tampico', 95.00, TRUE, FALSE, TRUE),
  (88, 7, NULL, 'Yakimeshi Especial', 'Arroz oriental con verduras y sazonado con soya', 'Salmón, pasta Tampico, ajonjolí, cebollín', 110.00, TRUE, FALSE, TRUE),
  (89, 7, NULL, 'Yakimeshi con camarón', 'Arroz oriental con verduras y sazonado con soya', 'Arroz oriental con camarón', 100.00, TRUE, FALSE, TRUE),
  (90, 7, NULL, 'Yakimeshi Atún', 'Arroz oriental con verduras y sazonado con soya', 'Arroz oriental con atún', 100.00, FALSE, FALSE, TRUE),
  (91, 7, NULL, 'Yakimeshi con salmón', 'Arroz oriental con verduras y sazonado con soya', 'Arroz oriental con salmón', 100.00, TRUE, FALSE, TRUE),
  (92, 7, NULL, 'Yakimeshi con surimi', 'Arroz oriental con verduras y sazonado con soya', 'Arroz oriental con surimi', 100.00, TRUE, FALSE, TRUE),
  (93, 7, NULL, 'Yakimeshi con mariscos', 'Arroz oriental con verduras y sazonado con soya', 'Arroz oriental con mariscos', 115.00, TRUE, FALSE, TRUE),
  (94, 7, NULL, 'Yakimeshi Hawaiiano', 'Arroz oriental con verduras y sazonado con soya', 'Philadelphia y piña', 110.00, TRUE, FALSE, TRUE),
  (95, 7, NULL, 'Yakimeshi con ajo', 'Arroz oriental con verduras y sazonado con soya', 'Arroz oriental sazonado con ajo', 85.00, FALSE, FALSE, TRUE),
  (96, 7, NULL, 'Yakimeshi Camarón empanizado', 'Arroz oriental con verduras y sazonado con soya', 'Arroz oriental con camarón empanizado', 125.00, TRUE, FALSE, TRUE),
  (97, 8, NULL, 'Ensalada Kani', 'Ensaladas', 'Lechuga, zanahoria, cebolla, surimi, pasta Tampico', 115.00, TRUE, FALSE, TRUE),
  (98, 8, NULL, 'Ensalada Cruji', 'Ensaladas', 'Fideos crujientes, col blanca, pollo, con vinagreta', 115.00, TRUE, FALSE, TRUE),
  (99, 8, NULL, 'Ensalada de Surimi', 'Ensaladas', 'Surimi finamente fileteado, con cebollín, pimiento y limón', 110.00, TRUE, FALSE, TRUE),
  (100, 8, NULL, 'Ensalada de Pollo', 'Ensaladas', 'Combinación de lechugas y vegetales con pechuga a la plancha', 125.00, FALSE, FALSE, TRUE),
  (101, 8, NULL, 'Ensalada de Salmón', 'Ensaladas', 'Combinación de lechuga, salmón a la plancha, nuez, aceitunas negras y aderezo mil islas', 150.00, TRUE, FALSE, TRUE),
  (102, 8, NULL, 'Champiñones empanizados', 'Ensaladas', 'Rellenos de pasta de Tampico', 85.00, TRUE, FALSE, TRUE),
  (103, 8, NULL, 'Rollito primavera', 'Ensaladas', 'Taquitos fritos de harina de arroz rellenos de verduras', 85.00, TRUE, FALSE, TRUE),
  (104, 9, NULL, 'Teppanyaki sencillo', 'Especialidades', 'Verdura a la plancha sazonada con sake y soya', 125.00, TRUE, FALSE, TRUE),
  (105, 9, NULL, 'Teppanyaki con pollo', 'Especialidades', 'Verdura y pollo a la plancha con sake y soya', 150.00, FALSE, FALSE, TRUE),
  (106, 9, NULL, 'Teppanyaki con camarón', 'Especialidades', 'Verdura y camarón a la plancha con sake y soya', 190.00, TRUE, FALSE, TRUE),
  (107, 9, NULL, 'Teppanyaki con salmón', 'Especialidades', 'Verdura y salmón a la plancha con sake y soya', 190.00, TRUE, FALSE, TRUE),
  (108, 9, NULL, 'Teppanyaki mixto', 'Especialidades', 'Combinación de carnes y mariscos a la plancha', 220.00, TRUE, FALSE, TRUE),
  (109, 9, NULL, 'Teppanyaki atún', 'Especialidades', 'Verdura y atún a la plancha con sake y soya', 190.00, TRUE, FALSE, TRUE),
  (110, 9, NULL, 'Tempura capeado de verdura', 'Especialidades', 'Vegetales capeados en tempura', 140.00, FALSE, FALSE, TRUE),
  (111, 9, NULL, 'Tempura capeado de camarón', 'Especialidades', 'Camarones y vegetales capeados en tempura', 180.00, TRUE, FALSE, TRUE),
  (112, 9, NULL, 'Tempura capeado mixto', 'Especialidades', 'Tempura mixto de mariscos y vegetales', 200.00, TRUE, FALSE, TRUE),
  (113, 9, NULL, 'Curry de pollo', 'Especialidades', 'Pechuga de pollo con verduras en salsa curry sobre arroz al vapor', 125.00, TRUE, FALSE, TRUE),
  (114, 9, NULL, 'Chicken Red', 'Especialidades', 'Pechuga de pollo capeada con verduras, sobre arroz al vapor y salsa agridulce y piña', 125.00, TRUE, FALSE, TRUE),
  (115, 9, NULL, 'Catsu Don', 'Especialidades', 'Milanesa de cerdo, bañada con salsa de soya dulce sobre arroz al vapor', 125.00, FALSE, FALSE, TRUE),
  (116, 9, NULL, 'Vegetariano Especial', 'Especialidades', 'Verduras sazonadas con soya servidas sobre arroz al vapor', 125.00, TRUE, FALSE, TRUE),
  (117, 9, NULL, 'Une Code', 'Especialidades', 'Bolitas de pollo con queso manchego, ligeramente picante, acompañada con arroz Yakimeshi y ensalada', 130.00, TRUE, FALSE, TRUE),
  (118, 10, NULL, 'Paquete A', 'Todos los paquetes incluyen 1 refresco (355 ml) a excepción del Paquete Sushi', 'Yakimeshi sencillo, 3 brochetas de queso', 140.00, TRUE, FALSE, TRUE),
  (119, 10, NULL, 'Paquete B', 'Todos los paquetes incluyen 1 refresco (355 ml) a excepción del Paquete Sushi', 'Sopa Misoshiro, 3 brochetas de queso, 1 California Roll', 220.00, TRUE, FALSE, TRUE),
  (120, 10, NULL, 'Paquete C', 'Todos los paquetes incluyen 1 refresco (355 ml) a excepción del Paquete Sushi', 'Rollito primavera, Yakimeshi', 98.00, FALSE, FALSE, TRUE),
  (121, 10, NULL, 'Paquete D', 'Todos los paquetes incluyen 1 refresco (355 ml) a excepción del Paquete Sushi', 'Plato Kin, 2 brochetas de queso, Plato Kin de una carne, Sopa Misoshiro', 200.00, TRUE, FALSE, TRUE),
  (122, 10, NULL, 'Paquete H', 'Todos los paquetes incluyen 1 refresco (355 ml) a excepción del Paquete Sushi', '1 California Roll, 3 brochetas de queso', 175.00, TRUE, FALSE, TRUE),
  (123, 10, NULL, 'Paquete Sushi', 'Todos los paquetes incluyen 1 refresco (355 ml) a excepción del Paquete Sushi', '5 barras y paga solo 4 barras (gratis la de menor precio)', NULL, TRUE, FALSE, TRUE),
  (124, 10, NULL, 'Paquete 1', 'Todos los paquetes incluyen 1 refresco (355 ml) a excepción del Paquete Sushi', '1 Sushi Acapulco, 1 Yakimeshi de res', 195.00, TRUE, FALSE, TRUE),
  (125, 10, NULL, 'Paquete 2', 'Todos los paquetes incluyen 1 refresco (355 ml) a excepción del Paquete Sushi', '1 Sushi Philadelphia, 1 Sushi Acapulco, 1 Yakimeshi de res, 2 refrescos', 295.00, FALSE, FALSE, TRUE),
  (126, 11, NULL, 'Galletas de la suerte', 'Postres', '', 10.00, TRUE, FALSE, TRUE),
  (127, 11, NULL, 'Helado de vainilla', 'Postres', 'Con fresa, chocolate o cajeta', 50.00, TRUE, FALSE, TRUE),
  (128, 11, NULL, 'Pockys', 'Postres', '', 65.00, TRUE, FALSE, TRUE),
  (129, 11, NULL, 'Tempura Helado', 'Postres', 'Helado frito con fresa, chocolate o cajeta', 75.00, TRUE, FALSE, TRUE),
  (130, 11, NULL, 'Banana Ice', 'Postres', '', 75.00, FALSE, FALSE, TRUE),
  (131, 12, NULL, 'Té Verde', 'CH = chico, GRDE = grande', 'CH $40 · GRDE $70', 40.00, TRUE, FALSE, TRUE),
  (132, 12, NULL, 'Kalpis', 'CH = chico, GRDE = grande', 'Bebida refrescante japonesa de arroz (CH $50 · GRDE $90)', 50.00, TRUE, FALSE, TRUE),
  (133, 12, NULL, 'Ramune', 'CH = chico, GRDE = grande', '', 65.00, TRUE, FALSE, TRUE),
  (134, 12, NULL, 'Refresco 335ml', 'CH = chico, GRDE = grande', 'Coca Cola, Fanta, Manzana', 25.00, TRUE, FALSE, TRUE),
  (135, 12, NULL, 'Delawere 600ml', 'CH = chico, GRDE = grande', '', 30.00, FALSE, FALSE, TRUE),
  (136, 12, NULL, 'Coca Light 600ml', 'CH = chico, GRDE = grande', '', 30.00, TRUE, FALSE, TRUE),
  (137, 12, NULL, 'Agua embotellada', 'CH = chico, GRDE = grande', '', 25.00, TRUE, FALSE, TRUE),
  (138, 12, NULL, 'Fuze Tea', 'CH = chico, GRDE = grande', '', 35.00, TRUE, FALSE, TRUE),
  (139, 12, NULL, 'Jugo Foco', 'CH = chico, GRDE = grande', '', 45.00, TRUE, FALSE, TRUE),
  (140, 13, 'Salsas y aderezos', 'Soya de limón', 'Salsas y aderezos', 'Salsas y aderezos', 8.00, FALSE, TRUE, TRUE),
  (141, 13, 'Salsas y aderezos', 'Aderezo', 'Salsas y aderezos', 'Salsas y aderezos', 8.00, TRUE, TRUE, TRUE),
  (142, 13, 'Salsas y aderezos', 'Chiles tostados', 'Salsas y aderezos', 'Salsas y aderezos', 8.00, TRUE, TRUE, TRUE),
  (143, 13, 'Salsas y aderezos', 'Wasabe', 'Salsas y aderezos', 'Salsas y aderezos', 20.00, TRUE, TRUE, TRUE),
  (144, 13, 'Salsas y aderezos', 'Gary', 'Salsas y aderezos', 'Salsas y aderezos', 20.00, TRUE, TRUE, TRUE),
  (145, 13, 'Salsas y aderezos', 'Shirasha', 'Salsas y aderezos', 'Salsas y aderezos', 20.00, FALSE, TRUE, TRUE),
  (146, 13, 'Salsas y aderezos', 'Salsa chipotle', 'Salsas y aderezos', 'Salsas y aderezos', 20.00, TRUE, TRUE, TRUE),
  (147, 13, 'Salsas y aderezos', 'Salsa Kin', 'Salsas y aderezos', 'Salsas y aderezos', 30.00, TRUE, TRUE, TRUE),
  (148, 13, 'Salsas y aderezos', 'Salsa de anguila', 'Salsas y aderezos', 'Salsas y aderezos', 35.00, TRUE, TRUE, TRUE),
  (149, 13, 'Proteínas', 'Orden extra de carne', 'Proteínas', 'Pollo, cerdo o res', 30.00, TRUE, TRUE, TRUE),
  (150, 13, 'Proteínas', 'Camarón', 'Proteínas', 'Proteína extra', 60.00, FALSE, TRUE, TRUE),
  (151, 13, 'Proteínas', 'Salmón', 'Proteínas', 'Proteína extra', 60.00, TRUE, TRUE, TRUE),
  (152, 13, 'Proteínas', 'Atún', 'Proteínas', 'Proteína extra', 60.00, TRUE, TRUE, TRUE),
  (153, 13, 'Complementos', 'Ajo', 'Complementos', 'Complemento extra', 20.00, TRUE, TRUE, TRUE),
  (154, 13, 'Complementos', 'Pasta Tampico', 'Complementos', 'Complemento extra', 35.00, TRUE, TRUE, TRUE),
  (155, 13, 'Complementos', 'Massago', 'Complementos', 'Complemento extra', 40.00, FALSE, TRUE, TRUE);

SELECT setval('productos_id_seq', (SELECT MAX(id) FROM productos));

-- =============================================================================
-- 4. VARIANTES DE TAMAÑO EN BEBIDAS (Té Verde y Kalpis: Chico / Grande)
-- =============================================================================
INSERT INTO producto_variantes (producto_id, nombre, abreviatura, precio, activa) VALUES
  (131, 'Chico',  'CH',   40.00, TRUE),
  (131, 'Grande', 'GRDE', 70.00, TRUE),
  (132, 'Chico',  'CH',   50.00, TRUE),
  (132, 'Grande', 'GRDE', 90.00, TRUE);

-- =============================================================================
-- 5. PAQUETES OFICIALES (Paquetes A, B, C, D, H, 1, 2 y Paquete Sushi 5x4)
-- =============================================================================
INSERT INTO paquetes (id, producto_id, nombre, descripcion, tipo_precio, precio_fijo, producto_gratis, se_eligen, se_pagan, activo) VALUES
  (1, 123, 'Paquete Sushi', '5 barras y paga solo 4 barras (gratis la de menor precio)', 'regla', NULL, TRUE, 5, 4, TRUE),
  (2, 118, 'Paquete A', 'Yakimeshi sencillo, 3 brochetas de queso', 'fijo', 140.00, FALSE, 2, 2, TRUE),
  (3, 119, 'Paquete B', 'Sopa Misoshiro, 3 brochetas de queso, 1 California Roll', 'fijo', 220.00, FALSE, 3, 3, TRUE),
  (4, 120, 'Paquete C', 'Rollito primavera, Yakimeshi', 'fijo', 98.00, FALSE, 2, 2, TRUE),
  (5, 121, 'Paquete D', 'Plato Kin, 2 brochetas de queso, Plato Kin de una carne, Sopa Misoshiro', 'fijo', 200.00, FALSE, 3, 3, TRUE),
  (6, 122, 'Paquete H', '1 California Roll, 3 brochetas de queso', 'fijo', 175.00, FALSE, 2, 2, TRUE),
  (7, 124, 'Paquete 1', '1 Sushi Acapulco, 1 Yakimeshi de res', 'fijo', 195.00, FALSE, 2, 2, TRUE),
  (8, 125, 'Paquete 2', '1 Sushi Philadelphia, 1 Sushi Acapulco, 1 Yakimeshi de res, 2 refrescos', 'fijo', 295.00, FALSE, 3, 3, TRUE);

SELECT setval('paquetes_id_seq', (SELECT MAX(id) FROM paquetes));

INSERT INTO paquete_items (paquete_id, producto_id, nombre_platillo, subtitulo, cantidad) VALUES
  (1, NULL, 'Barras de sushi a elegir', '5 barras y paga solo 4 (gratis la de menor precio)', 5),
  (2, 101, 'Yakimeshi sencillo', 'Arroz oriental con verduras', 1),
  (2, 78, 'Kushiage Queso manchego', '3 brochetas de queso', 1),
  (2, 134, 'Refresco 335ml', 'Incluido en el paquete', 1),
  (3, 114, 'Misoshiro', 'Sopa tradicional', 1),
  (3, 78, 'Kushiage Queso manchego', '3 brochetas de queso', 1),
  (3, 4, 'California Roll', '10 piezas', 1),
  (3, 134, 'Refresco 335ml', 'Incluido en el paquete', 1),
  (4, 66, 'Rollito primavera', 'Taquitos rellenos de verduras', 1),
  (4, 101, 'Yakimeshi sencillo', 'Arroz oriental', 1),
  (4, 134, 'Refresco 335ml', 'Incluido en el paquete', 1),
  (5, 51, 'Plato Kin de 1 carne', 'Con Yakimeshi y ensalada', 1),
  (5, 78, 'Kushiage Queso manchego', '2 brochetas de queso', 1),
  (5, 114, 'Misoshiro', 'Sopa tradicional', 1),
  (5, 134, 'Refresco 335ml', 'Incluido en el paquete', 1),
  (6, 4, 'California Roll', '10 piezas', 1),
  (6, 78, 'Kushiage Queso manchego', '3 brochetas de queso', 1),
  (6, 134, 'Refresco 335ml', 'Incluido en el paquete', 1),
  (7, 1, 'Acapulco Roll', '10 piezas', 1),
  (7, 103, 'Yakimeshi con 1 carne (res)', 'Arroz oriental con res', 1),
  (7, 134, 'Refresco 335ml', 'Incluido en el paquete', 1),
  (8, 37, 'Philadelphia Roll', '10 piezas', 1),
  (8, 1, 'Acapulco Roll', '10 piezas', 1),
  (8, 103, 'Yakimeshi con 1 carne (res)', 'Arroz oriental con res', 1),
  (8, 134, 'Refresco 335ml', '2 refrescos incluidos', 2);

-- =============================================================================
-- 6. PROMOCIÓN 2x1 EN ROLLOS (Válida únicamente Lunes y Martes, cobra el mayor)
-- =============================================================================
INSERT INTO promociones (id, nombre, tipo_descuento, cobra_mayor_precio, valor_descripcion, porcentaje_desc, fecha_inicio, fecha_fin, activa) VALUES
  (1, 'Promoción 2x1 en Rollos', '2x1', TRUE, 'Lleva 2 rollos y paga el de mayor precio', NULL, '2026-01-01', NULL, TRUE);

SELECT setval('promociones_id_seq', (SELECT MAX(id) FROM promociones));

-- Días válidos: 1 = Lunes, 2 = Martes
INSERT INTO promocion_dias (promocion_id, dia_semana, codigo_dia) VALUES
  (1, 1, 'Lun'),
  (1, 2, 'Mar');

-- Los 50 rollos participantes (Barra de Sushi, Empanizados y Afrutados)
INSERT INTO promocion_productos (promocion_id, producto_id) VALUES
  (1, 1),
  (1, 2),
  (1, 3),
  (1, 4),
  (1, 5),
  (1, 6),
  (1, 7),
  (1, 8),
  (1, 9),
  (1, 10),
  (1, 11),
  (1, 12),
  (1, 13),
  (1, 14),
  (1, 15),
  (1, 16),
  (1, 17),
  (1, 18),
  (1, 19),
  (1, 20),
  (1, 21),
  (1, 22),
  (1, 23),
  (1, 24),
  (1, 25),
  (1, 26),
  (1, 27),
  (1, 28),
  (1, 29),
  (1, 30),
  (1, 31),
  (1, 32),
  (1, 33),
  (1, 34),
  (1, 35),
  (1, 36),
  (1, 37),
  (1, 38),
  (1, 39),
  (1, 40),
  (1, 41),
  (1, 42),
  (1, 43),
  (1, 44),
  (1, 45),
  (1, 46),
  (1, 47),
  (1, 48),
  (1, 49),
  (1, 50),
  (1, 51),
  (1, 52),
  (1, 53),
  (1, 54),
  (1, 55);

-- =============================================================================
-- 7. INICIALIZACIÓN LIMPIA DE VENTAS Y ENTREGAS (SIN HISTORIAL PREVIO)
-- El contador de folios arranca desde #0001 para la primera venta real
-- =============================================================================
SELECT setval('seq_folio_venta', 1, false);

COMMIT;
