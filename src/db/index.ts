// src/db/index.ts
import Dexie, { type Table } from 'dexie'

/** Plant main table */
export interface Plant {
  id?: number
  name: string
  species?: string          // AI-identified or manually entered species name
  sowDate?: string          // ISO date string
  location?: string         // placement location
  notes?: string
  coverPhotoId?: number     // cover photo ID
  createdAt: string
  updatedAt: string
}

/** Care record types */
export type CareType = 'watering' | 'fertilizing' | 'repotting' | 'pruning' | 'other'

/** Care record table */
export interface CareRecord {
  id?: number
  plantId: number
  type: CareType
  date: string              // ISO date string
  note?: string
  createdAt: string
}

/** Photo table */
export interface Photo {
  id?: number
  plantId: number
  data: Blob                // compressed original image
  thumbnail: Blob           // thumbnail
  takenAt: string           // photo taken time
  createdAt: string
}

/** Chinese labels for care types */
export const careTypeLabels: Record<CareType, string> = {
  watering: '浇水',
  fertilizing: '施肥',
  repotting: '换盆',
  pruning: '修剪',
  other: '其他'
}

class PlantDB extends Dexie {
  plants!: Table<Plant, number>
  careRecords!: Table<CareRecord, number>
  photos!: Table<Photo, number>

  constructor() {
    super('PlantManagerDB')
    this.version(1).stores({
      plants: '++id, name, createdAt',
      careRecords: '++id, plantId, date, type',
      photos: '++id, plantId, createdAt'
    })
  }
}

export const db = new PlantDB()
