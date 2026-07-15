<script setup lang="ts">
import { computed } from 'vue'
import { useCategoryStore } from '../stores/categoryStore'
import { useCheckInStore } from '../stores/checkInStore'
import { formatDateTime } from '../utils/date'
import { Trash2, Image, Video, Pencil } from 'lucide-vue-next'
import type { CheckIn } from '../db'

const props = defineProps<{ checkIn: CheckIn }>()
const emit = defineEmits<{ (e: 'delete', id: number): void; (e: 'edit', checkIn: CheckIn): void }>()

const categoryStore = useCategoryStore()
const checkInStore = useCheckInStore()

const category = computed(() => categoryStore.getById(props.checkIn.categoryId))
const media = computed(() => checkInStore.getMediaByCheckIn(props.checkIn.id!))
const hasMedia = computed(() => media.value.length > 0)
const coverUrl = computed(() => {
  const first = media.value[0]
  if (!first) return ''
  return checkInStore.getUrl(first.thumbnail || first.blob)
})

function confirmDelete() {
  if (confirm('确定删除这条打卡记录吗？')) {
    emit('delete', props.checkIn.id!)
  }
}
</script>

<template>
  <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <div class="flex items-start justify-between gap-3">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-2">
          <span
            v-if="category"
            class="px-2 py-0.5 rounded-full text-xs font-medium"
            :style="{ backgroundColor: category.color + '20', color: category.color }"
          >
            {{ category.name }}
          </span>
          <span class="text-xs text-slate-400">{{ formatDateTime(checkIn.recordDate, checkIn.recordTime) }}</span>
        </div>
        <h3 class="text-base font-semibold text-slate-800 mb-1 truncate">{{ checkIn.title }}</h3>
        <p class="text-sm text-slate-600 whitespace-pre-line line-clamp-3">{{ checkIn.content }}</p>

        <div v-if="checkIn.topicTags.length" class="flex flex-wrap gap-1.5 mt-3">
          <span
            v-for="tag in checkIn.topicTags"
            :key="tag"
            class="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-md"
          >
            {{ tag }}
          </span>
        </div>
      </div>

      <div v-if="hasMedia" class="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 relative">
        <img v-if="media[0].fileType === 'image'" :src="coverUrl" class="w-full h-full object-cover" />
        <video v-else :src="coverUrl" class="w-full h-full object-cover" muted playsinline />
        <div class="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
          <Image v-if="media[0].fileType === 'image'" :size="10" />
          <Video v-else :size="10" />
          {{ media.length }}
        </div>
      </div>
    </div>

    <div class="mt-3 pt-3 border-t border-slate-100 flex justify-end gap-1">
      <button
        class="text-slate-400 hover:text-blue-500 transition-colors p-1.5 rounded-lg hover:bg-blue-50"
        title="编辑"
        @click="emit('edit', props.checkIn)"
      >
        <Pencil :size="16" />
      </button>
      <button
        class="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
        title="删除"
        @click="confirmDelete"
      >
        <Trash2 :size="16" />
      </button>
    </div>
  </div>
</template>
