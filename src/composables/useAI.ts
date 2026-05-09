// src/composables/useAI.ts
import { ref } from 'vue'
import { aiService, type AIResult } from '@/services/aiService'

export function useAI() {
  const result = ref<AIResult | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function identifyPlant(imageBase64: string) {
    loading.value = true
    error.value = null
    try {
      result.value = await aiService.identify(imageBase64)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '识别失败'
      result.value = null
    } finally {
      loading.value = false
    }
  }

  async function searchKnowledge(query: string) {
    loading.value = true
    error.value = null
    try {
      result.value = await aiService.search(query)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '搜索失败'
      result.value = null
    } finally {
      loading.value = false
    }
  }

  function clear() {
    result.value = null
    error.value = null
  }

  return { result, loading, error, identifyPlant, searchKnowledge, clear }
}
