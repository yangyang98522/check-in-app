<script setup lang="ts">
import { computed } from 'vue'
import { useCategoryStore } from '../stores/categoryStore'
import { useCheckInStore } from '../stores/checkInStore'
import StatCards from '../components/StatCards.vue'
import CalendarHeatmap from '../components/CalendarHeatmap.vue'

const categoryStore = useCategoryStore()
const checkInStore = useCheckInStore()

const categoryStats = computed(() => {
  return categoryStore.allCategories.map((cat) => {
    const count = checkInStore.getByCategory(cat.id!).length
    const topicMap = new Map<string, number>()
    checkInStore.getByCategory(cat.id!).forEach((ci) => {
      ci.topicTags.forEach((t) => topicMap.set(t, (topicMap.get(t) || 0) + 1))
    })
    const topTopics = Array.from(topicMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
    return { ...cat, count, topTopics }
  })
})

const allTopics = computed(() => {
  const map = new Map<string, number>()
  checkInStore.allCheckIns.forEach((ci) => {
    ci.topicTags.forEach((t) => map.set(t, (map.get(t) || 0) + 1))
  })
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
})
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <h2 class="text-2xl font-bold text-slate-800">数据统计</h2>

    <StatCards />

    <div class="grid lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-4">
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 class="text-base font-semibold text-slate-800 mb-4">分类打卡次数</h3>
          <div class="space-y-4">
            <div v-for="stat in categoryStats" :key="stat.id" class="flex items-center gap-4">
              <div class="w-24 text-sm text-slate-600 truncate">{{ stat.name }}</div>
              <div class="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :style="{ width: Math.max(stat.count * 10, 5) + '%', backgroundColor: stat.color }"
                />
              </div>
              <div class="w-10 text-right text-sm font-medium text-slate-700">{{ stat.count }}</div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 class="text-base font-semibold text-slate-800 mb-4">关键主题排行</h3>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="[topic, count] in allTopics"
              :key="topic"
              class="px-3 py-1.5 rounded-full text-sm bg-slate-100 text-slate-700"
            >
              {{ topic }} <span class="text-slate-400 ml-1">{{ count }}</span>
            </div>
            <div v-if="allTopics.length === 0" class="text-slate-400 text-sm">暂无主题数据</div>
          </div>
        </div>
      </div>

      <div>
        <CalendarHeatmap :data="checkInStore.statsByCategory()" />
      </div>
    </div>
  </div>
</template>
