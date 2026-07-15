<script setup lang="ts">
import { computed } from 'vue'
import { useCheckInStore } from '../stores/checkInStore'
import { useCategoryStore } from '../stores/categoryStore'
import { Calendar, Layers, Hash, Trophy } from 'lucide-vue-next'

const checkInStore = useCheckInStore()
const categoryStore = useCategoryStore()

const total = computed(() => checkInStore.allCheckIns.length)

const streak = computed(() => {
  const dates = [...new Set(checkInStore.allCheckIns.map((ci) => ci.recordDate))].sort().reverse()
  if (dates.length === 0) return 0
  let count = 1
  const todayStr = new Date().toISOString().slice(0, 10)
  if (dates[0] !== todayStr) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    if (dates[0] !== yesterday) return 0
  }
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1])
    const curr = new Date(dates[i])
    if ((prev.getTime() - curr.getTime()) / 86400000 === 1) {
      count++
    } else {
      break
    }
  }
  return count
})

const topicCount = computed(() => {
  const set = new Set<string>()
  checkInStore.allCheckIns.forEach((ci) => ci.topicTags.forEach((t) => set.add(t)))
  return set.size
})

const topCategory = computed(() => {
  const map = new Map<number, number>()
  checkInStore.allCheckIns.forEach((ci) => map.set(ci.categoryId, (map.get(ci.categoryId) || 0) + 1))
  let topId = 0
  let topCount = 0
  map.forEach((count, id) => {
    if (count > topCount) {
      topCount = count
      topId = id
    }
  })
  const cat = categoryStore.getById(topId)
  return cat ? `${cat.name} (${topCount})` : '-'
})

const cards = computed(() => [
  { label: '总打卡次数', value: total.value, icon: Trophy, color: 'bg-amber-100 text-amber-700' },
  { label: '连续打卡', value: `${streak.value} 天`, icon: Calendar, color: 'bg-emerald-100 text-emerald-700' },
  { label: '主题数量', value: topicCount.value, icon: Hash, color: 'bg-blue-100 text-blue-700' },
  { label: '最活跃分类', value: topCategory.value, icon: Layers, color: 'bg-purple-100 text-purple-700' }
])
</script>

<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div
      v-for="card in cards"
      :key="card.label"
      class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"
    >
      <div class="flex items-center gap-3 mb-2">
        <div class="w-9 h-9 rounded-lg flex items-center justify-center" :class="card.color">
          <component :is="card.icon" :size="18" />
        </div>
        <span class="text-sm text-slate-500">{{ card.label }}</span>
      </div>
      <div class="text-xl font-bold text-slate-800 truncate">{{ card.value }}</div>
    </div>
  </div>
</template>
