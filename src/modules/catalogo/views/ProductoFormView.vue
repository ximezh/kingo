<script setup>
import { ref, computed, watchEffect } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { CATEGORIAS_MOCK, PRODUCTOS_MOCK, guardarProductosStorage } from '@/services/catalogo.service'
import { reconstruirMenuVenta } from '@/services/ventas.service'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'

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
  activo: true
})

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
      activo: true
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
      activo: encontrado.activo !== false
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
  const existente =
    (productoEditandoId.value && PRODUCTOS_MOCK.find((p) => p.id === productoEditandoId.value)) ||
    PRODUCTOS_MOCK.find((p) => p.nombre.toLowerCase() === nombreLimpio.toLowerCase())

  if (existente) {
    existente.nombre = nombreLimpio
    existente.categoria = form.value.categoria
    existente.presentacion = form.value.presentacion
    existente.descripcion = form.value.descripcion
    if (!existente.precioNulo) {
      existente.precio = numPrecio
    }
    existente.activo = form.value.activo
    existente.imagenUrl = imagenPreview.value || null
    if (imagenPreview.value) existente.tieneFoto = true

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
      descripcion: form.value.descripcion,
      precio: numPrecio,
      imagenUrl: imagenPreview.value || null,
      tieneFoto: Boolean(imagenPreview.value),
      activo: form.value.activo,
      permiteExtras: true
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
        <label class="lbl" for="des">Descripción / Ingredientes</label>
        <textarea
          id="des"
          v-model="form.descripcion"
          class="inp"
          style="height:84px;padding:12px 14px;resize:none"
          placeholder="Ingredientes principales..."
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
          >Quitar</a>
        </div>
        <input
          ref="fileInputRef"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style="display:none"
          @change="onImagenSeleccionada"
        >
        <div
          :class="['ph', { 'has-preview': Boolean(imagenPreview), 'is-drag': isDragging }]"
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
          <template v-else>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <span>{{ imagenNombre || 'Haz clic o arrastra una foto' }}</span>
            <span style="font-weight:400;font-size:12px;color:var(--tx2)">JPG, PNG o WebP</span>
          </template>
        </div>
        <BaseButton variant="s" href="#" @click.prevent="abrirSelectorImagen">
          {{ imagenPreview ? 'Cambiar imagen' : 'Elegir imagen' }}
        </BaseButton>
      </div>

      <div class="card" style="display:flex;flex-direction:column;gap:12px">
        <div class="row" style="justify-content:space-between">
          <h2 style="font-size:15px;font-weight:600">Tamaños y extras</h2>
          <span class="sub" style="font-size:12px">Opcional</span>
        </div>
        <BaseButton
          variant="s"
          :to="productoEditandoId ? `/admin/productos/variantes-extras?id=${productoEditandoId}` : '/admin/productos/variantes-extras'"
        >
          Configurar
        </BaseButton>
      </div>
    </div>
  </div>
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
