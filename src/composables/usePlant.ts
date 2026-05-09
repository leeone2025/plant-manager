// src/composables/usePlant.ts
import { ref, shallowRef } from 'vue'
import { plantService } from '@/services/plantService'
import { careService } from '@/services/careService'
import { photoService } from '@/services/photoService'
import type { Plant, CareRecord, CareType } from '@/db'

export function usePlant() {
  const plant = shallowRef<Plant | null>(null)
  const records = shallowRef<CareRecord[]>([])
  const photoUrls = ref<string[]>([])
  const photoIds = ref<number[]>([])
  const counts = ref<Record<CareType, number>>({
    watering: 0, fertilizing: 0, repotting: 0, pruning: 0, other: 0
  })
  const loading = ref(false)

  async function load(id: number) {
    loading.value = true
    try {
      const [p, recs, photos] = await Promise.all([
        plantService.get(id),
        careService.listByPlant(id),
        photoService.listByPlant(id)
      ])
      plant.value = p ?? null
      records.value = recs
      counts.value = await careService.countByType(id)
      // Revoke previous blob URLs to prevent memory leaks
      photoUrls.value.forEach(url => URL.revokeObjectURL(url))
      photoUrls.value = photos.map(ph => URL.createObjectURL(ph.thumbnail))
      photoIds.value = photos.map(ph => ph.id!)
    } finally {
      loading.value = false
    }
  }

  async function addRecord(data: Parameters<typeof careService.create>[0]) {
    await careService.create(data)
    await load(data.plantId)
  }

  async function removeRecord(recordId: number) {
    const p = plant.value
    await careService.remove(recordId)
    if (p?.id) await load(p.id)
  }

  async function addPhoto(plantId: number, file: File) {
    await photoService.save(plantId, file)
    await load(plantId)
  }

  async function removePhoto(photoId: number) {
    await photoService.remove(photoId)
    if (plant.value?.id) await load(plant.value.id)
  }

  return { plant, records, photoUrls, photoIds, counts, loading, load, addRecord, removeRecord, addPhoto, removePhoto }
}
