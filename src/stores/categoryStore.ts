import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { db, seedCategories, type Category } from '../db'
import { scheduleCloudSync } from '../utils/syncHelper'

export const useCategoryStore = defineStore('category', () => {
  const categories = ref<Category[]>([])
  const loaded = ref(false)

  const allCategories = computed(() => categories.value)

  async function load(): Promise<void> {
    await seedCategories()
    categories.value = await db.categories.orderBy('sortOrder').toArray()
    loaded.value = true
  }

  async function add(name: string, color = '#3b82f6', icon = 'Tag'): Promise<number> {
    const count = await db.categories.count()
    const id = await db.categories.add({
      name,
      color,
      icon,
      sortOrder: count,
      createdAt: Date.now()
    })
    await load()
    scheduleCloudSync()
    return id as number
  }

  async function update(id: number, changes: Partial<Category>): Promise<void> {
    await db.categories.update(id, changes)
    await load()
    scheduleCloudSync()
  }

  async function remove(id: number): Promise<void> {
    await db.transaction('rw', db.categories, db.checkIns, db.mediaFiles, async () => {
      const checkIns = await db.checkIns.where({ categoryId: id }).toArray()
      for (const ci of checkIns) {
        await db.mediaFiles.where({ checkInId: ci.id }).delete()
        await db.checkIns.delete(ci.id!)
      }
      await db.categories.delete(id)
    })
    await load()
    scheduleCloudSync()
  }

  function getById(id: number): Category | undefined {
    return categories.value.find((c) => c.id === id)
  }

  return { categories, loaded, allCategories, load, add, update, remove, getById }
})
