<!-- src/views/AiView.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useAI } from '@/composables/useAI'
import CameraCapture from '@/components/CameraCapture.vue'

const { result, loading, error, identifyPlant, searchKnowledge, clear } = useAI()

const searchQuery = ref('')
const capturedImage = ref<string | null>(null)
const mode = ref<'camera' | 'search'>('camera')

async function handleCapture(base64: string) {
  capturedImage.value = base64
  await identifyPlant(base64)
}

async function handleSearch() {
  if (!searchQuery.value.trim()) return
  capturedImage.value = null
  await searchKnowledge(searchQuery.value.trim())
}

function handleReset() {
  capturedImage.value = null
  clear()
}

function setupApiKey() {
  const savedKey = localStorage.getItem('qwen_api_key') || ''
  const key = prompt(
    '请输入通义千问 API Key\n（免费注册 dashscope.aliyun.com 获取）',
    savedKey
  )
  if (key !== null) {
    localStorage.setItem('qwen_api_key', key.trim())
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

      <div v-if="loading" class="center">
        <van-loading size="24" />
        <p style="margin-top:12px;color:#999">AI 分析中...</p>
      </div>

      <van-cell-group v-if="error" inset style="margin-top:16px">
        <div class="error-box">
          <p>{{ error }}</p>
          <van-button size="small" @click="handleReset">重试</van-button>
        </div>
      </van-cell-group>

      <template v-if="result && !loading">
        <div v-if="capturedImage" class="preview-image">
          <img :src="`data:image/jpeg;base64,${capturedImage}`" alt="preview" />
        </div>

        <van-cell-group inset style="margin-top:16px">
          <van-cell title="识别结果" :value="result.name" />
        </van-cell-group>

        <van-cell-group inset style="margin-top:12px">
          <div class="result-text">{{ result.rawText }}</div>
        </van-cell-group>

        <div style="margin:16px">
          <van-button round block @click="handleReset">重新识别</van-button>
        </div>
      </template>
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
  margin: 16px 16px 0; border-radius: 12px; overflow: hidden;
}
.preview-image img { width: 100%; display: block; }
.result-text {
  padding: 16px; font-size: 14px; line-height: 1.8;
  white-space: pre-wrap; color: #333;
}
</style>
