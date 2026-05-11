// src/services/aiService.ts
import { db, type AIHistory } from '@/db'
import imageCompression from 'browser-image-compression'

export type { AIHistory } from '@/db'

export interface AIResult {
  name: string           // Plant Chinese name
  latinName?: string     // Latin scientific name
  family?: string        // Family and genus
  habits?: string        // Growth habits description
  careGuide?: {          // Care guide
    light?: string
    watering?: string
    temperature?: string
    soil?: string
    fertilizing?: string
    pests?: string
  }
  rawText: string        // Raw response text
}

const API_BASE = 'https://ark.cn-beijing.volces.com/api/v3'

async function getApiKey(): Promise<string> {
  const key = localStorage.getItem('doubao_api_key')
  if (!key) throw new Error('请先在设置中配置豆包 API Key')
  return key
}

function buildMessages(prompt: string, imageBase64?: string): Array<Record<string, unknown>> {
  const messages: Array<Record<string, unknown>> = [
    { role: 'system', content: '你是植物学专家，用中文简要且精准回答。' }
  ]
  if (imageBase64) {
    messages.push({
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
        { type: 'text', text: prompt }
      ]
    })
  } else {
    messages.push({ role: 'user', content: prompt })
  }
  return messages
}

/** Stream AI response via SSE, calls onChunk for each text delta, returns full text */
async function callAIStream(
  prompt: string,
  onChunk: (text: string) => void,
  imageBase64?: string
): Promise<string> {
  const apiKey = await getApiKey()

  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'doubao-seed-2-0-lite-260428',
      messages: buildMessages(prompt, imageBase64),
      max_tokens: 800,
      stream: true,
      thinking: { type: 'disabled' }
    })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error((err as { message?: string }).message ?? 'API 调用失败')
  }

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let fullText = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6)
      if (data === '[DONE]') continue
      try {
        const content = JSON.parse(data).choices?.[0]?.delta?.content
        if (content) {
          fullText += content
          onChunk(content)
        }
      } catch { /* skip malformed chunk */ }
    }
  }
  return fullText
}

function parseResult(text: string): AIResult {
  // Extract first plant name from "名称：XXX" pattern (AI is prompted to follow this format)
  const match = text.match(/名称[：:]\s*(.+?)(?:[\n\r]|$)/)
  let name = match ? match[1].replace(/\*+/g, '').replace(/#+/g, '').trim() : ''
  // Limit to first sentence/phrase, not a paragraph
  if (name.length > 20) name = name.split(/[，,。]/)[0].trim()
  if (name.length > 20) name = name.slice(0, 20)

  return { name: name || '未知植物', rawText: text }
}

export const aiService = {
  /** Identify plant from photo — streams result via onChunk */
  async identifyStream(
    imageBase64: string,
    onChunk: (text: string) => void
  ): Promise<AIResult> {
    const prompt = '识别图中植物，简要列出：名称、科属、习性、养护要点。其中养护要点要求简洁精准，分为：光照，浇水，温度，土壤，施肥5个维度'
    const text = await callAIStream(prompt, onChunk, imageBase64)
    return { ...parseResult(text), rawText: text }
  },

  /** Search for plant care knowledge — streams result via onChunk */
  async searchStream(
    query: string,
    onChunk: (text: string) => void
  ): Promise<AIResult> {
    const prompt = `${query}的查询结果：名称、科属、习性、养护要点。其中养护要点要求简洁精准，分为：光照，浇水，温度，土壤，施肥5个维度`
    const text = await callAIStream(prompt, onChunk)
    return { ...parseResult(text), rawText: text }
  },

  /** Generate a small thumbnail from a base64 image */
  async generateThumbnail(imageBase64: string, maxSize: number = 200): Promise<string> {
    const blob = await fetch(`data:image/jpeg;base64,${imageBase64}`).then(r => r.blob())
    const file = new File([blob], 'thumb.jpg', { type: 'image/jpeg' })
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.03,
      maxWidthOrHeight: maxSize,
      useWebWorker: false
    })
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve((reader.result as string).split(',')[1])
      reader.readAsDataURL(compressed)
    })
  },

  /** Save a history entry */
  async saveHistory(entry: Omit<AIHistory, 'id' | 'createdAt'>): Promise<number> {
    return db.aiHistory.add({
      ...entry,
      createdAt: new Date().toISOString()
    })
  },

  /** List all history entries, newest first */
  async listHistory(): Promise<AIHistory[]> {
    const items = await db.aiHistory.orderBy('createdAt').toArray()
    return items.reverse()
  },

  /** Delete a single history entry */
  async deleteHistory(id: number): Promise<void> {
    await db.aiHistory.delete(id)
  },

  /** Clear all history */
  async clearHistory(): Promise<void> {
    await db.aiHistory.clear()
  }
}
