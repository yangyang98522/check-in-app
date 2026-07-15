<script setup lang="ts">
import { toasts } from '../utils/toast'
</script>

<template>
  <transition-group
    name="toast"
    tag="div"
    class="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none"
  >
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="px-4 py-2 rounded-full text-sm font-medium shadow-lg backdrop-blur-sm transition-all duration-300"
      :class="[
        toast.type === 'success'
          ? 'bg-slate-800/90 text-white'
          : 'bg-red-500/90 text-white'
      ]"
    >
      {{ toast.message }}
    </div>
  </transition-group>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
