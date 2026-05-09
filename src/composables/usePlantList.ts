// src/composables/usePlantList.ts
import { ref, shallowRef, onMounted } from 'vue'
import { plantService } from '@/services/plantService'
import type { Plant } from '@/db'

const plants = shallowRef<Plant[]>([])
const loading = ref(false)

export function usePlantList() {
  async function refresh() {
    loading.value = true
    try {
      plants.value = await plantService.list()
    } finally {
      loading.value = false
    }
  }

  onMounted(refresh)

  return { plants, loading, refresh }
}
