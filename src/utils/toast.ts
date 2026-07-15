import { ref } from 'vue'

export interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error'
}

export const toasts = ref<ToastItem[]>([])

let toastId = 0

export function showToast(message: string, type: 'success' | 'error' = 'success'): void {
  const item: ToastItem = { id: ++toastId, message, type }
  toasts.value.push(item)
  window.setTimeout(() => {
    const index = toasts.value.findIndex((t) => t.id === item.id)
    if (index >= 0) {
      toasts.value.splice(index, 1)
    }
  }, 5000)
}
