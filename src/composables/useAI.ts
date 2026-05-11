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
    result.value = { name: '识别中...', rawText: '' }
    try {
      const final = await aiService.identifyStream(imageBase64, (chunk) => {
        result.value = { ...result.value!, rawText: result.value!.rawText + chunk }
      })
      result.value = final
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
    result.value = { name: '搜索中...', rawText: '' }
    try {
      const final = await aiService.searchStream(query, (chunk) => {
        result.value = { ...result.value!, rawText: result.value!.rawText + chunk }
      })
      result.value = final
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
