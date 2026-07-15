import { useAuthStore } from '../stores/authStore'
import { syncToCloud } from '../services/syncService'

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
    } catch (err) {
      console.error('同步到云端失败', err)
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
