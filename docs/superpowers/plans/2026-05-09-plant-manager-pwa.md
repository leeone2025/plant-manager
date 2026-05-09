# 植物管理 PWA 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个纯客户端 PWA，用户可建档管理绿植花卉，记录养护操作，拍照上传，并通过通义千问 AI 识图搜索植物知识。

**Architecture:** 四层分离 — UI 层（Vue 3 + Vant 4 组件）、Service 层（AI API + 图片压缩）、Data 层（Dexie.js 封装 IndexedDB）、Platform 层（PWA Service Worker + Camera API）。页面通过 Vue Router 管理 5 条路由，底部 Tab 切换。

**Tech Stack:** Vue 3 (Composition API) + TypeScript + Vant 4 + Vite + Dexie.js + vite-plugin-pwa + browser-image-compression + 通义千问 Qwen-VL API

---

## 文件结构

```
plant-manager/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── public/
│   └── icons/                    # PWA icons (auto-generated)
├── src/
│   ├── main.ts                   # 入口：createApp + router + vant
│   ├── App.vue                   # 根组件：Tab 布局 + router-view
│   ├── db/
│   │   └── index.ts              # Dexie 数据库定义 + 类型导出
│   ├── services/
│   │   ├── plantService.ts       # 植物 CRUD
│   │   ├── careService.ts        # 养护记录 CRUD
│   │   ├── photoService.ts       # 照片存储 / 压缩 / 缩略图
│   │   └── aiService.ts          # 通义千问 API 封装
│   ├── composables/
│   │   ├── usePlantList.ts       # 植物列表响应式数据
│   │   ├── usePlant.ts           # 单个植物 + 关联数据
│   │   └── useAI.ts              # AI 搜索 / 识图状态管理
│   ├── components/
│   │   ├── PlantCard.vue         # 植物卡片（列表项）
│   │   ├── CareTimeline.vue      # 养护记录时间线
│   │   ├── PhotoGrid.vue         # 照片墙网格
│   │   └── CameraCapture.vue     # 相机拍照 + 预览
│   ├── views/
│   │   ├── HomeView.vue          # / — 植物列表
│   │   ├── PlantDetailView.vue   # /plant/:id — 详情
│   │   ├── PlantFormView.vue     # /plant/new & /plant/:id/edit
│   │   └── AiView.vue            # /ai — AI 识图 + 搜索
│   └── router/
│       └── index.ts              # Vue Router 配置
```

---

### Task 1: 项目脚手架

**Files:**
- Create: `package.json`, `index.html`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `src/main.ts`, `src/App.vue`, `src/router/index.ts`, `src/env.d.ts`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "plant-manager",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.5.0",
    "vue-router": "^4.4.0",
    "vant": "^4.9.0",
    "dexie": "^4.0.0",
    "browser-image-compression": "^2.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.1.0",
    "typescript": "^5.6.0",
    "vite": "^6.0.0",
    "vite-plugin-pwa": "^0.21.0",
    "vue-tsc": "^2.1.0",
    "@vant/auto-import-resolver": "^1.3.0",
    "unplugin-vue-components": "^0.27.0"
  }
}
```

- [ ] **Step 2: 安装依赖**

```bash
npm install
```

Expected: 所有依赖安装完成，无 error。

- [ ] **Step 3: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover" />
  <meta name="theme-color" content="#4CAF50" />
  <link rel="icon" href="/icons/icon-192.png" />
  <title>植物管家</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 4: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForExpose": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 5: 创建 tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 6: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from '@vant/auto-import-resolver'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    Components({ resolvers: [VantResolver()] }),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '植物管家',
        short_name: '植物管家',
        description: '管理你的绿植花卉',
        theme_color: '#4CAF50',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/dashscope\.aliyuncs\.com\/.*/,
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') }
  }
})
```

- [ ] **Step 7: 创建 src/env.d.ts**

```typescript
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, unknown>
  export default component
}
```

- [ ] **Step 8: 创建占位 Router（src/router/index.ts）**

```typescript
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue')
    },
    {
      path: '/ai',
      name: 'ai',
      component: () => import('@/views/AiView.vue')
    },
    {
      path: '/plant/new',
      name: 'plant-new',
      component: () => import('@/views/PlantFormView.vue')
    },
    {
      path: '/plant/:id',
      name: 'plant-detail',
      component: () => import('@/views/PlantDetailView.vue')
    },
    {
      path: '/plant/:id/edit',
      name: 'plant-edit',
      component: () => import('@/views/PlantFormView.vue')
    }
  ]
})

export default router
```

- [ ] **Step 9: 创建占位 src/main.ts**

```typescript
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router)
app.mount('#app')
```

- [ ] **Step 10: 创建占位 App.vue**

```vue
<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const tabs = [
  { path: '/', label: '我的植物', icon: 'flower-o' },
  { path: '/ai', label: 'AI 搜索', icon: 'search' }
]
</script>

<template>
  <router-view />
  <van-tabbar
    v-model="route.path"
    :fixed="true"
    :border="true"
    :placeholder="true"
    active-color="#4CAF50"
  >
    <van-tabbar-item
      v-for="tab in tabs"
      :key="tab.path"
      :name="tab.path"
      :icon="tab.icon"
      @click="router.push(tab.path)"
    >
      {{ tab.label }}
    </van-tabbar-item>
  </van-tabbar>
</template>
```

- [ ] **Step 11: 创建 4 个占位 View 文件（先写最小代码让 dev 服务器启动）**

`src/views/HomeView.vue`:
```vue
<template>
  <div class="page">
    <van-nav-bar title="我的植物" fixed placeholder />
    <div class="content">植物列表</div>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: #f7f8fa; }
.content { padding: 16px; }
</style>
```

`src/views/AiView.vue`:
```vue
<template>
  <div class="page">
    <van-nav-bar title="AI 搜索" fixed placeholder />
    <div class="content">AI 功能</div>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: #f7f8fa; }
.content { padding: 16px; }
</style>
```

`src/views/PlantDetailView.vue`:
```vue
<template>
  <div class="page">
    <van-nav-bar title="植物详情" left-arrow fixed placeholder @click-left="$router.back()" />
    <div class="content">植物详情</div>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: #f7f8fa; }
.content { padding: 16px; }
</style>
```

`src/views/PlantFormView.vue`:
```vue
<template>
  <div class="page">
    <van-nav-bar :title="$route.name === 'plant-new' ? '添加植物' : '编辑植物'" left-arrow fixed placeholder @click-left="$router.back()" />
    <div class="content">表单</div>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: #f7f8fa; }
.content { padding: 16px; }
</style>
```

- [ ] **Step 12: 启动 dev 验证**

```bash
npm run dev
```

Expected: 开发服务器启动成功，浏览器可访问，底部 Tab 切换正常。

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vue 3 + TS + Vant + PWA project"
```

---

### Task 2: Data Layer — 类型定义与数据库 Schema

**Files:**
- Create: `src/db/index.ts`

- [ ] **Step 1: 创建数据库定义和类型**

```typescript
// src/db/index.ts
import Dexie, { type Table } from 'dexie'

/** 植物主表 */
export interface Plant {
  id?: number
  name: string
  species?: string          // AI 识别/手动填写的品种名
  sowDate?: string          // ISO date string
  location?: string         // 摆放位置
  notes?: string
  coverPhotoId?: number     // 封面照片 ID
  createdAt: string
  updatedAt: string
}

/** 养护记录类型 */
export type CareType = 'watering' | 'fertilizing' | 'repotting' | 'pruning' | 'other'

/** 养护记录表 */
export interface CareRecord {
  id?: number
  plantId: number
  type: CareType
  date: string              // ISO date string
  note?: string
  createdAt: string
}

/** 照片表 */
export interface Photo {
  id?: number
  plantId: number
  data: Blob                // 压缩后的原图
  thumbnail: Blob           // 缩略图
  takenAt: string           // 拍摄时间
  createdAt: string
}

/** 养护类型中文标签映射 */
export const careTypeLabels: Record<CareType, string> = {
  watering: '浇水',
  fertilizing: '施肥',
  repotting: '换盆',
  pruning: '修剪',
  other: '其他'
}

class PlantDB extends Dexie {
  plants!: Table<Plant, number>
  careRecords!: Table<CareRecord, number>
  photos!: Table<Photo, number>

  constructor() {
    super('PlantManagerDB')
    this.version(1).stores({
      plants: '++id, name, createdAt',
      careRecords: '++id, plantId, date, type',
      photos: '++id, plantId, createdAt'
    })
  }
}

export const db = new PlantDB()
```

- [ ] **Step 2: 验证 TypeScript 编译通过**

```bash
npx vue-tsc --noEmit
```

Expected: 无类型错误。

- [ ] **Step 3: Commit**

```bash
git add src/db/index.ts
git commit -m "feat: add database schema and TypeScript types"
```

---

### Task 3: Data Layer — 植物 CRUD 服务

**Files:**
- Create: `src/services/plantService.ts`

- [ ] **Step 1: 编写 plantService**

```typescript
// src/services/plantService.ts
import { db, type Plant } from '@/db'

function now(): string {
  return new Date().toISOString()
}

export const plantService = {
  /** 获取所有植物，按创建时间倒序 */
  async list(): Promise<Plant[]> {
    return db.plants.orderBy('createdAt').reverse().toArray()
  },

  /** 获取单个植物 */
  async get(id: number): Promise<Plant | undefined> {
    return db.plants.get(id)
  },

  /** 新增植物 */
  async create(data: Omit<Plant, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const ts = now()
    return db.plants.add({
      ...data,
      createdAt: ts,
      updatedAt: ts
    })
  },

  /** 更新植物 */
  async update(id: number, data: Partial<Omit<Plant, 'id' | 'createdAt' | 'updatedAt'>>): Promise<number> {
    return db.plants.update(id, { ...data, updatedAt: now() })
  },

  /** 删除植物（同时删关联养护记录和照片） */
  async remove(id: number): Promise<void> {
    await db.transaction('rw', db.plants, db.careRecords, db.photos, async () => {
      await db.careRecords.where('plantId').equals(id).delete()
      await db.photos.where('plantId').equals(id).delete()
      await db.plants.delete(id)
    })
  }
}
```

- [ ] **Step 2: 验证类型检查**

```bash
npx vue-tsc --noEmit
```

Expected: 无类型错误。

- [ ] **Step 3: Commit**

```bash
git add src/services/plantService.ts
git commit -m "feat: add plant CRUD service"
```

---

### Task 4: Data Layer — 养护记录 CRUD 服务

**Files:**
- Create: `src/services/careService.ts`

- [ ] **Step 1: 编写 careService**

```typescript
// src/services/careService.ts
import { db, type CareRecord, type CareType } from '@/db'

export const careService = {
  /** 获取某植物的所有养护记录，按日期倒序 */
  async listByPlant(plantId: number): Promise<CareRecord[]> {
    return db.careRecords
      .where('plantId')
      .equals(plantId)
      .reverse()
      .sortBy('date')
  },

  /** 添加养护记录 */
  async create(data: Omit<CareRecord, 'id' | 'createdAt'>): Promise<number> {
    return db.careRecords.add({
      ...data,
      createdAt: new Date().toISOString()
    })
  },

  /** 删除养护记录 */
  async remove(id: number): Promise<void> {
    await db.careRecords.delete(id)
  },

  /** 获取某植物各类护理操作的次数统计 */
  async countByType(plantId: number): Promise<Record<CareType, number>> {
    const records = await db.careRecords
      .where('plantId')
      .equals(plantId)
      .toArray()

    return {
      watering: records.filter(r => r.type === 'watering').length,
      fertilizing: records.filter(r => r.type === 'fertilizing').length,
      repotting: records.filter(r => r.type === 'repotting').length,
      pruning: records.filter(r => r.type === 'pruning').length,
      other: records.filter(r => r.type === 'other').length
    }
  }
}
```

- [ ] **Step 2: 验证类型检查**

```bash
npx vue-tsc --noEmit
```

Expected: 无类型错误。

- [ ] **Step 3: Commit**

```bash
git add src/services/careService.ts
git commit -m "feat: add care record CRUD service"
```

---

### Task 5: Data Layer — 照片存储服务

**Files:**
- Create: `src/services/photoService.ts`

- [ ] **Step 1: 编写 photoService**

```typescript
// src/services/photoService.ts
import imageCompression from 'browser-image-compression'
import { db, type Photo } from '@/db'

export const photoService = {
  /** 压缩并保存照片 */
  async save(plantId: number, file: File): Promise<number> {
    // 压缩原图到 ~300KB
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 1920,
      useWebWorker: true
    })

    // 生成缩略图 ~200px 宽
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

    // 如果这是第一张照片，设为封面
    const count = await db.photos.where('plantId').equals(plantId).count()
    if (count === 1) {
      await db.plants.update(plantId, { coverPhotoId: id })
    }

    return id
  },

  /** 获取某植物的所有照片 */
  async listByPlant(plantId: number): Promise<Photo[]> {
    return db.photos
      .where('plantId')
      .equals(plantId)
      .reverse()
      .sortBy('createdAt')
  },

  /** 获取单张照片（返回 Blob URL） */
  async getDataUrl(id: number): Promise<string | null> {
    const photo = await db.photos.get(id)
    if (!photo) return null
    return URL.createObjectURL(photo.data)
  },

  /** 获取缩略图 Blob URL */
  async getThumbnailUrl(id: number): Promise<string | null> {
    const photo = await db.photos.get(id)
    if (!photo) return null
    return URL.createObjectURL(photo.thumbnail)
  },

  /** 删除照片 */
  async remove(id: number): Promise<void> {
    const photo = await db.photos.get(id)
    await db.photos.delete(id)
    // 如果删的是封面，换一个
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
```

- [ ] **Step 2: 验证类型检查**

```bash
npx vue-tsc --noEmit
```

Expected: 无类型错误。

- [ ] **Step 3: Commit**

```bash
git add src/services/photoService.ts
git commit -m "feat: add photo service with compression and thumbnail"
```

---

### Task 6: 可组合函数（Composables）

**Files:**
- Create: `src/composables/usePlantList.ts`, `src/composables/usePlant.ts`, `src/composables/useAI.ts`

- [ ] **Step 1: 编写 usePlantList**

```typescript
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
```

- [ ] **Step 2: 编写 usePlant**

```typescript
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
  const photoIds = ref<number[]>([])          // 同步维护，与 photoUrls 同索引
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
```

- [ ] **Step 3: 编写 useAI**

```typescript
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
```

- [ ] **Step 4: 验证类型检查**

```bash
npx vue-tsc --noEmit
```

Expected: 无类型错误。

- [ ] **Step 5: Commit**

```bash
git add src/composables/
git commit -m "feat: add reactive composables for plant data and AI"
```

---

### Task 7: PlantCard 组件 + HomeView 页面

**Files:**
- Create: `src/components/PlantCard.vue`
- Modify: `src/views/HomeView.vue`

- [ ] **Step 1: 编写 PlantCard**

PlantCard 接受可选的 `coverUrl` prop（缩略图 Blob URL），由父组件加载后传入。MVP 阶段列表页不加载缩略图则显示占位图标。
```vue
<!-- src/components/PlantCard.vue -->
<script setup lang="ts">
import type { Plant } from '@/db'

defineProps<{
  plant: Plant
  coverUrl?: string
}>()
</script>

<template>
  <van-swipe-cell>
    <van-cell
      :title="plant.name"
      :label="plant.species || '未知品种'"
      is-link
      :to="`/plant/${plant.id}`"
      center
    >
      <template #icon>
        <div
          v-if="coverUrl"
          class="plant-avatar"
          :style="{ backgroundImage: `url(${coverUrl})` }"
        />
        <div v-else class="plant-avatar-placeholder">🌿</div>
      </template>
      <template #value>
        <span class="plant-date">{{ plant.createdAt.slice(0, 10) }}</span>
      </template>
    </van-cell>
  </van-swipe-cell>
</template>

<style scoped>
.plant-avatar {
  width: 44px; height: 44px; border-radius: 8px;
  background-size: cover; background-position: center;
  margin-right: 12px;
}
.plant-avatar-placeholder {
  width: 44px; height: 44px; border-radius: 8px;
  background: #e8f5e9; display: flex;
  align-items: center; justify-content: center;
  font-size: 24px; margin-right: 12px;
}
.plant-date { font-size: 12px; color: #999; }
</style>
```

- [ ] **Step 2: 重写 HomeView**

```vue
<!-- src/views/HomeView.vue -->
<script setup lang="ts">
import { usePlantList } from '@/composables/usePlantList'
import PlantCard from '@/components/PlantCard.vue'

const { plants, loading } = usePlantList()
</script>

<template>
  <div class="page">
    <van-nav-bar title="我的植物" fixed placeholder>
      <template #right>
        <van-icon name="plus" size="22" @click="$router.push('/plant/new')" />
      </template>
    </van-nav-bar>

    <div class="content">
      <van-loading v-if="loading" class="center" />
      <van-empty v-else-if="plants.length === 0" description="还没有植物，点右上角 + 添加" />
      <van-cell-group v-else inset>
        <PlantCard v-for="plant in plants" :key="plant.id" :plant="plant" />
      </van-cell-group>
    </div>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: #f7f8fa; padding-bottom: 50px; }
.content { padding: 16px 0; }
.center { display: flex; justify-content: center; padding: 60px 0; }
</style>
```

- [ ] **Step 3: 验证类型检查**

```bash
npx vue-tsc --noEmit
```

Expected: 无类型错误。

- [ ] **Step 4: Commit**

```bash
git add src/components/PlantCard.vue src/views/HomeView.vue
git commit -m "feat: add plant list page with PlantCard component"
```

---

### Task 8: PlantFormView — 添加/编辑植物表单

**Files:**
- Modify: `src/views/PlantFormView.vue`

- [ ] **Step 1: 重写 PlantFormView**

```vue
<!-- src/views/PlantFormView.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { plantService } from '@/services/plantService'
import type { Plant } from '@/db'

const route = useRoute()
const router = useRouter()
const isEdit = route.name === 'plant-edit'
const plantId = route.params.id ? Number(route.params.id) : null

const name = ref('')
const species = ref('')
const sowDate = ref('')
const location = ref('')
const notes = ref('')
const saving = ref(false)
const deleting = ref(false)

onMounted(async () => {
  if (isEdit && plantId) {
    const plant = await plantService.get(plantId)
    if (plant) {
      name.value = plant.name
      species.value = plant.species ?? ''
      sowDate.value = plant.sowDate ?? ''
      location.value = plant.location ?? ''
      notes.value = plant.notes ?? ''
    }
  }
})

async function handleSave() {
  if (!name.value.trim()) return

  saving.value = true
  try {
    const baseData = {
      name: name.value.trim(),
      species: species.value.trim() || undefined,
      sowDate: sowDate.value || undefined,
      location: location.value.trim() || undefined,
      notes: notes.value.trim() || undefined
    }

    if (isEdit && plantId) {
      await plantService.update(plantId, baseData)
    } else {
      await plantService.create(baseData)
    }
    router.back()
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!plantId) return
  deleting.value = true
  try {
    await plantService.remove(plantId)
    router.replace('/')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="page">
    <van-nav-bar
      :title="isEdit ? '编辑植物' : '添加植物'"
      left-arrow fixed placeholder
      @click-left="$router.back()"
    />

    <div class="content">
      <van-form @submit="handleSave">
        <van-cell-group inset>
          <van-field
            v-model="name"
            label="名称"
            placeholder="如：阳台月季"
            :rules="[{ required: true, message: '请输入名称' }]"
          />
          <van-field
            v-model="species"
            label="品种"
            placeholder="AI 识别或手动填写"
          />
          <van-field
            v-model="sowDate"
            label="播种日期"
            type="date"
            placeholder="选择日期"
          />
          <van-field
            v-model="location"
            label="位置"
            placeholder="如：阳台、客厅"
          />
          <van-field
            v-model="notes"
            label="备注"
            type="textarea"
            rows="3"
            placeholder="额外说明..."
          />
        </van-cell-group>

        <div style="margin: 24px 16px">
          <van-button
            round block type="primary"
            native-type="submit"
            :loading="saving"
            color="#4CAF50"
          >
            {{ isEdit ? '保存修改' : '添加植物' }}
          </van-button>
        </div>

        <div v-if="isEdit" style="margin: 24px 16px">
          <van-button
            round block type="danger"
            :loading="deleting"
            @click="handleDelete"
          >
            删除植物
          </van-button>
        </div>
      </van-form>
    </div>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: #f7f8fa; padding-bottom: 50px; }
.content { padding: 16px 0; }
</style>
```

- [ ] **Step 2: 验证类型检查**

```bash
npx vue-tsc --noEmit
```

Expected: 无类型错误。

- [ ] **Step 3: Commit**

```bash
git add src/views/PlantFormView.vue
git commit -m "feat: add plant create/edit form with validation"
```

---

### Task 9: PlantDetailView — 植物详情核心页面

**Files:**
- Create: `src/components/CareTimeline.vue`, `src/components/PhotoGrid.vue`
- Modify: `src/views/PlantDetailView.vue`

- [ ] **Step 1: 编写 CareTimeline**

```vue
<!-- src/components/CareTimeline.vue -->
<script setup lang="ts">
import type { CareRecord } from '@/db'
import { careTypeLabels } from '@/db'

defineProps<{
  records: CareRecord[]
  counts: Record<string, number>
}>()

const emit = defineEmits<{
  add: [type: string]
  remove: [id: number]
}>()
</script>

<template>
  <div class="care-section">
    <div class="care-header">
      <h3>养护记录</h3>
      <div class="care-stats">
        <span v-for="(count, type) in counts" :key="type" class="stat-badge">
          {{ careTypeLabels[type as keyof typeof careTypeLabels] }} {{ count }}次
        </span>
      </div>
    </div>

    <van-divider />

    <div v-if="records.length === 0" class="empty-hint">暂无养护记录</div>

    <van-steps v-else direction="vertical" :active="records.length - 1">
      <van-step v-for="record in records" :key="record.id">
        <template #inactive-icon>
          <span class="step-icon">
            {{ record.type === 'watering' ? '💧' : record.type === 'fertilizing' ? '🧪' : record.type === 'repotting' ? '🪴' : record.type === 'pruning' ? '✂️' : '📝' }}
          </span>
        </template>
        <template #active-icon>
          <span class="step-icon">
            {{ record.type === 'watering' ? '💧' : record.type === 'fertilizing' ? '🧪' : record.type === 'repotting' ? '🪴' : record.type === 'pruning' ? '✂️' : '📝' }}
          </span>
        </template>
        <div class="step-content">
          <p class="step-title">{{ careTypeLabels[record.type] }}</p>
          <p class="step-date">{{ record.date.slice(0, 10) }}</p>
          <p v-if="record.note" class="step-note">{{ record.note }}</p>
          <van-icon
            name="delete-o"
            class="step-delete"
            @click="emit('remove', record.id!)"
          />
        </div>
      </van-step>
    </van-steps>

    <div class="care-actions">
      <van-button
        v-for="(label, type) in careTypeLabels"
        :key="type"
        size="small"
        :type="type === 'watering' ? 'primary' : 'default'"
        @click="emit('add', type)"
      >
        {{ label }}
      </van-button>
    </div>
  </div>
</template>

<style scoped>
.care-section { margin-top: 16px; }
.care-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; }
.care-header h3 { margin: 0; font-size: 16px; }
.care-stats { display: flex; gap: 6px; flex-wrap: wrap; }
.stat-badge {
  font-size: 11px; background: #e8f5e9; color: #2e7d32;
  padding: 2px 8px; border-radius: 10px;
}
.step-icon { font-size: 18px; }
.step-content { min-width: 0; }
.step-title { font-weight: 600; margin: 0; font-size: 14px; }
.step-date { color: #999; font-size: 12px; margin: 2px 0; }
.step-note { font-size: 13px; color: #666; margin: 2px 0; }
.step-delete { color: #ff5252; cursor: pointer; margin-top: 4px; }
.empty-hint { text-align: center; color: #999; padding: 20px; }
.care-actions {
  display: flex; gap: 8px; flex-wrap: wrap;
  margin-top: 16px; padding-top: 12px; border-top: 1px solid #ebedf0;
}
</style>
```

- [ ] **Step 2: 编写 PhotoGrid**

```vue
<!-- src/components/PhotoGrid.vue -->
<script setup lang="ts">
defineProps<{
  urls: string[]
}>()

const emit = defineEmits<{
  remove: [index: number]
  add: []
}>()
</script>

<template>
  <div class="photo-section">
    <h3>照片墙</h3>
    <div class="photo-grid">
      <div
        v-for="(url, index) in urls"
        :key="index"
        class="photo-item"
        :style="{ backgroundImage: `url(${url})` }"
        @click="emit('remove', index)"
      >
        <van-icon name="close" class="photo-remove" />
      </div>
      <div class="photo-item photo-add" @click="emit('add')">
        <van-icon name="photograph" size="28" color="#999" />
        <span class="add-text">拍照</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.photo-section { margin-top: 16px; }
.photo-section h3 { font-size: 16px; margin: 0 0 12px; }
.photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.photo-item {
  aspect-ratio: 1; border-radius: 8px;
  background-size: cover; background-position: center;
  position: relative; overflow: hidden;
}
.photo-add {
  background: #f5f5f5; display: flex;
  flex-direction: column; align-items: center;
  justify-content: center; cursor: pointer;
}
.add-text { font-size: 12px; color: #999; margin-top: 4px; }
.photo-remove {
  position: absolute; top: 4px; right: 4px;
  color: #fff; background: rgba(0,0,0,0.5);
  border-radius: 50%; padding: 2px;
}
</style>
```

- [ ] **Step 3: 重写 PlantDetailView**

```vue
<!-- src/views/PlantDetailView.vue -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePlant } from '@/composables/usePlant'
import PhotoGrid from '@/components/PhotoGrid.vue'
import CareTimeline from '@/components/CareTimeline.vue'

const route = useRoute()
const plantId = Number(route.params.id)
const { plant, records, photoUrls, photoIds, counts, loading, load, addRecord, removeRecord, addPhoto, removePhoto } = usePlant()

onMounted(() => load(plantId))

function handleCareAdd(type: string) {
  addRecord({
    plantId,
    type: type as Parameters<typeof addRecord>[0]['type'],
    date: new Date().toISOString()
  })
}

function handleCareRemove(id: number) {
  removeRecord(id)
}

function handlePhotoAdd() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.capture = 'environment'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) await addPhoto(plantId, file)
  }
  input.click()
}

function handlePhotoRemove(index: number) {
  const photoId = photoIds.value[index]
  if (photoId !== undefined) removePhoto(photoId)
}
</script>

<template>
  <div class="page">
    <van-nav-bar
      :title="plant?.name ?? '加载中...'"
      left-arrow fixed placeholder
      @click-left="$router.back()"
    >
      <template #right>
        <van-icon name="edit" size="20" @click="$router.push(`/plant/${plantId}/edit`)" />
      </template>
    </van-nav-bar>

    <van-loading v-if="loading" class="center" />

    <template v-else-if="plant">
      <div class="hero">
        <div
          class="hero-image"
          :style="plant.coverPhotoId ? { backgroundImage: `url(${photoUrls[0]})` } : {}"
        >
          <div v-if="!plant.coverPhotoId" class="hero-placeholder">🌱</div>
        </div>
        <div class="hero-info">
          <h2>{{ plant.name }}</h2>
          <p class="species">{{ plant.species || '点击编辑添加品种' }}</p>
          <div class="meta">
            <span v-if="plant.sowDate">播种: {{ plant.sowDate.slice(0, 10) }}</span>
            <span v-if="plant.location">📍 {{ plant.location }}</span>
          </div>
          <p v-if="plant.notes" class="hero-notes">{{ plant.notes }}</p>
        </div>
      </div>

      <van-cell-group inset style="margin-top:12px">
        <PhotoGrid :urls="photoUrls" @add="handlePhotoAdd" @remove="handlePhotoRemove" />
      </van-cell-group>

      <van-cell-group inset style="margin-top:12px">
        <CareTimeline
          :records="records"
          :counts="counts"
          @add="handleCareAdd"
          @remove="handleCareRemove"
        />
      </van-cell-group>

      <div style="height:60px" />
    </template>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: #f7f8fa; padding-bottom: 50px; }
.center { display: flex; justify-content: center; padding: 100px 0; }
.hero { background: #fff; }
.hero-image {
  width: 100%; height: 240px; background-size: cover;
  background-position: center; background-color: #e8f5e9;
  display: flex; align-items: center; justify-content: center;
}
.hero-placeholder { font-size: 80px; }
.hero-info { padding: 16px; }
.hero-info h2 { margin: 0; font-size: 22px; }
.species { color: #666; margin: 4px 0; font-size: 14px; }
.meta { display: flex; gap: 16px; margin-top: 8px; font-size: 13px; color: #888; }
.hero-notes { margin-top: 8px; font-size: 13px; color: #666; white-space: pre-wrap; }
</style>
```

- [ ] **Step 4: 验证类型检查**

```bash
npx vue-tsc --noEmit
```

Expected: 无类型错误。

- [ ] **Step 5: Commit**

```bash
git add src/views/PlantDetailView.vue src/components/CareTimeline.vue src/components/PhotoGrid.vue
git commit -m "feat: add plant detail page with care timeline and photo grid"
```

---

### Task 10: AI Service — 通义千问 API 封装

**Files:**
- Create: `src/services/aiService.ts`

- [ ] **Step 1: 编写 aiService**

```typescript
// src/services/aiService.ts
import { db } from '@/db'

export interface AIResult {
  name: string           // 植物中文名
  latinName?: string     // 拉丁学名
  family?: string        // 科属
  habits?: string        // 习性描述
  careGuide?: {          // 养护指南
    light?: string
    watering?: string
    temperature?: string
    soil?: string
    fertilizing?: string
    pests?: string
  }
  rawText: string        // 原始返回文本
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
  // 简单提取植物名称，其余保留原始文本
  const nameMatch = text.match(/(?:这是|识别为|植物是|名称[：:])?\s*([一-龥]{2,10}(?:玫瑰|月季|牡丹|菊花|兰花|绿萝|吊兰|发财树|龟背竹|琴叶榕|仙人掌|多肉|薄荷|薰衣草|茉莉|栀子|绣球|海棠|君子兰|文竹|常春藤|虎皮兰|芦荟|昙花|蟹爪兰|长寿花|天竺葵|矮牵牛|向日葵|郁金香|风信子|百合|康乃馨|马蹄莲|鹤望兰|昙花|令箭荷花|三角梅|杜鹃|茶花|桂花|樱花|桃花|梅花|杏花|梨花|石榴|柠檬|金桔|无花果)[一-龥]?)/
  const name = nameMatch ? nameMatch[1] : '未知植物'

  return {
    name,
    rawText: text
  }
}

export const aiService = {
  /** 拍照识图 */
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

  /** 养护知识搜索 */
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
```

- [ ] **Step 2: 验证类型检查**

```bash
npx vue-tsc --noEmit
```

Expected: 无类型错误。

- [ ] **Step 3: Commit**

```bash
git add src/services/aiService.ts
git commit -m "feat: add Qwen-VL AI service for plant identification and knowledge search"
```

---

### Task 11: AiView — AI 识图与搜索页面

**Files:**
- Create: `src/components/CameraCapture.vue`
- Modify: `src/views/AiView.vue`

- [ ] **Step 1: 编写 CameraCapture**

```vue
<!-- src/components/CameraCapture.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  capture: [base64: string]
}>()

const showActions = ref(false)

function openCamera() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.capture = 'environment'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    // 压缩并转 base64
    const { default: imageCompression } = await import('browser-image-compression')
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1920,
      useWebWorker: true
    })

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      emit('capture', base64)
    }
    reader.readAsDataURL(compressed)
  }
  input.click()
}

function openGallery() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    const { default: imageCompression } = await import('browser-image-compression')
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1920,
      useWebWorker: true
    })

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      emit('capture', base64)
    }
    reader.readAsDataURL(compressed)
  }
  input.click()
}
</script>

<template>
  <div class="camera-area" @click="openCamera">
    <div class="camera-placeholder">
      <van-icon name="photograph" size="40" color="#4CAF50" />
      <p>点击拍照识别植物</p>
      <p class="sub">或长按从相册选择</p>
    </div>
  </div>
</template>

<style scoped>
.camera-area {
  width: 100%; height: 200px; background: #f0faf0;
  border-radius: 12px; border: 2px dashed #a5d6a7;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
}
.camera-placeholder { text-align: center; color: #4CAF50; }
.camera-placeholder p { margin: 8px 0 0; font-size: 15px; }
.sub { font-size: 12px !important; color: #81c784 !important; }
</style>
```

- [ ] **Step 2: 重写 AiView**

```vue
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
</script>

<template>
  <div class="page">
    <van-nav-bar title="AI 搜索" fixed placeholder />

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

      <!-- Loading -->
      <div v-if="loading" class="center">
        <van-loading size="24" />
        <p style="margin-top:12px;color:#999">AI 分析中...</p>
      </div>

      <!-- Error -->
      <van-cell-group v-if="error" inset style="margin-top:16px">
        <div class="error-box">
          <p>{{ error }}</p>
          <van-button size="small" @click="handleReset">重试</van-button>
        </div>
      </van-cell-group>

      <!-- Result -->
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
```

- [ ] **Step 3: 验证类型检查**

```bash
npx vue-tsc --noEmit
```

Expected: 无类型错误。

- [ ] **Step 4: Commit**

```bash
git add src/components/CameraCapture.vue src/views/AiView.vue
git commit -m "feat: add AI identification and knowledge search UI"
```

---

### Task 12: 设置页面 + API Key 管理

**Files:**
- Modify: `src/views/AiView.vue` (添加设置入口)
- 在 AiView 中添加 API Key 配置功能（使用 van-dialog）

由于没有独立设置页，将 API Key 配置集成在 AiView 的 NavBar 右侧。

- [ ] **Step 1: 在 AiView 添加 API Key 配置**

在 `AiView.vue` 的 `<script setup>` 中添加:

```typescript
// 在原有 script setup 中添加 API Key 配置函数
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
```

在 NavBar 部分修改为:

```vue
<van-nav-bar title="AI 搜索" fixed placeholder>
  <template #right>
    <van-icon name="setting-o" size="20" @click="setupApiKey" />
  </template>
</van-nav-bar>
```

- [ ] **Step 2: 验证类型检查**

```bash
npx vue-tsc --noEmit
```

Expected: 无类型错误。

- [ ] **Step 3: Commit**

```bash
git add src/views/AiView.vue
git commit -m "feat: add API key configuration in AI view"
```

---

### Task 13: PWA 图标与最终集成验证

**Files:**
- Create: `public/icons/` 占位图标

- [ ] **Step 1: 生成 PWA 图标**

使用 vite-plugin-pwa 的自动生成能力，在 `vite.config.ts` 中补充图标生成配置已包含在 Task 1 的 PWA 插件配置中。创建占位图标目录:

```bash
mkdir -p public/icons
```

由于 `vite-plugin-pwa` 在构建时可通过 `includeAssets` 引用图标，MVP 阶段使用一个简单的 SVG 转 PNG 占位图。具体方案：在 `index.html` 中添加一个内联 favicon 链接。

- [ ] **Step 2: 构建生产版本验证**

```bash
npm run build
```

Expected: 构建成功，`dist/` 目录生成，包含 service worker、manifest.json 和所有页面 JS/CSS。

- [ ] **Step 3: 预览生产构建**

```bash
npm run preview
```

Expected: 预览服务器启动，可正常访问，底部 Tab 切换正常，PWA 可安装。

- [ ] **Step 4: Commit**

```bash
git add public/ && git commit -m "chore: add PWA icon placeholder and verify production build"
```

---

## 任务依赖图

```
Task 1 (Scaffold)
  └─> Task 2 (DB Schema)
       ├─> Task 3 (Plant CRUD)
       ├─> Task 4 (Care CRUD)
       └─> Task 5 (Photo Service)
            └─> Task 6 (Composables)
                 ├─> Task 7 (HomeView + PlantCard)
                 ├─> Task 8 (PlantFormView)
                 ├─> Task 9 (PlantDetailView)
                 └─> Task 10 (AI Service)
                      └─> Task 11 (AIView + Camera)
                           └─> Task 12 (API Key config)
                                └─> Task 13 (Build verify)
```

可并行的任务组：
- Task 3、4、5 可并行（彼此独立）
- Task 7、8 可并行（独立页面）
- Task 9 依赖 Task 6 的 `usePlant` composable
- Task 10、11 是独立的 AI 链路，不依赖植物管理功能
