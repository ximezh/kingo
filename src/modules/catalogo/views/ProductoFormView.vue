<script setup>
import { ref, computed, watchEffect } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  CATEGORIAS_MOCK,
  PRODUCTOS_MOCK,
  EXTRAS_DISPONIBLES_MOCK,
  guardarProductosStorage,
  formatearDescripcionCatalogo
} from '@/services/catalogo.service'
import { reconstruirMenuVenta } from '@/services/ventas.service'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import StatusTag from '@/components/ui/StatusTag.vue'
import ProductoVectorArt from '@/components/ui/ProductoVectorArt.vue'

const route = useRoute()
const router = useRouter()
const fileInputRef = ref(null)
const imagenNombre = ref('')
const imagenPreview = ref(null)
const isDragging = ref(false)

const categoriasFormulario = computed(() => CATEGORIAS_MOCK.filter((c) => c !== 'Todas'))
const esModoNuevo = computed(() => route.path.endsWith('/nuevo') && !route.query.id)

const productoEditandoId = ref(null)

const form = ref({
  nombre: '',
  categoria: 'Barra de Sushi',
  presentacion: '10 piezas por rollo',
  descripcion: '',
  precio: '',
  activo: true,
  variantes: [],
  permiteExtras: true
})

// Modal interno de Variantes y Extras para no perder los datos del formulario
const showVariantesExtrasModal = ref(false)
const variantesActivasModal = ref(false)
const listaVariantesModal = ref([])
const extrasModal = ref(EXTRAS_DISPONIBLES_MOCK.map((e) => ({ ...e })))
const mensajeConfigGuardada = ref('')

const resumenVariantesExtras = computed(() => {
  const numTam = Array.isArray(form.value.variantes) ? form.value.variantes.length : 0
  const numExt = extrasModal.value.filter((e) => e.seleccionado !== false).length
  const txtTam = numTam > 0 ? `${numTam} tamaños` : 'Sin tamaños'
  const txtExt = form.value.permiteExtras ? `${numExt} extras permitidos` : 'Sin extras'
  return `${txtTam} · ${txtExt}`
})

function abrirModalVariantesExtras() {
  const actuales = Array.isArray(form.value.variantes) ? form.value.variantes : []
  variantesActivasModal.value = actuales.length > 0
  listaVariantesModal.value =
    actuales.length > 0
      ? actuales.map((v, i) => ({
          id: v.id || i + 1,
          nombre: v.nombre || v.tamano || 'Chico',
          precio: String(v.precio || '').replace(/[^0-9.]/g, '')
        }))
      : [
          { id: 1, nombre: 'Chico', precio: '40' },
          { id: 2, nombre: 'Grande', precio: '75' }
        ]
  extrasModal.value = EXTRAS_DISPONIBLES_MOCK.map((e) => ({ ...e }))
  showVariantesExtrasModal.value = true
}

function agregarTamanoModal() {
  listaVariantesModal.value.push({
    id: Date.now(),
    nombre: '',
    precio: ''
  })
}

function quitarTamanoModal(id) {
  listaVariantesModal.value = listaVariantesModal.value.filter((v) => v.id !== id)
}

function guardarConfigVariantesExtras() {
  form.value.variantes = variantesActivasModal.value
    ? listaVariantesModal.value
        .filter((v) => v.nombre.trim())
        .map((v, idx) => ({
          id: idx + 1,
          nombre: v.nombre.trim(),
          precio: `$${Number(String(v.precio).replace(/[^0-9.]/g, '') || 0).toFixed(2)}`
        }))
    : []

  EXTRAS_DISPONIBLES_MOCK.splice(
    0,
    EXTRAS_DISPONIBLES_MOCK.length,
    ...extrasModal.value.map((e) => ({ ...e }))
  )
  form.value.permiteExtras = extrasModal.value.some((e) => e.seleccionado !== false)

  showVariantesExtrasModal.value = false
  mensajeConfigGuardada.value = 'Configuración de tamaños y extras aplicada al producto.'
  setTimeout(() => {
    mensajeConfigGuardada.value = ''
  }, 3000)
}

watchEffect(() => {
  const qId = route.query.id ? Number(route.query.id) : null
  if (esModoNuevo.value) {
    productoEditandoId.value = null
    form.value = {
      nombre: '',
      categoria: 'Barra de Sushi',
      presentacion: '10 piezas por rollo',
      descripcion: '',
      precio: '',
      activo: true,
      variantes: [],
      permiteExtras: true
    }
    imagenPreview.value = null
    imagenNombre.value = ''
    return
  }

  const encontrado =
    (qId && PRODUCTOS_MOCK.find((p) => Number(p.id) === qId)) ||
    PRODUCTOS_MOCK.find((p) => p.nombre === 'Kamikaze Roll') ||
    PRODUCTOS_MOCK[0]

  if (encontrado) {
    productoEditandoId.value = encontrado.id
    form.value = {
      nombre: encontrado.nombre,
      categoria: encontrado.categoria || 'Barra de Sushi',
      presentacion: encontrado.presentacion || '10 piezas',
      descripcion: encontrado.descripcion || '',
      precio: encontrado.precioNulo ? 'Paga 4, lleva 5' : `$${Number(encontrado.precio || 0).toFixed(2)}`,
      activo: encontrado.activo !== false,
      variantes: Array.isArray(encontrado.variantes) ? encontrado.variantes.map((v) => ({ ...v })) : [],
      permiteExtras: encontrado.permiteExtras !== false
    }
    imagenPreview.value = encontrado.imagenUrl || null
    imagenNombre.value = ''
  }
})

function abrirSelectorImagen() {
  fileInputRef.value?.click()
}

function comprimirImagenDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const maxDim = 440
        let w = img.width
        let h = img.height
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w)
            w = maxDim
          } else {
            w = Math.round((w * maxDim) / h)
            h = maxDim
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = () => resolve(ev.target.result)
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  })
}

async function procesarArchivoImagen(file) {
  if (!file || !file.type.startsWith('image/')) return
  imagenNombre.value = file.name
  imagenPreview.value = await comprimirImagenDataUrl(file)
}

function onImagenSeleccionada(e) {
  const file = e.target.files?.[0]
  if (file) {
    procesarArchivoImagen(file)
  }
}

function onDropImagen(e) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) {
    procesarArchivoImagen(file)
  }
}

function quitarImagen() {
  imagenPreview.value = null
  imagenNombre.value = ''
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function guardarProducto() {
  const nombreLimpio = form.value.nombre.trim()
  if (!nombreLimpio) return

  const numPrecio = Number(String(form.value.precio).replace(/[^0-9.]/g, '')) || 120
  const descFormateada = formatearDescripcionCatalogo(form.value.categoria, form.value.descripcion)
  const existente =
    (productoEditandoId.value && PRODUCTOS_MOCK.find((p) => p.id === productoEditandoId.value)) ||
    PRODUCTOS_MOCK.find((p) => p.nombre.toLowerCase() === nombreLimpio.toLowerCase())

  if (existente) {
    existente.nombre = nombreLimpio
    existente.categoria = form.value.categoria
    existente.presentacion = form.value.presentacion
    existente.descripcion = descFormateada
    if (!existente.precioNulo) {
      existente.precio = numPrecio
    }
    existente.activo = form.value.activo
    existente.imagenUrl = imagenPreview.value || null
    existente.esVector = !imagenPreview.value
    existente.tieneFoto = Boolean(imagenPreview.value)
    existente.variantes = Array.isArray(form.value.variantes) ? [...form.value.variantes] : []
    existente.permiteExtras = form.value.permiteExtras !== false

    fetch(`http://localhost:3000/api/catalogo/productos/${existente.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: existente.nombre,
        categoria: existente.categoria,
        presentacion: existente.presentacion,
        descripcion: existente.descripcion,
        precio: existente.precio,
        activo: existente.activo,
        tieneFoto: existente.tieneFoto
      })
    }).catch(() => {})
  } else {
    const nuevoProd = {
      id: Date.now(),
      nombre: nombreLimpio,
      categoria: form.value.categoria,
      presentacion: form.value.presentacion,
      descripcion: descFormateada,
      precio: numPrecio,
      imagenUrl: imagenPreview.value || null,
      esVector: !imagenPreview.value,
      tieneFoto: Boolean(imagenPreview.value),
      activo: form.value.activo,
      variantes: Array.isArray(form.value.variantes) ? [...form.value.variantes] : [],
      permiteExtras: form.value.permiteExtras !== false
    }
    PRODUCTOS_MOCK.unshift(nuevoProd)

    fetch('http://localhost:3000/api/catalogo/productos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoProd)
    }).catch(() => {})
  }

  guardarProductosStorage()
  reconstruirMenuVenta()
  router.push('/admin/productos')
}

function handleSubmit(e) {
  e.preventDefault()
  guardarProducto()
}
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:4px">
    <RouterLink class="back" to="/admin/productos">Volver a productos</RouterLink>
    <h1 style="font-size:22px;font-weight:600">
      {{ esModoNuevo ? 'Nuevo producto' : 'Editar producto' }}
    </h1>
  </div>

  <div class="prod-form-layout">
    <form
      class="card"
      style="flex:1;display:flex;flex-direction:column;gap:16px"
      @submit="handleSubmit"
    >
      <BaseInput
        id="nom"
        v-model="form.nombre"
        label="Nombre *"
        type="text"
        placeholder="Ej. Kamikaze Roll"
      />

      <div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:16px">
        <div>
          <label class="lbl" for="cat">Categoría</label>
          <select id="cat" v-model="form.categoria" class="inp">
            <option v-for="cat in categoriasFormulario" :key="cat" :value="cat">
              {{ cat }}
            </option>
          </select>
        </div>
        <BaseInput
          id="uni"
          v-model="form.presentacion"
          label="Presentación"
          type="text"
          placeholder="Ej. 10 piezas"
        />
      </div>

      <div>
        <div class="row" style="justify-content:space-between;margin-bottom:6px">
          <label class="lbl" for="des" style="margin-bottom:0">Descripción / Ingredientes</label>
          <span
            v-if="['Barra de Sushi', 'Empanizados', 'Afrutados'].includes(form.categoria)"
            class="sub"
            style="font-size:11.5px;color:var(--act);font-weight:500"
          >
            Usa un punto (.) para separar D: (dentro) y A: (afuera)
          </span>
        </div>
        <textarea
          id="des"
          v-model="form.descripcion"
          class="inp"
          style="height:84px;padding:12px 14px;resize:none"
          placeholder="Ej. D: Salmón y cebollín. A: Queso crema y massago"
        ></textarea>
      </div>

      <div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:16px;align-items:end">
        <BaseInput
          id="pre"
          v-model="form.precio"
          label="Precio ($)"
          type="text"
          placeholder="Ej. 145"
        />
        <label class="row" style="height:44px;font-size:14px;cursor:pointer">
          <input
            v-model="form.activo"
            type="checkbox"
            style="width:18px;height:18px;accent-color:#C94C08"
          >
          Activo en el menú
        </label>
      </div>

      <div style="display:flex;gap:12px;justify-content:flex-end;padding-top:6px">
        <BaseButton variant="s" to="/admin/productos">Cancelar</BaseButton>
        <BaseButton variant="p" href="#" @click.prevent="guardarProducto">Guardar producto</BaseButton>
      </div>
    </form>

    <div style="width:320px;flex:none;display:flex;flex-direction:column;gap:20px">
      <div class="card" style="display:flex;flex-direction:column;gap:14px">
        <div class="row" style="justify-content:space-between">
          <h2 style="font-size:15px;font-weight:600">Imagen del platillo</h2>
          <a
            v-if="imagenPreview"
            href="#"
            class="edit"
            style="font-size:12px;color:#B91C1C"
            @click.prevent="quitarImagen"
          >Usar base vectorial</a>
        </div>
        <input
          ref="fileInputRef"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style="display:none"
          @change="onImagenSeleccionada"
        >
        <div
          :class="['ph', 'has-preview', { 'is-drag': isDragging }]"
          style="height:190px;cursor:pointer"
          @click="abrirSelectorImagen"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="onDropImagen"
        >
          <img
            v-if="imagenPreview"
            :src="imagenPreview"
            alt="Vista previa"
            class="preview-img"
          >
          <ProductoVectorArt
            v-else
            :nombre="form.nombre || 'KinGo'"
            :categoria="form.categoria"
          />
        </div>
        <span class="sub" style="font-size:11.5px;text-align:center">
          {{ imagenPreview ? 'Foto personalizada activa' : 'Ilustración vectorial KinGo activa por defecto' }}
        </span>
        <BaseButton variant="s" href="#" @click.prevent="abrirSelectorImagen">
          {{ imagenPreview ? 'Cambiar foto' : 'Subir foto propia (opcional)' }}
        </BaseButton>
      </div>

      <div class="card" style="display:flex;flex-direction:column;gap:10px">
        <div class="row" style="justify-content:space-between">
          <h2 style="font-size:15px;font-weight:600">Tamaños y extras</h2>
          <span class="sub" style="font-size:12px">Opcional</span>
        </div>
        <span class="sub" style="font-size:12px">{{ resumenVariantesExtras }}</span>
        <div v-if="mensajeConfigGuardada" style="font-size:12px;color:var(--ok);font-weight:500">
          ✓ {{ mensajeConfigGuardada }}
        </div>
        <BaseButton
          variant="s"
          href="#"
          @click.prevent="abrirModalVariantesExtras"
        >
          Configurar
        </BaseButton>
      </div>
    </div>
  </div>

  <!-- Modal integrado de Variantes y Extras para no perder el formulario en curso -->
  <BaseModal
    v-model="showVariantesExtrasModal"
    aria-label="Configurar variantes y extras"
    width="560px"
  >
    <div style="display:flex;flex-direction:column;gap:2px">
      <h2 style="font-size:19px;font-weight:600">Variantes y extras</h2>
      <p class="sub" style="font-size:13px">
        {{ form.nombre.trim() || (esModoNuevo ? 'Nuevo producto en registro' : 'Producto actual') }}
      </p>
    </div>

    <!-- Sección Tamaños / Variantes -->
    <div style="display:flex;flex-direction:column;gap:10px;padding:14px 16px;background:var(--bg2);border:1.5px solid var(--bd);border-radius:12px">
      <div class="row" style="justify-content:space-between;align-items:center;gap:12px;flex-wrap:nowrap">
        <label class="row" style="font-size:14px;font-weight:600;cursor:pointer;gap:10px;flex:1;min-width:0">
          <input
            v-model="variantesActivasModal"
            type="checkbox"
            style="width:17px;height:17px;accent-color:#C94C08;flex-shrink:0"
          >
          <span>Este producto tiene tamaños (ej. Chico / Grande)</span>
        </label>
        <StatusTag
          :variant="variantesActivasModal ? 'ok' : ''"
          style="height:28px;padding:0 12px;border-radius:999px;font-weight:600;white-space:nowrap;flex-shrink:0"
        >
          {{ variantesActivasModal ? 'Con tamaños' : 'Precio único' }}
        </StatusTag>
      </div>

      <template v-if="variantesActivasModal">
        <div
          v-for="v in listaVariantesModal"
          :key="v.id"
          style="display:grid;grid-template-columns:1fr 130px auto;gap:10px;align-items:center"
        >
          <input
            v-model="v.nombre"
            class="inp"
            type="text"
            placeholder="Tamaño (ej. Chico)"
            style="height:38px"
          >
          <input
            v-model="v.precio"
            class="inp"
            type="text"
            placeholder="Precio ($)"
            style="height:38px"
          >
          <a
            href="#"
            class="back"
            style="font-size:12px"
            @click.prevent="quitarTamanoModal(v.id)"
          >
            Quitar
          </a>
        </div>
        <BaseButton variant="s" href="#" style="align-self:flex-start;height:36px" @click.prevent="agregarTamanoModal">
          + Agregar tamaño
        </BaseButton>
      </template>
    </div>

    <!-- Sección Extras permitidos -->
    <div style="display:flex;flex-direction:column;gap:10px">
      <div class="row" style="justify-content:space-between">
        <span style="font-size:14px;font-weight:600">Extras permitidos</span>
        <StatusTag>{{ extrasModal.filter((e) => e.seleccionado !== false).length }} seleccionados</StatusTag>
      </div>
      <div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:8px;max-height:210px;overflow-y:auto">
        <label
          v-for="ex in extrasModal"
          :key="ex.id"
          style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border:1px solid var(--bd);border-radius:10px;cursor:pointer;font-size:13px"
        >
          <span class="row" style="gap:8px">
            <input
              v-model="ex.seleccionado"
              type="checkbox"
              style="width:16px;height:16px;accent-color:#C94C08"
            >
            <span>{{ ex.nombre }}</span>
          </span>
          <strong style="color:var(--act)">{{ ex.precio }}</strong>
        </label>
      </div>
    </div>

    <div class="row" style="justify-content:flex-end;gap:10px;padding-top:6px">
      <BaseButton variant="s" href="#" @click.prevent="showVariantesExtrasModal = false">
        Cancelar
      </BaseButton>
      <BaseButton variant="p" href="#" @click.prevent="guardarConfigVariantesExtras">
        Guardar configuración
      </BaseButton>
    </div>
  </BaseModal>
</template>

<style scoped>
.prod-form-layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

@media (max-width: 900px) {
  .prod-form-layout {
    flex-direction: column;
  }
}

.ph {
  background: var(--acs);
  border: 1.5px dashed transparent;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  justify-content: center;
  color: var(--act);
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  padding: 16px;
  overflow: hidden;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.ph.is-drag {
  border-color: var(--btn);
  background: var(--bg2);
}

.ph.has-preview {
  padding: 0;
  background: var(--bg2);
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
</style>
