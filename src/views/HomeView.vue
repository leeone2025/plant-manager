<!-- src/views/HomeView.vue -->
<script setup lang="ts">
import { ref, watch } from 'vue'
import { usePlantList } from '@/composables/usePlantList'
import { photoService } from '@/services/photoService'
import PlantCard from '@/components/PlantCard.vue'

const { plants, loading, refresh } = usePlantList()
const coverUrls = ref<Record<number, string>>({})

watch(plants, async (list) => {
  const map: Record<number, string> = {}
  for (const p of list) {
    if (p.coverPhotoId) {
      const url = await photoService.getThumbnailUrl(p.coverPhotoId)
      if (url) map[p.id!] = url
    }
  }
  coverUrls.value = map
}, { immediate: true })
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
        <PlantCard v-for="plant in plants" :key="plant.id" :plant="plant" :cover-url="coverUrls[plant.id!]" />
      </van-cell-group>
    </div>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: #f7f8fa; padding-bottom: 50px; }
.content { padding: 16px 0; }
.center { display: flex; justify-content: center; padding: 60px 0; }
</style>
