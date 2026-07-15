<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCategoryStore } from '../stores/categoryStore'
import { useCheckInStore } from '../stores/checkInStore'
import { useAuthStore } from '../stores/authStore'
import { db } from '../db'
import { syncFromCloud, syncToCloud } from '../services/syncService'
import { Download, Upload, Trash2, Save, CloudDownload, CloudUpload, LogIn } from 'lucide-vue-next'

const router = useRouter()
const categoryStore = useCategoryStore()
const checkInStore = useCheckInStore()
const authStore = useAuthStore()

const storageInfo = ref('')
const syncLoading = ref(false)
const syncMessage = ref('')

async function calcStorage() {
  let total = 0
  const files = await db.mediaFiles.toArray()
  files.forEach((f) => (total += f.size))
  const count = files.length
  storageInfo.value = `${count} 个文件，约 ${(total / 1024 / 1024).toFixed(2)} MB`
}
calcStorage()

async function exportData() {
  const categories = await db.categories.toArray()
  const checkIns = await db.checkIns.toArray()
  const mediaFiles = await db.mediaFiles.toArray()

  const payload = { categories, checkIns, mediaFiles: mediaFiles.map((m) => ({ ...m, blob: undefined })) }
  const payloadBlob = new Blob([JSON.stringify(payload)], { type: 'application/json' })

  // 导出 JSON 元数据（媒体文件需要额外手动备份）
  const url = URL.createObjectURL(payloadBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = `check-in-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function importData() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await db.transaction('rw', db.categories, db.checkIns, db.mediaFiles, async () => {
        if (data.categories?.length) await db.categories.bulkPut(data.categories)
        if (data.checkIns?.length) await db.checkIns.bulkPut(data.checkIns)
      })
      await categoryStore.load()
      await checkInStore.load()
      alert('导入成功')
    } catch (err) {
      alert('导入失败：' + (err as Error).message)
    }
  }
  input.click()
}

async function clearAll() {
  if (confirm('确定清空所有数据吗？此操作不可恢复，建议先导出备份。')) {
    await db.delete()
    location.reload()
  }
}

async function pullFromCloud() {
  if (!authStore.user) return
  syncLoading.value = true
  syncMessage.value = ''
  try {
    const synced = await syncFromCloud(authStore.user.id)
    await categoryStore.load()
    await checkInStore.load()
    syncMessage.value = synced ? '已从云端恢复数据' : '云端暂无数据'
  } catch (err) {
    syncMessage.value = '恢复失败：' + (err as Error).message
  } finally {
    syncLoading.value = false
  }
}

async function pushToCloud() {
  if (!authStore.user) return
  syncLoading.value = true
  syncMessage.value = ''
  try {
    await syncToCloud(authStore.user.id)
    syncMessage.value = '已同步到云端'
  } catch (err) {
    syncMessage.value = '同步失败：' + (err as Error).message
  } finally {
    syncLoading.value = false
  }
}

const editingCategory = ref<number | null>(null)
const editName = ref('')

function startEdit(cat: { id?: number; name: string }) {
  editingCategory.value = cat.id!
  editName.value = cat.name
}

async function saveEdit(id: number) {
  if (editName.value.trim()) {
    await categoryStore.update(id, { name: editName.value.trim() })
  }
  editingCategory.value = null
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <h2 class="text-2xl font-bold text-slate-800">设置</h2>

    <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <h3 class="text-base font-semibold text-slate-800 mb-4">分类管理</h3>
      <div class="space-y-2">
        <div
          v-for="cat in categoryStore.allCategories"
          :key="cat.id"
          class="flex items-center justify-between p-3 rounded-xl border border-slate-100"
        >
          <div class="flex items-center gap-3">
            <div class="w-4 h-4 rounded-full" :style="{ backgroundColor: cat.color }" />
            <span v-if="editingCategory !== cat.id" class="text-slate-700">{{ cat.name }}</span>
            <input
              v-else
              v-model="editName"
              type="text"
              class="px-2 py-1 border border-slate-300 rounded text-sm"
              @keyup.enter="saveEdit(cat.id!)"
            />
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="editingCategory !== cat.id"
              class="text-sm text-blue-600 hover:underline"
              @click="startEdit(cat)"
            >
              重命名
            </button>
            <button v-else class="text-sm text-blue-600 hover:underline" @click="saveEdit(cat.id!)">
              <Save :size="16" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <h3 class="text-base font-semibold text-slate-800 mb-4">云端同步</h3>
      <p class="text-sm text-slate-500 mb-4">
        {{ authStore.isLoggedIn ? `当前登录：${authStore.user?.email}` : '登录后可将数据同步到云端，换设备不丢失' }}
      </p>
      <div v-if="syncMessage" class="mb-4 p-3 bg-blue-50 text-blue-700 text-sm rounded-lg">
        {{ syncMessage }}
      </div>
      <div class="flex flex-wrap gap-3">
        <template v-if="authStore.isLoggedIn">
          <button
            class="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
            :disabled="syncLoading"
            @click="pullFromCloud"
          >
            <CloudDownload :size="16" />
            {{ syncLoading ? '同步中...' : '从云端恢复' }}
          </button>
          <button
            class="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
            :disabled="syncLoading"
            @click="pushToCloud"
          >
            <CloudUpload :size="16" />
            {{ syncLoading ? '同步中...' : '同步到云端' }}
          </button>
        </template>
        <button
          v-else
          class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          @click="router.push('/login')"
        >
          <LogIn :size="16" />
          登录 / 注册
        </button>
      </div>
    </div>

    <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <h3 class="text-base font-semibold text-slate-800 mb-4">数据管理</h3>
      <p class="text-sm text-slate-500 mb-4">当前媒体占用：{{ storageInfo || '计算中...' }}</p>
      <div class="flex flex-wrap gap-3">
        <button
          class="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          @click="exportData"
        >
          <Download :size="16" />
          导出备份
        </button>
        <button
          class="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          @click="importData"
        >
          <Upload :size="16" />
          导入备份
        </button>
        <button
          class="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
          @click="clearAll"
        >
          <Trash2 :size="16" />
          清空数据
        </button>
      </div>
    </div>
  </div>
</template>
