// src/services/careService.ts
import { db, type CareRecord, type CareType } from '@/db'

export const careService = {
  /** Get all care records for a plant, ordered by date descending */
  async listByPlant(plantId: number): Promise<CareRecord[]> {
    return db.careRecords
      .where('plantId')
      .equals(plantId)
      .reverse()
      .sortBy('date')
  },

  /** Add a care record */
  async create(data: Omit<CareRecord, 'id' | 'createdAt'>): Promise<number> {
    return db.careRecords.add({
      ...data,
      createdAt: new Date().toISOString()
    })
  },

  /** Delete a care record */
  async remove(id: number): Promise<void> {
    await db.careRecords.delete(id)
  },

  /** Get count stats by care type for a plant */
  async countByType(plantId: number): Promise<Record<CareType, number>> {
    const records = await db.careRecords
      .where('plantId')
      .equals(plantId)
      .toArray()

    return {
      watering: records.filter(r => r.type === 'watering').length,
      fertilizing: records.filter(r => r.type === 'fertilizing').length,
      repotting: records.filter(r => r.type === 'repotting').length,
      pruning: records.filter(r => r.type === 'pruning').length,
      other: records.filter(r => r.type === 'other').length
    }
  }
}
