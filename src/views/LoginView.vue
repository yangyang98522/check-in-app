<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { Mail, Lock, UserPlus, LogIn } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const isSignUp = ref(false)
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const passwordMismatch = computed(() => {
  return isSignUp.value && password.value !== confirmPassword.value
})

async function submit() {
  if (passwordMismatch.value) return
  let success = false
  if (isSignUp.value) {
    success = await authStore.signUp(email.value, password.value)
  } else {
    success = await authStore.signIn(email.value, password.value)
  }
  if (success) {
    router.push('/')
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 p-4">
    <div class="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-slate-800">{{ isSignUp ? '注册账号' : '登录' }}</h1>
        <p class="text-sm text-slate-500 mt-2">登录后数据可同步到云端</p>
      </div>

      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">邮箱</label>
          <div class="relative">
            <Mail class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
            <input
              v-model="email"
              type="email"
              required
              placeholder="your@email.com"
              class="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">密码</label>
          <div class="relative">
            <Lock class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
            <input
              v-model="password"
              type="password"
              required
              placeholder="至少6位"
              class="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div v-if="isSignUp">
          <label class="block text-sm font-medium text-slate-700 mb-1.5">确认密码</label>
          <div class="relative">
            <Lock class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
            <input
              v-model="confirmPassword"
              type="password"
              required
              placeholder="再次输入密码"
              class="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <p v-if="passwordMismatch" class="text-xs text-red-500 mt-1">两次输入的密码不一致</p>
        </div>

        <div v-if="authStore.error" class="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
          {{ authStore.error }}
        </div>

        <button
          type="submit"
          class="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
          :disabled="authStore.loading || passwordMismatch"
        >
          <component :is="isSignUp ? UserPlus : LogIn" :size="18" />
          {{ authStore.loading ? (isSignUp ? '注册中...' : '登录中...') : (isSignUp ? '注册' : '登录') }}
        </button>
      </form>

      <div class="mt-6 text-center text-sm text-slate-500">
        {{ isSignUp ? '已有账号？' : '还没有账号？' }}
        <button class="text-blue-600 hover:underline ml-1" @click="isSignUp = !isSignUp">
          {{ isSignUp ? '去登录' : '去注册' }}
        </button>
      </div>

      <div class="mt-4 text-center">
        <button class="text-sm text-slate-400 hover:text-slate-600" @click="router.push('/')">
          暂不登录，本地使用
        </button>
      </div>
    </div>
  </div>
</template>
