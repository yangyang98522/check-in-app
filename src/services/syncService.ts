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

export async function merge(data: SyncData): Promise<void> {
  const localCategories = await db.categories.toArray()
  const localCheckIns = await db.checkIns.toArray()
  const localMediaFiles = await db.mediaFiles.toArray()

  // Merge categories by uuid, keep the one with later updatedAt
  const categoryMap = new Map<string, Category>()
  for (const c of localCategories) {
    if (c.uuid) categoryMap.set(c.uuid, c)
  }
  for (const c of data.categories) {
    if (!c.uuid) continue
    const local = categoryMap.get(c.uuid)
    const remoteTime = c.updatedAt || c.createdAt || 0
    const localTime = local ? (local.updatedAt || local.createdAt || 0) : 0
    if (!local || remoteTime > localTime) {
      categoryMap.set(c.uuid, c)
    }
  }
  const mergedCategories = Array.from(categoryMap.values()).sort((a, b) => a.sortOrder - b.sortOrder)

  const categoryUuidToId = new Map<string, number>()
  for (let i = 0; i < mergedCategories.length; i++) {
    mergedCategories[i].id = i + 1
    categoryUuidToId.set(mergedCategories[i].uuid, mergedCategories[i].id!)
  }

  // Merge checkIns by uuid
  const checkInMap = new Map<string, CheckIn>()
  for (const ci of localCheckIns) {
    if (ci.uuid) checkInMap.set(ci.uuid, ci)
  }
  for (const ci of data.checkIns) {
    if (!ci.uuid) continue
    const local = checkInMap.get(ci.uuid)
    const remoteTime = ci.updatedAt || ci.createdAt || 0
    const localTime = local ? (local.updatedAt || local.createdAt || 0) : 0
    if (!local || remoteTime > localTime) {
      checkInMap.set(ci.uuid, ci)
    }
  }
  const mergedCheckIns = Array.from(checkInMap.values())

  const checkInUuidToId = new Map<string, number>()
  for (let i = 0; i < mergedCheckIns.length; i++) {
    const ci = mergedCheckIns[i]
    ci.id = i + 1
    checkInUuidToId.set(ci.uuid, ci.id!)
    if (ci.categoryUuid && categoryUuidToId.has(ci.categoryUuid)) {
      ci.categoryId = categoryUuidToId.get(ci.categoryUuid)!
    }
  }

  // Merge mediaFiles by uuid
  const mediaFileMap = new Map<string, MediaFile>()
  for (const m of localMediaFiles) {
    if (m.uuid) mediaFileMap.set(m.uuid, m)
  }
  for (const m of data.mediaFiles) {
    if (!m.uuid) continue
    const local = mediaFileMap.get(m.uuid)
    const remoteTime = m.createdAt || 0
    const localTime = local ? (local.createdAt || 0) : 0
    if (!local || remoteTime > localTime) {
      const blob = base64ToBlob(m.blob)
      const thumbnail = m.thumbnail ? base64ToBlob(m.thumbnail) : undefined
      mediaFileMap.set(m.uuid, { ...m, blob, thumbnail } as MediaFile)
    }
  }
  const mergedMediaFiles = Array.from(mediaFileMap.values())
  for (let i = 0; i < mergedMediaFiles.length; i++) {
    const m = mergedMediaFiles[i]
    m.id = i + 1
    if (m.checkInUuid && checkInUuidToId.has(m.checkInUuid)) {
      m.checkInId = checkInUuidToId.get(m.checkInUuid)!
    }
  }

  // Clear and re-insert with clean sequential ids
  await db.transaction('rw', db.categories, db.checkIns, db.mediaFiles, async () => {
    await db.categories.clear()
    await db.checkIns.clear()
    await db.mediaFiles.clear()

    if (mergedCategories.length) {
      await db.categories.bulkAdd(mergedCategories)
    }
    if (mergedCheckIns.length) {
      await db.checkIns.bulkAdd(mergedCheckIns)
    }
    if (mergedMediaFiles.length) {
      await db.mediaFiles.bulkAdd(mergedMediaFiles)
    }
  })
}

export async function restore(data: SyncData): Promise<void> {
  await merge(data)
}

export async function syncFromCloud(userId: string): Promise<boolean> {
  const data = await download(userId)
  if (!data) return false
  await merge(data)
  return true
}

export async function syncToCloud(userId: string): Promise<void> {
  await upload(userId)
}
