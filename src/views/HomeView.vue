<!-- src/views/HomeView.vue -->
<script setup lang="ts">
import { usePlantList } from '@/composables/usePlantList'
import PlantCard from '@/components/PlantCard.vue'

const { plants, loading, refresh } = usePlantList()
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
