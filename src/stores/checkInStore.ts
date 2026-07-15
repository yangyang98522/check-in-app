import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { db, type CheckIn, type MediaFile } from '../db'
import { extractTitle, extractTopics } from '../utils/extract'
import { generateUUID } from '../utils/uuid'
import { scheduleCloudSync } from '../utils/syncHelper'

export interface CheckInForm {
  categoryId: number
  content: string
  recordDate: string
  recordTime: string
  mediaFiles: { file: File; type: 'image' | 'video' }[]
  topicTags?: string[]
  keepExistingMedia?: boolean
}

export const useCheckInStore = defineStore('checkIn', () => {
  const checkIns = ref<CheckIn[]>([])
  const mediaFiles = ref<MediaFile[]>([])

  const allCheckIns = computed(() =>
    checkIns.value.sort((a, b) => `${b.recordDate} ${b.recordTime}`.localeCompare(`${a.recordDate} ${a.recordTime}`))
  )

  async function load(): Promise<void> {
    checkIns.value = await db.checkIns.toArray()
    mediaFiles.value = await db.mediaFiles.toArray()
  }

  async function add(form: CheckInForm): Promise<CheckIn> {
    const title = extractTitle(form.content)
    const topicTags = extractTopics(form.content)
    const now = Date.now()

    const category = await db.categories.get(form.categoryId)
    const checkInUuid = generateUUID()

    const id = await db.checkIns.add({
      categoryId: form.categoryId,
      categoryUuid: category?.uuid,
      title,
      content: form.content,
      recordDate: form.recordDate,
      recordTime: form.recordTime,
      topicTags,
      uuid: checkInUuid,
      createdAt: now,
      updatedAt: now
    })

    for (const item of form.mediaFiles) {
      await db.mediaFiles.add({
        checkInId: id as number,
        checkInUuid,
        fileType: item.type,
        blob: item.file,
        size: item.file.size,
        uuid: generateUUID(),
        createdAt: now
      })
    }

    await load()
    scheduleCloudSync()
    return checkIns.value.find((ci) => ci.id === id)!
  }

  async function update(id: number, form: Partial<CheckInForm>): Promise<void> {
    const changes: Partial<CheckIn> = {}
    if (form.categoryId !== undefined) changes.categoryId = form.categoryId
    if (form.content !== undefined) {
      changes.content = form.content
      changes.title = extractTitle(form.content)
      changes.topicTags = extractTopics(form.content)
    }
    if (form.recordDate !== undefined) changes.recordDate = form.recordDate
    if (form.recordTime !== undefined) changes.recordTime = form.recordTime
    changes.updatedAt = Date.now()

    await db.checkIns.update(id, changes)

    if (form.mediaFiles && form.mediaFiles.length > 0) {
      await db.mediaFiles.where({ checkInId: id }).delete()
      const checkInUuid = (await db.checkIns.get(id))?.uuid || generateUUID()
      for (const item of form.mediaFiles) {
        await db.mediaFiles.add({
          checkInId: id,
          checkInUuid: checkInUuid,
          fileType: item.type,
          blob: item.file,
          size: item.file.size,
          uuid: generateUUID(),
          createdAt: Date.now()
        })
      }
    }

    await load()
    scheduleCloudSync()
  }

  async function remove(id: number): Promise<void> {
    await db.transaction('rw', db.checkIns, db.mediaFiles, async () => {
      await db.mediaFiles.where({ checkInId: id }).delete()
      await db.checkIns.delete(id)
    })
    await load()
    scheduleCloudSync()
  }

  function getByCategory(categoryId: number): CheckIn[] {
    return allCheckIns.value.filter((ci) => ci.categoryId === categoryId)
  }

  function getById(id: number): CheckIn | undefined {
    return checkIns.value.find((ci) => ci.id === id)
  }

  function getMediaByCheckIn(checkInId: number): MediaFile[] {
    return mediaFiles.value.filter((m) => m.checkInId === checkInId)
  }

  function getUrl(blob: Blob): string {
    return URL.createObjectURL(blob)
  }

  function statsByCategory(categoryId?: number): { date: string; count: number }[] {
    const list = categoryId ? getByCategory(categoryId) : allCheckIns.value
    const map = new Map<string, number>()
    for (const ci of list) {
      map.set(ci.recordDate, (map.get(ci.recordDate) || 0) + 1)
    }
    return Array.from(map.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  return {
    checkIns,
    mediaFiles,
    allCheckIns,
    load,
    add,
    update,
    remove,
    getByCategory,
    getById,
    getMediaByCheckIn,
    getUrl,
    statsByCategory
  }
})
