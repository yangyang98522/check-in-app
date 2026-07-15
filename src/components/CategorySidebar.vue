<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCategoryStore } from '../stores/categoryStore'
import { useCheckInStore } from '../stores/checkInStore'
import { useAuthStore } from '../stores/authStore'
import { LayoutDashboard, Tag, BarChart3, Settings, Plus, Dumbbell, BookOpen, GraduationCap, Coffee, Sun, Moon, Music, PenTool, LogIn, LogOut } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const categoryStore = useCategoryStore()
const checkInStore = useCheckInStore()
const authStore = useAuthStore()

const newName = ref('')
const showAdd = ref(false)
const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#64748b']
const selectedColor = ref(colors[6])

const iconMap: Record<string, any> = {
  Dumbbell,
  BookOpen,
  GraduationCap,
  Coffee,
  Sun,
  Moon,
  Music,
  PenTool,
  Tag
}

function resolveIcon(name: string) {
  return iconMap[name] || Tag
}

function navClass(path: string) {
  const isActive = path ? route.path === path || route.path.startsWith(path) : false
  return [
    'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer',
    isActive ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'
  ]
}

function categoryClass(id: number) {
  const isActive = route.name === 'category' && Number(route.params.id) === id
  return [
    'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer',
    isActive ? 'bg-slate-100 font-medium' : 'text-slate-600 hover:bg-slate-50'
  ]
}

async function addCategory() {
  const name = newName.value.trim()
  if (!name) return
  try {
    const id = await categoryStore.add(name, selectedColor.value)
    newName.value = ''
    showAdd.value = false
    await categoryStore.load()
    if (id) router.push(`/category/${id}`)
  } catch (err) {
    console.error('添加分类失败:', err)
    alert('添加分类失败：' + (err as Error).message)
  }
}

const totalCount = computed(() => checkInStore.allCheckIns.length)
</script>

<template>
  <aside class="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex-shrink-0">
    <div class="p-4 md:p-6">
      <div class="flex items-center gap-2 mb-6">
        <div class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
          <LayoutDashboard :size="22" />
        </div>
        <div>
          <h1 class="text-lg font-bold text-slate-800 leading-tight">打卡助手</h1>
          <p class="text-xs text-slate-500">已记录 {{ totalCount }} 次</p>
        </div>
      </div>

      <nav class="space-y-1">
        <div :class="navClass('/')" @click="router.push('/')">
          <LayoutDashboard :size="18" />
          <span>首页</span>
        </div>

        <div
          v-for="cat in categoryStore.allCategories"
          :key="cat.id"
          :class="categoryClass(cat.id!)"
          @click="router.push(`/category/${cat.id}`)"
        >
          <component :is="resolveIcon(cat.icon)" :size="18" :style="{ color: cat.color }" />
          <span>{{ cat.name }}</span>
        </div>

        <div v-if="showAdd" class="px-4 py-2">
          <input
            v-model="newName"
            type="text"
            placeholder="分类名称"
            class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            @keyup.enter="addCategory"
          />
          <div class="flex gap-1 flex-wrap mb-2">
            <button
              v-for="c in colors"
              :key="c"
              type="button"
              class="w-5 h-5 rounded-full border border-slate-200"
              :style="{ backgroundColor: c }"
              :class="{ 'ring-2 ring-offset-1 ring-blue-500': selectedColor === c }"
              @click="selectedColor = c"
            />
          </div>
          <div class="flex gap-2">
            <button class="flex-1 bg-blue-600 text-white text-sm py-1.5 rounded-lg hover:bg-blue-700" @click="addCategory">确定</button>
            <button class="flex-1 text-slate-600 text-sm py-1.5 rounded-lg hover:bg-slate-100" @click="showAdd = false">取消</button>
          </div>
        </div>

        <div v-else :class="navClass('')" @click="showAdd = true">
          <Plus :size="18" />
          <span>新建分类</span>
        </div>
      </nav>

      <div class="mt-6 pt-6 border-t border-slate-200 space-y-1">
        <div :class="navClass('/stats')" @click="router.push('/stats')">
          <BarChart3 :size="18" />
          <span>统计</span>
        </div>
        <div :class="navClass('/settings')" @click="router.push('/settings')">
          <Settings :size="18" />
          <span>设置</span>
        </div>
        <div
          v-if="!authStore.isLoggedIn"
          :class="navClass('/login')"
          @click="router.push('/login')"
        >
          <LogIn :size="18" />
          <span>登录 / 注册</span>
        </div>
        <div
          v-else
          class="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer text-slate-600 hover:bg-slate-100"
          @click="authStore.signOut"
        >
          <LogOut :size="18" />
          <span>退出登录</span>
        </div>
      </div>
    </div>
  </aside>
</template>
