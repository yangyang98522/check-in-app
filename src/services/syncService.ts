import { supabase } from '../supabase'
import { db, type Category, type CheckIn, type MediaFile } from '../db'

export interface SyncData {
  version: number
  exportedAt: number
  categories: Category[]
  checkIns: CheckIn[]
  mediaFiles: SerializedMediaFile[]
}

interface SerializedMediaFile extends Omit<MediaFile, 'blob' | 'thumbnail'> {
  blob: string
  thumbnail?: string
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] || 'application/octet-stream'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mime })
}

export async function exportAll(): Promise<SyncData> {
  const [categories, checkIns, mediaFiles] = await Promise.all([
    db.categories.toArray(),
    db.checkIns.toArray(),
    db.mediaFiles.toArray()
  ])

  const serializedMediaFiles: SerializedMediaFile[] = []
  for (const m of mediaFiles) {
    serializedMediaFiles.push({
      ...m,
      blob: await blobToBase64(m.blob),
      thumbnail: m.thumbnail ? await blobToBase64(m.thumbnail) : undefined
    })
  }

  return {
    version: 1,
    exportedAt: Date.now(),
    categories,
    checkIns,
    mediaFiles: serializedMediaFiles
  }
}

export async function upload(userId: string): Promise<void> {
  const data = await exportAll()
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  const { error } = await supabase.storage
    .from('sync')
    .upload(`${userId}/data.json`, blob, { upsert: true })
  if (error) throw error
}

export async function download(userId: string): Promise<SyncData | null> {
  const { data, error } = await supabase.storage
    .from('sync')
    .download(`${userId}/data.json`)
  if (error) {
    if (error.message.toLowerCase().includes('not found')) {
      return null
    }
    throw error
  }
  const text = await data.text()
  return JSON.parse(text) as SyncData
}

export async function restore(data: SyncData): Promise<void> {
  await db.transaction('rw', db.categories, db.checkIns, db.mediaFiles, async () => {
    await db.categories.clear()
    await db.checkIns.clear()
    await db.mediaFiles.clear()

    if (data.categories.length) {
      await db.categories.bulkAdd(data.categories)
    }
    if (data.checkIns.length) {
      await db.checkIns.bulkAdd(data.checkIns)
    }
    if (data.mediaFiles.length) {
      const mediaFiles = data.mediaFiles.map(m => ({
        ...m,
        blob: base64ToBlob(m.blob),
        thumbnail: m.thumbnail ? base64ToBlob(m.thumbnail) : undefined
      }))
      await db.mediaFiles.bulkAdd(mediaFiles as MediaFile[])
    }
  })
}

export async function syncFromCloud(userId: string): Promise<boolean> {
  const data = await download(userId)
  if (!data) return false
  await restore(data)
  return true
}

export async function syncToCloud(userId: string): Promise<void> {
  await upload(userId)
}
