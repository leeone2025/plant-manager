<!-- src/views/AiView.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAI } from '@/composables/useAI'
import { aiService, type AIHistory } from '@/services/aiService'
import { plantService } from '@/services/plantService'
import { photoService } from '@/services/photoService'
import { showSuccessToast, showFailToast } from 'vant'
import CameraCapture from '@/components/CameraCapture.vue'

const { result, loading, error, identifyPlant, searchKnowledge, clear } = useAI()

const router = useRouter()
const searchQuery = ref('')
const capturedImage = ref<string | null>(null)
const mode = ref<'camera' | 'search'>('camera')
const history = ref<AIHistory[]>([])
const saving = ref(false)

onMounted(() => loadHistory())

async function loadHistory() {
  history.value = await aiService.listHistory()
}

async function handleCapture(base64: string) {
  capturedImage.value = base64
  await identifyPlant(base64)
  if (result.value) {
    const thumbnail = await aiService.generateThumbnail(base64)
    await aiService.saveHistory({
      type: 'identify',
      imageThumbnail: thumbnail,
      resultName: result.value.name,
      resultText: result.value.rawText
    })
    await loadHistory()
  }
}

async function handleSearch() {
  if (!searchQuery.value.trim()) return
  capturedImage.value = null
  await searchKnowledge(searchQuery.value.trim())
  if (result.value) {
    await aiService.saveHistory({
      type: 'search',
      query: searchQuery.value.trim(),
      resultName: result.value.name,
      resultText: result.value.rawText
    })
    await loadHistory()
  }
}

async function deleteHistoryItem(id: number) {
  await aiService.deleteHistory(id)
  await loadHistory()
}

function handleReset() {
  capturedImage.value = null
  searchQuery.value = ''
  clear()
}

function extractNotes(rawText: string): string {
  // Take everything from "习性" onwards (includes 习性 + 养护要点)
  const idx = rawText.search(/习性/)
  if (idx === -1) return rawText
  return rawText.slice(idx).trim()
}

function base64ToFile(base64: string): File {
  const byteString = atob(base64)
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }
  return new File([ab], 'plant.jpg', { type: 'image/jpeg' })
}

async function handleAddToPlants() {
  if (!result.value || !capturedImage.value) return
  saving.value = true
  try {
    const plantId = await plantService.create({
      name: result.value.name,
      notes: extractNotes(result.value.rawText)
    })
    const file = base64ToFile(capturedImage.value)
    await photoService.save(plantId, file)
    showSuccessToast('已添加到我的植物')
    router.push({ name: 'PlantDetail', params: { id: plantId } })
  } catch (e) {
    showFailToast(e instanceof Error ? e.message : '添加失败')
  } finally {
    saving.value = false
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function setupApiKey() {
  const savedKey = localStorage.getItem('doubao_api_key') || ''
  const key = prompt(
    '请输入豆包 API Key\n（注册 console.volcengine.com 获取）',
    savedKey
  )
  if (key !== null) {
    localStorage.setItem('doubao_api_key', key.trim())
  }
}
</script>

<template>
  <div class="page">
    <van-nav-bar title="AI 搜索" fixed placeholder>
      <template #right>
        <van-icon name="setting-o" size="20" @click="setupApiKey" />
      </template>
    </van-nav-bar>

    <div class="content">
      <van-tabs v-model:active="mode">
        <van-tab title="拍照识图" name="camera">
          <CameraCapture
            v-if="!capturedImage && !loading"
            @capture="handleCapture"
          />
        </van-tab>
        <van-tab title="知识搜索" name="search">
          <van-search
            v-model="searchQuery"
            placeholder="输入植物名或问题..."
            @search="handleSearch"
            shape="round"
          />
        </van-tab>
      </van-tabs>

      <div v-if="loading && !result?.rawText" class="center">
        <van-loading size="24" />
        <p style="margin-top:12px;color:#999">AI 分析中...</p>
      </div>

      <van-cell-group v-if="error" inset style="margin-top:16px">
        <div class="error-box">
          <p>{{ error }}</p>
          <van-button size="small" @click="handleReset">重试</van-button>
        </div>
      </van-cell-group>

      <template v-if="result?.rawText">
        <div v-if="capturedImage" class="preview-image">
          <img :src="`data:image/jpeg;base64,${capturedImage}`" alt="preview" />
        </div>

        <van-cell-group v-if="!loading && result.name && result.name !== '未知植物' && result.name !== '识别中...'" inset style="margin-top:16px">
          <van-cell title="识别结果" :value="result.name" />
        </van-cell-group>

        <van-cell-group inset style="margin-top:12px">
          <div class="result-text">{{ result.rawText }}<span v-if="loading" class="cursor-blink">|</span></div>
        </van-cell-group>

        <div v-if="!loading" style="margin:16px; display:flex; gap:12px">
          <van-button v-if="capturedImage" round block type="success" :loading="saving" @click="handleAddToPlants">一键添加</van-button>
          <van-button round block @click="handleReset">重新识别</van-button>
        </div>
      </template>

      <div v-if="history.length > 0" class="history-section">
        <div class="history-header">
          <span class="history-title">搜索记录</span>
          <van-button size="mini" plain type="danger" @click="aiService.clearHistory().then(loadHistory)">清空</van-button>
        </div>

        <van-swipe-cell v-for="item in history" :key="item.id">
          <div class="history-card" @click="() => { result = { name: item.resultName, rawText: item.resultText }; capturedImage = item.imageThumbnail || null; scrollToTop(); }">
            <div class="history-meta">
              <van-tag :type="item.type === 'identify' ? 'success' : 'primary'" size="medium">
                {{ item.type === 'identify' ? '拍照' : '搜索' }}
              </van-tag>
              <span class="history-name">{{ item.resultName }}</span>
              <span class="history-time">{{ new Date(item.createdAt).toLocaleString('zh-CN', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' }) }}</span>
            </div>
            <div class="history-preview">{{ item.resultText.slice(0, 100) }}{{ item.resultText.length > 100 ? '...' : '' }}</div>
          </div>
          <template #right>
            <van-button square type="danger" text="删除" @click="deleteHistoryItem(item.id!)" style="height:100%" />
          </template>
        </van-swipe-cell>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: #f7f8fa; padding-bottom: 50px; }
.content { padding: 16px 0; }
.center { text-align: center; padding: 60px 16px; }
.error-box { padding: 24px; text-align: center; color: #ff5252; }
.error-box p { margin-bottom: 12px; }
.preview-image {
  margin: 16px; border-radius: 12px; overflow: hidden;
}
.preview-image img { width: 100%; display: block; object-fit: cover; }
.result-text {
  padding: 16px; font-size: 14px; line-height: 1.8;
  white-space: pre-wrap; color: #333;
}
.cursor-blink { animation: blink 0.6s infinite; color: #4CAF50; }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
.history-section {
  margin: 24px 16px 16px;
}
.history-header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;
}
.history-title {
  font-size: 16px; font-weight: 600; color: #333;
}
.history-card {
  background: #fff; border-radius: 10px; padding: 12px 16px; margin-bottom: 8px;
  cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.history-meta {
  display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
}
.history-name {
  font-size: 15px; font-weight: 500; color: #333; flex: 1;
}
.history-time {
  font-size: 12px; color: #999;
}
.history-preview {
  font-size: 13px; color: #666; line-height: 1.6;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
