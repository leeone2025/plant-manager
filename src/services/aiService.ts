// src/services/aiService.ts

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

const API_BASE = 'https://dashscope.aliyuncs.com/compatible-mode/v1'

async function getApiKey(): Promise<string> {
  const key = localStorage.getItem('qwen_api_key')
  if (!key) throw new Error('请先在设置中配置通义千问 API Key')
  return key
}

async function callQwen(prompt: string, imageBase64?: string): Promise<string> {
  const apiKey = await getApiKey()

  const messages: Array<Record<string, unknown>> = [
    {
      role: 'system',
      content: '你是一位专业的植物学专家和园艺师。请用中文回答，内容准确、具体、可操作。'
    }
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

  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'qwen-vl-max',
      messages,
      max_tokens: 1500,
      temperature: 0.3
    })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    const errMsg = (err as { message?: string }).message ?? 'API 调用失败'
    throw new Error(errMsg)
  }

  const data = await res.json() as {
    choices: Array<{ message: { content: string } }>
  }
  return data.choices[0].message.content
}

function parseResult(text: string): AIResult {
  const nameMatch = text.match(/(?:这是|识别为|植物是|名称[：:])?\s*([一-鿿]{2,10}(?:玫瑰|月季|牡丹|菊花|兰花|绿萝|吊兰|发财树|龟背竹|琴叶榕|仙人掌|多肉|薄荷|薰衣草|茉莉|栀子|绣球|海棠|君子兰|文竹|常春藤|虎皮兰|芦荟|昙花|蟹爪兰|长寿花|天竺葵|矮牵牛|向日葵|郁金香|风信子|百合|康乃馨|马蹄莲|鹤望兰|昙花|令箭荷花|三角梅|杜鹃|茶花|桂花|樱花|桃花|梅花|杏花|梨花|石榴|柠檬|金桔|无花果)[一-鿿]?)/)
  const name = nameMatch ? nameMatch[1] : '未知植物'

  return {
    name,
    rawText: text
  }
}

export const aiService = {
  /** Identify plant from photo */
  async identify(imageBase64: string): Promise<AIResult> {
    const prompt = `请识别这张图片中的植物，并以以下格式回答：
1. 中文名称
2. 拉丁学名
3. 科属
4. 生长习性（光照、温度、水分需求）
5. 养护要点`

    const text = await callQwen(prompt, imageBase64)
    return { ...parseResult(text), rawText: text }
  },

  /** Search for plant care knowledge */
  async search(query: string): Promise<AIResult> {
    const prompt = `请提供关于"${query}"的详细养护信息，以以下格式回答：
1. 植物名称和基本介绍
2. 光照需求
3. 浇水频率和方法
4. 适宜温度
5. 土壤要求
6. 施肥建议
7. 常见病虫害及防治`

    const text = await callQwen(prompt)
    return { ...parseResult(text), rawText: text }
  }
}
