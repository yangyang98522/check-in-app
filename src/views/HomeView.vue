<script setup lang="ts">
import { ref } from 'vue'
import { Plus } from 'lucide-vue-next'
import { useCheckInStore } from '../stores/checkInStore'
import StatCards from '../components/StatCards.vue'
import CheckInCard from '../components/CheckInCard.vue'
import CheckInModal from '../components/CheckInModal.vue'
import CalendarHeatmap from '../components/CalendarHeatmap.vue'
import { today } from '../utils/date'
import type { CheckIn } from '../db'

const checkInStore = useCheckInStore()
const showModal = ref(false)
const editingCheckIn = ref<CheckIn | null>(null)

const todayCount = () => checkInStore.allCheckIns.filter((ci) => ci.recordDate === today()).length

function openAdd() {
  editingCheckIn.value = null
  showModal.value = true
}

function openEdit(ci: CheckIn) {
  editingCheckIn.value = ci
  showModal.value = true
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">今日打卡</h2>
        <p class="text-sm text-slate-500 mt-1">今天已记录 {{ todayCount() }} 次</p>
      </div>
      <button
        class="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        @click="openAdd"
      >
        <Plus :size="18" />
        <span>新建打卡</span>
      </button>
    </div>

    <StatCards />

    <div class="grid lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-4">
        <h3 class="text-base font-semibold text-slate-700">最近记录</h3>
        <CheckInCard
          v-for="ci in checkInStore.allCheckIns.slice(0, 20)"
          :key="ci.id"
          :check-in="ci"
          @delete="checkInStore.remove"
          @edit="openEdit"
        />
        <div v-if="checkInStore.allCheckIns.length === 0" class="text-center py-12 text-slate-400">
          还没有打卡记录，点击右上角开始第一次打卡吧
        </div>
      </div>

      <div class="space-y-4">
        <CalendarHeatmap :data="checkInStore.statsByCategory()" />
      </div>
    </div>

    <CheckInModal v-model:visible="showModal" :edit-check-in="editingCheckIn" @saved="() => {}" />
  </div>
</template>
