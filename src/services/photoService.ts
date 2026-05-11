// src/services/photoService.ts
import imageCompression from 'browser-image-compression'
import { db, type Photo } from '@/db'

/** Read EXIF orientation from a JPEG file (1-8, default 1) */
async function getExifOrientation(file: File): Promise<number> {
  try {
    const buffer = await file.slice(0, 128 * 1024).arrayBuffer()
    const view = new DataView(buffer)
    if (view.getUint16(0, false) !== 0xffd8) return 1

    let offset = 2
    while (offset < view.byteLength - 4) {
      if (view.getUint8(offset) !== 0xff) return 1
      const marker = view.getUint8(offset + 1)

      if (marker === 0xe1) {
        const exifStart = offset + 4
        if (view.getUint32(exifStart, false) !== 0x45786966) return 1 // 'Exif'
        const tiffStart = exifStart + 6
        const le = view.getUint16(tiffStart, false) === 0x4949
        const ifd0 = tiffStart + view.getUint32(tiffStart + 4, le)
        const entries = view.getUint16(ifd0, le)
        for (let i = 0; i < entries; i++) {
          const entry = ifd0 + 2 + i * 12
          if (view.getUint16(entry, le) === 0x0112) {
            return view.getUint16(entry + 8, le)
          }
        }
        return 1
      }

      if (marker >= 0xd0 && marker <= 0xda) {
        offset += 2
      } else {
        offset += 2 + view.getUint16(offset + 2, false)
      }
    }
  } catch { /* ignore */ }
  return 1
}

/** Apply EXIF rotation via canvas, return a correctly-oriented File */
export async function fixOrientation(file: File): Promise<File> {
  const orientation = await getExifOrientation(file)
  if (orientation === 1) return file

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)

      const c = document.createElement('canvas')
      const ctx = c.getContext('2d')!
      const w = img.naturalWidth
      const h = img.naturalHeight

      switch (orientation) {
        case 2: // flip horizontal
          c.width = w; c.height = h
          ctx.translate(w, 0); ctx.scale(-1, 1)
          break
        case 3: // rotate 180
          c.width = w; c.height = h
          ctx.translate(w, h); ctx.rotate(Math.PI)
          break
        case 4: // flip vertical
          c.width = w; c.height = h
          ctx.translate(0, h); ctx.scale(1, -1)
          break
        case 5: // transpose
          c.width = h; c.height = w
          ctx.translate(h, 0); ctx.rotate(Math.PI / 2); ctx.scale(1, -1)
          break
        case 6: // rotate 90 CW
          c.width = h; c.height = w
          ctx.translate(h, 0); ctx.rotate(Math.PI / 2)
          break
        case 7: // transverse
          c.width = h; c.height = w
          ctx.translate(0, w); ctx.rotate(-Math.PI / 2); ctx.scale(1, -1)
          break
        case 8: // rotate 90 CCW
          c.width = h; c.height = w
          ctx.translate(0, w); ctx.rotate(-Math.PI / 2)
          break
        default:
          c.width = w; c.height = h
      }

      ctx.drawImage(img, 0, 0)
      c.toBlob((blob) => {
        if (!blob) return reject(new Error('Canvas toBlob failed'))
        resolve(new File([blob], file.name, { type: 'image/jpeg' }))
      }, 'image/jpeg', 0.92)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(file) // fallback to original
    }
    img.src = url
  })
}

export const photoService = {
  /** Compress and save a photo, auto-set as cover if first photo */
  async save(plantId: number, file: File): Promise<number> {
    // Fix EXIF rotation before compression
    const oriented = await fixOrientation(file)

    // Compress original to ~500KB
    const compressed = await imageCompression(oriented, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1920,
      useWebWorker: false
    })

    // Generate thumbnail ~200px wide
    const thumbnail = await imageCompression(oriented, {
      maxSizeMB: 0.05,
      maxWidthOrHeight: 200,
      useWebWorker: false
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

    // Always set new photo as cover
    await db.plants.update(plantId, { coverPhotoId: id })

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
    return URL.createObjectURL(photo.data)
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
