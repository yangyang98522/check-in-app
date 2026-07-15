<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/authStore'
import { useCategoryStore } from './stores/categoryStore'
import { useCheckInStore } from './stores/checkInStore'
import { syncFromCloud } from './services/syncService'
import { cleanupDuplicateCategories } from './db'
import CategorySidebar from './components/CategorySidebar.vue'
import ToastContainer from './components/ToastContainer.vue'

const route = useRoute()
const authStore = useAuthStore()
const categoryStore = useCategoryStore()
const checkInStore = useCheckInStore()

onMounted(async () => {
  await cleanupDuplicateCategories()
  await authStore.init()
  if (authStore.user) {
    try {
      const synced = await syncFromCloud(authStore.user.id)
      if (synced) {
        console.log('已从云端恢复数据')
      }
    } catch (err) {
      console.error('云端同步失败', err)
    }
  }
  await categoryStore.load()
  await checkInStore.load()
})
</script>

<template>
  <div class="min-h-screen flex flex-col md:flex-row bg-slate-50">
    <CategorySidebar v-if="route.name !== 'login'" />
    <main v-if="route.name !== 'login'" class="flex-1 p-4 md:p-6 overflow-y-auto">
      <router-view />
    </main>
    <router-view v-else />
    <ToastContainer />
  </div>
</template>
