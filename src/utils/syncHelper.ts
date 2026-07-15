import { useAuthStore } from '../stores/authStore'
import { syncToCloud } from '../services/syncService'
import { showToast } from './toast'

let syncTimer: number | null = null
let isSyncing = false

export function scheduleCloudSync(delay = 5000): void {
  const authStore = useAuthStore()
  if (!authStore.user) return

  if (syncTimer) {
    window.clearTimeout(syncTimer)
  }

  syncTimer = window.setTimeout(async () => {
    if (isSyncing) {
      scheduleCloudSync(delay)
      return
    }
    isSyncing = true
    try {
      await syncToCloud(authStore.user!.id)
      console.log('已同步到云端')
      showToast('已同步到云端', 'success')
    } catch (err) {
      console.error('同步到云端失败', err)
      showToast('同步到云端失败', 'error')
    } finally {
      isSyncing = false
      syncTimer = null
    }
  }, delay)
}

export async function syncNow(): Promise<void> {
  const authStore = useAuthStore()
  if (!authStore.user) return
  await syncToCloud(authStore.user.id)
}
