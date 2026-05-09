// src/services/plantService.ts
import { db, type Plant } from '@/db'

function now(): string {
  return new Date().toISOString()
}

export const plantService = {
  /** Get all plants, ordered by createdAt descending */
  async list(): Promise<Plant[]> {
    return db.plants.orderBy('createdAt').reverse().toArray()
  },

  /** Get a single plant by id */
  async get(id: number): Promise<Plant | undefined> {
    return db.plants.get(id)
  },

  /** Create a new plant */
  async create(data: Omit<Plant, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const ts = now()
    return db.plants.add({
      ...data,
      createdAt: ts,
      updatedAt: ts
    })
  },

  /** Update an existing plant */
  async update(id: number, data: Partial<Omit<Plant, 'id' | 'createdAt' | 'updatedAt'>>): Promise<number> {
    return db.plants.update(id, { ...data, updatedAt: now() })
  },

  /** Delete a plant and its associated care records and photos */
  async remove(id: number): Promise<void> {
    await db.transaction('rw', db.plants, db.careRecords, db.photos, async () => {
      await db.careRecords.where('plantId').equals(id).delete()
      await db.photos.where('plantId').equals(id).delete()
      await db.plants.delete(id)
    })
  }
}
