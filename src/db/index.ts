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
  }
}

export const db = new CheckInDB()

export async function seedCategories(): Promise<void> {
  const count = await db.categories.count()
  if (count === 0) {
    await db.categories.bulkAdd([
      { name: '健身', color: '#ef4444', icon: 'Dumbbell', sortOrder: 0, uuid: generateUUID(), createdAt: Date.now(), updatedAt: Date.now() },
      { name: '阅读', color: '#3b82f6', icon: 'BookOpen', sortOrder: 1, uuid: generateUUID(), createdAt: Date.now(), updatedAt: Date.now() },
      { name: '学习', color: '#10b981', icon: 'GraduationCap', sortOrder: 2, uuid: generateUUID(), createdAt: Date.now(), updatedAt: Date.now() },
      { name: '生活', color: '#f59e0b', icon: 'Coffee', sortOrder: 3, uuid: generateUUID(), createdAt: Date.now(), updatedAt: Date.now() }
    ])
  }
}
