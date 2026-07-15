import Dexie, { type Table } from 'dexie'

export interface Category {
  id?: number
  name: string
  color: string
  icon: string
  sortOrder: number
  createdAt: number
}

export interface CheckIn {
  id?: number
  categoryId: number
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
  checkInId: number
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
  }
}

export const db = new CheckInDB()

export async function seedCategories(): Promise<void> {
  const count = await db.categories.count()
  if (count === 0) {
    await db.categories.bulkAdd([
      { name: '健身', color: '#ef4444', icon: 'Dumbbell', sortOrder: 0, createdAt: Date.now() },
      { name: '阅读', color: '#3b82f6', icon: 'BookOpen', sortOrder: 1, createdAt: Date.now() },
      { name: '学习', color: '#10b981', icon: 'GraduationCap', sortOrder: 2, createdAt: Date.now() },
      { name: '生活', color: '#f59e0b', icon: 'Coffee', sortOrder: 3, createdAt: Date.now() }
    ])
  }
}
