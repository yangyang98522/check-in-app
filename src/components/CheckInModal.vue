<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { useCategoryStore } from '../stores/categoryStore'
import { useCheckInStore } from '../stores/checkInStore'
import { today, nowTime } from '../utils/date'
import MediaUploader from './MediaUploader.vue'
import { db } from '../db'
import type { CheckIn, MediaFile } from '../db'

const props = defineProps<{
  visible: boolean
  initialCategoryId?: number
  editCheckIn?: CheckIn | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'saved'): void
}>()

const categoryStore = useCategoryStore()
const checkInStore = useCheckInStore()

const isEdit = computed(() => !!props.editCheckIn)

const categoryId = ref<number>(props.initialCategoryId || categoryStore.allCategories[0]?.id || 0)
const content = ref('')
const recordDate = ref(today())
const recordTime = ref(nowTime())
const mediaFiles = ref<{ file: File; type: 'image' | 'video'; preview: string }[]>([])
const existingMedia = ref<MediaFile[]>([])
const topicInput = ref('')
const submitting = ref(false)

function reset() {
  if (isEdit.value && props.editCheckIn) {
    const ci = props.editCheckIn
    categoryId.value = ci.categoryId
    content.value = ci.content
    recordDate.value = ci.recordDate
    recordTime.value = ci.recordTime
    topicInput.value = ci.topicTags.join(' ')
    existingMedia.value = checkInStore.getMediaByCheckIn(ci.id!)
    mediaFiles.value = []
  } else {
    categoryId.value = props.initialCategoryId || categoryStore.allCategories[0]?.id || 0
    content.value = ''
    recordDate.value = today()
    recordTime.value = nowTime()
    topicInput.value = ''
    existingMedia.value = []
    mediaFiles.value = []
  }
}

watch(
  () => props.visible,
  (val) => {
    if (val) reset()
  }
)

watch(
  () => props.editCheckIn,
  () => {
    if (props.visible) reset()
  }
)

const parsedTopics = computed(() => {
  return topicInput.value
    .split(/[\s,，]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
})

const canSubmit = computed(() => content.value.trim() && categoryId.value)

async function submit() {
  if (!canSubmit.value || submitting.value) return
  submitting.value = true
  try {
    const topicTags = parsedTopics.value.length > 0 ? parsedTopics.value : undefined
    if (isEdit.value && props.editCheckIn) {
      await checkInStore.update(props.editCheckIn.id!, {
        categoryId: categoryId.value,
        content: content.value.trim(),
        recordDate: recordDate.value,
        recordTime: recordTime.value,
        mediaFiles: mediaFiles.value.map((m) => ({ file: m.file, type: m.type })),
        topicTags,
        keepExistingMedia: true
      })
    } else {
      await checkInStore.add({
        categoryId: categoryId.value,
        content: content.value.trim(),
        recordDate: recordDate.value,
        recordTime: recordTime.value,
        mediaFiles: mediaFiles.value.map((m) => ({ file: m.file, type: m.type })),
        topicTags
      })
    }
    emit('saved')
    emit('update:visible', false)
  } finally {
    submitting.value = false
  }
}

function close() {
  emit('update:visible', false)
}

function removeExistingMedia(id: number) {
  existingMedia.value = existingMedia.value.filter((m) => m.id !== id)
}

function getMediaUrl(media: MediaFile) {
  return checkInStore.getUrl(media.thumbnail || media.blob)
}

async function deleteExistingMedia(id: number) {
  await db.mediaFiles.delete(id)
  removeExistingMedia(id)
}
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    @click.self="close"
  >
    <div class="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
      <div class="flex items-center justify-between p-4 border-b border-slate-100">
        <h2 class="text-lg font-bold text-slate-800">{{ isEdit ? '编辑打卡' : '新建打卡' }}</h2>
        <button class="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100" @click="close">
          <X :size="20" />
        </button>
      </div>

      <div class="p-4 space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">选择分类</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="cat in categoryStore.allCategories"
              :key="cat.id"
              type="button"
              class="px-3 py-1.5 rounded-full text-sm border transition-all"
              :class="categoryId === cat.id ? 'border-transparent text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'"
              :style="categoryId === cat.id ? { backgroundColor: cat.color } : {}"
              @click="categoryId = cat.id!"
            >
              {{ cat.name }}
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">打卡内容</label>
          <textarea
            v-model="content"
            rows="4"
            placeholder="今天做了什么？系统会自动提取标题和主题"
            class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            主题标签（手动修正，用空格或逗号分隔）
          </label>
          <input
            v-model="topicInput"
            type="text"
            placeholder="留空则自动提取"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div v-if="parsedTopics.length" class="flex flex-wrap gap-1.5 mt-2">
            <span
              v-for="tag in parsedTopics"
              :key="tag"
              class="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-md"
            >
              {{ tag }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">日期</label>
            <input
              v-model="recordDate"
              type="date"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">时间</label>
            <input
              v-model="recordTime"
              type="time"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">图片 / 视频</label>
          <div v-if="existingMedia.length" class="flex flex-wrap gap-3 mb-3">
            <div
              v-for="m in existingMedia"
              :key="m.id"
              class="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-100 group"
            >
              <img v-if="m.fileType === 'image'" :src="getMediaUrl(m)" class="w-full h-full object-cover" />
              <video v-else :src="getMediaUrl(m)" class="w-full h-full object-cover" muted playsinline />
              <button
                type="button"
                class="absolute top-1 right-1 w-6 h-6 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                @click="deleteExistingMedia(m.id!)"
              >
                <X :size="14" />
              </button>
            </div>
          </div>
          <MediaUploader v-model="mediaFiles" />
        </div>
      </div>

      <div class="p-4 border-t border-slate-100 flex justify-end gap-3">
        <button class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" @click="close">取消</button>
        <button
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          :disabled="!canSubmit || submitting"
          @click="submit"
        >
          {{ submitting ? '保存中...' : (isEdit ? '保存修改' : '保存打卡') }}
        </button>
      </div>
    </div>
  </div>
</template>
