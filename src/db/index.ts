import Dexie, { type Table } from 'dexie'
import { generateUUID } from '../utils/uuid'

export interface Category {
  id?: number
  uuid: string
  name: string
  color: string
  icon: string
  sortOrder: number
  createdAt: number
  updatedAt: number
}

export interface CheckIn {
  id?: number
  uuid: string
  categoryId: number
  categoryUuid?: string
  title: string
  content: string
  recordDate: string
  recordTime: string
  topicTags: string[]
  createdAt: number
  updatedAt: number
}

export interface MediaFile {
  id?: number
  uuid: string
  checkInId: number
  checkInUuid: string
  fileType: 'image' | 'video'
  blob: Blob
  thumbnail?: Blob
  size: number
  duration?: number
  createdAt: number
}

class CheckInDB extends Dexie {
  categories!: Table<Category, number>
  checkIns!: Table<CheckIn, number>
  mediaFiles!: Table<MediaFile, number>

  constructor() {
    super('CheckInDB')
    this.version(1).stores({
      categories: '++id, name',
      checkIns: '++id, categoryId, recordDate, [categoryId+recordDate]',
      mediaFiles: '++id, checkInId, fileType'
    })
    this.version(2).stores({
      categories: '++id, name, sortOrder',
      checkIns: '++id, categoryId, recordDate, [categoryId+recordDate]',
      mediaFiles: '++id, checkInId, fileType'
    })
    this.version(3).stores({
      categories: '++id, uuid, name, sortOrder',
      checkIns: '++id, uuid, categoryId, recordDate, [categoryId+recordDate]',
      mediaFiles: '++id, uuid, checkInId, checkInUuid, fileType'
    }).upgrade(async (tx) => {
      const categories = await tx.table('categories').toArray()
      for (const c of categories) {
        await tx.table('categories').update(c.id, {
          uuid: generateUUID(),
          updatedAt: c.createdAt || Date.now()
        })
      }

      const checkIns = await tx.table('checkIns').toArray()
      for (const ci of checkIns) {
        await tx.table('checkIns').update(ci.id, {
          uuid: generateUUID(),
          updatedAt: ci.createdAt || Date.now()
        })
      }

      const mediaFiles = await tx.table('mediaFiles').toArray()
      for (const m of mediaFiles) {
        const checkIn = checkIns.find((ci: { id?: number }) => ci.id === m.checkInId)
        await tx.table('mediaFiles').update(m.id, {
          uuid: generateUUID(),
          checkInUuid: checkIn?.uuid || ''
        })
      }
    })
    this.version(4).stores({
      categories: '++id, uuid, name, sortOrder',
      checkIns: '++id, uuid, categoryId, recordDate, [categoryId+recordDate]',
      mediaFiles: '++id, uuid, checkInId, checkInUuid, fileType'
    }).upgrade(async (tx) => {
      // 清理重复的分类，保留 id 最小的一个
      const categories = await tx.table('categories').toArray()
      const groups = new Map<string, number[]>()
      for (const c of categories) {
        if (!groups.has(c.name)) groups.set(c.name, [])
        groups.get(c.name)!.push(c.id!)
      }
      for (const ids of groups.values()) {
        if (ids.length > 1) {
          ids.sort((a, b) => a - b)
          const keepId = ids[0]
          for (let i = 1; i < ids.length; i++) {
            await tx.table('checkIns').where({ categoryId: ids[i] }).modify({ categoryId: keepId })
            await tx.table('categories').delete(ids[i])
          }
        }
      }
    })
  }
}

export const db = new CheckInDB()

export async function seedCategories(): Promise<void> {
  await db.transaction('rw', db.categories, async () => {
    const count = await db.categories.count()
    if (count === 0) {
      await db.categories.bulkAdd([
        { name: '健身', color: '#ef4444', icon: 'Dumbbell', sortOrder: 0, uuid: generateUUID(), createdAt: Date.now(), updatedAt: Date.now() },
        { name: '阅读', color: '#3b82f6', icon: 'BookOpen', sortOrder: 1, uuid: generateUUID(), createdAt: Date.now(), updatedAt: Date.now() },
        { name: '学习', color: '#10b981', icon: 'GraduationCap', sortOrder: 2, uuid: generateUUID(), createdAt: Date.now(), updatedAt: Date.now() },
        { name: '生活', color: '#f59e0b', icon: 'Coffee', sortOrder: 3, uuid: generateUUID(), createdAt: Date.now(), updatedAt: Date.now() }
      ])
    }
  })
}
