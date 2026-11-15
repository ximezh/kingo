/**
 * Constructor de libros de Excel (.xlsx) nativos para los reportes de Kin Sushi.
 *
 * - Genera el paquete OpenXML completo en JavaScript puro (sin dependencias).
 * - Las gráficas son objetos de gráfico NATIVOS de Excel (xl/charts/chartN.xml)
 *   vinculados a las celdas de la hoja: se pueden editar, mover y actualizar en Excel.
 * - Los importes, cantidades, porcentajes y fechas se guardan como números reales con
 *   formato, y los totales/participaciones se calculan con fórmulas.
 */

const encoder = new TextEncoder()

// ---------------------------------------------------------------------------
// Paleta corporativa (naranja Kin Sushi, sobria)
// ---------------------------------------------------------------------------
const COLOR = {
  naranja: 'F26A1B',
  naranjaOscuro: 'C94C08',
  marron: '7C2D12',
  duraznoClaro: 'FFF6EF',
  duraznoMedio: 'FDE3CF',
  borde: 'F1D2BC',
  texto: '1F2937',
  gris: '6B7280',
  blanco: 'FFFFFF'
}

const PALETA_GRAFICAS = ['C94C08', 'F26A1B', 'F9A66C', 'FCD0AE', '7C2D12', 'FDBA8C', 'E8590C', 'FFE3CC']

const FORMATO_NUM = {
  moneda: '"$"#,##0.00',
  monedaCorta: '"$"#,##0',
  entero: '#,##0',
  porcentaje: '0.0%',
  fecha: 'dd/mm/yyyy'
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
function esc(valor) {
  return String(valor ?? '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function colLetra(indice) {
  let n = indice + 1
  let s = ''
  while (n > 0) {
    const m = (n - 1) % 26
    s = String.fromCharCode(65 + m) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

function numeroSeguro(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

/** Convierte 'YYYY-MM-DD' a número de serie de fecha de Excel. */
export function fechaISOaSerialExcel(fechaISO) {
  const [y, m, d] = String(fechaISO || '').split('-').map(Number)
  if (!y || !m || !d) return 0
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000)
}

// ---------------------------------------------------------------------------
// ZIP sin compresión (STORE)
// ---------------------------------------------------------------------------
const CRC32_TABLA = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[i] = c >>> 0
  }
  return t
})()

function crc32(bytes) {
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i++) crc = CRC32_TABLA[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function empaquetarZip(archivos) {
  const partesLocales = []
  const partesCentrales = []
  let offset = 0

  for (const archivo of archivos) {
    const nombre = encoder.encode(archivo.ruta)
    const datos = archivo.datos instanceof Uint8Array ? archivo.datos : encoder.encode(String(archivo.datos))
    const crc = crc32(datos)

    const local = new Uint8Array(30 + nombre.length)
    const lv = new DataView(local.buffer)
    lv.setUint32(0, 0x04034b50, true)
    lv.setUint16(4, 20, true)
    lv.setUint16(6, 0x0800, true)
    lv.setUint16(8, 0, true)
    lv.setUint16(10, 0, true)
    lv.setUint16(12, 0x5b21, true)
    lv.setUint32(14, crc, true)
    lv.setUint32(18, datos.length, true)
    lv.setUint32(22, datos.length, true)
    lv.setUint16(26, nombre.length, true)
    lv.setUint16(28, 0, true)
    local.set(nombre, 30)
    partesLocales.push(local, datos)

    const central = new Uint8Array(46 + nombre.length)
    const cv = new DataView(central.buffer)
    cv.setUint32(0, 0x02014b50, true)
    cv.setUint16(4, 20, true)
    cv.setUint16(6, 20, true)
    cv.setUint16(8, 0x0800, true)
    cv.setUint16(10, 0, true)
    cv.setUint16(12, 0, true)
    cv.setUint16(14, 0x5b21, true)
    cv.setUint32(16, crc, true)
    cv.setUint32(20, datos.length, true)
    cv.setUint32(24, datos.length, true)
    cv.setUint16(28, nombre.length, true)
    cv.setUint32(42, offset, true)
    central.set(nombre, 46)
    partesCentrales.push(central)

    offset += local.length + datos.length
  }

  const tamCentral = partesCentrales.reduce((a, b) => a + b.length, 0)
  const fin = new Uint8Array(22)
  const fv = new DataView(fin.buffer)
  fv.setUint32(0, 0x06054b50, true)
  fv.setUint16(8, archivos.length, true)
  fv.setUint16(10, archivos.length, true)
  fv.setUint32(12, tamCentral, true)
  fv.setUint32(16, offset, true)

  const todas = [...partesLocales, ...partesCentrales, fin]
  const total = todas.reduce((a, b) => a + b.length, 0)
  const salida = new Uint8Array(total)
  let pos = 0
  for (const p of todas) {
    salida.set(p, pos)
    pos += p.length
  }
  return salida
}

// ---------------------------------------------------------------------------
// Hoja de estilos
// ---------------------------------------------------------------------------
const NUMFMT_ID = { moneda: 164, porcentaje: 165, entero: 166, fecha: 167 }

const fuentes = []
const rellenos = ['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>']
const bordes = ['<border><left/><right/><top/><bottom/><diagonal/></border>']
const xfs = ['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>']

function fuente(sz, color, { b = false, i = false } = {}) {
  fuentes.push(
    `<font>${b ? '<b/>' : ''}${i ? '<i/>' : ''}<sz val="${sz}"/><color rgb="FF${color}"/><name val="Calibri"/><family val="2"/></font>`
  )
  return fuentes.length - 1
}

function relleno(color) {
  rellenos.push(
    `<fill><patternFill patternType="solid"><fgColor rgb="FF${color}"/><bgColor indexed="64"/></patternFill></fill>`
  )
  return rellenos.length - 1
}

function borde({ izq, der, arr, aba } = {}) {
  const lado = (tag, def) =>
    def ? `<${tag} style="${def[0]}"><color rgb="FF${def[1]}"/></${tag}>` : `<${tag}/>`
  bordes.push(`<border>${lado('left', izq)}${lado('right', der)}${lado('top', arr)}${lado('bottom', aba)}<diagonal/></border>`)
  return bordes.length - 1
}

function xf({ fuenteId = 0, rellenoId = 0, bordeId = 0, numFmt = 0, h = 'general', v = 'center', indent = 0, wrap = false }) {
  xfs.push(
    `<xf numFmtId="${numFmt}" fontId="${fuenteId}" fillId="${rellenoId}" borderId="${bordeId}" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="${h}" vertical="${v}"${indent ? ` indent="${indent}"` : ''}${wrap ? ' wrapText="1"' : ''}/></xf>`
  )
  return xfs.length - 1
}

// Fuentes
fuente(11, COLOR.texto) // 0 por defecto
const F_TITULO = fuente(20, COLOR.blanco, { b: true })
const F_SUBTITULO = fuente(12, 'FFE7D6')
const F_META = fuente(10, COLOR.gris)
const F_KPI_ETQ = fuente(9, COLOR.marron, { b: true })
const F_KPI_VAL = fuente(18, COLOR.naranjaOscuro, { b: true })
const F_SECCION = fuente(13, COLOR.marron, { b: true })
const F_TH = fuente(10, COLOR.blanco, { b: true })
const F_DATO = fuente(10, COLOR.texto)
const F_TOTAL = fuente(10, COLOR.marron, { b: true })
const F_PIE = fuente(9, COLOR.gris, { i: true })

// Rellenos
const R_BANDA = relleno(COLOR.naranjaOscuro)
const R_TH = relleno(COLOR.naranja)
const R_KPI = relleno(COLOR.duraznoClaro)
const R_BLANCO = relleno(COLOR.blanco)
const R_CEBRA = relleno('FFFAF6')
const R_TOTAL = relleno(COLOR.duraznoMedio)

// Bordes
const B_DATO = borde({
  izq: ['thin', COLOR.borde],
  der: ['thin', COLOR.borde],
  arr: ['thin', COLOR.borde],
  aba: ['thin', COLOR.borde]
})
const B_KPI_ARR = borde({ izq: ['thin', COLOR.borde], der: ['thin', COLOR.borde], arr: ['thick', COLOR.naranja] })
const B_KPI_ABA = borde({ izq: ['thin', COLOR.borde], der: ['thin', COLOR.borde], aba: ['thin', COLOR.borde] })
const B_SECCION = borde({ aba: ['medium', COLOR.naranja] })
const B_TOTAL = borde({
  izq: ['thin', COLOR.borde],
  der: ['thin', COLOR.borde],
  arr: ['thin', COLOR.naranjaOscuro],
  aba: ['double', COLOR.naranjaOscuro]
})

// Estilos de celda
const S = {
  titulo: xf({ fuenteId: F_TITULO, rellenoId: R_BANDA, h: 'left', indent: 1 }),
  subtitulo: xf({ fuenteId: F_SUBTITULO, rellenoId: R_BANDA, h: 'left', indent: 1 }),
  meta: xf({ fuenteId: F_META, h: 'left', indent: 1 }),
  kpiEtq: xf({ fuenteId: F_KPI_ETQ, rellenoId: R_KPI, bordeId: B_KPI_ARR, h: 'center' }),
  kpi: {
    texto: xf({ fuenteId: F_KPI_VAL, rellenoId: R_KPI, bordeId: B_KPI_ABA, h: 'center' }),
    moneda: xf({ fuenteId: F_KPI_VAL, rellenoId: R_KPI, bordeId: B_KPI_ABA, h: 'center', numFmt: NUMFMT_ID.moneda }),
    entero: xf({ fuenteId: F_KPI_VAL, rellenoId: R_KPI, bordeId: B_KPI_ABA, h: 'center', numFmt: NUMFMT_ID.entero }),
    porcentaje: xf({ fuenteId: F_KPI_VAL, rellenoId: R_KPI, bordeId: B_KPI_ABA, h: 'center', numFmt: NUMFMT_ID.porcentaje })
  },
  seccion: xf({ fuenteId: F_SECCION, bordeId: B_SECCION, h: 'left', v: 'bottom' }),
  thIzq: xf({ fuenteId: F_TH, rellenoId: R_TH, bordeId: B_DATO, h: 'left', indent: 1 }),
  thDer: xf({ fuenteId: F_TH, rellenoId: R_TH, bordeId: B_DATO, h: 'right', indent: 1 }),
  thCen: xf({ fuenteId: F_TH, rellenoId: R_TH, bordeId: B_DATO, h: 'center' }),
  dato: {},
  total: {},
  pie: xf({ fuenteId: F_PIE, h: 'left', indent: 1 })
}

const DEF_FORMATOS = {
  texto: { numFmt: 0, h: 'left', indent: 1 },
  centro: { numFmt: 0, h: 'center' },
  moneda: { numFmt: NUMFMT_ID.moneda, h: 'right', indent: 1 },
  entero: { numFmt: NUMFMT_ID.entero, h: 'right', indent: 1 },
  porcentaje: { numFmt: NUMFMT_ID.porcentaje, h: 'right', indent: 1 },
  fecha: { numFmt: NUMFMT_ID.fecha, h: 'center' }
}

for (const [nombre, def] of Object.entries(DEF_FORMATOS)) {
  S.dato[nombre] = [
    xf({ fuenteId: F_DATO, rellenoId: R_BLANCO, bordeId: B_DATO, ...def }),
    xf({ fuenteId: F_DATO, rellenoId: R_CEBRA, bordeId: B_DATO, ...def })
  ]
  S.total[nombre] = xf({ fuenteId: F_TOTAL, rellenoId: R_TOTAL, bordeId: B_TOTAL, ...def })
}

function xmlEstilos() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="4"><numFmt numFmtId="${NUMFMT_ID.moneda}" formatCode="${esc(FORMATO_NUM.moneda)}"/><numFmt numFmtId="${NUMFMT_ID.porcentaje}" formatCode="${esc(FORMATO_NUM.porcentaje)}"/><numFmt numFmtId="${NUMFMT_ID.entero}" formatCode="${esc(FORMATO_NUM.entero)}"/><numFmt numFmtId="${NUMFMT_ID.fecha}" formatCode="${esc(FORMATO_NUM.fecha)}"/></numFmts>
<fonts count="${fuentes.length}">${fuentes.join('')}</fonts>
<fills count="${rellenos.length}">${rellenos.join('')}</fills>
<borders count="${bordes.length}">${bordes.join('')}</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="${xfs.length}">${xfs.join('')}</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
<dxfs count="0"/>
<tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/>
</styleSheet>`
}

// ---------------------------------------------------------------------------
// Modelo de hoja
// ---------------------------------------------------------------------------
class Hoja {
  constructor(nombre) {
    this.nombre = nombre
    this.filas = new Map()
    this.alturas = new Map()
    this.combinadas = []
  }

  celda(col, fila, estilo, valor = null, formula = null) {
    if (!this.filas.has(fila)) this.filas.set(fila, new Map())
    const ref = `${colLetra(col)}${fila}`
    let xml
    if (formula) {
      xml = `<c r="${ref}" s="${estilo}"><f>${esc(formula)}</f><v>${numeroSeguro(valor)}</v></c>`
    } else if (typeof valor === 'number') {
      xml = `<c r="${ref}" s="${estilo}"><v>${numeroSeguro(valor)}</v></c>`
    } else if (valor === null || valor === undefined || valor === '') {
      xml = `<c r="${ref}" s="${estilo}"/>`
    } else {
      xml = `<c r="${ref}" s="${estilo}" t="inlineStr"><is><t xml:space="preserve">${esc(valor)}</t></is></c>`
    }
    this.filas.get(fila).set(col, xml)
  }

  rango(colIni, colFin, fila, estilo, valor = null, formula = null) {
    this.celda(colIni, fila, estilo, valor, formula)
    for (let c = colIni + 1; c <= colFin; c++) this.celda(c, fila, estilo)
    if (colFin > colIni) this.combinadas.push(`${colLetra(colIni)}${fila}:${colLetra(colFin)}${fila}`)
  }

  altura(fila, pt) {
    this.alturas.set(fila, pt)
  }

  ref(col, fila, absoluta = true) {
    return absoluta ? `$${colLetra(col)}$${fila}` : `${colLetra(col)}${fila}`
  }

  refHoja(colIni, filaIni, colFin = colIni, filaFin = filaIni) {
    const base = `'${this.nombre.replace(/'/g, "''")}'!${this.ref(colIni, filaIni)}`
    return colFin === colIni && filaFin === filaIni ? base : `${base}:${this.ref(colFin, filaFin)}`
  }

  xmlFilas() {
    const numeros = new Set([...this.filas.keys(), ...this.alturas.keys()])
    return [...numeros]
      .sort((a, b) => a - b)
      .map((f) => {
        const celdas = this.filas.get(f)
        const ht = this.alturas.get(f)
        const attrHt = ht ? ` ht="${ht}" customHeight="1"` : ''
        if (!celdas || celdas.size === 0) return `<row r="${f}"${attrHt}/>`
        const contenido = [...celdas.entries()].sort((a, b) => a[0] - b[0]).map(([, x]) => x).join('')
        return `<row r="${f}"${attrHt}>${contenido}</row>`
      })
      .join('')
  }

  xml({ columnas, vista, autoFiltro = '', conDibujo = false, alturaDefecto = 18 }) {
    const merges = this.combinadas.length
      ? `<mergeCells count="${this.combinadas.length}">${this.combinadas.map((m) => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>`
      : ''
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
<sheetViews>${vista}</sheetViews>
<sheetFormatPr defaultRowHeight="${alturaDefecto}" customHeight="1"/>
<cols>${columnas}</cols>
<sheetData>${this.xmlFilas()}</sheetData>
${autoFiltro ? `<autoFilter ref="${autoFiltro}"/>` : ''}
${merges}
<printOptions horizontalCentered="1"/>
<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>
<pageSetup paperSize="1" orientation="landscape" fitToWidth="1" fitToHeight="0"/>
<headerFooter><oddFooter>&amp;L&amp;8Kin Sushi · Reporte generado por KinGo&amp;R&amp;8Página &amp;P de &amp;N</oddFooter></headerFooter>
${conDibujo ? '<drawing r:id="rId1"/>' : ''}
</worksheet>`
  }
}

// ---------------------------------------------------------------------------
// Gráficas nativas (DrawingML Chart)
// ---------------------------------------------------------------------------
function txPr(sz = 900, color = '4B5563', negrita = false) {
  return `<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="${sz}" b="${negrita ? 1 : 0}"><a:solidFill><a:srgbClr val="${color}"/></a:solidFill><a:latin typeface="Calibri"/><a:cs typeface="Calibri"/></a:defRPr></a:pPr><a:endParaRPr lang="es-MX"/></a:p></c:txPr>`
}

function tituloGrafica(texto) {
  return `<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1200" b="1"><a:solidFill><a:srgbClr val="${COLOR.marron}"/></a:solidFill><a:latin typeface="Calibri"/></a:defRPr></a:pPr><a:r><a:rPr lang="es-MX" sz="1200" b="1"><a:solidFill><a:srgbClr val="${COLOR.marron}"/></a:solidFill><a:latin typeface="Calibri"/></a:rPr><a:t>${esc(texto)}</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title><c:autoTitleDeleted val="0"/>`
}

function cacheTexto(valores) {
  return `<c:strCache><c:ptCount val="${valores.length}"/>${valores
    .map((v, i) => `<c:pt idx="${i}"><c:v>${esc(v)}</c:v></c:pt>`)
    .join('')}</c:strCache>`
}

function cacheNumero(valores, formato = 'General') {
  return `<c:numCache><c:formatCode>${esc(formato)}</c:formatCode><c:ptCount val="${valores.length}"/>${valores
    .map((v, i) => `<c:pt idx="${i}"><c:v>${numeroSeguro(v)}</c:v></c:pt>`)
    .join('')}</c:numCache>`
}

function etiquetasDatos({ formato, mostrarValor = true, mostrarPorcentaje = false, posicion = null, lineasGuia = false, color = '374151' }) {
  return `<c:dLbls><c:numFmt formatCode="${esc(formato)}" sourceLinked="0"/><c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr>${txPr(900, color, true)}${posicion ? `<c:dLblPos val="${posicion}"/>` : ''}<c:showLegendKey val="0"/><c:showVal val="${mostrarValor ? 1 : 0}"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="${mostrarPorcentaje ? 1 : 0}"/><c:showBubbleSize val="0"/>${lineasGuia ? '<c:showLeaderLines val="1"/>' : ''}</c:dLbls>`
}

/**
 * @param {object} g
 * @param {'columna'|'barra'|'pastel'} g.tipo
 */
function xmlGrafica(g) {
  const serieTx = `<c:tx><c:strRef><c:f>${esc(g.refNombreSerie)}</c:f>${cacheTexto([g.nombreSerie])}</c:strRef></c:tx>`
  const cat = `<c:cat><c:strRef><c:f>${esc(g.refCategorias)}</c:f>${cacheTexto(g.categorias)}</c:strRef></c:cat>`
  const val = `<c:val><c:numRef><c:f>${esc(g.refValores)}</c:f>${cacheNumero(g.valores, g.formatoNumero)}</c:numRef></c:val>`
  const formatoEtiqueta = g.formatoEtiqueta || g.formatoNumero || 'General'

  let areaGrafica
  let leyenda

  if (g.tipo === 'pastel') {
    const puntos = g.valores
      .map(
        (_, i) =>
          `<c:dPt><c:idx val="${i}"/><c:bubble3D val="0"/><c:spPr><a:solidFill><a:srgbClr val="${PALETA_GRAFICAS[i % PALETA_GRAFICAS.length]}"/></a:solidFill><a:ln w="19050"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:ln></c:spPr></c:dPt>`
      )
      .join('')
    areaGrafica = `<c:pieChart><c:varyColors val="1"/><c:ser><c:idx val="0"/><c:order val="0"/>${serieTx}${puntos}${etiquetasDatos({
      formato: FORMATO_NUM.porcentaje,
      mostrarValor: false,
      mostrarPorcentaje: true,
      posicion: 'outEnd',
      lineasGuia: true,
      color: COLOR.texto
    })}${cat}${val}</c:ser><c:firstSliceAng val="0"/></c:pieChart>`
    leyenda = `<c:legend><c:legendPos val="r"/><c:overlay val="0"/>${txPr(1000, COLOR.texto)}</c:legend>`
  } else {
    const horizontal = g.tipo === 'barra'
    const mostrarEtiquetas = g.valores.length <= 14
    areaGrafica = `<c:barChart><c:barDir val="${horizontal ? 'bar' : 'col'}"/><c:grouping val="clustered"/><c:varyColors val="0"/><c:ser><c:idx val="0"/><c:order val="0"/>${serieTx}<c:spPr><a:solidFill><a:srgbClr val="${COLOR.naranja}"/></a:solidFill><a:ln><a:noFill/></a:ln></c:spPr><c:invertIfNegative val="0"/>${
      mostrarEtiquetas ? etiquetasDatos({ formato: formatoEtiqueta, posicion: 'outEnd' }) : ''
    }${cat}${val}</c:ser><c:gapWidth val="${horizontal ? 45 : 70}"/><c:axId val="50010001"/><c:axId val="50010002"/></c:barChart><c:catAx><c:axId val="50010001"/><c:scaling><c:orientation val="${
      horizontal ? 'maxMin' : 'minMax'
    }"/></c:scaling><c:delete val="0"/><c:axPos val="${horizontal ? 'l' : 'b'}"/><c:numFmt formatCode="General" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:spPr><a:ln w="9525"><a:solidFill><a:srgbClr val="D9BBA6"/></a:solidFill></a:ln></c:spPr>${txPr(
      900,
      '374151'
    )}<c:crossAx val="50010002"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx><c:valAx><c:axId val="50010002"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="${
      horizontal ? 1 : 0
    }"/><c:axPos val="${horizontal ? 'b' : 'l'}"/>${
      horizontal
        ? ''
        : '<c:majorGridlines><c:spPr><a:ln w="6350"><a:solidFill><a:srgbClr val="F3E6DC"/></a:solidFill></a:ln></c:spPr></c:majorGridlines>'
    }<c:numFmt formatCode="${esc(g.formatoEje || formatoEtiqueta)}" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:spPr><a:ln><a:noFill/></a:ln></c:spPr>${txPr(
      900,
      COLOR.gris
    )}<c:crossAx val="50010001"/><c:crosses val="autoZero"/><c:crossBetween val="between"/></c:valAx>`
    leyenda = ''
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<c:lang val="es-MX"/>
<c:roundedCorners val="0"/>
<c:chart>${tituloGrafica(g.titulo)}<c:plotArea><c:layout/>${areaGrafica}<c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr></c:plotArea>${leyenda}<c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart>
<c:spPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:ln w="9525"><a:solidFill><a:srgbClr val="${COLOR.borde}"/></a:solidFill></a:ln></c:spPr>
${txPr(1000, COLOR.texto)}
<c:printSettings><c:headerFooter/><c:pageMargins b="0.75" l="0.7" r="0.7" t="0.75" header="0.3" footer="0.3"/><c:pageSetup/></c:printSettings>
</c:chartSpace>`
}

function xmlAnclaGrafica({ indice, colIni, filaIni, colFin, filaFin, desplazamientoCol = 0 }) {
  return `<xdr:twoCellAnchor editAs="oneCell"><xdr:from><xdr:col>${colIni}</xdr:col><xdr:colOff>${desplazamientoCol}</xdr:colOff><xdr:row>${filaIni}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:to><xdr:col>${colFin}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${filaFin}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to><xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="${indice + 2}" name="Gráfico ${indice + 1}"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" r:id="rId${indice + 1}"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor>`
}

// ---------------------------------------------------------------------------
// Construcción del libro
// ---------------------------------------------------------------------------
const COL_CONCEPTO_INI = 1 // B
const COL_CONCEPTO_FIN = 3 // D
const COL_GRAFICA_INI = 7 // H
const COL_GRAFICA_FIN = 13 // borde derecho de M
const COL_ULTIMA = 12 // M
const FILAS_GRAFICA = 17

/**
 * Construye el .xlsx del reporte.
 *
 * @param {object} spec
 * @param {string} spec.titulo                Título principal (banda naranja).
 * @param {string} spec.subtitulo             Nombre del reporte.
 * @param {string} spec.meta                  Línea de periodo / emisión.
 * @param {Array<{etiqueta:string, valor:any, formato:string}>} spec.kpis   Hasta 4 indicadores.
 * @param {Array<object>} spec.bloques        Tablas con su gráfica nativa.
 * @param {object} spec.detalle               Hoja de detalle con filtros.
 * @param {string} [spec.pie]                 Nota al pie.
 * @returns {Uint8Array}
 */
export function construirLibroXlsx(spec) {
  const resumen = new Hoja('Resumen')
  const graficas = []

  // Encabezado
  resumen.altura(1, 10)
  resumen.rango(COL_CONCEPTO_INI, COL_ULTIMA, 2, S.titulo, spec.titulo)
  resumen.altura(2, 34)
  resumen.rango(COL_CONCEPTO_INI, COL_ULTIMA, 3, S.subtitulo, spec.subtitulo)
  resumen.altura(3, 22)
  resumen.rango(COL_CONCEPTO_INI, COL_ULTIMA, 4, S.meta, spec.meta)
  resumen.altura(4, 20)
  resumen.altura(5, 8)

  // Indicadores clave (4 tarjetas de 3 columnas)
  const kpis = (spec.kpis || []).slice(0, 4)
  kpis.forEach((k, i) => {
    const c1 = COL_CONCEPTO_INI + i * 3
    const c2 = c1 + 2
    resumen.rango(c1, c2, 6, S.kpiEtq, String(k.etiqueta || '').toUpperCase())
    const estilo = S.kpi[k.formato] ?? S.kpi.texto
    resumen.rango(c1, c2, 7, estilo, k.formato === 'texto' ? String(k.valor ?? '-') : numeroSeguro(k.valor))
  })
  resumen.altura(6, 20)
  resumen.altura(7, 36)
  resumen.altura(8, 14)

  // Bloques: tabla a la izquierda (B:G) + gráfica nativa a la derecha (H:M)
  let fila = 9
  ;(spec.bloques || []).forEach((bloque, indiceBloque) => {
    resumen.rango(COL_CONCEPTO_INI, COL_ULTIMA, fila, S.seccion, `${indiceBloque + 1}.  ${bloque.titulo}`)
    resumen.altura(fila, 24)
    resumen.altura(fila + 1, 8)

    const filaEnc = fila + 2
    const columnas = bloque.columnas.slice(0, 4)
    const colDe = (j) => (j === 0 ? COL_CONCEPTO_INI : COL_CONCEPTO_FIN + j) // 1:E 2:F 3:G

    resumen.rango(COL_CONCEPTO_INI, COL_CONCEPTO_FIN, filaEnc, S.thIzq, columnas[0].titulo)
    for (let j = 1; j < columnas.length; j++) {
      resumen.celda(colDe(j), filaEnc, S.thDer, columnas[j].titulo)
    }
    resumen.altura(filaEnc, 22)

    let filas = bloque.filas || []
    const sinDatos = filas.length === 0
    if (sinDatos) {
      filas = [[bloque.textoSinDatos || 'Sin registros en el periodo', ...columnas.slice(1).map(() => 0)]]
    }

    const filaIni = filaEnc + 1
    const filaFin = filaEnc + filas.length

    // Totales por columna (para porcentajes y fila Total)
    const sumas = columnas.map((_, j) => (j === 0 ? 0 : filas.reduce((a, f) => a + numeroSeguro(f[j]), 0)))

    filas.forEach((f, idx) => {
      const r = filaIni + idx
      const cebra = idx % 2
      resumen.rango(COL_CONCEPTO_INI, COL_CONCEPTO_FIN, r, S.dato.texto[cebra], String(f[0] ?? ''))
      for (let j = 1; j < columnas.length; j++) {
        const def = columnas[j]
        const estilo = (S.dato[def.formato] || S.dato.texto)[cebra]
        if (def.porcentajeDe !== undefined) {
          const colBase = colLetra(colDe(def.porcentajeDe))
          const rangoBase = `${colBase}$${filaIni}:${colBase}$${filaFin}`
          const totalBase = sumas[def.porcentajeDe]
          const valor = totalBase > 0 ? numeroSeguro(f[def.porcentajeDe]) / totalBase : 0
          resumen.celda(colDe(j), r, estilo, valor, `IF(SUM(${rangoBase})=0,0,${colBase}${r}/SUM(${rangoBase}))`)
        } else {
          resumen.celda(colDe(j), r, estilo, numeroSeguro(f[j]))
        }
      }
      resumen.altura(r, 19)
    })

    let ultimaFilaTabla = filaFin
    if (bloque.total !== false) {
      const rt = filaFin + 1
      resumen.rango(COL_CONCEPTO_INI, COL_CONCEPTO_FIN, rt, S.total.texto, 'Total')
      for (let j = 1; j < columnas.length; j++) {
        const def = columnas[j]
        const col = colLetra(colDe(j))
        const estilo = S.total[def.formato] ?? S.total.texto
        const valor = def.porcentajeDe !== undefined ? (sumas[def.porcentajeDe] > 0 ? 1 : 0) : sumas[j]
        resumen.celda(colDe(j), rt, estilo, valor, `SUM(${col}${filaIni}:${col}${filaFin})`)
      }
      resumen.altura(rt, 21)
      ultimaFilaTabla = rt
    }

    // Gráfica nativa vinculada a la tabla
    if (bloque.grafica) {
      const g = bloque.grafica
      const colValor = colDe(g.columnaValor)
      const formatoNumero =
        columnas[g.columnaValor].formato === 'moneda'
          ? FORMATO_NUM.moneda
          : columnas[g.columnaValor].formato === 'porcentaje'
            ? FORMATO_NUM.porcentaje
            : FORMATO_NUM.entero
      const formatoEtiqueta = columnas[g.columnaValor].formato === 'moneda' ? FORMATO_NUM.monedaCorta : formatoNumero

      graficas.push({
        xml: xmlGrafica({
          tipo: g.tipo,
          titulo: g.titulo,
          nombreSerie: columnas[g.columnaValor].titulo,
          refNombreSerie: resumen.refHoja(colValor, filaEnc),
          refCategorias: resumen.refHoja(COL_CONCEPTO_INI, filaIni, COL_CONCEPTO_INI, filaFin),
          refValores: resumen.refHoja(colValor, filaIni, colValor, filaFin),
          categorias: filas.map((f) => String(f[0] ?? '')),
          valores: filas.map((f) => numeroSeguro(f[g.columnaValor])),
          formatoNumero,
          formatoEtiqueta,
          formatoEje: formatoEtiqueta
        }),
        ancla: {
          colIni: COL_GRAFICA_INI,
          filaIni: filaEnc - 1,
          colFin: COL_GRAFICA_FIN,
          filaFin: filaEnc - 1 + FILAS_GRAFICA,
          desplazamientoCol: 152400
        }
      })
    }

    const finBloque = Math.max(ultimaFilaTabla, bloque.grafica ? filaEnc - 1 + FILAS_GRAFICA : ultimaFilaTabla)
    fila = finBloque + 2
  })

  if (spec.pie) {
    resumen.rango(COL_CONCEPTO_INI, COL_ULTIMA, fila, S.pie, spec.pie)
  }

  const columnasResumen = `<col min="1" max="1" width="2.7" customWidth="1"/><col min="2" max="13" width="12.9" customWidth="1"/><col min="14" max="14" width="2.7" customWidth="1"/>`
  const vistaResumen = `<sheetView showGridLines="0" tabSelected="1" zoomScale="100" workbookViewId="0"><selection activeCell="A1" sqref="A1"/></sheetView>`
  const xmlResumen = resumen.xml({ columnas: columnasResumen, vista: vistaResumen, conDibujo: graficas.length > 0 })

  // -------------------------------------------------------------------------
  // Hojas de detalle (tablas con filtros, encabezado inmovilizado y subtotales)
  // -------------------------------------------------------------------------
  const listaDetalles = Array.isArray(spec.detalles) ? spec.detalles : spec.detalle ? [spec.detalle] : []
  const hojasDetalle = listaDetalles.map((det, i) => construirHojaDetalle(det, i))

  // -------------------------------------------------------------------------
  // Paquete OpenXML
  // -------------------------------------------------------------------------
  const ahoraIso = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
  const totalHojas = 1 + hojasDetalle.length
  const numerosHoja = Array.from({ length: totalHojas }, (_, i) => i + 1)

  const nombresDefinidos = hojasDetalle
    .map((h, i) =>
      h.autoFiltro
        ? `<definedName name="_xlnm._FilterDatabase" localSheetId="${i + 1}" hidden="1">'${esc(h.nombre).replace(/'/g, "''")}'!${h.autoFiltro
            .split(':')
            .map((p) => p.replace(/([A-Z]+)(\d+)/, '$$$1$$$2'))
            .join(':')}</definedName>`
        : ''
    )
    .join('')

  const archivos = [
    {
      ruta: '[Content_Types].xml',
      datos: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
${numerosHoja.map((n) => `<Override PartName="/xl/worksheets/sheet${n}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('\n')}
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
${graficas.length ? '<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>' : ''}
${graficas.map((_, i) => `<Override PartName="/xl/charts/chart${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>`).join('\n')}
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`
    },
    {
      ruta: '_rels/.rels',
      datos: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`
    },
    {
      ruta: 'docProps/core.xml',
      datos: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:title>${esc(spec.subtitulo)}</dc:title>
<dc:subject>Reporte de ventas Kin Sushi</dc:subject>
<dc:creator>KinGo · Kin Sushi</dc:creator>
<cp:lastModifiedBy>KinGo</cp:lastModifiedBy>
<dcterms:created xsi:type="dcterms:W3CDTF">${ahoraIso}</dcterms:created>
<dcterms:modified xsi:type="dcterms:W3CDTF">${ahoraIso}</dcterms:modified>
</cp:coreProperties>`
    },
    {
      ruta: 'docProps/app.xml',
      datos: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Microsoft Excel</Application><Company>Kin Sushi</Company></Properties>`
    },
    {
      ruta: 'xl/workbook.xml',
      datos: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<bookViews><workbookView xWindow="0" yWindow="0" windowWidth="28800" windowHeight="15000" activeTab="0"/></bookViews>
<sheets><sheet name="Resumen" sheetId="1" r:id="rId1"/>${hojasDetalle
        .map((h, i) => `<sheet name="${esc(h.nombre)}" sheetId="${i + 2}" r:id="rId${i + 2}"/>`)
        .join('')}</sheets>
${nombresDefinidos ? `<definedNames>${nombresDefinidos}</definedNames>` : ''}
<calcPr calcId="191029" fullCalcOnLoad="1"/>
</workbook>`
    },
    {
      ruta: 'xl/_rels/workbook.xml.rels',
      datos: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${numerosHoja.map((n) => `<Relationship Id="rId${n}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${n}.xml"/>`).join('\n')}
<Relationship Id="rId${totalHojas + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
    },
    { ruta: 'xl/styles.xml', datos: xmlEstilos() },
    { ruta: 'xl/worksheets/sheet1.xml', datos: xmlResumen },
    ...hojasDetalle.map((h, i) => ({ ruta: `xl/worksheets/sheet${i + 2}.xml`, datos: h.xml }))
  ]

  if (graficas.length) {
    archivos.push(
      {
        ruta: 'xl/worksheets/_rels/sheet1.xml.rels',
        datos: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/>
</Relationships>`
      },
      {
        ruta: 'xl/drawings/drawing1.xml',
        datos: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
${graficas.map((g, i) => xmlAnclaGrafica({ indice: i, ...g.ancla })).join('\n')}
</xdr:wsDr>`
      },
      {
        ruta: 'xl/drawings/_rels/drawing1.xml.rels',
        datos: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${graficas.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart${i + 1}.xml"/>`).join('\n')}
</Relationships>`
      },
      ...graficas.map((g, i) => ({ ruta: `xl/charts/chart${i + 1}.xml`, datos: g.xml }))
    )
  }

  return empaquetarZip(archivos)
}

/**
 * Construye una hoja de detalle: tabla con encabezado naranja, filas cebra,
 * filtros automáticos, encabezado inmovilizado y fila de totales con SUBTOTAL
 * (los totales respetan los filtros aplicados).
 */
function construirHojaDetalle(det, indice) {
  const detalle = new Hoja(det.nombreHoja || `Detalle ${indice + 1}`)
  const colsDet = det.columnas
  const colIniDet = 1
  const colFinDet = colIniDet + colsDet.length - 1

  detalle.altura(1, 10)
  detalle.rango(colIniDet, colFinDet, 2, S.titulo, det.titulo)
  detalle.altura(2, 32)
  detalle.rango(colIniDet, colFinDet, 3, S.subtitulo, det.subtitulo)
  detalle.altura(3, 22)
  detalle.altura(4, 10)

  const filaEncDet = 5
  colsDet.forEach((c, j) => {
    const estilo = ['moneda', 'entero', 'porcentaje'].includes(c.formato) ? S.thDer : c.formato === 'texto' ? S.thIzq : S.thCen
    detalle.celda(colIniDet + j, filaEncDet, estilo, c.titulo)
  })
  detalle.altura(filaEncDet, 24)

  const filasDet = det.filas || []
  const filaIniDet = filaEncDet + 1
  let autoFiltro = ''

  if (filasDet.length === 0) {
    detalle.rango(colIniDet, colFinDet, filaIniDet, S.dato.centro[0], det.textoSinDatos || 'Sin registros en el periodo')
    detalle.altura(filaIniDet, 22)
  } else {
    filasDet.forEach((f, idx) => {
      const r = filaIniDet + idx
      const cebra = idx % 2
      colsDet.forEach((c, j) => {
        const estilo = (S.dato[c.formato] || S.dato.texto)[cebra]
        const v = f[j]
        const esNumerico = ['moneda', 'entero', 'porcentaje', 'fecha'].includes(c.formato)
        detalle.celda(colIniDet + j, r, estilo, esNumerico ? numeroSeguro(v) : String(v ?? ''))
      })
      detalle.altura(r, 19)
    })

    const filaFinDet = filaIniDet + filasDet.length - 1
    autoFiltro = `${colLetra(colIniDet)}${filaEncDet}:${colLetra(colFinDet)}${filaFinDet}`

    const rt = filaFinDet + 1
    colsDet.forEach((c, j) => {
      const col = colIniDet + j
      const letra = colLetra(col)
      if (j === 0) {
        detalle.celda(col, rt, S.total.texto, 'Total')
      } else if ((det.columnasSuma || []).includes(j)) {
        const suma = filasDet.reduce((a, f) => a + numeroSeguro(f[j]), 0)
        detalle.celda(col, rt, S.total[c.formato] ?? S.total.entero, suma, `SUBTOTAL(109,${letra}${filaIniDet}:${letra}${filaFinDet})`)
      } else {
        detalle.celda(col, rt, S.total.texto)
      }
    })
    detalle.altura(rt, 22)
    if (det.notaTotales) {
      detalle.rango(colIniDet, colFinDet, rt + 2, S.pie, det.notaTotales)
    }
  }

  const columnasDetalle =
    `<col min="1" max="1" width="2.7" customWidth="1"/>` +
    colsDet
      .map((c, j) => `<col min="${colIniDet + j + 1}" max="${colIniDet + j + 1}" width="${c.ancho || 14}" customWidth="1"/>`)
      .join('')
  const vistaDetalle = `<sheetView showGridLines="0" workbookViewId="0"><pane ySplit="${filaEncDet}" topLeftCell="A${filaEncDet + 1}" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="B${filaEncDet + 1}" sqref="B${filaEncDet + 1}"/></sheetView>`

  return {
    nombre: detalle.nombre,
    autoFiltro,
    xml: detalle.xml({ columnas: columnasDetalle, vista: vistaDetalle, autoFiltro })
  }
}
