<script setup lang="ts">
import { ref, computed } from 'vue'
import { ImagePlus, X } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: { file: File; type: 'image' | 'video'; preview: string }[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: { file: File; type: 'image' | 'video'; preview: string }[]): void
}>()

const files = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const fileInput = ref<HTMLInputElement | null>(null)

function triggerUpload() {
  fileInput.value?.click()
}

function handleFiles(event: Event) {
  const target = event.target as HTMLInputElement
  if (!target.files) return

  const newFiles: { file: File; type: 'image' | 'video'; preview: string }[] = []
  for (const file of Array.from(target.files)) {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) continue
    const type = file.type.startsWith('image/') ? 'image' : 'video'
    newFiles.push({ file, type, preview: URL.createObjectURL(file) })
  }
  files.value = [...files.value, ...newFiles]
  target.value = ''
}

function remove(index: number) {
  URL.revokeObjectURL(files.value[index].preview)
  files.value = files.value.filter((_, i) => i !== index)
}
</script>

<template>
  <div>
    <div class="flex flex-wrap gap-3 mb-3">
      <div
        v-for="(item, index) in files"
        :key="index"
        class="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-100 group"
      >
        <img v-if="item.type === 'image'" :src="item.preview" class="w-full h-full object-cover" />
        <video v-else :src="item.preview" class="w-full h-full object-cover" muted playsinline />
        <button
          type="button"
          class="absolute top-1 right-1 w-6 h-6 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          @click="remove(index)"
        >
          <X :size="14" />
        </button>
      </div>

      <button
        type="button"
        class="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 flex flex-col items-center justify-center text-slate-500 hover:text-blue-600 transition-colors"
        @click="triggerUpload"
      >
        <ImagePlus :size="20" class="mb-1" />
        <span class="text-xs">图片/视频</span>
      </button>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/*,video/*"
      multiple
      class="hidden"
      @change="handleFiles"
    />

    <p class="text-xs text-slate-400">支持图片和视频，单文件建议不超过 50MB</p>
  </div>
</template>
