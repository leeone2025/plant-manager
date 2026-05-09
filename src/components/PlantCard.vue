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
