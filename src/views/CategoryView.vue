<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Plus, Trash2 } from 'lucide-vue-next'
import { useCategoryStore } from '../stores/categoryStore'
import { useCheckInStore } from '../stores/checkInStore'
import CheckInCard from '../components/CheckInCard.vue'
import CheckInModal from '../components/CheckInModal.vue'
import type { CheckIn } from '../db'

const route = useRoute()
const categoryStore = useCategoryStore()
const checkInStore = useCheckInStore()

const categoryId = computed(() => Number(route.params.id))
const category = computed(() => categoryStore.getById(categoryId.value))
const checkIns = computed(() => checkInStore.getByCategory(categoryId.value))
const showModal = ref(false)
const editingCheckIn = ref<CheckIn | null>(null)

watch(categoryId, () => {
  showModal.value = false
  editingCheckIn.value = null
})

function openAdd() {
  editingCheckIn.value = null
  showModal.value = true
}

function openEdit(ci: CheckIn) {
  editingCheckIn.value = ci
  showModal.value = true
}

const totalCount = computed(() => checkIns.value.length)
const topicSet = computed(() => {
  const set = new Set<string>()
  checkIns.value.forEach((ci) => ci.topicTags.forEach((t) => set.add(t)))
  return Array.from(set)
})

async function deleteCategory() {
  if (!category.value) return
  if (confirm(`确定删除分类「${category.value.name}」吗？该分类下的所有打卡记录也会被删除。`)) {
    await categoryStore.remove(category.value.id!)
    window.location.href = '/'
  }
}
</script>

<template>
  <div v-if="category" class="max-w-4xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div
          class="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-bold"
          :style="{ backgroundColor: category.color }"
        >
          {{ category.name[0] }}
        </div>
        <div>
          <h2 class="text-2xl font-bold text-slate-800">{{ category.name }}</h2>
          <p class="text-sm text-slate-500">{{ totalCount }} 次打卡 · {{ topicSet.length }} 个主题</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          @click="openAdd"
        >
          <Plus :size="18" />
          <span>打卡</span>
        </button>
        <button
          class="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          title="删除分类"
          @click="deleteCategory"
        >
          <Trash2 :size="18" />
        </button>
      </div>
    </div>

    <div v-if="topicSet.length" class="flex flex-wrap gap-2">
      <span
        v-for="topic in topicSet"
        :key="topic"
        class="px-3 py-1 rounded-full text-sm"
        :style="{ backgroundColor: category.color + '15', color: category.color }"
      >
        {{ topic }}
      </span>
    </div>

    <div class="space-y-4">
      <CheckInCard
        v-for="ci in checkIns"
        :key="ci.id"
        :check-in="ci"
        @delete="checkInStore.remove"
        @edit="openEdit"
      />
      <div v-if="checkIns.length === 0" class="text-center py-12 text-slate-400">
        该分类下暂无打卡记录
      </div>
    </div>

    <CheckInModal v-model:visible="showModal" :initial-category-id="categoryId" :edit-check-in="editingCheckIn" @saved="() => {}" />
  </div>

  <div v-else class="text-center py-20 text-slate-400">
    分类不存在
  </div>
</template>
