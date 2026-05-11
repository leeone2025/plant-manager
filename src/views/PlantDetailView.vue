<!-- src/views/PlantDetailView.vue -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePlant } from '@/composables/usePlant'
import CareTimeline from '@/components/CareTimeline.vue'

const route = useRoute()
const plantId = Number(route.params.id)
const { plant, records, photoUrls, counts, loading, load, addRecord, removeRecord } = usePlant()

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
        <div class="hero-image">
          <img v-if="plant.coverPhotoId && photoUrls.length > 0" :src="photoUrls[0]" class="hero-img" />
          <div v-else class="hero-placeholder">🌱</div>
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
  width: 100%; height: 240px; background-color: #e8f5e9;
  position: relative; overflow: hidden;
}
.hero-img {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover;
}
.hero-placeholder {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 80px;
}
.hero-info { padding: 16px; }
.hero-info h2 { margin: 0; font-size: 22px; }
.species { color: #666; margin: 4px 0; font-size: 14px; }
.meta { display: flex; gap: 16px; margin-top: 8px; font-size: 13px; color: #888; }
.hero-notes { margin-top: 8px; font-size: 13px; color: #666; white-space: pre-wrap; }
</style>
