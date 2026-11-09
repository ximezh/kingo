<script setup>
import { ref } from 'vue'
import { PRODUCTOS_MOCK } from '@/services/catalogo.service'
import ProductoCard from '@/modules/catalogo/components/ProductoCard.vue'
import ModalEliminarProducto from '@/modules/catalogo/components/ModalEliminarProducto.vue'

const productosFondo = PRODUCTOS_MOCK.slice(0, 4)
const mostrarModal = ref(true)
</script>

<template>
  <h1 style="font-size:22px;font-weight:600">Productos</h1>

  <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(220px, 1fr));gap:18px">
    <ProductoCard
      v-for="prod in productosFondo"
      :key="prod.id"
      :producto="prod"
      :editable="false"
      :hide-photo-text="true"
    />
  </div>

  <ModalEliminarProducto
    v-model="mostrarModal"
    nombre-producto="Acapulco Roll"
    paquete-incluido="Paquete 1"
  />
</template>
