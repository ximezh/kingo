import { reactive } from 'vue'

export function formatearDescripcionCatalogo(categoria, descripcion) {
  const desc = String(descripcion || '').trim()
  if (!desc) return ''
  const esRollo = ['Barra de Sushi', 'Empanizados', 'Afrutados'].includes(categoria)
  if (!esRollo) return desc
  if (desc.startsWith('D:') || desc.includes('A:')) return desc
  const idx = desc.indexOf('.')
  if (idx > 0 && idx < desc.length - 1) {
    const dentro = desc.slice(0, idx).trim()
    const afuera = desc.slice(idx + 1).trim()
    return `D: ${dentro}. A: ${afuera}`
  }
  return `D: ${desc}`
}

export const MENU_OFICIAL_JSON = {
  categorias: [
    {
      categoria: 'Barra de Sushi',
      nota: '10 piezas por rollo',
      productos: [
        { nombre: 'Acapulco Roll', precio: 110, descripcion: 'D: Camarón, queso y pepino. A: Ajonjolí', id: 1 },
        { nombre: 'Avocado Roll', precio: 140, descripcion: 'D: Anguila, queso y pepino. A: Cubierto de aguacate', id: 2 },
        { nombre: 'Avocado Recargado', precio: 145, descripcion: 'D: Surimi, philadelphia y pepino. A: Aguacate, Tampico y cebollín', id: 3 },
        { nombre: 'California Roll', precio: 110, descripcion: 'D: Surimi, pepino y aguacate. A: Ajonjolí', id: 4 },
        { nombre: 'California Especial', precio: 140, descripcion: 'D: Surimi, pepino y aguacate. A: Massago (hueva de pez)', id: 5 },
        { nombre: 'Cani Roll', precio: 110, descripcion: 'D: Queso y pepino. A: Envuelto en cangrejo', id: 6 },
        { nombre: 'Carrusel Roll', precio: 135, descripcion: 'D: Surimi y pepino. A: Salmón, queso, aguacate y massago', id: 7 },
        { nombre: 'Eby Fry Roll', precio: 125, descripcion: 'D: Camarón empanizado, aguacate y queso. A: Ajonjolí', id: 8 },
        { nombre: 'Futomaki Roll', precio: 140, descripcion: 'D: Camarón, pepino, queso, aguacate, zanahoria y ajonjolí. A: Alga marina', id: 9 },
        { nombre: 'Futomaki Recargado', precio: 150, descripcion: 'D: Salmón, surimi, massago, camarón, queso, pepino, aguacate y zanahoria. A: Alga marina', id: 10 },
        { nombre: 'Joshi Roll', precio: 130, descripcion: 'D: Surimi, aguacate y pepino. A: Envuelto en queso crema', id: 11 },
        { nombre: 'Kakeage Roll', precio: 120, descripcion: 'D: Queso y pepino. A: Frituras de verdura', id: 12 },
        { nombre: 'Kamikaze Roll', precio: 145, descripcion: 'D: Salmón y cebollín. A: Queso crema y massago', id: 13 },
        { nombre: 'Kin Sushi Roll', precio: 135, descripcion: 'D: Salmón, pepino y aguacate. A: Envuelto en queso crema', id: 14 },
        { nombre: 'Nemo Roll', precio: 145, descripcion: 'D: Camarón empanizado. A: Salmón, queso crema y salsa de anguila', id: 15 },
        { nombre: 'Oishi Roll', precio: 145, descripcion: 'D: Salmón, cebollín y aguacate. A: Camarón, manchego y aguacate', id: 16 },
        { nombre: 'Otoño Roll', precio: 145, descripcion: 'D: Philadelphia, camarón y aguacate. A: Kakeage y salsa de anguila', id: 17 },
        { nombre: 'Sake Roll', precio: 120, descripcion: 'D: Pepino y queso. A: Salmón fresco', id: 18 },
        { nombre: 'Sake Recargado', precio: 145, descripcion: 'D: Pepino, philadelphia y camarón. A: Salmón y pasta Tampico', id: 19 },
        { nombre: 'Shinsen Roll', precio: 145, descripcion: 'D: Camarón empanizado, aguacate y philadelphia. A: Atún fresco, salsa spicy, cebollín y shishimi', id: 20 },
        { nombre: 'Sunset Roll', precio: 145, descripcion: 'D: Camarón, pepino, aguacate y zanahoria. A: Queso crema y massago', id: 21 },
        { nombre: 'Tampico Roll', precio: 120, descripcion: 'D: Pepino y aguacate. A: Pasta Tampico', id: 22 },
        { nombre: 'Tofú Roll', precio: 115, descripcion: 'D: Relleno de tofu, aguacate y camarón. A: Ajonjolí y cebollín', id: 23 },
        { nombre: 'Toreadito Roll', precio: 110, descripcion: 'D: Surimi, queso y chiles toreados. A: Ajonjolí', id: 24 },
        { nombre: 'Tuna Roll', precio: 145, descripcion: 'D: Atún fresco, queso y cebollín. A: Ajonjolí', id: 25 },
        { nombre: 'Vegetariano Roll', precio: 110, descripcion: 'D: Pepino, aguacate, queso y zanahoria. A: Ajonjolí', id: 26 },
        { nombre: 'Volcán Roll', precio: 145, descripcion: 'D: Aguacate, carne de res y chiles toreados. A: Queso gratinado', id: 27 }
      ]
    },
    {
      categoria: 'Empanizados',
      nota: '10 piezas por rollo',
      productos: [
        { nombre: 'Acapulco Recargado', precio: 125, descripcion: 'D: Camarón y queso philadelphia. A: Empanizado crujiente', id: 28 },
        { nombre: 'Bananito Roll', precio: 115, descripcion: 'D: Plátano frito y queso crema. A: Empanizado', id: 29 },
        { nombre: 'Bull Roll', precio: 130, descripcion: 'D: Res, pepino y queso. A: Empanizado con aderezo chipotle', id: 30 },
        { nombre: 'Chicken Breast', precio: 150, descripcion: 'D: Queso manchego, champiñón, zanahoria y cebolla. A: Pechuga de pollo y empanizado', id: 31 },
        { nombre: 'Gyun Roll', precio: 135, descripcion: 'D: Carne de res, queso manchego y cebollín. A: Empanizado y salsa spicy', id: 32 },
        { nombre: 'Irresistible Roll', precio: 140, descripcion: 'D: Camarón empanizado y aguacate. A: Queso crema y empanizado', id: 33 },
        { nombre: 'Larissa Roll', precio: 130, descripcion: 'D: Queso, pepino y aguacate. A: Empanizado y pasta Tampico', id: 34 },
        { nombre: 'Kumano Roll', precio: 145, descripcion: 'D: Res, aguacate y pepino. A: Empanizado y queso manchego gratinado', id: 35 },
        { nombre: 'Madan Roll', precio: 125, descripcion: 'D: Aguacate y queso philadelphia. A: Empanizado dorado', id: 36 },
        { nombre: 'Manchego Roll', precio: 125, descripcion: 'D: Queso manchego, pepino y aguacate. A: Empanizado', id: 37 },
        { nombre: 'Mar y Tierra', precio: 140, descripcion: 'D: Camarón, carne de res y queso crema. A: Empanizado', id: 38 },
        { nombre: 'Philadelphia Roll', precio: 135, descripcion: 'D: Salmón y queso crema. A: Empanizado', id: 39 },
        { nombre: 'Pollito Roll', precio: 145, descripcion: 'D: Pechuga de pollo, zanahoria y aguacate. A: Queso crema y empanizado', id: 40 },
        { nombre: 'Sakawa Roll', precio: 150, descripcion: 'D: Camarón, res y pollo. A: Empanizado y queso manchego gratinado', id: 41 },
        { nombre: 'Sushi Ball', precio: 145, descripcion: 'D: Camarón, surimi y queso crema. A: Empanizado con pasta Tampico o salsa de anguila', id: 42 },
        { nombre: 'Tabatha Roll', precio: 135, descripcion: 'D: Relleno de camarón, aguacate y queso crema. A: Empanizado', id: 43 }
      ]
    },
    {
      categoria: 'Afrutados',
      nota: '10 piezas por rollo',
      productos: [
        { nombre: 'Afrutado', precio: 145, descripcion: 'D: Camarón empanizado y philadelphia. A: Mango, plátano, kiwi y salsa de tamarindo', id: 53 },
        { nombre: 'Atami', precio: 135, descripcion: 'D: Camarón empanizado. A: Queso philadelphia, plátano frito y salsa de anguila', id: 54 },
        { nombre: 'Banana Recargado', precio: 135, descripcion: 'D: Queso, pepino y camarón. A: Plátano frito y salsa de anguila', id: 55 },
        { nombre: 'Banana Roll', precio: 115, descripcion: 'D: Queso crema y pepino. A: Envuelto en plátano frito', id: 44 },
        { nombre: 'Delicioso Roll', precio: 145, descripcion: 'D: Mango y camarón. A: Queso crema, nuez y salsa de anguila', id: 45 },
        { nombre: 'Harakiri Roll', precio: 140, descripcion: 'D: Surimi, manzana y philadelphia. A: Kakeage y salsa de anguila', id: 46 },
        { nombre: 'Hawaiian Roll', precio: 135, descripcion: 'D: Surimi, queso y piña. A: Ajonjolí tostado', id: 47 },
        { nombre: 'Kiwi Roll', precio: 145, descripcion: 'D: Surimi y queso philadelphia. A: Kiwi fresco y salsa de fresa', id: 48 },
        { nombre: 'Mango Recargado', precio: 145, descripcion: 'D: Camarón empanizado, philadelphia y aguacate. A: Philadelphia, mango y salsa de tamarindo', id: 49 },
        { nombre: 'Mango Roll', precio: 135, descripcion: 'D: Camarón empanizado y pepino. A: Mango, ajonjolí, shishimi y salsa de tamarindo', id: 50 },
        { nombre: 'Ringo Roll', precio: 145, descripcion: 'D: Queso philadelphia, manzana, salmón y cebollín. A: Queso crema y coco rallado', id: 51 },
        { nombre: 'Tropical Roll', precio: 145, descripcion: 'D: Piña, surimi y pepino. A: Queso philadelphia y coco tostado', id: 52 }
      ]
    },
    {
      categoria: 'Plato Kin',
      nota: 'Ensalada de lechuga y zanahoria, arroz Yakimeshi y carne a la plancha en salsa dulce',
      productos: [
        { nombre: 'Plato Kin de 1 carne', precio: 95, descripcion: 'Carne a elegir (pollo, cerdo o res) a la plancha en salsa dulce con arroz Yakimeshi y ensalada', id: 56 },
        { nombre: 'Plato Kin de 2 carnes', precio: 115, descripcion: 'Combinación de 2 carnes (pollo, cerdo o res) con arroz Yakimeshi y ensalada fresca', id: 57 },
        { nombre: 'Plato Kin Especial de 3 carnes', precio: 145, descripcion: 'Pollo, cerdo y res a la plancha en salsa dulce con arroz Yakimeshi y ensalada', id: 58 },
        { nombre: 'Plato Kin de camarón', precio: 155, descripcion: 'Camarón a la plancha en salsa dulce de la casa con arroz Yakimeshi y ensalada', id: 59 },
        { nombre: 'Plato Kin de camarón y piña', precio: 170, descripcion: 'Camarón y piña asada a la plancha en salsa dulce con arroz Yakimeshi y ensalada', id: 60 },
        { nombre: 'Plato Kin de salmón', precio: 155, descripcion: 'Filete de salmón a la plancha en salsa dulce con arroz Yakimeshi y ensalada', id: 61 },
        { nombre: 'Plato Kin Mariscos', precio: 180, descripcion: 'Combinación de camarón, salmón y surimi a la plancha con arroz Yakimeshi y ensalada', id: 62 },
        { nombre: 'Plato Kin con piña', precio: 95, descripcion: 'Carne a la plancha con piña caramelizada, arroz Yakimeshi y ensalada', id: 63 },
        { nombre: 'Plato Kin Atún', precio: 155, descripcion: 'Medallón de atún a la plancha con salsa dulce, arroz Yakimeshi y ensalada', id: 64 }
      ]
    },
    {
      categoria: 'Kushiages',
      nota: 'Brochetas empanizadas (3 piezas)',
      productos: [
        { nombre: 'Kushiage Queso manchego', precio: 67, descripcion: '3 brochetas empanizadas de queso manchego fundido con salsa katsu', id: 65 },
        { nombre: 'Kushiage Plátano', precio: 67, descripcion: '3 brochetas empanizadas de plátano macho maduro', id: 66 },
        { nombre: 'Kushiage Plátano con queso manchego', precio: 105, descripcion: '3 brochetas empanizadas de plátano macho rellenas de queso manchego', id: 67 },
        { nombre: 'Kushiage Philadelphia', precio: 105, descripcion: '3 brochetas empanizadas de queso crema philadelphia', id: 68 },
        { nombre: 'Kushiage Pollo', precio: 105, descripcion: '3 brochetas empanizadas de pechuga de pollo marinada', id: 69 },
        { nombre: 'Kushiage Camarón', precio: 95, descripcion: '3 brochetas empanizadas de camarón pacotilla', id: 70 },
        { nombre: 'Kushiage Camarón con queso', precio: 105, descripcion: '3 brochetas empanizadas de camarón con queso crema', id: 71 },
        { nombre: 'Kushiage Surimi', precio: 95, descripcion: '3 brochetas empanizadas de surimi de cangrejo', id: 72 },
        { nombre: 'Kushiage Salmón', precio: 95, descripcion: '3 brochetas empanizadas de dados de salmón fresco', id: 73 },
        { nombre: 'Kushiage Salmón con queso', precio: 105, descripcion: '3 brochetas empanizadas de salmón con queso crema', id: 74 }
      ]
    },
    {
      categoria: 'Sopas',
      nota: '',
      productos: [
        { nombre: 'Misoshiro', precio: 48, descripcion: 'Caldo tradicional de pasta de soya (miso) con tofu en cubos, cebollín y fideos transparentes', id: 75 },
        { nombre: 'Wacame soup', precio: 48, descripcion: 'Sopa ligera de alga marina wakame con champiñones, ajonjolí y fideos transparentes', id: 76 },
        { nombre: 'Sumashi', precio: 100, descripcion: 'Sopa clara japonesa de mariscos con camarón, salmón, surimi y fideos cristalinos', id: 77 },
        { nombre: 'Tori Soup', precio: 90, descripcion: 'Caldo reconfortante con pollo en trozos, arroz al vapor, huevo, champiñón y cebollín', id: 78 },
        { nombre: 'Tempura Udon', precio: 125, descripcion: 'Sopa de tallarines gruesos udon en caldo dashi coronada con camarón capeado en tempura', id: 79 },
        { nombre: 'Ramen', precio: 100, descripcion: 'Tazón de fideos ramen en caldo sazonado con verduras frescas y proteína a elegir (cerdo o pollo)', id: 80 },
        { nombre: 'Yakisoba', precio: 125, descripcion: 'Tallarines orientales salteados a la plancha con verduras en salsa yakisoba y cerdo o pollo', id: 81 }
      ]
    },
    {
      categoria: 'Yakimeshi',
      nota: 'Arroz oriental con verduras y sazonado con soya',
      productos: [
        { nombre: 'Gohan', precio: 55, descripcion: 'Tazón de arroz blanco japonés cocido al vapor con toque de ajonjolí', id: 82 },
        { nombre: 'Yakimeshi sencillo', precio: 60, descripcion: 'Arroz oriental salteado a la plancha con calabaza, zanahoria, cebolla, huevo y soya', id: 83 },
        { nombre: 'Yakimeshi con 1 carne', precio: 75, descripcion: 'Arroz oriental salteado con verduras y 1 carne a elegir: pollo, cerdo o res', id: 84 },
        { nombre: 'Yakimeshi con 2 carnes', precio: 90, descripcion: 'Arroz oriental salteado con verduras y combinación de 2 carnes a elegir', id: 85 },
        { nombre: 'Yakimeshi con 3 carnes', precio: 100, descripcion: 'Arroz oriental salteado con verduras, pollo, cerdo y res', id: 86 },
        { nombre: 'Yakimeshi con pasta Tampico', precio: 95, descripcion: 'Arroz oriental con verduras coronado con porción generosa de pasta Tampico', id: 87 },
        { nombre: 'Yakimeshi Especial', precio: 110, descripcion: 'Arroz oriental con salmón a la plancha, pasta Tampico, aguacate, ajonjolí y cebollín', id: 88 },
        { nombre: 'Yakimeshi con camarón', precio: 100, descripcion: 'Arroz oriental salteado a la plancha con camarones y verduras', id: 89 },
        { nombre: 'Yakimeshi Atún', precio: 100, descripcion: 'Arroz oriental salteado con dados de atún a la plancha y cebollín', id: 90 },
        { nombre: 'Yakimeshi con salmón', precio: 100, descripcion: 'Arroz oriental salteado con trozos de salmón a la plancha y verduras', id: 91 },
        { nombre: 'Yakimeshi con surimi', precio: 100, descripcion: 'Arroz oriental salteado con surimi de cangrejo y verduras', id: 92 },
        { nombre: 'Yakimeshi con mariscos', precio: 115, descripcion: 'Arroz oriental salteado con camarón, salmón, calamar y surimi', id: 93 },
        { nombre: 'Yakimeshi Hawaiiano', precio: 110, descripcion: 'Arroz oriental salteado con piña dulce, jamón, queso philadelphia y ajonjolí', id: 94 },
        { nombre: 'Yakimeshi con ajo', precio: 85, descripcion: 'Arroz oriental salteado con láminas de ajo dorado y mantequilla de soya', id: 95 },
        { nombre: 'Yakimeshi Camarón empanizado', precio: 125, descripcion: 'Arroz oriental con verduras coronado con camarones empanizados crujientes', id: 96 }
      ]
    },
    {
      categoria: 'Ensaladas',
      nota: '',
      productos: [
        { nombre: 'Ensalada Kani', precio: 115, descripcion: 'Mezcla de lechuga fresca, zanahoria, cebolla morada, surimi y pasta Tampico', id: 97 },
        { nombre: 'Ensalada Cruji', precio: 115, descripcion: 'Fideos de arroz crujientes, col blanca fileteada y pechuga de pollo con vinagreta oriental', id: 98 },
        { nombre: 'Ensalada de Surimi', precio: 110, descripcion: 'Surimi finamente fileteado marinado con cebollín, pimiento morrón y aderezo de limón', id: 99 },
        { nombre: 'Ensalada de Pollo', precio: 125, descripcion: 'Combinación de lechugas y vegetales frescos con fajitas de pechuga de pollo a la plancha', id: 100 },
        { nombre: 'Ensalada de Salmón', precio: 150, descripcion: 'Lechuga fresca con salmón a la plancha, nuez picada, aceitunas negras y aderezo mil islas', id: 101 },
        { nombre: 'Champiñones empanizados', precio: 85, descripcion: 'Champiñones enteros rellenos de pasta Tampico y queso crema, empanizados al momento', id: 102 },
        { nombre: 'Rollito primavera', precio: 85, descripcion: '2 rollitos crujientes de pasta de arroz rellenos de verduras orientales con salsa agridulce', id: 103 }
      ]
    },
    {
      categoria: 'Especialidades',
      nota: '',
      productos: [
        { nombre: 'Teppanyaki sencillo', precio: 125, descripcion: 'Verduras frescas asadas a la plancha sazonadas con sake, mantequilla y salsa de soya', id: 104 },
        { nombre: 'Teppanyaki con pollo', precio: 150, descripcion: 'Verduras y pechuga de pollo a la plancha sazonadas con sake y salsa de soya', id: 105 },
        { nombre: 'Teppanyaki con camarón', precio: 190, descripcion: 'Verduras y camarones a la plancha flameados con sake y salsa de soya', id: 106 },
        { nombre: 'Teppanyaki con salmón', precio: 190, descripcion: 'Verduras y filete de salmón a la plancha sazonados con sake y soya', id: 107 },
        { nombre: 'Teppanyaki mixto', precio: 220, descripcion: 'Combinación de pollo, res, camarón y verduras asadas a la plancha con sake y soya', id: 108 },
        { nombre: 'Teppanyaki atún', precio: 190, descripcion: 'Verduras y medallón de atún fresco a la plancha con sake y salsa de soya', id: 109 },
        { nombre: 'Tempura capeado de verdura', precio: 140, descripcion: 'Selección de vegetales frescos capeados en masa tempura ligera con salsa tentsuyu', id: 110 },
        { nombre: 'Tempura capeado de camarón', precio: 180, descripcion: 'Camarones grandes y vegetales capeados al estilo tempura tradicional japonés', id: 111 },
        { nombre: 'Tempura capeado mixto', precio: 200, descripcion: 'Combinación de camarón, pescado blanco y vegetales capeados en tempura crujiente', id: 112 },
        { nombre: 'Curry de pollo', precio: 125, descripcion: 'Pechuga de pollo con verduras en salsa curry japonés servida sobre arroz gohan al vapor', id: 113 },
        { nombre: 'Chicken Red', precio: 125, descripcion: 'Pechuga de pollo capeada con verduras sobre arroz al vapor, bañada en salsa agridulce con piña', id: 114 },
        { nombre: 'Catsu Don', precio: 125, descripcion: 'Milanesa de cerdo empanizada (tonkatsu) bañada en salsa de soya dulce sobre arroz al vapor', id: 115 },
        { nombre: 'Vegetariano Especial', precio: 125, descripcion: 'Salteado de brócoli, champiñón, calabaza y zanahoria con soya sobre cama de arroz al vapor', id: 116 },
        { nombre: 'Une Code', precio: 130, descripcion: 'Bolitas de pollo rellenas de queso manchego ligeramente picantes con arroz Yakimeshi y ensalada', id: 117 }
      ]
    },
    {
      categoria: 'Paquetes',
      nota: 'Todos los paquetes incluyen 1 refresco (355 ml) a excepción del Paquete Sushi',
      productos: [
        { nombre: 'Paquete A', precio: 140, descripcion: 'Incluye: 1 Yakimeshi sencillo, 3 brochetas de queso manchego y 1 refresco de 355 ml', id: 118 },
        { nombre: 'Paquete B', precio: 220, descripcion: 'Incluye: 1 Sopa Misoshiro, 3 brochetas de queso, 1 California Roll y 1 refresco de 355 ml', id: 119 },
        { nombre: 'Paquete C', precio: 98, descripcion: 'Incluye: 1 orden de Rollito primavera, 1 Yakimeshi sencillo y 1 refresco de 355 ml', id: 120 },
        { nombre: 'Paquete D', precio: 200, descripcion: 'Incluye: 1 Plato Kin de 1 carne, 2 brochetas de queso, 1 Sopa Misoshiro y 1 refresco de 355 ml', id: 121 },
        { nombre: 'Paquete H', precio: 175, descripcion: 'Incluye: 1 California Roll, 3 brochetas de queso manchego y 1 refresco de 355 ml', id: 122 },
        { nombre: 'Paquete Sushi', precio: null, descripcion: 'Elige 5 barras de sushi del menú y paga solo 4 (gratis el rollo de menor precio)', id: 123 },
        { nombre: 'Paquete 1', precio: 195, descripcion: 'Incluye: 1 Acapulco Roll, 1 Yakimeshi de res y 1 refresco de 355 ml', id: 124 },
        { nombre: 'Paquete 2', precio: 295, descripcion: 'Incluye: 1 Philadelphia Roll, 1 Acapulco Roll, 1 Yakimeshi de res y 2 refrescos de 355 ml', id: 125 }
      ]
    },
    {
      categoria: 'Postres',
      nota: '',
      productos: [
        { nombre: 'Galletas de la suerte', precio: 10, descripcion: 'Crujientes galletas orientales de vainilla con mensaje de la suerte en su interior', id: 126 },
        { nombre: 'Helado de vainilla', precio: 50, descripcion: 'Bola de helado cremoso de vainilla decorada con jarabe de fresa, chocolate o cajeta', id: 127 },
        { nombre: 'Pockys', precio: 65, descripcion: 'Caja de palitos de galleta japonesa cubiertos de crema de chocolate, fresa o matcha', id: 128 },
        { nombre: 'Tempura Helado', precio: 75, descripcion: 'Bola de helado de vainilla envuelta en cubierta caliente y crujiente de tempura con chocolate o fresa', id: 129 },
        { nombre: 'Banana Ice', precio: 75, descripcion: 'Plátano macho dorado acompañado de una bola de helado de vainilla, nuez y cajeta', id: 130 }
      ]
    },
    {
      categoria: 'Bebidas',
      nota: 'CH = chico, GRDE = grande',
      productos: [
        {
          nombre: 'Té Verde',
          precio: 40,
          descripcion: 'Té verde japonés helado ligeramente endulzado (Chico $40 · Grande $70)',
          variantes: [
            { nombre: 'Chico', precio: 40 },
            { nombre: 'Grande', precio: 70 }
          ],
          id: 131
        },
        {
          nombre: 'Kalpis',
          precio: 50,
          descripcion: 'Bebida refrescante japonesa tradicional a base de leche y arroz (Chico $50 · Grande $90)',
          variantes: [
            { nombre: 'Chico', precio: 50 },
            { nombre: 'Grande', precio: 90 }
          ],
          id: 132
        },
        { nombre: 'Ramune', precio: 65, descripcion: 'Soda japonesa importada de 200 ml con sello tradicional de canica de cristal', id: 133 },
        { nombre: 'Refresco 335ml', precio: 25, descripcion: 'Refresco en lata de 355 ml bien frío (Coca-Cola, Fanta de naranja o Manzana)', id: 134 },
        { nombre: 'Delawere 600ml', precio: 30, descripcion: 'Refresco sabor uva Delaware Punch en botella de 600 ml', id: 135 },
        { nombre: 'Coca Light 600ml', precio: 30, descripcion: 'Refresco Coca-Cola Light sin calorías en botella de 600 ml', id: 136 },
        { nombre: 'Agua embotellada', precio: 25, descripcion: 'Agua natural purificada en botella de 600 ml', id: 137 },
        { nombre: 'Fuze Tea', precio: 35, descripcion: 'Té negro helado embotellado sabor durazno o limón de 600 ml', id: 138 },
        { nombre: 'Jugo Foco', precio: 45, descripcion: 'Néctar oriental importado en lata con trozos de fruta natural (coco, mango o lichi)', id: 139 }
      ]
    },
    {
      categoria: 'Orden Extra',
      nota: 'Complementos, salsas y proteínas adicionales',
      productos: [
        { subcategoria: 'Salsas y aderezos', nombre: 'Soya de limón (Ponzu)', precio: 8, descripcion: 'Salsa ponzu japonesa de soya preparada con toque cítrico de limón natural', id: 140 },
        { subcategoria: 'Salsas y aderezos', nombre: 'Aderezo', precio: 8, descripcion: 'Aderezo cremoso de la casa para acompañar rollos empanizados y kushiages', id: 141 },
        { subcategoria: 'Salsas y aderezos', nombre: 'Chiles tostados', precio: 8, descripcion: 'Chiles serranos toreados a la plancha sazonados con soya y limón', id: 142 },
        { subcategoria: 'Salsas y aderezos', nombre: 'Wasabe', precio: 20, descripcion: 'Porción extra de pasta picante de rábano verde japonés (wasabi)', id: 143 },
        { subcategoria: 'Salsas y aderezos', nombre: 'Gary', precio: 20, descripcion: 'Porción extra de jengibre rosado dulce encurtido en láminas finas', id: 144 },
        { subcategoria: 'Salsas y aderezos', nombre: 'Shirasha', precio: 20, descripcion: 'Salsa picante oriental Sriracha de chiles rojos maduros', id: 145 },
        { subcategoria: 'Salsas y aderezos', nombre: 'Salsa chipotle', precio: 20, descripcion: 'Aderezo cremoso picante de chile chipotle adobado', id: 146 },
        { subcategoria: 'Salsas y aderezos', nombre: 'Salsa Kin', precio: 30, descripcion: 'Salsa especial dulce de la casa para teppanyaki, yakimeshi y plato Kin', id: 147 },
        { subcategoria: 'Salsas y aderezos', nombre: 'Salsa de anguila', precio: 35, descripcion: 'Salsa dulce japonesa kabayaki de reducción de soya para rollos y brochetas', id: 148 },
        { subcategoria: 'Proteínas', nombre: 'Orden extra de carne', precio: 30, descripcion: 'Porción extra de proteína a la plancha (pollo, cerdo o res) para tu platillo', id: 149 },
        { subcategoria: 'Proteínas', nombre: 'Camarón', precio: 60, descripcion: 'Porción adicional de camarón para agregar a tu rollo, yakimeshi o sopa', id: 150 },
        { subcategoria: 'Proteínas', nombre: 'Salmón', precio: 60, descripcion: 'Porción adicional de salmón fresco para rollo, yakimeshi o teppanyaki', id: 151 },
        { subcategoria: 'Proteínas', nombre: 'Atún', precio: 60, descripcion: 'Porción adicional de medallón de atún fresco para tu platillo', id: 152 },
        { subcategoria: 'Complementos', nombre: 'Ajo', precio: 20, descripcion: 'Sazonado extra de ajo dorado salteado a la plancha', id: 153 },
        { subcategoria: 'Complementos', nombre: 'Pasta Tampico', precio: 35, descripcion: 'Porción extra de pasta cremosa Tampico de surimi finamente picado', id: 154 },
        { subcategoria: 'Complementos', nombre: 'Massago', precio: 40, descripcion: 'Porción extra de hueva de pez capelán (massago) para cubrir o rellenar', id: 155 }
      ]
    }
  ]
}

export const CATEGORIAS_NOTAS_MAP = Object.fromEntries(
  MENU_OFICIAL_JSON.categorias.map((c) => [c.categoria, c.nota || ''])
)

export const CATEGORIAS_MOCK = [
  'Todas',
  'Promociones',
  ...MENU_OFICIAL_JSON.categorias.map((c) => c.categoria)
]

const CATEGORIAS_CON_EXTRAS = new Set([
  'Barra de Sushi',
  'Empanizados',
  'Afrutados',
  'Plato Kin',
  'Yakimeshi',
  'Especialidades',
  'Ensaladas',
  'Sopas'
])

export const CATEGORIAS_SOLO_PLATILLOS = [
  'Barra de Sushi',
  'Empanizados',
  'Afrutados',
  'Plato Kin',
  'Kushiages',
  'Sopas',
  'Yakimeshi',
  'Ensaladas',
  'Especialidades'
]

const STORAGE_PRODUCTOS_KEY = 'kingo_productos_v3'
const STORAGE_PAQUETES_KEY = 'kingo_paquetes_v3'
const STORAGE_VARIANTES_KEY = 'kingo_variantes_v2'
const STORAGE_EXTRAS_KEY = 'kingo_extras_v3'

const MAPA_BASE_POR_ID = new Map()

const PRODUCTOS_BASE = MENU_OFICIAL_JSON.categorias.flatMap((catObj) =>
  catObj.productos.map((prod) => {
    const esPaquete = catObj.categoria === 'Paquetes'
    const item = {
      id: prod.id,
      nombre: prod.nombre,
      categoria: catObj.categoria,
      subcategoria: prod.subcategoria || null,
      presentacion: catObj.nota || prod.subcategoria || catObj.categoria,
      descripcion: formatearDescripcionCatalogo(catObj.categoria, prod.descripcion || ''),
      precio: prod.precio ?? (prod.variantes ? prod.variantes[0].precio : 440),
      precioNulo: prod.precio === null && !prod.variantes,
      variantes: prod.variantes || null,
      // Los paquetes usan ilustración vectorial naranja/blanca; los platillos 1..155 usan su foto real
      imagenUrl: esPaquete ? null : prod.imagenUrl || `/img/productos/${prod.id}.jpg?v=2`,
      esVector: esPaquete,
      tieneFoto: !esPaquete,
      activo: true,
      permiteExtras: CATEGORIAS_CON_EXTRAS.has(catObj.categoria),
      enPaquete: prod.id === 1 ? 'Paquete 1' : null,
      tieneVentas: prod.id <= 30
    }
    MAPA_BASE_POR_ID.set(prod.id, item)
    return item
  })
)

function cargarProductosIniciales() {
  try {
    const saved = localStorage.getItem(STORAGE_PRODUCTOS_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p) => {
          const base = MAPA_BASE_POR_ID.get(p.id)
          const cat = p.categoria || base?.categoria || 'Barra de Sushi'
          const esPaquete = cat === 'Paquetes' || cat === 'Promociones'
          const esCustomDataUrl = typeof p.imagenUrl === 'string' && p.imagenUrl.startsWith('data:')
          const descRaw = p.descripcion || base?.descripcion || ''
          return {
            ...p,
            descripcion: formatearDescripcionCatalogo(cat, descRaw),
            imagenUrl: esCustomDataUrl
              ? p.imagenUrl
              : esPaquete
                ? null
                : p.id && p.id <= 155
                  ? `/img/productos/${p.id}.jpg?v=2`
                  : null,
            esVector: !esCustomDataUrl && (esPaquete || !p.id || p.id > 155),
            tieneFoto: Boolean(esCustomDataUrl || (!esPaquete && p.id && p.id <= 155))
          }
        })
      }
    }
  } catch {
    // ignore storage errors
  }
  return PRODUCTOS_BASE.map((p) => ({ ...p }))
}

export const PRODUCTOS_MOCK = reactive(cargarProductosIniciales())

export const ROLLOS_PROMO_MOCK = reactive([])

export function actualizarRollosPromo() {
  const rollos = PRODUCTOS_MOCK.filter(
    (p) => p.activo !== false && ['Barra de Sushi', 'Empanizados', 'Afrutados'].includes(p.categoria)
  ).map((p) => ({
    ...p,
    precioNum: Number(p.precio) || 110
  }))
  ROLLOS_PROMO_MOCK.splice(0, ROLLOS_PROMO_MOCK.length, ...rollos)
}

actualizarRollosPromo()

export function guardarProductosStorage() {
  try {
    localStorage.setItem(STORAGE_PRODUCTOS_KEY, JSON.stringify(PRODUCTOS_MOCK))
  } catch {
    // ignore quota errors
  }
  actualizarRollosPromo()
}

const VARIANTES_BASE = [
  { id: 1, nombre: 'Chico', precio: '$40' },
  { id: 2, nombre: 'Grande', precio: '$70' }
]

function cargarVariantesIniciales() {
  try {
    const saved = localStorage.getItem(STORAGE_VARIANTES_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // ignore
  }
  return VARIANTES_BASE.map((v) => ({ ...v }))
}

export const VARIANTES_TE_VERDE_MOCK = reactive(cargarVariantesIniciales())

const EXTRAS_BASE = MENU_OFICIAL_JSON.categorias
  .find((c) => c.categoria === 'Orden Extra')
  .productos.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    subcategoria: p.subcategoria,
    descripcion: p.descripcion,
    precio: `+$${p.precio}`,
    costo: p.precio,
    tipo: p.subcategoria === 'Proteínas' ? 'proteina' : p.subcategoria === 'Complementos' ? 'ingrediente' : 'complemento',
    seleccionado: false
  }))

function cargarExtrasIniciales() {
  try {
    const saved = localStorage.getItem(STORAGE_EXTRAS_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // ignore
  }
  return EXTRAS_BASE.map((e) => ({ ...e }))
}

export const EXTRAS_DISPONIBLES_MOCK = reactive(cargarExtrasIniciales())

export function guardarVariantesExtrasStorage(nuevasVariantes, nuevosExtras) {
  if (Array.isArray(nuevasVariantes)) {
    VARIANTES_TE_VERDE_MOCK.splice(0, VARIANTES_TE_VERDE_MOCK.length, ...nuevasVariantes)
    try {
      localStorage.setItem(STORAGE_VARIANTES_KEY, JSON.stringify(VARIANTES_TE_VERDE_MOCK))
    } catch {
      // ignore
    }
  }
  if (Array.isArray(nuevosExtras)) {
    EXTRAS_DISPONIBLES_MOCK.splice(0, EXTRAS_DISPONIBLES_MOCK.length, ...nuevosExtras)
    try {
      localStorage.setItem(STORAGE_EXTRAS_KEY, JSON.stringify(EXTRAS_DISPONIBLES_MOCK))
    } catch {
      // ignore
    }
  }
}

const PAQUETES_BASE = [
  {
    id: 123,
    nombre: 'Paquete Sushi',
    detalle: '5 barras (paga 4)',
    precioFijo: 0,
    tipoPrecio: 'regla',
    cantidadBarras: 5,
    reglaActiva: true,
    productoGratis: true,
    seEligen: '5',
    sePagan: '4',
    itemsIncluidos: [
      { id: 101, nombre: 'Barras de sushi a elegir', subtitulo: '5 barras y paga solo 4 (gratis la de menor precio)', cantidad: 5 }
    ]
  },
  {
    id: 118,
    nombre: 'Paquete A',
    detalle: '$140',
    precioFijo: 140,
    tipoPrecio: 'fijo',
    cantidadBarras: 1,
    reglaActiva: false,
    productoGratis: false,
    seEligen: '2',
    sePagan: '2',
    itemsIncluidos: [
      { id: 1181, nombre: 'Yakimeshi sencillo', subtitulo: 'Arroz oriental con verduras', cantidad: 1 },
      { id: 1182, nombre: 'Kushiage Queso manchego', subtitulo: '3 brochetas de queso', cantidad: 1 },
      { id: 1183, nombre: 'Refresco 335ml', subtitulo: 'Incluido en el paquete', cantidad: 1 }
    ]
  },
  {
    id: 119,
    nombre: 'Paquete B',
    detalle: '$220',
    precioFijo: 220,
    tipoPrecio: 'fijo',
    cantidadBarras: 1,
    reglaActiva: false,
    productoGratis: false,
    seEligen: '3',
    sePagan: '3',
    itemsIncluidos: [
      { id: 1191, nombre: 'Misoshiro', subtitulo: 'Sopa tradicional', cantidad: 1 },
      { id: 1192, nombre: 'Kushiage Queso manchego', subtitulo: '3 brochetas de queso', cantidad: 1 },
      { id: 1193, nombre: 'California Roll', subtitulo: '10 piezas', cantidad: 1 },
      { id: 1194, nombre: 'Refresco 335ml', subtitulo: 'Incluido en el paquete', cantidad: 1 }
    ]
  },
  {
    id: 120,
    nombre: 'Paquete C',
    detalle: '$98',
    precioFijo: 98,
    tipoPrecio: 'fijo',
    cantidadBarras: 1,
    reglaActiva: false,
    productoGratis: false,
    seEligen: '2',
    sePagan: '2',
    itemsIncluidos: [
      { id: 1201, nombre: 'Rollito primavera', subtitulo: 'Taquitos rellenos de verduras', cantidad: 1 },
      { id: 1202, nombre: 'Yakimeshi sencillo', subtitulo: 'Arroz oriental', cantidad: 1 },
      { id: 1203, nombre: 'Refresco 335ml', subtitulo: 'Incluido en el paquete', cantidad: 1 }
    ]
  },
  {
    id: 121,
    nombre: 'Paquete D',
    detalle: '$200',
    precioFijo: 200,
    tipoPrecio: 'fijo',
    cantidadBarras: 1,
    reglaActiva: false,
    productoGratis: false,
    seEligen: '3',
    sePagan: '3',
    itemsIncluidos: [
      { id: 1211, nombre: 'Plato Kin de 1 carne', subtitulo: 'Con Yakimeshi y ensalada', cantidad: 1 },
      { id: 1212, nombre: 'Kushiage Queso manchego', subtitulo: '2 brochetas de queso', cantidad: 1 },
      { id: 1213, nombre: 'Misoshiro', subtitulo: 'Sopa tradicional', cantidad: 1 },
      { id: 1214, nombre: 'Refresco 335ml', subtitulo: 'Incluido en el paquete', cantidad: 1 }
    ]
  },
  {
    id: 122,
    nombre: 'Paquete H',
    detalle: '$175',
    precioFijo: 175,
    tipoPrecio: 'fijo',
    cantidadBarras: 1,
    reglaActiva: false,
    productoGratis: false,
    seEligen: '2',
    sePagan: '2',
    itemsIncluidos: [
      { id: 1221, nombre: 'California Roll', subtitulo: '10 piezas', cantidad: 1 },
      { id: 1222, nombre: 'Kushiage Queso manchego', subtitulo: '3 brochetas de queso', cantidad: 1 },
      { id: 1223, nombre: 'Refresco 335ml', subtitulo: 'Incluido en el paquete', cantidad: 1 }
    ]
  },
  {
    id: 124,
    nombre: 'Paquete 1',
    detalle: '$195',
    precioFijo: 195,
    tipoPrecio: 'fijo',
    cantidadBarras: 1,
    reglaActiva: false,
    productoGratis: false,
    seEligen: '2',
    sePagan: '2',
    itemsIncluidos: [
      { id: 1241, nombre: 'Acapulco Roll', subtitulo: '10 piezas', cantidad: 1 },
      { id: 1242, nombre: 'Yakimeshi con 1 carne (res)', subtitulo: 'Arroz oriental con res', cantidad: 1 },
      { id: 1243, nombre: 'Refresco 335ml', subtitulo: 'Incluido en el paquete', cantidad: 1 }
    ]
  },
  {
    id: 125,
    nombre: 'Paquete 2',
    detalle: '$295',
    precioFijo: 295,
    tipoPrecio: 'fijo',
    cantidadBarras: 2,
    reglaActiva: false,
    productoGratis: false,
    seEligen: '3',
    sePagan: '3',
    itemsIncluidos: [
      { id: 1251, nombre: 'Philadelphia Roll', subtitulo: '10 piezas', cantidad: 1 },
      { id: 1252, nombre: 'Acapulco Roll', subtitulo: '10 piezas', cantidad: 1 },
      { id: 1253, nombre: 'Yakimeshi con 1 carne (res)', subtitulo: 'Arroz oriental con res', cantidad: 1 },
      { id: 1254, nombre: 'Refresco 335ml', subtitulo: '2 refrescos incluidos', cantidad: 2 }
    ]
  }
]

function cargarPaquetesIniciales() {
  try {
    const saved = localStorage.getItem(STORAGE_PAQUETES_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // ignore
  }
  return PAQUETES_BASE.map((p) => ({
    ...p,
    itemsIncluidos: (p.itemsIncluidos || []).map((i) => ({ ...i }))
  }))
}

export const PAQUETES_MOCK = reactive(cargarPaquetesIniciales())

export function guardarPaquetesStorage() {
  try {
    localStorage.setItem(STORAGE_PAQUETES_KEY, JSON.stringify(PAQUETES_MOCK))
  } catch {
    // ignore
  }
}

export async function getProductos() {
  return PRODUCTOS_MOCK
}

export async function getPaquetes() {
  return PAQUETES_MOCK
}
