<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { CATEGORIAS_MOCK, PRODUCTOS_MOCK } from '@/services/catalogo.service'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'

const router = useRouter()
const fileInputRef = ref(null)
const imagenNombre = ref('')

const form = ref({
  nombre: 'Kamikaze Roll',
  categoria: 'Barra de Sushi',
  presentacion: '10 piezas',
  descripcion: 'Salmón, cebollín y aguacate. Queso crema y massago.',
  precio: '$145.00',
  activo: true
})

function abrirSelectorImagen() {
  fileInputRef.value?.click()
}

function onImagenSeleccionada(e) {
  const file = e.target.files?.[0]
  if (file) {
    imagenNombre.value = file.name
  }
}

function guardarProducto() {
  const numPrecio = Number(String(form.value.precio).replace(/[^0-9.]/g, '')) || 145
  const existente = PRODUCTOS_MOCK.find((p) => p.nombre.toLowerCase() === form.value.nombre.trim().toLowerCase())
  if (existente) {
    existente.categoria = form.value.categoria
    existente.precio = numPrecio
    existente.activo = form.value.activo
    if (imagenNombre.value) existente.tieneFoto = true
  } else if (form.value.nombre.trim()) {
    PRODUCTOS_MOCK.push({
      id: Date.now(),
      nombre: form.value.nombre.trim(),
      categoria: form.value.categoria,
      precio: numPrecio,
      tieneFoto: Boolean(imagenNombre.value),
      activo: form.value.activo
    })
  }
  router.push('/admin/productos')
}

function handleSubmit(e) {
  e.preventDefault()
  guardarProducto()
}
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:6px">
    <RouterLink class="back" to="/admin/productos">Volver a productos</RouterLink>
    <h1 style="font-size:22px;font-weight:600">Editar producto</h1>
    <p class="sub">El mismo formulario sirve para agregar un producto nuevo.</p>
  </div>

  <div style="display:flex;gap:20px;align-items:flex-start">
    <form
      class="card"
      style="flex:1;display:flex;flex-direction:column;gap:16px"
      @submit="handleSubmit"
    >
      <BaseInput
        id="nom"
        v-model="form.nombre"
        label="Nombre"
        type="text"
      />

      <div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:16px">
        <div>
          <label class="lbl" for="cat">Categoría</label>
          <select id="cat" v-model="form.categoria" class="inp">
            <option v-for="cat in CATEGORIAS_MOCK" :key="cat" :value="cat">
              {{ cat }}
            </option>
          </select>
        </div>
        <BaseInput
          id="uni"
          v-model="form.presentacion"
          label="Presentación"
          type="text"
        />
      </div>

      <div>
        <label class="lbl" for="des">Descripción</label>
        <textarea
          id="des"
          v-model="form.descripcion"
          class="inp"
          style="height:84px;padding:12px 14px;resize:none"
        ></textarea>
      </div>

      <div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:16px;align-items:end">
        <BaseInput
          id="pre"
          v-model="form.precio"
          label="Precio"
          type="text"
        />
        <label class="row" style="height:44px;font-size:14px">
          <input
            v-model="form.activo"
            type="checkbox"
            style="width:18px;height:18px;accent-color:#C94C08"
          >
          Producto activo en el menú
        </label>
      </div>

      <div style="display:flex;gap:12px;justify-content:flex-end;padding-top:6px">
        <BaseButton variant="s" to="/admin/productos">Cancelar</BaseButton>
        <BaseButton variant="p" href="#" @click.prevent="guardarProducto">Guardar producto</BaseButton>
      </div>
    </form>

    <div style="width:320px;flex:none;display:flex;flex-direction:column;gap:20px">
      <div class="card" style="display:flex;flex-direction:column;gap:14px">
        <h2 style="font-size:15px;font-weight:600">Imagen</h2>
        <input
          ref="fileInputRef"
          type="file"
          accept="image/jpeg,image/png"
          style="display:none"
          @change="onImagenSeleccionada"
        >
        <div class="ph" style="height:190px;cursor:pointer" @click="abrirSelectorImagen">
          <span>{{ imagenNombre || 'Arrastra una foto aquí' }}</span>
          <span style="font-weight:400;color:var(--tx2)">JPG o PNG</span>
        </div>
        <BaseButton variant="s" href="#" @click.prevent="abrirSelectorImagen">Elegir imagen</BaseButton>
      </div>

      <div class="card" style="display:flex;flex-direction:column;gap:10px">
        <h2 style="font-size:15px;font-weight:600">Tamaños y extras</h2>
        <p class="sub">Define variantes con su propio precio y los extras que se pueden agregar.</p>
        <BaseButton variant="s" to="/admin/productos/variantes-extras">Configurar</BaseButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ph {
  background: var(--acs);
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
}
</style>
