// src/services/photoService.ts
import imageCompression from 'browser-image-compression'
import { db, type Photo } from '@/db'

export const photoService = {
  /** Compress and save a photo, auto-set as cover if first photo */
  async save(plantId: number, file: File): Promise<number> {
    // Compress original to ~300KB
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 1920,
      useWebWorker: true
    })

    // Generate thumbnail ~200px wide
    const thumbnail = await imageCompression(file, {
      maxSizeMB: 0.05,
      maxWidthOrHeight: 200,
      useWebWorker: true
    })

    const photoData: Omit<Photo, 'id' | 'createdAt'> = {
      plantId,
      data: compressed,
      thumbnail,
      takenAt: new Date().toISOString()
    }

    const id = await db.photos.add({
      ...photoData,
      createdAt: new Date().toISOString()
    })

    // If this is the first photo, set as cover
    const count = await db.photos.where('plantId').equals(plantId).count()
    if (count === 1) {
      await db.plants.update(plantId, { coverPhotoId: id })
    }

    return id
  },

  /** Get all photos for a plant, newest first */
  async listByPlant(plantId: number): Promise<Photo[]> {
    const photos = await db.photos
      .where('plantId')
      .equals(plantId)
      .sortBy('createdAt')
    return photos.reverse()
  },

  /** Get a Blob URL for a photo's original data */
  async getDataUrl(id: number): Promise<string | null> {
    const photo = await db.photos.get(id)
    if (!photo) return null
    return URL.createObjectURL(photo.data)
  },

  /** Get a Blob URL for a photo's thumbnail */
  async getThumbnailUrl(id: number): Promise<string | null> {
    const photo = await db.photos.get(id)
    if (!photo) return null
    return URL.createObjectURL(photo.thumbnail)
  },

  /** Delete a photo, reassign cover if deleted photo was cover */
  async remove(id: number): Promise<void> {
    const photo = await db.photos.get(id)
    await db.photos.delete(id)
    if (photo) {
      const plant = await db.plants.get(photo.plantId)
      if (plant?.coverPhotoId === id) {
        const first = await db.photos
          .where('plantId')
          .equals(photo.plantId)
          .first()
        await db.plants.update(photo.plantId, {
          coverPhotoId: first?.id
        })
      }
    }
  }
}
