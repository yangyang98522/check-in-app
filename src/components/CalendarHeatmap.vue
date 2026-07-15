<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'

const props = defineProps<{
  data: { date: string; count: number }[]
}>()

const year = new Date().getFullYear()
const month = new Date().getMonth() + 1

const days = computed(() => {
  const start = dayjs(`${year}-${month}-01`)
  const list: { date: string; count: number }[] = []
  for (let i = 0; i < start.daysInMonth(); i++) {
    const date = start.add(i, 'day').format('YYYY-MM-DD')
    const found = props.data.find((d) => d.date === date)
    list.push({ date, count: found ? found.count : 0 })
  }
  return list
})

function level(count: number): string {
  if (count === 0) return 'bg-slate-100'
  if (count === 1) return 'bg-emerald-200'
  if (count <= 3) return 'bg-emerald-400'
  return 'bg-emerald-600'
}
</script>

<template>
  <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
    <h3 class="text-base font-semibold text-slate-800 mb-4">本月打卡热力图</h3>
    <div class="grid grid-cols-7 gap-1.5">
      <div
        v-for="day in days"
        :key="day.date"
        class="aspect-square rounded-md flex items-center justify-center text-[10px] text-slate-500 transition-colors"
        :class="level(day.count)"
        :title="`${day.date}: ${day.count} 次打卡`"
      >
        <span :class="day.count > 2 ? 'text-white' : ''">{{ day.date.slice(8) }}</span>
      </div>
    </div>
    <div class="flex items-center justify-end gap-2 mt-3 text-xs text-slate-400">
      <span>少</span>
      <div class="flex gap-1">
        <div class="w-3 h-3 rounded-sm bg-slate-100" />
        <div class="w-3 h-3 rounded-sm bg-emerald-200" />
        <div class="w-3 h-3 rounded-sm bg-emerald-400" />
        <div class="w-3 h-3 rounded-sm bg-emerald-600" />
      </div>
      <span>多</span>
    </div>
  </div>
</template>
