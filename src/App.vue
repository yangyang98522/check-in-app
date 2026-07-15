<script setup lang="ts">
import { onMounted } from 'vue'
import { useCategoryStore } from './stores/categoryStore'
import { useCheckInStore } from './stores/checkInStore'
import CategorySidebar from './components/CategorySidebar.vue'

const categoryStore = useCategoryStore()
const checkInStore = useCheckInStore()

onMounted(async () => {
  await categoryStore.load()
  await checkInStore.load()
})
</script>

<template>
  <div class="min-h-screen flex flex-col md:flex-row bg-slate-50">
    <CategorySidebar />
    <main class="flex-1 p-4 md:p-6 overflow-y-auto">
      <router-view />
    </main>
  </div>
</template>
